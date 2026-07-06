/**
 * Engine → JSON driver.
 *
 * Runs the REAL Trapeza engine (Python CP-SAT Tier-1 when the service is up, TS
 * Tier-2 otherwise) over a set of scenarios and emits one versioned
 * `demo-run.json` per scenario into `apps/dashboard/src/fixtures/`. These bundled
 * fixtures are what the deployed dashboard replays with zero backend.
 *
 * The engine is untouched: this driver only orchestrates the existing
 * `submitGraph` / `solveCpSat` / `solveGreedyLns` / Monte-Carlo seams and
 * reshapes their output into the dashboard contract.
 *
 * Run:  npm run demo:emit
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  calibratedEstimate,
  defaultCalibration,
  formatMicroToUsdc,
  parseUsdcToMicro,
  pSuccessMean,
  taskValueUsdc,
  type NodeSchedule,
  type TaskGraph,
} from "@trapeza/core";
import {
  ClearingError,
  createClearinghouse,
  formatPreflightSummary,
  preflightSettlement,
  solveCpSat,
  solveGreedyLns,
  solveMilp,
  solverHealthy,
  type NodeAssignment,
  type SolverInput,
  type SolverProvider,
} from "@trapeza/clearinghouse";
import {
  DEMO_SEED,
  budgetBottleneckGraph,
  budgetBottleneckProvidersUncalibrated,
  fundedSnapshot,
  underFundedSnapshot,
  workflowGraph,
  workflowProviders,
} from "./data.js";
import {
  DEMO_RUN_SCHEMA_VERSION,
  type AllocationView,
  type BakeOff,
  type BakeOffSolverResult,
  type CalibrationContrast,
  type CalibrationModeResult,
  type DemoRun,
  type GraphView,
  type ProviderView,
  type SolverKind,
  type TwinMonteCarlo,
} from "../apps/dashboard/src/types/contract.js";
import { researchGraph, researchProviders } from "./scenarios.js";

interface Scenario {
  runId: string;
  label: string;
  description: string;
  narrative: string;
  graph: TaskGraph;
  providers: SolverProvider[];
  bottleneckNodeIds: string[];
  /** Optional tighter deadline used only for the Monte-Carlo risk panel. */
  mcDeadlineMs?: number;
}

// ── small helpers ────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, "..", "apps", "dashboard", "src", "fixtures");

function stripCalibration(p: SolverProvider): SolverProvider {
  return { ...p, calibration: defaultCalibration(p.id, p.capabilities[0]!) };
}

function realizedPHat(p: SolverProvider): number {
  return p.calibration.nObservations > 0
    ? pSuccessMean(p.calibration)
    : p.claimedSuccessProb;
}

function providerRealizedCostUsdc(p: SolverProvider): number {
  const est = calibratedEstimate(p.calibration);
  return p.calibration.nObservations > 0 ? est.costMeanUsdc : Number(p.priceUsdc);
}

function endToEndSuccess(
  allocations: { providerId: string }[],
  byId: Map<string, SolverProvider>,
  which: "realized" | "claimed",
): number {
  let product = 1;
  for (const a of allocations) {
    const p = byId.get(a.providerId)!;
    product *= which === "realized" ? realizedPHat(p) : p.claimedSuccessProb;
  }
  return product;
}

function archetypeOf(p: SolverProvider): ProviderView["archetype"] {
  const claimed = p.claimedSuccessProb;
  const realized = realizedPHat(p);
  if (claimed - realized > 0.25) return "braggart";
  if (realized - claimed > 0.1) return "workhorse";
  return "neutral";
}

/** Longest dependency chain (in node count) = payment-chain depth. */
function longestChain(graph: TaskGraph): number {
  const succ = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const n of graph.nodes) {
    succ.set(n.nodeId, []);
    indeg.set(n.nodeId, 0);
  }
  for (const e of graph.edges) {
    succ.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const depth = new Map<string, number>();
  const queue = graph.nodes.filter((n) => (indeg.get(n.nodeId) ?? 0) === 0).map((n) => n.nodeId);
  for (const id of queue) depth.set(id, 1);
  const order = [...queue];
  const remaining = new Map(indeg);
  while (order.length > 0) {
    const cur = order.shift()!;
    for (const nx of succ.get(cur) ?? []) {
      depth.set(nx, Math.max(depth.get(nx) ?? 1, (depth.get(cur) ?? 1) + 1));
      remaining.set(nx, (remaining.get(nx) ?? 0) - 1);
      if ((remaining.get(nx) ?? 0) === 0) order.push(nx);
    }
  }
  return Math.max(1, ...depth.values());
}

function toGraphView(graph: TaskGraph, bottleneck: Set<string>): GraphView {
  return {
    id: graph.id,
    globalBudgetUsdc: graph.globalBudgetUsdc,
    globalDeadlineMs: graph.globalDeadlineMs,
    globalQualityFloor: graph.globalQualityFloor ?? null,
    riskAversion: graph.riskAversion ?? 1,
    nodes: graph.nodes.map((n) => ({
      nodeId: n.nodeId,
      capability: n.task.capability,
      valueUsdc: n.task.valueUsdc,
      budgetUsdc: n.task.budgetUsdc,
      bondRatio: n.task.bondRatio ?? 0.1,
      qualityFloor: n.task.qualityFloor ?? null,
      bottleneck: bottleneck.has(n.nodeId),
    })),
    edges: graph.edges.map((e) => ({ from: e.from, to: e.to })),
  };
}

function toProviderViews(providers: SolverProvider[]): ProviderView[] {
  return providers.map((p) => {
    const est = calibratedEstimate(p.calibration);
    return {
      id: p.id,
      capabilities: p.capabilities,
      priceUsdc: p.priceUsdc,
      bondOfferedUsdc: p.bondOfferedUsdc,
      claimedSuccessProb: p.claimedSuccessProb,
      claimedLatencyMs: p.claimedLatencyMs,
      calibratedSuccessProb: est.pSuccess,
      pSuccessStdDev: est.pSuccessStdDev,
      successAlpha: p.calibration.successAlpha,
      successBeta: p.calibration.successBeta,
      costMeanUsdc: est.costMeanUsdc,
      latencyMeanMs: est.latencyMeanMs,
      nObservations: est.nObservations,
      archetype: archetypeOf(p),
    };
  });
}

async function solvePrimary(
  input: SolverInput,
  serviceUp: boolean,
): Promise<{ assignments: NodeAssignment[]; objectiveValue: number; solver: SolverKind }> {
  if (serviceUp) {
    try {
      const cp = await solveCpSat(input);
      return { assignments: cp.assignments, objectiveValue: cp.objectiveValue, solver: "cp_sat" };
    } catch {
      /* degrade */
    }
  }
  const greedy = solveGreedyLns(input);
  return { assignments: greedy.assignments, objectiveValue: greedy.objectiveValue, solver: "greedy_lns" };
}

function allocationsToViews(
  assignments: NodeAssignment[],
  graph: TaskGraph,
): AllocationView[] {
  return assignments.map((a) => {
    const node = graph.nodes.find((n) => n.nodeId === a.nodeId)!;
    return { nodeId: a.nodeId, taskId: node.task.id, providerId: a.providerId, score: a.score };
  });
}

async function computeBakeOff(
  input: SolverInput,
  serviceUp: boolean,
): Promise<BakeOff> {
  // Greedy per-node router (Tier-2) — the naive opponent.
  let greedy: BakeOffSolverResult;
  try {
    const g = solveGreedyLns(input);
    greedy = {
      solverLabel: "Greedy + LNS (per-node, Tier-2)",
      kind: "greedy_lns",
      status: "cleared",
      objectiveValue: g.objectiveValue,
      errorCode: null,
      errorMessage: null,
      assignments: allocationsToViews(g.assignments, input.graph),
    };
  } catch (e) {
    const err = e instanceof ClearingError ? e : null;
    greedy = {
      solverLabel: "Greedy + LNS (per-node, Tier-2)",
      kind: "greedy_lns",
      status: "failed",
      objectiveValue: null,
      errorCode: err?.code ?? "ERROR",
      errorMessage: err?.message ?? String(e),
      assignments: [],
    };
  }

  // Graph-aware optimal clearing (Tier-1 CP-SAT, or TS HiGHS stand-in).
  let optimal: BakeOffSolverResult;
  if (serviceUp) {
    const cp = await solveCpSat(input);
    optimal = {
      solverLabel: "CP-SAT graph clearing (Python Tier-1)",
      kind: "cp_sat",
      status: "cleared",
      objectiveValue: cp.objectiveValue,
      errorCode: null,
      errorMessage: null,
      assignments: allocationsToViews(cp.assignments, input.graph),
    };
  } else {
    const milp = await solveMilp(input);
    optimal = {
      solverLabel: "HiGHS MILP graph clearing (TS stand-in)",
      kind: "highs_milp",
      status: "cleared",
      objectiveValue: milp.objectiveValue,
      errorCode: null,
      errorMessage: null,
      assignments: allocationsToViews(milp.assignments, input.graph),
    };
  }

  const greedyObj = greedy.status === "cleared" ? greedy.objectiveValue! : null;
  const optimalObj = optimal.status === "cleared" ? optimal.objectiveValue! : null;
  // The graph-aware clearing is the winner whenever it produces a feasible
  // allocation: it jointly respects the global budget, deadline, quality floor,
  // bond capacity and concurrency that the per-node greedy router ignores.
  const winner: SolverKind = optimal.status === "cleared" ? optimal.kind : greedy.kind;

  const narrative =
    greedy.status === "failed"
      ? `Greedy spends the shared budget in topological order, overpays on the easy node, and cannot afford the bottleneck (${greedy.errorCode}). The graph-aware clearing sees the whole DAG and buys cheap-but-adequate on the easy nodes to reserve budget for the bottleneck — so it clears where greedy busts. The single-task bonded broker is this graph's one-node special case.`
      : `Greedy optimizes each node in isolation (objective ${greedyObj?.toFixed(4)}) but is blind to the shared budget, deadline, quality floor and bond limits — its number is an infeasible upper bound. The CP-SAT clearing (objective ${optimalObj?.toFixed(4)}) solves those constraints jointly and returns the feasible allocation the market actually settles.`;

  return { greedy, optimal, winner, narrative };
}

async function computeCalibration(
  scenario: Scenario,
  serviceUp: boolean,
  onAssignments: NodeAssignment[],
  onObjective: number,
  onSolver: SolverKind,
): Promise<CalibrationContrast> {
  const byId = new Map(scenario.providers.map((p) => [p.id, p]));

  const offProviders = scenario.providers.map(stripCalibration);
  const offInput: SolverInput = {
    graph: scenario.graph,
    providers: offProviders,
    riskAversion: scenario.graph.riskAversion ?? 1,
    seed: DEMO_SEED,
  };

  let offAssignments: NodeAssignment[] = [];
  let offObjective = 0;
  let offSolver: SolverKind = onSolver;
  try {
    const off = await solvePrimary(offInput, serviceUp);
    offAssignments = off.assignments;
    offObjective = off.objectiveValue;
    offSolver = off.solver;
  } catch {
    /* OFF may be infeasible under bids — leave empty */
  }

  const onViews = allocationsToViews(onAssignments, scenario.graph);
  const offViews = allocationsToViews(offAssignments, scenario.graph);

  const expectedSpend = (assigns: { providerId: string }[]): string => {
    let micro = 0n;
    for (const a of assigns) {
      micro += parseUsdcToMicro(String(providerRealizedCostUsdc(byId.get(a.providerId)!)));
    }
    return formatMicroToUsdc(micro);
  };

  const on: CalibrationModeResult = {
    mode: "on",
    solver: onSolver,
    objectiveValue: onObjective,
    allocations: onViews,
    realizedEndToEndSuccess: endToEndSuccess(onViews, byId, "realized"),
    claimedEndToEndSuccess: endToEndSuccess(onViews, byId, "claimed"),
    expectedSpendUsdc: expectedSpend(onViews),
  };
  const off: CalibrationModeResult = {
    mode: "off",
    solver: offSolver,
    objectiveValue: offObjective,
    allocations: offViews,
    realizedEndToEndSuccess: offViews.length ? endToEndSuccess(offViews, byId, "realized") : 0,
    claimedEndToEndSuccess: offViews.length ? endToEndSuccess(offViews, byId, "claimed") : 0,
    expectedSpendUsdc: expectedSpend(offViews),
  };

  const onByNode = new Map(onViews.map((a) => [a.nodeId, a.providerId]));
  const divergentNodes = offViews
    .filter((a) => onByNode.get(a.nodeId) !== a.providerId)
    .map((a) => a.nodeId);

  return {
    on,
    off,
    divergentNodes,
    successLift: on.realizedEndToEndSuccess - off.realizedEndToEndSuccess,
  };
}

async function computeTwin(
  scenario: Scenario,
  serviceUp: boolean,
): Promise<TwinMonteCarlo | null> {
  const mkCh = (graph: TaskGraph) =>
    createClearinghouse({
      providers: scenario.providers,
      seed: DEMO_SEED,
      snapshot: { getSettlementState: async () => fundedSnapshot(scenario.providers) },
      monteCarlo: { enabled: true, iterations: 500 },
    }).submitGraph(graph);

  const attempts: TaskGraph[] = [];
  if (scenario.mcDeadlineMs) {
    attempts.push({ ...scenario.graph, id: `${scenario.graph.id}-mc`, globalDeadlineMs: scenario.mcDeadlineMs });
  }
  attempts.push(scenario.graph);

  for (const g of attempts) {
    try {
      const clearing = await mkCh(g);
      const t = clearing.twinSimulation;
      if (t) {
        return {
          engine: t.engine,
          iterations: t.iterations,
          deadlineMs: g.globalDeadlineMs,
          failureProbability: t.failureProbability,
          budgetOverrunProbability: t.budgetOverrunProbability,
          deadlineBreachProbability: t.deadlineBreachProbability,
          expectedNetCostUsdc: t.expectedNetCostUsdc,
        };
      }
    } catch {
      /* try the next (looser) deadline */
    }
  }
  return null;
  void serviceUp;
}

async function computeRun(scenario: Scenario): Promise<DemoRun> {
  const serviceUp = await solverHealthy();
  const bottleneck = new Set(scenario.bottleneckNodeIds);
  const input: SolverInput = {
    graph: scenario.graph,
    providers: scenario.providers,
    riskAversion: scenario.graph.riskAversion ?? 1,
    seed: DEMO_SEED,
  };

  // Headline clearing (calibration ON) via the real submitGraph path.
  const ch = createClearinghouse({
    providers: scenario.providers,
    seed: DEMO_SEED,
    snapshot: { getSettlementState: async () => fundedSnapshot(scenario.providers) },
  });
  const clearing = await ch.submitGraph(scenario.graph);

  // ON assignments (nodeId-keyed) recovered from the clearing allocations.
  const taskToNode = new Map(scenario.graph.nodes.map((n) => [n.task.id, n.nodeId]));
  const onAssignments: NodeAssignment[] = clearing.allocations.map((a) => ({
    nodeId: taskToNode.get(a.taskId)!,
    providerId: a.providerId,
    score: a.score,
  }));

  const bakeOff = await computeBakeOff(input, serviceUp);
  const calibration = await computeCalibration(
    scenario,
    serviceUp,
    onAssignments,
    clearing.meta.objectiveValue,
    clearing.meta.solver,
  );
  const twin = await computeTwin(scenario, serviceUp);

  // Preflight: same clearing against an under-funded requester → rejected.
  const bad = preflightSettlement(underFundedSnapshot(scenario.providers), input, onAssignments);

  const scheduleView: NodeSchedule[] = clearing.schedule;
  const totalValue = scenario.graph.nodes.reduce(
    (s, n) => s + Number(taskValueUsdc(n.task)),
    0,
  );
  const totalCleared = Number(clearing.totalClearedUsdc);

  return {
    schemaVersion: DEMO_RUN_SCHEMA_VERSION,
    meta: {
      runId: scenario.runId,
      label: scenario.label,
      description: scenario.description,
      narrative: scenario.narrative,
      generatedAt: new Date().toISOString(),
      seed: DEMO_SEED,
      solverServiceUp: serviceUp,
      headlineSolver: clearing.meta.solver,
    },
    graph: toGraphView(scenario.graph, bottleneck),
    providers: toProviderViews(scenario.providers),
    clearing: {
      solver: clearing.meta.solver,
      degraded: clearing.meta.degraded ?? false,
      objectiveValue: clearing.meta.objectiveValue,
      makespanMs: clearing.meta.makespanMs,
      preflightPassed: clearing.meta.preflightPassed,
      allocations: allocationsToViews(onAssignments, scenario.graph),
      schedule: scheduleView.map((s) => ({
        nodeId: s.nodeId,
        startMs: s.startMs,
        durationMs: s.durationMs,
        endMs: s.endMs,
      })),
      settlementPricesUsdc: clearing.settlementPricesUsdc,
      totalClearedUsdc: clearing.totalClearedUsdc,
      shadowPricesUsdc: clearing.shadowPricesUsdc,
    },
    calibration,
    bakeOff,
    twin,
    preflight: {
      fundedPassed: clearing.meta.preflightPassed,
      underFunded: {
        passed: bad.passed,
        summary: formatPreflightSummary(bad),
        errors: bad.errors,
      },
    },
    traction: {
      nodesCleared: onAssignments.length,
      totalClearedUsdc: clearing.totalClearedUsdc,
      resultPerUsdc: totalCleared > 0 ? totalValue / totalCleared : 0,
      makespanMs: clearing.meta.makespanMs,
      paymentChainDepth: longestChain(scenario.graph),
      graphDensity: scenario.graph.edges.length / scenario.graph.nodes.length,
      providerCount: scenario.providers.length,
    },
  };
}

const SCENARIOS: Scenario[] = [
  {
    runId: "invoice-workflow",
    label: "Invoice workflow (6-node DAG)",
    description:
      "A six-node extraction → reconcile → fact-check → format pipeline where braggart providers claim 97–99% but realize ~15%.",
    narrative:
      "The clearinghouse ingests the whole workflow and prices every provider from its realized-outcome ledger, not its bid. Calibration ON routes to the workhorses; the same market with calibration OFF buys the braggarts and the workflow collapses.",
    graph: workflowGraph,
    providers: workflowProviders,
    bottleneckNodeIds: ["n6"],
    mcDeadlineMs: 620,
  },
  {
    runId: "budget-bottleneck",
    label: "Budget bottleneck (greedy busts)",
    description:
      "A two-node logo → code graph under a tight $1.00 budget: the CP-SAT clearing vs the naive greedy router.",
    narrative:
      "Greedy spends in topological order, overpays on the easy logo step, and has nothing left for the bottleneck code node — it returns NO_PROVIDER. CP-SAT sees the whole graph and clears feasibly at a higher objective. The single-task bonded broker is this graph's one-node special case.",
    graph: budgetBottleneckGraph,
    providers: budgetBottleneckProvidersUncalibrated,
    bottleneckNodeIds: ["code"],
  },
  {
    runId: "research-pipeline",
    label: "Research pipeline (8-node, tight deadline)",
    description:
      "An eight-node research → extract×3 → reconcile → fact-check → format DAG under a tight deadline, stressing the schedule and the twin risk preflight.",
    narrative:
      "A denser workflow with a real critical path. Shadow prices reveal which constraint (budget vs deadline vs a scarce provider) is binding, and the State-Twins Monte Carlo scores failure / deadline-breach / budget-overrun risk on the cleared plan before a cent moves.",
    graph: researchGraph,
    providers: researchProviders,
    bottleneckNodeIds: ["reconcile", "factcheck"],
    mcDeadlineMs: 900,
  },
];

async function main(): Promise<void> {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const manifest: { runId: string; label: string; description: string }[] = [];

  for (const scenario of SCENARIOS) {
    process.stdout.write(`  emitting ${scenario.runId} … `);
    const run = await computeRun(scenario);
    const file = join(FIXTURE_DIR, `${scenario.runId}.json`);
    writeFileSync(file, `${JSON.stringify(run, null, 2)}\n`, "utf8");
    manifest.push({
      runId: scenario.runId,
      label: scenario.label,
      description: scenario.description,
    });
    process.stdout.write(
      `ok (solver=${run.clearing.solver}, obj=${run.clearing.objectiveValue.toFixed(4)}, ` +
        `bakeoff winner=${run.bakeOff.winner}, calib lift=${run.calibration.successLift.toFixed(3)})\n`,
    );
  }

  writeFileSync(
    join(FIXTURE_DIR, "manifest.json"),
    `${JSON.stringify({ schemaVersion: DEMO_RUN_SCHEMA_VERSION, runs: manifest }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`\n  wrote ${SCENARIOS.length} fixtures + manifest to ${FIXTURE_DIR}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
