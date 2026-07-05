import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultCalibration,
  type Bond,
  type Outcome,
  type ProviderProfile,
  type TaskSpec,
} from "@trapeza/core";
import { SqliteStore } from "../src/store.js";

function tempDb(): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-sqlite-"));
  const path = join(dir, "test.db");
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const fixedPrice = () => "0.10";

function sampleProvider(id: string, caps: string[]): ProviderProfile {
  return {
    id,
    agentId: 42n,
    wallet: "0xabc1234567890123456789012345678901234567890",
    capabilities: caps,
    endpoint: `https://provider.example/${id}`,
    priceSurface: fixedPrice,
    bondBalanceUsdc: "1.00",
    status: "active",
  };
}

const sampleTask: TaskSpec = {
  id: "task-1",
  capability: "extract.invoice.v1",
  input: { doc: "x" },
  oracleSpec: { schema: { type: "object" }, groundTruth: {} },
  valueUsdc: "1.00",
  budgetUsdc: "1.00",
  preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
  deadlineMs: 60_000,
};

describe("SqliteStore", () => {
  it("round-trips providers and filters by capability", async () => {
    const { path, cleanup } = tempDb();
    const store = new SqliteStore({ dbPath: path, now: () => 1000 });
    await store.putProvider(sampleProvider("p1", ["extract.invoice.v1"]));
    await store.putProvider(sampleProvider("p2", ["code.fix.v1"]));

    const listed = await store.listProviders("extract.invoice.v1");
    expect(listed).toHaveLength(1);
    expect(listed[0]!.id).toBe("p1");

    const got = await store.getProvider("p1");
    expect(got?.wallet).toBe(sampleProvider("p1", []).wallet);
    expect(got?.priceSurface(0, 0)).toBe("0.10");
    store.close();
    cleanup();
  });

  it("upserts calibration by (provider, capability)", async () => {
    const { path, cleanup } = tempDb();
    const store = new SqliteStore({ dbPath: path });
    await store.putProvider(sampleProvider("p1", ["extract.invoice.v1"]));

    const v1 = defaultCalibration("p1", "extract.invoice.v1");
    await store.putCalibration(v1);
    const updated = { ...v1, successAlpha: 5, nObservations: 4, lastUpdate: 99 };
    await store.putCalibration(updated);

    const got = await store.getCalibration("p1", "extract.invoice.v1");
    expect(got?.successAlpha).toBe(5);
    expect(got?.nObservations).toBe(4);
    store.close();
    cleanup();
  });

  it("round-trips tasks, bonds, outcomes", async () => {
    const { path, cleanup } = tempDb();
    const store = new SqliteStore({ dbPath: path, now: () => 500 });
    await store.putProvider(sampleProvider("p1", ["extract.invoice.v1"]));
    await store.putTask(sampleTask);
    const bond: Bond = {
      id: "bond_task-1",
      taskId: "task-1",
      providerId: "p1",
      amountUsdc: "0.05",
      state: "posted",
      escrowTxHash: "0xesc",
    };
    await store.putBond(bond);
    const outcome: Outcome = {
      taskId: "task-1",
      providerId: "p1",
      passed: true,
      score: 100,
      evidenceURI: "oracle://x",
      realizedCostUsdc: "0.10",
      realizedLatencyMs: 42,
    };
    await store.putOutcome(outcome);

    expect(await store.getTask("task-1")).toEqual(sampleTask);
    const outcomes = await store.listOutcomes();
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]!.realizedLatencyMs).toBe(42);
    store.close();
    cleanup();
  });

  it("appends and lists events", async () => {
    const { path, cleanup } = tempDb();
    const store = new SqliteStore({ dbPath: path });
    await store.appendEvent({
      ts: 1,
      kind: "clearing",
      taskId: "g1",
      payload: { solver: "cp_sat" },
    });
    const events = await store.listEvents(10);
    expect(events).toHaveLength(1);
    expect(events[0]!.kind).toBe("clearing");
    store.close();
    cleanup();
  });

  it("survives reopen with WAL", async () => {
    const { path, cleanup } = tempDb();
    const store = new SqliteStore({ dbPath: path });
    await store.putProvider(sampleProvider("p1", ["cap.a"]));
    store.close();

    const reopened = SqliteStore.reopen({ dbPath: path });
    const got = await reopened.getProvider("p1");
    expect(got?.id).toBe("p1");
    reopened.close();
    cleanup();
  });
});
