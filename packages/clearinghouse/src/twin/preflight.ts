import { formatMicroToUsdc } from "@trapeza/core";
import type { SettlementState } from "@trapeza/core";
import { providerBondMicro, providerCostMicro } from "../score.js";
import { ClearingError, type NodeAssignment, type SolverInput } from "../types.js";

export interface PreflightResult {
  passed: boolean;
  requesterBalanceMicro: bigint;
  errors: string[];
}

/**
 * Deterministic forward simulation of batch settlement on a cloned snapshot.
 * Matches RefundProtocol/ERC-8183 accounting:
 * - success: provider receives fee; bond returned
 * - failure: requester refunded fee + bond from provider
 */
export function preflightSettlement(
  state: SettlementState,
  input: SolverInput,
  assignments: NodeAssignment[],
  /** Per-node oracle pass (default all success for preflight). */
  nodeOutcomes: Record<string, boolean> = {},
): PreflightResult {
  const errors: string[] = [];
  let requester = state.requesterBalanceMicro;
  const bonds = { ...state.providerBondMicro };
  const byProv = new Map(input.providers.map((p) => [p.id, p]));

  for (const a of assignments) {
    const node = input.graph.nodes.find((n) => n.nodeId === a.nodeId)!;
    const p = byProv.get(a.providerId)!;
    const fee = providerCostMicro(p);
    const bond = providerBondMicro(
      p,
      node.task.bondRatio ?? 0.1,
      node.task.valueUsdc,
    );
    const passed = nodeOutcomes[a.nodeId] ?? true;

    if (fee > requester) {
      errors.push(
        `overdraw at ${a.nodeId}: fee ${fee} > requester ${requester}`,
      );
    }
    requester -= fee;

    const provBond = bonds[a.providerId] ?? 0n;
    if (bond > provBond) {
      errors.push(`insufficient bond for ${a.providerId} on ${a.nodeId}`);
    }

    if (passed) {
      bonds[a.providerId] = provBond;
    } else {
      requester += fee + bond;
      bonds[a.providerId] = provBond - bond;
      if (bonds[a.providerId]! < 0n) {
        errors.push(`negative bond after slash ${a.providerId}`);
      }
    }
  }

  if (requester < 0n) errors.push("requester balance negative");

  return {
    passed: errors.length === 0,
    requesterBalanceMicro: requester,
    errors,
  };
}

export function assertPreflight(
  state: SettlementState,
  input: SolverInput,
  assignments: NodeAssignment[],
): void {
  const r = preflightSettlement(state, input, assignments);
  if (!r.passed) {
    throw new ClearingError(
      `preflight failed: ${r.errors.join("; ")}`,
      "PREFLIGHT_FAILED",
    );
  }
}

export function formatPreflightSummary(r: PreflightResult): string {
  return `requester=${formatMicroToUsdc(r.requesterBalanceMicro)} errors=${r.errors.length}`;
}
