import { describe, expect, it } from "vitest";
import { createTrapezaCore, pSuccessMean } from "@trapeza/core";
import type { TrapezaDeps } from "@trapeza/core";
import {
  InMemoryStore,
  MockChainAdapter,
  MockOracle,
  MockQuoteSource,
  MockSettlementAdapter,
} from "@trapeza/core/testing";
import { makeProviderInput, makeQuote, makeTask } from "./helpers.js";

function harness(oracle = new MockOracle()) {
  const store = new InMemoryStore();
  const settlement = new MockSettlementAdapter("0.10");
  const chain = new MockChainAdapter();
  const quotes = new MockQuoteSource();
  let t = 1000;
  const deps: TrapezaDeps = {
    store,
    settlement,
    chain,
    oracle,
    quotes,
    now: () => t++,
  };
  const core = createTrapezaCore(deps);
  return { core, store, settlement, chain, quotes, oracle };
}

describe("canonical pipeline", () => {
  it("happy path: submitTask → … → settle releases and writes a calibration record", async () => {
    const { core, store, settlement, chain, quotes } = harness();

    const provider = await core.registerProvider(makeProviderInput());
    expect(provider.id).toBe("prov_1");
    expect(provider.agentId).toBe(1n); // mock minted an ERC-8004 identity

    quotes.setQuote(provider.id, {
      priceUsdc: "0.10",
      claimedSuccessProb: 0.9,
      claimedLatencyMs: 100,
      bondOfferedUsdc: "1.00",
    });

    const task = makeTask();
    const taskId = await core.submitTask(task);

    const collected = await core.collectQuotes(taskId);
    expect(collected).toHaveLength(1);

    const allocation = await core.route(taskId, collected);
    expect(allocation.providerId).toBe(provider.id);

    const bond = await core.postBond(allocation);
    expect(bond.state).toBe("posted");
    expect(bond.amountUsdc).toBe("1.00");
    expect(chain.escrows.get(taskId)?.state).toBe("open");

    const result = await core.execute(allocation);
    expect(settlement.payments).toHaveLength(1);

    const outcome = await core.oracleVerify(task, result);
    expect(outcome.passed).toBe(true);

    const settled = await core.settle(taskId, outcome);
    expect(settled.action).toBe("release");
    expect(chain.escrows.get(taskId)?.state).toBe("released");
    expect(store.bonds.get(bond.id)?.state).toBe("released");

    await core.recordOutcome(outcome);
    const rec = await store.getCalibration(provider.id, task.capability);
    expect(rec).not.toBeNull();
    expect(rec!.nObservations).toBe(1);
    expect(rec!.successAlpha).toBe(2); // prior 1 + one pass
    expect(pSuccessMean(rec!)).toBeCloseTo(2 / 3, 12);
    // reputation mirrored to the (mock) chain
    expect(chain.feedback).toHaveLength(1);
    expect(chain.feedback[0]!.tag).toBe("success");
  });

  it("bond slashes on a scripted oracle failure", async () => {
    const oracle = new MockOracle();
    const { core, store, chain, quotes } = harness(oracle);

    const provider = await core.registerProvider(makeProviderInput());
    quotes.setQuote(provider.id, {
      priceUsdc: "0.10",
      claimedSuccessProb: 0.9,
      claimedLatencyMs: 100,
      bondOfferedUsdc: "1.00",
    });

    const task = makeTask({ id: "task-fail" });
    oracle.script(task.id, { passed: false, score: 0 });

    const taskId = await core.submitTask(task);
    const collected = await core.collectQuotes(taskId);
    const allocation = await core.route(taskId, collected);
    const bond = await core.postBond(allocation);
    const result = await core.execute(allocation);
    const outcome = await core.oracleVerify(task, result);

    const settled = await core.settle(taskId, outcome);
    expect(settled.action).toBe("slash");
    expect(chain.escrows.get(taskId)?.state).toBe("slashed");
    expect(store.bonds.get(bond.id)?.state).toBe("slashed");

    await core.recordOutcome(outcome);
    const rec = await store.getCalibration(provider.id, task.capability);
    expect(rec!.successBeta).toBe(2); // prior 1 + one failure
    expect(chain.feedback[0]!.tag).toBe("failure");
  });

  it("lemons mini-demo: CALIBRATION OFF picks the liar, ON picks the honest provider", async () => {
    const { core, store, quotes } = harness();

    const honest = await core.registerProvider(
      makeProviderInput({ endpoint: "https://honest.example" }),
    );
    const liar = await core.registerProvider(
      makeProviderInput({ endpoint: "https://liar.example" }),
    );

    // Seed the realized-outcome ledger: honest delivers, liar doesn't.
    for (let i = 0; i < 9; i++) {
      await store.putCalibration(
        bump(await getCal(store, honest.id), true),
      );
    }
    for (let i = 0; i < 9; i++) {
      await store.putCalibration(bump(await getCal(store, liar.id), false));
    }

    quotes
      .setQuote(honest.id, {
        priceUsdc: "0.10",
        claimedSuccessProb: 0.8,
        claimedLatencyMs: 100,
        bondOfferedUsdc: "0",
      })
      .setQuote(liar.id, {
        priceUsdc: "0.10",
        claimedSuccessProb: 0.99, // the lie
        claimedLatencyMs: 100,
        bondOfferedUsdc: "0",
      });

    const task = makeTask({ id: "task-lemons" });
    const taskId = await core.submitTask(task);
    const collected = await core.collectQuotes(taskId);

    const off = await core.route(taskId, collected, false);
    const on = await core.route(taskId, collected, true);

    expect(off.providerId).toBe(liar.id);
    expect(on.providerId).toBe(honest.id);
  });
});

// helpers for the lemons test ledger seeding
import type { CalibrationRecord } from "@trapeza/core";
import { defaultCalibration, updateCalibration } from "@trapeza/core";

async function getCal(
  store: InMemoryStore,
  providerId: string,
): Promise<CalibrationRecord> {
  return (
    (await store.getCalibration(providerId, "extract.invoice.v1")) ??
    defaultCalibration(providerId, "extract.invoice.v1")
  );
}

function bump(rec: CalibrationRecord, passed: boolean): CalibrationRecord {
  return updateCalibration(
    rec,
    {
      taskId: "seed",
      providerId: rec.providerId,
      passed,
      score: passed ? 100 : 0,
      evidenceURI: "mock://seed",
      realizedCostUsdc: "0.10",
      realizedLatencyMs: 100,
    },
    1,
  );
}
