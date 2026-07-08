#!/usr/bin/env tsx
/**
 * ArcTask × Trapeza end-to-end integration harness.
 *
 * Simulated mode (default): ARCTASK_SIMULATED=true — no live chain.
 * Live mode: set wallet keys + ARCTASK_SIMULATED=false.
 *
 *   npm run harness:arc
 *   ARCTASK_SIMULATED=true npm run harness:arc
 */

import { loadEnv } from "@trapeza/adapter-arc";
import {
  ArcTaskChainAdapter,
  ArcTaskClient,
  ArcTaskQuoteSource,
  ARC_TESTNET_USDC,
  encodeJobPayloadUri,
  IDENTITY_REGISTRY,
  MarketplaceProviderSync,
  parseUsdcToWei,
  REPUTATION_REGISTRY,
  SimulatedArcTaskClient,
  makeWallet,
} from "@trapeza/adapter-arc";
import { ARCTASK_SIMULATED, ARCTASK_USDC_MODE } from "@trapeza/adapter-arc";
import { createTrapezaCore } from "@trapeza/core";
import {
  InMemoryStore,
  MockChainAdapter,
  MockOracle,
  MockQuoteSource,
  MockSettlementAdapter,
} from "@trapeza/core/testing";
import { ArcTaskEscrowNanoSettlementProvider } from "../demo/onchain.js";

loadEnv();

const simulated = process.env.ARCTASK_SIMULATED !== "false" && ARCTASK_SIMULATED;

function requireKey(name: string): `0x${string}` | undefined {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) return undefined;
  return v as `0x${string}`;
}

/** ArcKit canonical constants + MockChainAdapter escrow — deterministic control. */
async function runArcKitCanonicalControl(): Promise<void> {
  console.log("\n=== ArcKit canonical control (simulated) ===");
  console.log(`  identity registry: ${IDENTITY_REGISTRY}`);
  console.log(`  reputation registry: ${REPUTATION_REGISTRY}`);
  console.log(`  erc20 usdc:        ${ARC_TESTNET_USDC}`);

  const chain = new MockChainAdapter();
  const store = new InMemoryStore();
  const quotes = new MockQuoteSource();
  const core = createTrapezaCore({
    store,
    chain,
    settlement: new MockSettlementAdapter("0.001"),
    oracle: new MockOracle({ passed: true, score: 100 }),
    quotes,
  });

  const agentId = await chain.mintIdentity({ metadataURI: "arckit://control" });
  const provider = {
    id: "arckit-provider",
    agentId,
    wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`,
    capabilities: ["arckit.control.v1"],
    endpoint: "mock://arckit",
    priceSurface: () => "0.001",
    bondBalanceUsdc: "0.01",
    status: "active" as const,
  };
  await store.putProvider(provider);
  quotes.setQuote("arckit-provider", {
    priceUsdc: "0.001",
    claimedSuccessProb: 0.95,
    claimedLatencyMs: 100,
    bondOfferedUsdc: "0.01",
  });

  const taskId = "arckit-control-1";
  await store.putTask({
    id: taskId,
    capability: "arckit.control.v1",
    input: {},
    oracleSpec: { schema: {}, groundTruth: {} },
    valueUsdc: "0.01",
    budgetUsdc: "0.01",
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 60_000,
  });

  const collected = await core.collectQuotes(taskId);
  const allocation = await core.route(taskId, collected, true);
  await core.postBond(allocation);
  const result = await core.execute(allocation);
  const outcome = await core.oracleVerify(
    (await store.getTask(taskId))!,
    result,
  );
  const settled = await core.settle(taskId, outcome);
  await core.recordOutcome(outcome);

  console.log(`  routed: ${allocation.providerId}`);
  console.log(`  escrow: ${settled.action} tx=${settled.txHash}`);
  console.log("  canonical control OK");
}

async function runArcTaskLoop(): Promise<void> {
  console.log(`\n=== ArcTask integration ===`);
  console.log(`mode: ${simulated ? "simulated" : "live"} | usdc rail: ${ARCTASK_USDC_MODE}`);

  const clientKey = requireKey("BUYER_PRIVATE_KEY") ?? ("0x" + "11".repeat(32)) as `0x${string}`;
  const ownerKey = requireKey("OWNER_PRIVATE_KEY") ?? ("0x" + "22".repeat(32)) as `0x${string}`;
  const evaluatorKey = requireKey("VALIDATOR_PRIVATE_KEY") ?? ("0x" + "33".repeat(32)) as `0x${string}`;

  const arctaskClient: ArcTaskClient = simulated
    ? new SimulatedArcTaskClient()
    : new ArcTaskClient();

  const chain = new ArcTaskChainAdapter({
    clientPrivateKey: clientKey,
    evaluatorPrivateKey: evaluatorKey,
    validatorPrivateKey: requireKey("VALIDATOR_PRIVATE_KEY"),
    simulated,
    arctaskClient,
  });

  const store = new InMemoryStore();
  const settlement = new MockSettlementAdapter("0.001");
  const oracle = new MockOracle({ passed: true, score: 95 });
  const quotes = new ArcTaskQuoteSource({ defaultSuccessProb: 0.9 });

  const core = createTrapezaCore({
    store,
    chain,
    settlement,
    oracle,
    quotes,
  });

  const owner = makeWallet(ownerKey);
  const { agentId } = simulated
    ? await (arctaskClient as SimulatedArcTaskClient).registerAgent(owner.account)
    : await arctaskClient.registerAgent(
        owner.account,
        owner.wallet,
        encodeJobPayloadUri({ name: "harness-agent", capabilities: ["arctask.general.v1"] }),
      );
  console.log(`registered agent ${agentId}`);

  const sync = new MarketplaceProviderSync(arctaskClient);
  const providers = await sync.syncProviders();
  for (const p of providers) await store.putProvider(p);
  console.log(`synced ${providers.length} provider(s)`);

  const taskId = "harness-task-1";
  const rewardWei = parseUsdcToWei("0.01", ARCTASK_USDC_MODE);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const jobURI = encodeJobPayloadUri({
    title: "Harness integration job",
    description: "Verify Trapeza evaluator settlement loop",
  });

  chain.registerEscrowIntent(taskId, {
    agentId,
    evaluator: chain.evaluatorAddress,
    jobURI,
    deadline,
    rewardAmountWei: rewardWei,
  });

  const escrowTx = await chain.openEscrow(taskId, owner.account.address, "0.01");
  console.log(`escrow opened: ${escrowTx}`);

  const jobId = chain.intents.resolveTaskId(taskId);
  const arctaskTaskId = `arctask:job:${jobId}`;
  const deliverable = JSON.stringify({ summary: "Harness deliverable", ok: true });
  const hash = arctaskClient.hashDeliverable(deliverable);
  const subTx = await arctaskClient.submitDeliverable(
    owner.account,
    owner.wallet,
    jobId,
    hash,
  );
  console.log(`deliverable submitted: ${subTx}`);

  const spec = {
    id: taskId,
    capability: "arctask.general.v1",
    input: { title: "Harness integration job" },
    oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    valueUsdc: "0.01",
    budgetUsdc: "0.01",
    preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
    deadlineMs: 3_600_000,
  };
  await store.putTask(spec);

  const collected = await core.collectQuotes(taskId);
  const allocation = await core.route(taskId, collected, false);
  console.log(`routed to ${allocation.providerId} score=${allocation.score.toFixed(4)}`);

  await core.postBond(allocation);
  const execResult = await core.execute(allocation);
  const outcome = await core.oracleVerify(spec, execResult);

  // Stage F: NanoSettlementProvider seam (demo/onchain.ts)
  const nano = new ArcTaskEscrowNanoSettlementProvider({
    evaluatorPrivateKey: evaluatorKey,
    simulated,
    taskIdForNode: () => arctaskTaskId,
    arctaskClient,
  });
  await nano.init();
  const nanoResult = await nano.settleNode({
    nodeId: "node-1",
    providerId: allocation.providerId,
    price: "0.01",
  });
  console.log(`nano settle: tx=${nanoResult.settlementTxHash}`);
  await nano.close();

  await core.recordOutcome(outcome);

  const finalJob = await arctaskClient.getJob(jobId);
  console.log(`final job status: ${finalJob.status} (2=Accepted)`);
}

async function main() {
  await runArcKitCanonicalControl();
  await runArcTaskLoop();
  console.log("\nharness complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
