/**
 * Demo scenario primitives — provider/graph builders + settlement snapshots.
 *
 * The concrete, recognizable workflows (invoice, research, ETL, support triage,
 * code-PR, RAG Q&A) live in `demo/scenarios.ts` and are assembled into the
 * runnable registry in `demo/scenario-registry.ts`. This module only holds the
 * shared constructors and the funded / under-funded settlement snapshots.
 */

import {
  defaultCalibration,
  parseUsdcToMicro,
  updateCalibration,
  type CalibrationRecord,
  type Outcome,
  type TaskGraph,
  type TaskSpec,
} from "@trapeza/core";
import {
  fixtureSettlementState,
  type SolverProvider,
} from "@trapeza/clearinghouse";

const DEMO_SEED = 42;

/** Fold synthetic realized outcomes into a calibration ledger. */
export function buildCalibration(
  providerId: string,
  capability: string,
  outcomes: Array<{ passed: boolean; cost: string; latency: number }>,
): CalibrationRecord {
  let cal = defaultCalibration(providerId, capability);
  let t = 1;
  for (const o of outcomes) {
    const outcome: Outcome = {
      taskId: `task-${providerId}-${t}`,
      providerId,
      passed: o.passed,
      score: o.passed ? 100 : 0,
      evidenceURI: "demo://synthetic",
      realizedCostUsdc: o.cost,
      realizedLatencyMs: o.latency,
    };
    cal = updateCalibration(cal, outcome, t);
    t++;
  }
  return cal;
}

/**
 * A track record of `passes`/`total` verified outcomes at roughly `cost`/`latency`.
 * A workhorse passes most of its history; a braggart passes very little of it —
 * so its realized posterior mean lands far below its self-reported claim.
 */
export function trackRecord(
  passes: number,
  total: number,
  cost: string,
  latency: number,
) {
  return Array.from({ length: total }, (_, i) => ({
    passed: i < passes,
    cost,
    latency: latency + (i % 5) * 10,
  }));
}

export function makeProvider(
  id: string,
  capability: string,
  opts: {
    priceUsdc: string;
    claimedSuccessProb: number;
    claimedLatencyMs: number;
    outcomes: Array<{ passed: boolean; cost: string; latency: number }>;
    bondOfferedUsdc?: string;
  },
): SolverProvider {
  return {
    id,
    capabilities: [capability],
    priceUsdc: opts.priceUsdc,
    bondOfferedUsdc: opts.bondOfferedUsdc ?? "0",
    claimedSuccessProb: opts.claimedSuccessProb,
    claimedLatencyMs: opts.claimedLatencyMs,
    calibration: buildCalibration(id, capability, opts.outcomes),
  };
}

export function makeUncalibratedProvider(
  id: string,
  capability: string,
  opts: {
    priceUsdc: string;
    claimedSuccessProb: number;
    claimedLatencyMs?: number;
  },
): SolverProvider {
  return {
    id,
    capabilities: [capability],
    priceUsdc: opts.priceUsdc,
    bondOfferedUsdc: "0",
    claimedSuccessProb: opts.claimedSuccessProb,
    claimedLatencyMs: opts.claimedLatencyMs ?? 100,
    calibration: defaultCalibration(id, capability),
  };
}

export function makeNode(
  nodeId: string,
  task: Partial<TaskSpec> & { capability: string },
): TaskGraph["nodes"][0] {
  return {
    nodeId,
    task: {
      id: `task-${nodeId}`,
      capability: task.capability,
      input: {},
      oracleSpec: { schema: { type: "object" }, groundTruth: {} },
      valueUsdc: task.valueUsdc ?? "1.00",
      budgetUsdc: task.budgetUsdc ?? "1.00",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: task.deadlineMs ?? 60_000,
      qualityFloor: task.qualityFloor,
      bondRatio: task.bondRatio,
    },
  };
}

export function makeGraph(
  id: string,
  nodes: TaskGraph["nodes"],
  edges: TaskGraph["edges"] = [],
  overrides: Partial<TaskGraph> = {},
): TaskGraph {
  return {
    id,
    nodes,
    edges,
    globalBudgetUsdc: "1.00",
    globalDeadlineMs: 60_000,
    ...overrides,
  };
}

/** Snapshot with bonds funded — preflight passes. */
export function fundedSnapshot(providers: SolverProvider[]) {
  return fixtureSettlementState({
    requesterBalanceMicro: parseUsdcToMicro("100.00"),
    providerBondMicro: Object.fromEntries(
      providers.map((p) => [p.id, parseUsdcToMicro("100.00")]),
    ),
  });
}

/** Snapshot with requester balance too low — preflight fails. */
export function underFundedSnapshot(providers: SolverProvider[]) {
  return fixtureSettlementState({
    requesterBalanceMicro: parseUsdcToMicro("0.05"),
    providerBondMicro: Object.fromEntries(
      providers.map((p) => [p.id, parseUsdcToMicro("100.00")]),
    ),
  });
}

export { DEMO_SEED };
