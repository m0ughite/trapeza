import { describe, expect, it } from "vitest";
import {
  ArcTaskChainAdapter,
  decodeJobPayloadUri,
  encodeJobPayloadUri,
  jobToTaskSpec,
  MarketplaceProviderSync,
  SimulatedArcTaskClient,
  ArcTaskQuoteSource,
  makeWallet,
  parseUsdcToWei,
} from "../src/index.js";
import { ARCTASK_USDC_MODE } from "../src/constants.js";
import { InMemoryStore, MockOracle, MockSettlementAdapter } from "@trapeza/core/testing";
import { createTrapezaCore } from "@trapeza/core";

describe("ArcTask integration", () => {
  it("exports arctask-client surface", async () => {
    const client = await import("../src/arctask-client.js");
    expect(client.ArcTaskClient).toBeDefined();
    expect(client.arctaskEscrowAbi).toBeDefined();
    expect(client.ArcTaskJobStatus.Funded).toBe(0);
  });
  it("decodes jobURI payloads", () => {
    const payload = { title: "test", description: "desc" };
    const uri = encodeJobPayloadUri(payload);
    expect(decodeJobPayloadUri(uri)).toEqual(payload);
  });

  it("maps jobs to TaskSpec", () => {
    const client = new SimulatedArcTaskClient();
    const job = {
      jobId: 1n,
      client: "0x1111111111111111111111111111111111111111",
      agentId: 1n,
      agentOwner: "0x2222222222222222222222222222222222222222",
      evaluator: "0x3333333333333333333333333333333333333333",
      rewardAmount: parseUsdcToWei("0.01", ARCTASK_USDC_MODE),
      deadline: 9_999_999_999n,
      jobURI: encodeJobPayloadUri({ title: "T", description: "D" }),
      deliverableHash: `0x${"0".repeat(64)}`,
      status: 0,
      createdAt: 1n,
      updatedAt: 1n,
    };
    const spec = jobToTaskSpec(job);
    expect(spec.id).toBe("arctask:job:1");
    expect(spec.capability).toBe("arctask.general.v1");
  });

  it("simulated harness loop: register → escrow → submit → settle", async () => {
    const client = new SimulatedArcTaskClient();
    const clientKey = ("0x" + "11".repeat(32)) as `0x${string}`;
    const ownerKey = ("0x" + "22".repeat(32)) as `0x${string}`;
    const evaluatorKey = ("0x" + "33".repeat(32)) as `0x${string}`;

    const chain = new ArcTaskChainAdapter({
      clientPrivateKey: clientKey,
      evaluatorPrivateKey: evaluatorKey,
      simulated: true,
      arctaskClient: client,
    });

    const owner = makeWallet(ownerKey);
    const { agentId } = await client.registerAgent(owner.account);

    const sync = new MarketplaceProviderSync(client);
    const providers = await sync.syncProviders();
    expect(providers.length).toBeGreaterThan(0);

    const taskId = "sim-task-1";
    chain.registerEscrowIntent(taskId, {
      agentId,
      evaluator: chain.evaluatorAddress,
      jobURI: encodeJobPayloadUri({ title: "sim" }),
      deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      rewardAmountWei: parseUsdcToWei("0.01", ARCTASK_USDC_MODE),
    });

    await chain.openEscrow(taskId, owner.account.address, "0.01");
    const jobId = chain.intents.resolveTaskId(taskId);
    const hash = client.hashDeliverable("ok");
    await client.submitDeliverable(owner.account, owner.wallet, jobId, hash);

    const store = new InMemoryStore();
    for (const p of providers) await store.putProvider(p);

    const core = createTrapezaCore({
      store,
      chain,
      settlement: new MockSettlementAdapter(),
      oracle: new MockOracle({ passed: true, score: 90 }),
      quotes: new ArcTaskQuoteSource(),
    });

    const spec = {
      id: taskId,
      capability: "arctask.general.v1",
      input: {},
      oracleSpec: { schema: {}, groundTruth: {} },
      valueUsdc: "0.01",
      budgetUsdc: "0.01",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: 60_000,
    };
    await store.putTask(spec);

    const quotes = await core.collectQuotes(taskId);
    const alloc = await core.route(taskId, quotes, false);
    await core.postBond(alloc);
    const result = await core.execute(alloc);
    const outcome = await core.oracleVerify(spec, result);
    const settled = await core.settle(taskId, outcome);

    expect(settled.action).toBe("release");
    const job = await client.getJob(jobId);
    expect(job.status).toBe(2); // Accepted
  });
});
