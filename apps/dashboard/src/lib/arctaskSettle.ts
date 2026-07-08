/**
 * Portable simulated ArcTask escrow settlement — runs in the browser fallback and
 * the Vercel serverless function without pulling in viem / adapter-arc.
 */

import {
  ONCHAIN_RECEIPTS_SCHEMA_VERSION,
  type AgentView,
  type ArcTaskReceipts,
  type OnchainRef,
} from "../types/contract";

const FIXED_AT = "2026-01-15T12:00:00.000Z";

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

function simTx(prefix: string, id: bigint): string {
  return `0x${prefix}${id.toString(16).padStart(56, "0")}`;
}

export interface SettleInput {
  allocations: Array<{ nodeId: string; providerId: string }>;
  agents: AgentView[];
  rewardUsdc?: string;
  runId?: string;
}

export function simulateArcTaskSettle(input: SettleInput): ArcTaskReceipts {
  const alloc = input.allocations[0];
  if (!alloc) throw new Error("no allocations to settle");

  const agent =
    input.agents.find((a) => a.linkedProviderId === alloc.providerId) ??
    input.agents.find((a) => a.agentId === alloc.providerId) ??
    input.agents[0];
  if (!agent) throw new Error("no agent available for settlement");

  const jobId = 1n;
  const rewardUsdc = input.rewardUsdc ?? "0.15";

  return {
    schemaVersion: ONCHAIN_RECEIPTS_SCHEMA_VERSION,
    meta: {
      generatedAt: FIXED_AT,
      network: "arc-testnet (simulated)",
      mode: "simulated",
      runId: input.runId ?? "interactive",
      honestyNote:
        "Simulated ArcTask escrow. Transaction IDs are placeholders — not real arcscan links.",
    },
    jobId: jobId.toString(),
    agent: { agentId: agent.agentId, wallet: agent.wallet },
    reward: { amountUsdc: rewardUsdc, usdcMode: "native" },
    lifecycle: [
      {
        status: "Funded",
        ref: simRef("fund escrow", simTx("job", jobId)),
        at: FIXED_AT,
      },
      {
        status: "Submitted",
        ref: simRef("submit deliverable", simTx("sub", jobId)),
        at: FIXED_AT,
      },
      {
        status: "Accepted",
        ref: simRef("accept work", simTx("acc", jobId)),
        at: FIXED_AT,
      },
    ],
  };
}
