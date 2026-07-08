/**
 * Emit bundled ArcTask agent registry + escrow receipt fixtures for the dashboard.
 *
 * Run: npm run demo:emit:agents
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calibratedEstimate } from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import {
  SimulatedArcTaskClient,
  encodeJobPayloadUri,
  parseUsdcToWei,
} from "@trapeza/adapter-arc";
import type { PrivateKeyAccount } from "viem/accounts";
import { keccak256, toHex } from "viem";
import {
  ONCHAIN_RECEIPTS_SCHEMA_VERSION,
  type AgentView,
  type ArcTaskReceipts,
  type OnchainRef,
} from "../apps/dashboard/src/types/contract.js";
import {
  budgetBottleneckProviders,
  workflowProviders,
} from "./data.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, "..", "apps", "dashboard", "src", "fixtures");

const FIXED_AT = "2026-01-15T12:00:00.000Z";
const FIXED_DEADLINE = 1_767_000_000n;

const CAP_MAP: Record<string, string> = {
  "cap.1": "arctask.general.v1",
  "cap.2": "code.fix.v1",
  "cap.3": "extract.invoice.v1",
  "cap.logo": "arctask.general.v1",
  "cap.code": "code.fix.v1",
};

const CLIENT_ADDR = walletFor(101);
const EVAL_ADDR = walletFor(102);

function mockAccount(address: `0x${string}`): PrivateKeyAccount {
  return { address, type: "local" } as PrivateKeyAccount;
}

function walletFor(index: number): `0x${string}` {
  return `0x${"22".repeat(19)}${index.toString(16).padStart(2, "0")}` as `0x${string}`;
}

function realizedPHat(p: SolverProvider): number {
  const est = calibratedEstimate(p.calibration);
  return est.pSuccess;
}

function archetypeOf(p: SolverProvider): AgentView["archetype"] {
  const claimed = p.claimedSuccessProb;
  const realized = realizedPHat(p);
  if (claimed - realized > 0.25) return "braggart";
  if (realized - claimed > 0.1) return "workhorse";
  return "neutral";
}

function toAgentView(p: SolverProvider, agentId: bigint, wallet: `0x${string}`): AgentView {
  const est = calibratedEstimate(p.calibration);
  const cap = CAP_MAP[p.capabilities[0]!] ?? "arctask.general.v1";
  return {
    agentId: agentId.toString(),
    wallet,
    capabilities: [cap, ...p.capabilities.slice(1)],
    claimedSuccessProb: p.claimedSuccessProb,
    calibratedSuccessProb: est.pSuccess,
    nObservations: est.nObservations,
    bondUsdc: p.bondOfferedUsdc || "10.00",
    archetype: archetypeOf(p),
    active: true,
    linkedProviderId: p.id,
  };
}

function simRef(label: string, value: string): OnchainRef {
  return {
    kind: "simulated-tx",
    value,
    url: null,
    linkable: false,
    label,
    simulated: true,
  };
}

async function emitAgents(): Promise<AgentView[]> {
  const client = new SimulatedArcTaskClient();
  const providers = [...workflowProviders, ...budgetBottleneckProviders];
  const agents: AgentView[] = [];

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]!;
    const { agentId } = await client.registerAgent(mockAccount(walletFor(i + 1)));
    agents.push(toAgentView(p, agentId, walletFor(i + 1)));
  }

  return agents;
}

async function emitReceipts(agents: AgentView[]): Promise<ArcTaskReceipts> {
  const client = new SimulatedArcTaskClient();
  const clientAccount = mockAccount(CLIENT_ADDR);
  const evaluatorAccount = mockAccount(EVAL_ADDR);

  const hero = agents.find((a) => a.linkedProviderId === "workhorse-1") ?? agents[0]!;
  const agentId = BigInt(hero.agentId);
  const agentOwner = mockAccount(hero.wallet as `0x${string}`);
  await client.registerAgent(agentOwner);

  const rewardUsdc = "0.15";
  const rewardWei = parseUsdcToWei(rewardUsdc, "native");
  const jobURI = encodeJobPayloadUri({
    title: "Trapeza fixture escrow",
    description: "Bundled simulated ArcTask escrow round",
  });

  const { jobId, txHash: fundTx } = await client.createJob(
    clientAccount,
    {} as never,
    {
      agentId,
      rewardAmountWei: rewardWei,
      deadline: FIXED_DEADLINE,
      evaluator: evaluatorAccount.address,
      jobURI,
    },
  );

  const deliverableHash = keccak256(toHex("fixture-deliverable"));
  const submitTx = await client.submitDeliverable(
    agentOwner,
    {} as never,
    jobId,
    deliverableHash,
  );
  const acceptTx = await client.acceptWork(evaluatorAccount, {} as never, jobId);

  return {
    schemaVersion: ONCHAIN_RECEIPTS_SCHEMA_VERSION,
    meta: {
      generatedAt: FIXED_AT,
      network: "arc-testnet (simulated)",
      mode: "simulated",
      runId: "fixture-escrow",
      honestyNote:
        "Simulated ArcTask escrow receipts. IDs are labeled simulated and are not arcscan transaction links.",
    },
    jobId: jobId.toString(),
    agent: { agentId: hero.agentId, wallet: hero.wallet },
    reward: { amountUsdc: rewardUsdc, usdcMode: "native" },
    lifecycle: [
      { status: "Funded", ref: simRef("fund escrow", fundTx), at: FIXED_AT },
      { status: "Submitted", ref: simRef("submit deliverable", submitTx), at: FIXED_AT },
      { status: "Accepted", ref: simRef("accept work", acceptTx), at: FIXED_AT },
    ],
  };
}

async function main(): Promise<void> {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const agents = await emitAgents();
  const receipts = await emitReceipts(agents);
  writeFileSync(join(FIXTURE_DIR, "arctask-agents.json"), `${JSON.stringify(agents, null, 2)}\n`);
  writeFileSync(
    join(FIXTURE_DIR, "arctask-receipts.json"),
    `${JSON.stringify(receipts, null, 2)}\n`,
  );
  console.log(`Wrote ${agents.length} agents + escrow receipts → ${FIXTURE_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
