import { parseUsdcToMicro, type TaskGraph } from "@trapeza/core";
import seedrandom from "seedrandom";
import { parentMap, sinkNodeIds, topologicalSort } from "../dag.js";
import type { NodeAssignment, SolverInput, SolverProvider } from "../types.js";

export interface MonteCarloResult {
  failureProbability: number;
  budgetOverrunProbability: number;
  deadlineBreachProbability: number;
  expectedNetCostUsdc: number;
  seed: number;
  iterations: number;
}

/** Marsaglia-Tsang gamma sample (shape k, scale 1). */
export function gammaSample(rng: () => number, shape: number): number {
  if (shape < 1) {
    return gammaSample(rng, shape + 1) * Math.pow(rng(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normalSample(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(rng: () => number): number {
  const u = rng() || 1e-10;
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function betaSample(
  rng: () => number,
  alpha: number,
  beta: number,
): number {
  const x = gammaSample(rng, alpha);
  const y = gammaSample(rng, beta);
  return x / (x + y);
}

function sampleLatencyMs(rng: () => number, p: SolverProvider): number {
  if (p.calibration.nObservations > 0) {
    const mean = Math.max(0, Math.round(p.calibration.latencyMean));
    const std = Math.sqrt(Math.max(p.calibration.latencyVar, 0));
    return Math.max(0, mean + std * normalSample(rng));
  }
  return Math.max(0, p.claimedLatencyMs);
}

/** Longest-path makespan from per-node sampled durations (same recurrence as schedule.ts). */
function longestPathMakespan(
  graph: TaskGraph,
  order: string[],
  duration: Map<string, number>,
): number {
  const start = new Map<string, number>();
  for (const nodeId of order) {
    let earliest = 0;
    for (const e of graph.edges) {
      if (e.to !== nodeId) continue;
      const predEnd =
        (start.get(e.from) ?? 0) + (duration.get(e.from) ?? 0);
      earliest = Math.max(earliest, predEnd);
    }
    start.set(nodeId, earliest);
  }
  let makespanMs = 0;
  for (const nodeId of order) {
    const s = start.get(nodeId) ?? 0;
    const d = duration.get(nodeId) ?? 0;
    makespanMs = Math.max(makespanMs, s + d);
  }
  return makespanMs;
}

export function runMonteCarlo(
  input: SolverInput,
  assignments: NodeAssignment[],
  iterations = 500,
  seed = 42,
): MonteCarloResult {
  const rng = seedrandom(String(seed));
  const graph = input.graph;
  const byProv = new Map(input.providers.map((p) => [p.id, p]));
  const order = topologicalSort(graph);
  const parents = parentMap(graph);
  const sinks = new Set(sinkNodeIds(graph));
  const budgetMicro = Number(parseUsdcToMicro(graph.globalBudgetUsdc));

  let failCount = 0;
  let overrunCount = 0;
  let deadlineCount = 0;
  let costSum = 0;

  for (let k = 0; k < iterations; k++) {
    const success = new Map<string, boolean>();

    for (const nodeId of order) {
      const a = assignments.find((x) => x.nodeId === nodeId)!;
      const p = byProv.get(a.providerId)!;
      const alpha = p.calibration.successAlpha;
      const beta = p.calibration.successBeta;
      let ok = rng() < betaSample(() => rng(), alpha, beta);
      for (const par of parents.get(nodeId) ?? []) {
        if (!success.get(par)) ok = false;
      }
      success.set(nodeId, ok);
    }

    const workflowOk = [...sinks].every((s) => success.get(s));
    if (!workflowOk) failCount++;

    let totalCost = 0;
    const duration = new Map<string, number>();
    for (const a of assignments) {
      const p = byProv.get(a.providerId)!;
      duration.set(a.nodeId, sampleLatencyMs(() => rng(), p));

      const mean =
        p.calibration.nObservations > 0
          ? p.calibration.costMean
          : Number(p.priceUsdc);
      const std = Math.sqrt(Math.max(p.calibration.costVar, 0));
      const draw = Math.max(0, mean + std * normalSample(() => rng()));
      if (success.get(a.nodeId)) totalCost += draw;
    }

    if (totalCost * 1_000_000 > budgetMicro) overrunCount++;
    costSum += totalCost;

    const makespanMs = longestPathMakespan(graph, order, duration);
    if (makespanMs > graph.globalDeadlineMs) deadlineCount++;
  }

  return {
    failureProbability: failCount / iterations,
    budgetOverrunProbability: overrunCount / iterations,
    deadlineBreachProbability: deadlineCount / iterations,
    expectedNetCostUsdc: costSum / iterations,
    seed,
    iterations,
  };
}
