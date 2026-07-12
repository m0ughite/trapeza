#!/usr/bin/env tsx
/**
 * ArcTask x Trapeza end-to-end integration harness.
 *
 * Drives one full job lifecycle against the ArcTask marketplace on Arc testnet:
 *   register agent -> sync providers -> open escrow (createJob + fund)
 *   -> submit deliverable -> clear via @trapeza/core -> verify -> settle escrow
 *   (acceptWork = release / rejectWork = refund).
 *
 * Settlement goes through the chain-agnostic core seam: `core.settle` calls
 * `ChainAdapter.resolveEscrow`, implemented by `ArcTaskChainAdapter` against the
 * ArcTask escrow. Nothing chain-specific leaks into @trapeza/core.
 *
 *   npm run harness:arc                                   # simulated (default)
 *   ARCTASK_SIMULATED=false ARCTASK_USDC_MODE=native \
 *     npm run harness:arc                                 # live Arc testnet
 */

import {
  ArcTaskChainAdapter,
  ArcTaskQuoteSource,
  ArcTaskClient,
  SimulatedArcTaskClient,
  MarketplaceProviderSync,
  encodeJobPayloadUri,
  makeWallet,
  parseUsdcToWei,
  readArctaskUsdcMode,
  ARC_TESTNET_EXPLORER,
  loadEnv,
} from "@trapeza/adapter-arc";
import { createTrapezaCore, type TaskSpec } from "@trapeza/core";
import {
  InMemoryStore,
  MockOracle,
  MockSettlementAdapter,
} from "@trapeza/core/testing";

loadEnv();

// Default to a safe simulated dry-run; live requires ARCTASK_SIMULATED=false
// AND funded wallets. (Live also wants ARCTASK_USDC_MODE=native to match the
// live ArcTask deployment, or erc20 against a self-hosted fork.)
const simulated = process.env.ARCTASK_SIMULATED !== "false";
const usdcMode = readArctaskUsdcMode();

function requireKey(name: string, fallback: string): `0x${string}` {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) {
    if (!simulated) {
      throw new Error(
        `${name} is required for a live run (set it in .env). ` +
          `Run simulated with ARCTASK_SIMULATED=true to skip live wallets.`,
      );
    }
    return fallback as `0x${string}`;
  }
  return v as `0x${string}`;
}

function txLink(hash: string): string {
  return hash.startsWith("0x") && hash.length === 66
    ? `${ARC_TESTNET_EXPLORER}/tx/${hash}`
    : "(off-chain / simulated ref)";
}

async function main(): Promise<void> {
  console.log("=== ArcTask x Trapeza integration harness ===");
  console.log(`mode: ${simulated ? "simulated" : "live"} | usdc rail: ${usdcMode}`);

  const clientKey = requireKey("BUYER_PRIVATE_KEY", "0x" + "11".repeat(32));
  const ownerKey = requireKey("OWNER_PRIVATE_KEY", "0x" + "22".repeat(32));
  const evaluatorKey = requireKey("VALIDATOR_PRIVATE_KEY", "0x" + "33".repeat(32));

  const arctask: ArcTaskClient = simulated
    ? new SimulatedArcTaskClient()
    : new ArcTaskClient();

  const chain = new ArcTaskChainAdapter({
    clientPrivateKey: clientKey,
    evaluatorPrivateKey: evaluatorKey,
    validatorPrivateKey: simulated ? undefined : evaluatorKey,
    simulated,
    arctaskClient: arctask,
  });

  // 1. Register a provider agent on the ArcTask registry.
  const owner = makeWallet(ownerKey);
  const { agentId, txHash: regTx } = simulated
    ? await (arctask as SimulatedArcTaskClient).registerAgent(owner.account)
    : await arctask.registerAgent(
        owner.account,
        owner.wallet,
        encodeJobPayloadUri({
          name: "trapeza-harness-agent",
          capabilities: ["arctask.general.v1"],
        }),
      );
  console.log(`\n[1] registered agent #${agentId}  tx=${regTx}`);
  if (!simulated) console.log(`    ${txLink(regTx)}`);

  // 2. Sync registry agents into Trapeza ProviderProfiles.
  const store = new InMemoryStore();
  const sync = new MarketplaceProviderSync(arctask);
  const providers = await sync.syncProviders();
  for (const p of providers) await store.putProvider(p);
  console.log(`[2] synced ${providers.length} provider(s) from the registry`);

  // 3. Open escrow: createJob + fund it (native msg.value or ERC-20 approve).
  const taskId = "harness-task-1";
  const rewardUsdc = "0.01";
  chain.registerEscrowIntent(taskId, {
    agentId,
    evaluator: chain.evaluatorAddress,
    jobURI: encodeJobPayloadUri({
      title: "Trapeza harness job",
      description: "End-to-end escrow + settlement smoke test",
    }),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
    rewardAmountWei: parseUsdcToWei(rewardUsdc, usdcMode),
  });
  const escrowTx = await chain.openEscrow(taskId, owner.account.address, rewardUsdc);
  const jobId = chain.intents.resolveTaskId(taskId);
  console.log(`[3] escrow opened for job #${jobId}  tx=${escrowTx}`);
  if (!simulated) console.log(`    ${txLink(escrowTx)}`);

  // 4. The agent submits a deliverable hash on-chain.
  const deliverable = JSON.stringify({ summary: "harness deliverable", ok: true });
  const subTx = await arctask.submitDeliverable(
    owner.account,
    owner.wallet,
    jobId,
    arctask.hashDeliverable(deliverable),
  );
  console.log(`[4] deliverable submitted  tx=${subTx}`);
  if (!simulated) console.log(`    ${txLink(subTx)}`);

  // 5. Clear + verify + settle through the chain-agnostic core seam.
  const core = createTrapezaCore({
    store,
    chain,
    settlement: new MockSettlementAdapter("0.001"),
    oracle: new MockOracle({ passed: true, score: 95 }),
    quotes: new ArcTaskQuoteSource({ defaultSuccessProb: 0.9 }),
  });

  const spec: TaskSpec = {
    id: taskId,
    capability: "arctask.general.v1",
    input: { title: "Trapeza harness job" },
    oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    valueUsdc: rewardUsdc,
    budgetUsdc: rewardUsdc,
    preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
    deadlineMs: 3_600_000,
  };
  await store.putTask(spec);

  const quotes = await core.collectQuotes(taskId);
  const alloc = await core.route(taskId, quotes, false);
  console.log(`[5] routed to ${alloc.providerId}  score=${alloc.score.toFixed(4)}`);

  await core.postBond(alloc);
  const result = await core.execute(alloc);
  const outcome = await core.oracleVerify(spec, result);

  // core.settle -> ArcTaskChainAdapter.resolveEscrow -> acceptWork / rejectWork
  const settled = await core.settle(taskId, outcome);
  console.log(`[6] escrow ${settled.action}  tx=${settled.txHash}`);
  if (!simulated) console.log(`    ${txLink(settled.txHash)}`);

  await core.recordOutcome(outcome);

  const finalJob = await arctask.getJob(jobId);
  console.log(
    `[7] final job status: ${finalJob.status} ` +
      `(0=Funded 1=Submitted 2=Accepted 3=Rejected)`,
  );

  console.log("\nharness complete ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
