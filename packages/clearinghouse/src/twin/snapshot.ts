import { parseUsdcToMicro, type SettlementState } from "@trapeza/core";
import { providerBondMicro } from "../score.js";
import type { NodeAssignment, SolverInput } from "../types.js";

/** Fixture snapshot for tests — no chain RPC required. */
export function fixtureSettlementState(
  overrides: Partial<SettlementState> = {},
): SettlementState {
  return {
    requesterBalanceMicro: 10_000_000n,
    providerBondMicro: {},
    escrowLockedMicro: {},
    nodeFeeMicro: {},
    ...overrides,
  };
}

/**
 * Honest default snapshot when no chain source is injected: the requester is
 * funded to EXACTLY the global budget (no 2× multiplier that would mask
 * insolvency — CONSOLIDATION-PLAN bug #4), and each provider posts EXACTLY the
 * bond required across its assigned nodes. Preflight is then meaningful: an
 * injected snapshot with less funding will fail it.
 */
export function defaultSettlementState(
  input: SolverInput,
  assignments: NodeAssignment[],
): SettlementState {
  const providerBond: Record<string, bigint> = {};
  for (const a of assignments) {
    const node = input.graph.nodes.find((n) => n.nodeId === a.nodeId)!;
    const p = input.providers.find((x) => x.id === a.providerId)!;
    const bond = providerBondMicro(p, node.task.bondRatio ?? 0.1, node.task.valueUsdc);
    providerBond[a.providerId] = (providerBond[a.providerId] ?? 0n) + bond;
  }
  return {
    requesterBalanceMicro: parseUsdcToMicro(input.graph.globalBudgetUsdc),
    providerBondMicro: providerBond,
    escrowLockedMicro: {},
    nodeFeeMicro: {},
  };
}
