/**
 * Shared scenario runner — produces DemoRun JSON for fixtures and the harness.
 */

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
  createTraceCollector,
  formatPreflightSummary,
  pHat,
  preflightSettlement,
  scoreProviderForNode,
  solveCpSat,
  solveGreedyLns,
  solveMilp,
  solverHealthy,
  type NodeAssignment,
  type SolverInput,
  type SolverProvider,
} from "@trapeza/clearinghouse";
import {
  DEMO_RUN_SCHEMA_VERSION,
  type AllocationView,
  type BakeOff,
  type BakeOffSolverResult,
  type CalibrationContrast,
  type CalibrationModeResult,
  type DemoRun,
  type ManifestRun,
  type RunStatus,
  type SolverKind,
  type TraceStep,
  type TwinMonteCarlo,
} from "../apps/dashboard/src/types/contract.js";
import { DEMO_SEED, fundedSnapshot, underFundedSnapshot } from "./data.js";
import type { Scenario } from "./scenario-registry.js";

export interface ComputeRunOptions {
  preferCpSat?: boolean;
  trace?: boolean;
}

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

function archetypeOf(p: SolverProvider): DemoRun["providers"][0]["archetype"] {
  const claimed = p.claimedSuccessProb;
  const realized = realizedPHat(p);
  if (claimed - realized > 0.25) return "braggart";
  if (realized - claimed > 0.1) return "workhorse";
  return "neutral";
}

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

function toGraphView(graph: TaskGraph, bottleneck: Set<string>): DemoRun["graph"] {
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

function toProviderViews(providers: SolverProvider[]): DemoRun["providers"] {
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
  preferCpSat: boolean,
): Promise<{ assignments: NodeAssignment[]; objectiveValue: number; solver: SolverKind }> {
  if (preferCpSat && serviceUp) {
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

function enrichScoreCandidates(
  scenario: Scenario,
  useCalibration: boolean,
  startSeq: number,
): TraceStep[] {
  const steps: TraceStep[] = [];
  let seq = startSeq;
  for (const n of scenario.graph.nodes) {
    const cap = n.task.capability;
    const eligible = scenario.providers.filter((p) => p.capabilities.includes(cap));
    const ranked = eligible
      .map((p) => ({
        providerId: p.id,
        score: scoreProviderForNode(scenario.graph, n.nodeId, p, useCalibration),
        pHat: pHat(p, useCalibration),
        priceUsdc: p.priceUsdc,
      }))
      .sort((a, b) => b.score - a.score);
    seq += 1;
    steps.push({
      seq,
      phase: "score-candidates",
      nodeId: n.nodeId,
      level: "info",
      message: `${n.nodeId}: ${ranked.length} candidates — top ${ranked[0]?.providerId ?? "none"} (score ${ranked[0]?.score.toFixed(4) ?? "—"})`,
      data: { ranked },
    });
  }
  return steps;
}

async function computeBakeOff(
  input: SolverInput,
  serviceUp: boolean,
  preferCpSat: boolean,
  sink?: (s: Omit<TraceStep, "seq">) => void,
): Promise<BakeOff> {
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

  let optimal: BakeOffSolverResult;
  if (preferCpSat && serviceUp) {
    try {
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
    } catch {
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
  const winner: SolverKind = optimal.status === "cleared" ? optimal.kind : greedy.kind;

  const narrative =
    greedy.status === "failed"
      ? `Greedy spends the shared budget in topological order, overpays on the easy node, and cannot afford the bottleneck (${greedy.errorCode}). The graph-aware clearing sees the whole DAG and buys cheap-but-adequate on the easy nodes to reserve budget for the bottleneck — so it clears where greedy busts. The single-task bonded broker is this graph's one-node special case.`
      : `Greedy optimizes each node in isolation (objective ${greedyObj?.toFixed(4)}) but is blind to the shared budget, deadline, quality floor and bond limits — its number is an infeasible upper bound. The CP-SAT clearing (objective ${optimalObj?.toFixed(4)}) solves those constraints jointly and returns the feasible allocation the market actually settles.`;

  sink?.({
    phase: "bake-off",
    level: "info",
    message: `Bake-off: winner=${winner}, greedy=${greedy.status}, optimal=${optimal.status}`,
    data: { winner, greedyObj, optimalObj },
  });

  return { greedy, optimal, winner, narrative };
}

async function computeCalibration(
  scenario: Scenario,
  serviceUp: boolean,
  preferCpSat: boolean,
  onAssignments: NodeAssignment[],
  onObjective: number,
  onSolver: SolverKind,
  sink?: (s: Omit<TraceStep, "seq">) => void,
): Promise<CalibrationContrast> {
  const byId = new Map(scenario.providers.map((p) => [p.id, p]));

  const offProviders = scenario.providers.map(stripCalibration);
  const offInput: SolverInput = {
    graph: scenario.graph,
    providers: offProviders,
    riskAversion: scenario.graph.riskAversion ?? 1,
    seed: DEMO_SEED,
    useCalibration: false,
  };

  let offAssignments: NodeAssignment[] = [];
  let offObjective = 0;
  let offSolver: SolverKind = onSolver;
  try {
    const off = await solvePrimary(offInput, serviceUp, preferCpSat);
    offAssignments = off.assignments;
    offObjective = off.objectiveValue;
    offSolver = off.solver;
  } catch {
    /* OFF may be infeasible under bids */
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

  const contrast: CalibrationContrast = {
    on,
    off,
    divergentNodes,
    successLift: on.realizedEndToEndSuccess - off.realizedEndToEndSuccess,
  };

  sink?.({
    phase: "calibration",
    level: "info",
    message: `Calibration contrast: ${divergentNodes.length} divergent nodes, success lift ${contrast.successLift.toFixed(3)}`,
    data: { divergentNodes, successLift: contrast.successLift },
  });

  return contrast;
}

async function computeTwin(
  scenario: Scenario,
  sink?: (s: Omit<TraceStep, "seq">) => void,
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
    attempts.push({
      ...scenario.graph,
      id: `${scenario.graph.id}-mc`,
      globalDeadlineMs: scenario.mcDeadlineMs,
    });
  }
  attempts.push(scenario.graph);

  for (const g of attempts) {
    try {
      const clearing = await mkCh(g);
      const t = clearing.twinSimulation;
      if (t) {
        sink?.({
          phase: "twin",
          level: "info",
          message: `Twin MC (${t.engine}): failure p=${t.failureProbability.toFixed(3)}`,
          data: { ...t, deadlineMs: g.globalDeadlineMs },
        });
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
      /* try looser deadline */
    }
  }
  return null;
}

function emptyClearing(): DemoRun["clearing"] {
  return {
    solver: "greedy_lns",
    degraded: false,
    objectiveValue: 0,
    makespanMs: 0,
    preflightPassed: false,
    allocations: [],
    schedule: [],
    settlementPricesUsdc: {},
    totalClearedUsdc: "0.00",
    shadowPricesUsdc: {},
  };
}

function emptyCalibration(): CalibrationContrast {
  const empty: CalibrationModeResult = {
    mode: "on",
    solver: "greedy_lns",
    objectiveValue: 0,
    allocations: [],
    realizedEndToEndSuccess: 0,
    claimedEndToEndSuccess: 0,
    expectedSpendUsdc: "0.00",
  };
  return {
    on: empty,
    off: { ...empty, mode: "off" },
    divergentNodes: [],
    successLift: 0,
  };
}

function emptyBakeOff(): BakeOff {
  const failed: BakeOffSolverResult = {
    solverLabel: "n/a",
    kind: "greedy_lns",
    status: "failed",
    objectiveValue: null,
    errorCode: "SKIPPED",
    errorMessage: "not computed",
    assignments: [],
  };
  return {
    greedy: failed,
    optimal: failed,
    winner: "greedy_lns",
    narrative: "Clearing did not complete.",
  };
}

function buildRejectedRun(
  scenario: Scenario,
  serviceUp: boolean,
  trace: TraceStep[],
  err: ClearingError,
): DemoRun {
  const bottleneck = new Set(scenario.bottleneckNodeIds);
  return {
    schemaVersion: DEMO_RUN_SCHEMA_VERSION,
    status: "rejected",
    error: { code: err.code, message: err.message },
    meta: {
      runId: scenario.runId,
      label: scenario.label,
      description: scenario.description,
      narrative: scenario.narrative,
      generatedAt: new Date().toISOString(),
      seed: DEMO_SEED,
      solverServiceUp: serviceUp,
      headlineSolver: "greedy_lns",
    },
    graph: toGraphView(scenario.graph, bottleneck),
    providers: toProviderViews(scenario.providers),
    clearing: emptyClearing(),
    calibration: emptyCalibration(),
    bakeOff: emptyBakeOff(),
    twin: null,
    preflight: {
      fundedPassed: false,
      underFunded: {
        passed: false,
        summary: err.message,
        errors: [err.message],
      },
    },
    traction: {
      nodesCleared: 0,
      totalClearedUsdc: "0.00",
      resultPerUsdc: 0,
      makespanMs: 0,
      paymentChainDepth: longestChain(scenario.graph),
      graphDensity: scenario.graph.edges.length / scenario.graph.nodes.length,
      providerCount: scenario.providers.length,
    },
    trace: finalizeTrace(trace),
  };
}

export async function computeRun(
  scenario: Scenario,
  options: ComputeRunOptions = {},
): Promise<DemoRun> {
  const preferCpSat = options.preferCpSat ?? scenario.preferCpSat ?? true;
  const wantTrace = options.trace !== false;
  const collector = wantTrace ? createTraceCollector() : null;
  const sink = collector?.sink;

  const serviceUp = scenario.forceDegrade ? false : await solverHealthy();
  const bottleneck = new Set(scenario.bottleneckNodeIds);
  const useCalibration = scenario.solverUseCalibration ?? true;
  const input: SolverInput = {
    graph: scenario.graph,
    providers: scenario.providers,
    riskAversion: scenario.graph.riskAversion ?? 1,
    seed: DEMO_SEED,
    useCalibration,
  };

  const snapshotFn = scenario.underFunded
    ? () => underFundedSnapshot(scenario.providers)
    : () => fundedSnapshot(scenario.providers);

  let clearing;
  try {
    const ch = createClearinghouse({
      providers: scenario.providers,
      seed: DEMO_SEED,
      useCalibration,
      preferCpSat: scenario.forceDegrade ? true : preferCpSat,
      solverUrl: scenario.forceDegrade ? "http://127.0.0.1:1" : undefined,
      snapshot: { getSettlementState: async () => snapshotFn() },
      onStep: sink,
    });
    clearing = await ch.submitGraph(scenario.graph);
  } catch (e) {
    if (scenario.underFunded && e instanceof ClearingError) {
      return buildRejectedRun(scenario, serviceUp, collector?.steps ?? [], e);
    }
    throw e;
  }

  if (wantTrace && collector) {
    const maxSeq = collector.steps.length > 0 ? Math.max(...collector.steps.map((s) => s.seq)) : 0;
    const scoreSteps = enrichScoreCandidates(scenario, useCalibration, maxSeq);
    collector.steps.push(...scoreSteps);
    collector.steps.sort((a, b) => a.seq - b.seq);
  }

  const taskToNode = new Map(scenario.graph.nodes.map((n) => [n.task.id, n.nodeId]));
  const onAssignments: NodeAssignment[] = clearing.allocations.map((a) => ({
    nodeId: taskToNode.get(a.taskId)!,
    providerId: a.providerId,
    score: a.score,
  }));

  const bakeOff = await computeBakeOff(input, serviceUp, preferCpSat, sink);
  const calibration = await computeCalibration(
    scenario,
    serviceUp,
    preferCpSat,
    onAssignments,
    clearing.meta.objectiveValue,
    clearing.meta.solver,
    sink,
  );
  const twin = await computeTwin(scenario, sink);

  const bad = preflightSettlement(underFundedSnapshot(scenario.providers), input, onAssignments);

  const scheduleView: NodeSchedule[] = clearing.schedule;
  const totalValue = scenario.graph.nodes.reduce(
    (s, n) => s + Number(taskValueUsdc(n.task)),
    0,
  );
  const totalCleared = Number(clearing.totalClearedUsdc);

  let status: RunStatus = "cleared";
  if (clearing.meta.degraded) status = "degraded";

  return {
    schemaVersion: DEMO_RUN_SCHEMA_VERSION,
    status,
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
    trace: collector?.steps ? finalizeTrace(collector.steps) : undefined,
  };
}

export function manifestFromRun(scenario: Scenario, run: DemoRun): ManifestRun {
  const caps = [...new Set(scenario.graph.nodes.map((n) => n.task.capability))];
  const headline =
    run.status === "rejected"
      ? `rejected: ${run.error?.code ?? "ERROR"}`
      : run.status === "degraded"
        ? `degraded → ${run.clearing.solver}`
        : `obj ${run.clearing.objectiveValue.toFixed(4)} · lift ${run.calibration.successLift.toFixed(3)}`;

  return {
    runId: scenario.runId,
    label: scenario.label,
    description: scenario.description,
    proves: scenario.proves,
    tags: scenario.tags,
    headline,
    nodeCount: scenario.graph.nodes.length,
    providerCount: scenario.providers.length,
    capabilities: caps,
    tier: scenario.tier,
    status: run.status ?? "cleared",
  };
}

export function printTrace(trace: TraceStep[]): void {
  for (const s of trace) {
    const node = s.nodeId ? ` [${s.nodeId}]` : "";
    process.stdout.write(`  ${String(s.seq).padStart(3)}  ${s.phase}${node}  ${s.message}\n`);
  }
}

/** Assign monotonic seq after merging engine + driver-enriched steps. */
export function finalizeTrace(steps: TraceStep[]): TraceStep[] {
  return [...steps]
    .sort((a, b) => a.seq - b.seq || a.phase.localeCompare(b.phase))
    .map((s, i) => ({ ...s, seq: i + 1 }));
}
