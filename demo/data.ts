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
function buildCalibration(
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

function makeProvider(
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

function makeUncalibratedProvider(
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

function makeNode(
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

function makeGraph(
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

/** Braggart: claims 98% success, realized ~15%. Workhorse: claims 65%, realized ~90%. */
function lemonsOutcomes(
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

/** Budget-vs-bottleneck graph: cheap logo vs hard code under a tight budget. */
export const budgetBottleneckGraph = makeGraph(
  "demo-budget-bottleneck",
  [
    makeNode("logo", {
      capability: "cap.logo",
      valueUsdc: "2.00",
      budgetUsdc: "2.00",
      bondRatio: 0.05,
    }),
    makeNode("code", {
      capability: "cap.code",
      valueUsdc: "1.50",
      budgetUsdc: "1.50",
      bondRatio: 0.05,
    }),
  ],
  [{ from: "logo", to: "code" }],
  { globalBudgetUsdc: "1.00", globalDeadlineMs: 120_000 },
);

/** Uncalibrated providers for bake-off — matches solver-benchmark.test.ts. */
export const budgetBottleneckProvidersUncalibrated: SolverProvider[] = [
  makeUncalibratedProvider("premium-logo", "cap.logo", {
    priceUsdc: "0.65",
    claimedSuccessProb: 0.98,
  }),
  makeUncalibratedProvider("cheap-logo", "cap.logo", {
    priceUsdc: "0.15",
    claimedSuccessProb: 0.55,
  }),
  makeUncalibratedProvider("mid-code", "cap.code", {
    priceUsdc: "0.50",
    claimedSuccessProb: 0.9,
  }),
  makeUncalibratedProvider("premium-code", "cap.code", {
    priceUsdc: "0.80",
    claimedSuccessProb: 0.95,
  }),
];

export const budgetBottleneckProviders: SolverProvider[] = [
  makeProvider("premium-logo", "cap.logo", {
    priceUsdc: "0.65",
    claimedSuccessProb: 0.98,
    claimedLatencyMs: 80,
    outcomes: lemonsOutcomes(18, 20, "0.65", 75),
  }),
  makeProvider("cheap-logo", "cap.logo", {
    priceUsdc: "0.15",
    claimedSuccessProb: 0.55,
    claimedLatencyMs: 120,
    outcomes: lemonsOutcomes(17, 20, "0.14", 115),
  }),
  makeProvider("mid-code", "cap.code", {
    priceUsdc: "0.50",
    claimedSuccessProb: 0.9,
    claimedLatencyMs: 200,
    outcomes: lemonsOutcomes(16, 20, "0.48", 195),
  }),
  makeProvider("premium-code", "cap.code", {
    priceUsdc: "0.80",
    claimedSuccessProb: 0.95,
    claimedLatencyMs: 150,
    outcomes: lemonsOutcomes(19, 20, "0.78", 145),
  }),
];

/** Six-node DAG for the full clearing walkthrough. */
export const workflowGraph = makeGraph(
  "demo-workflow",
  ["n1", "n2", "n3", "n4", "n5", "n6"].map((id, i) =>
    makeNode(id, {
      capability: `cap.${(i % 3) + 1}`,
      valueUsdc: "0.50",
      budgetUsdc: "0.80",
      bondRatio: 0.05,
    }),
  ),
  [
    { from: "n1", to: "n4" },
    { from: "n2", to: "n4" },
    { from: "n3", to: "n5" },
    { from: "n4", to: "n6" },
    { from: "n5", to: "n6" },
  ],
  { globalBudgetUsdc: "5.00", globalDeadlineMs: 120_000 },
);

/** Tight deadline variant for Monte Carlo deadline-breach demo. */
export const workflowGraphTightDeadline: TaskGraph = {
  ...workflowGraph,
  id: "demo-workflow-tight",
  globalDeadlineMs: 580,
};

export const workflowProviders: SolverProvider[] = [
  makeProvider("workhorse-1", "cap.1", {
    priceUsdc: "0.15",
    claimedSuccessProb: 0.65,
    claimedLatencyMs: 100,
    outcomes: lemonsOutcomes(18, 20, "0.14", 95),
  }),
  makeProvider("braggart-1", "cap.1", {
    priceUsdc: "0.30",
    claimedSuccessProb: 0.98,
    claimedLatencyMs: 50,
    outcomes: lemonsOutcomes(3, 20, "0.29", 55),
  }),
  makeProvider("workhorse-2", "cap.2", {
    priceUsdc: "0.20",
    claimedSuccessProb: 0.7,
    claimedLatencyMs: 150,
    outcomes: lemonsOutcomes(17, 20, "0.19", 145),
  }),
  makeProvider("braggart-2", "cap.2", {
    priceUsdc: "0.35",
    claimedSuccessProb: 0.97,
    claimedLatencyMs: 80,
    outcomes: lemonsOutcomes(4, 20, "0.34", 85),
  }),
  makeProvider("workhorse-3", "cap.3", {
    priceUsdc: "0.25",
    claimedSuccessProb: 0.68,
    claimedLatencyMs: 180,
    outcomes: lemonsOutcomes(18, 20, "0.24", 175),
  }),
  makeProvider("braggart-3", "cap.3", {
    priceUsdc: "0.40",
    claimedSuccessProb: 0.99,
    claimedLatencyMs: 60,
    outcomes: lemonsOutcomes(2, 20, "0.39", 65),
  }),
];

/** Snapshot with bonds funded — preflight passes. */
export function fundedSnapshot(providers: SolverProvider[]) {
  return fixtureSettlementState({
    requesterBalanceMicro: parseUsdcToMicro("10.00"),
    providerBondMicro: Object.fromEntries(
      providers.map((p) => [p.id, parseUsdcToMicro("10.00")]),
    ),
  });
}

/** Snapshot with requester balance too low — preflight fails. */
export function underFundedSnapshot(providers: SolverProvider[]) {
  return fixtureSettlementState({
    requesterBalanceMicro: parseUsdcToMicro("0.05"),
    providerBondMicro: Object.fromEntries(
      providers.map((p) => [p.id, parseUsdcToMicro("10.00")]),
    ),
  });
}

export { DEMO_SEED };
