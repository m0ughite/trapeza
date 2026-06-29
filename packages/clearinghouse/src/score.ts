import {
  calibratedEstimate,
  computeRiskPremium,
  DEFAULT_CONFIG,
  pSuccessMean,
  parseUsdcToMicro,
  scaleLogProbability,
  scaleProbability,
  taskValueUsdc,
  type TaskGraph,
} from "@trapeza/core";
import { topologicalSort } from "./dag.js";
import { ClearingError, type NodeAssignment, type SolverInput, type SolverProvider } from "./types.js";

export function providerCostUsdc(p: SolverProvider): number {
  const est = calibratedEstimate(p.calibration);
  return p.calibration.nObservations > 0
    ? est.costMeanUsdc
    : Number(p.priceUsdc);
}

export function providerCostMicro(p: SolverProvider): bigint {
  return parseUsdcToMicro(String(providerCostUsdc(p)));
}

export function providerBondMicro(
  p: SolverProvider,
  bondRatio: number,
  valueUsdc: string,
): bigint {
  const offered = parseUsdcToMicro(p.bondOfferedUsdc);
  if (offered > 0n) return offered;
  const value = parseUsdcToMicro(valueUsdc);
  return (value * BigInt(Math.round(bondRatio * 1000))) / 1000n;
}

export function scoreProviderForNode(
  graph: TaskGraph,
  nodeId: string,
  provider: SolverProvider,
): number {
  const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
  const spec = node.task;
  const est = calibratedEstimate(provider.calibration);
  const pSuccess =
    provider.calibration.nObservations > 0
      ? est.pSuccess
      : provider.claimedSuccessProb;
  const value = taskValueUsdc(spec);
  const price = providerCostUsdc(provider);
  const risk = computeRiskPremium({
    spec,
    value,
    pSuccess,
    pStdDev: est.pSuccessStdDev,
    bondOffered: Number(provider.bondOfferedUsdc),
    config: { ...DEFAULT_CONFIG, riskAversion: graph.riskAversion ?? 1 },
  });
  return pSuccess * value - price - risk;
}

export function greedyAssign(input: SolverInput): NodeAssignment[] {
  const { graph, providers } = input;
  const order = topologicalSort(graph);
  let budgetLeft = parseUsdcToMicro(graph.globalBudgetUsdc);
  const assignments: NodeAssignment[] = [];

  for (const nodeId of order) {
    const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
    const cap = node.task.capability;
    const candidates = providers.filter((p) => p.capabilities.includes(cap));
    let best: { p: SolverProvider; score: number } | null = null;

    for (const p of candidates) {
      const cost = providerCostMicro(p);
      const bond = providerBondMicro(
        p,
        node.task.bondRatio ?? 0.1,
        node.task.valueUsdc,
      );
      if (cost + bond > budgetLeft) continue;

      const qFloor = node.task.qualityFloor ?? 0;
      const pHat =
        p.calibration.nObservations > 0
          ? pSuccessMean(p.calibration)
          : p.claimedSuccessProb;
      if (pHat < qFloor) continue;

      const score = scoreProviderForNode(graph, nodeId, p);
      if (!best || score > best.score) best = { p, score };
    }

    if (!best) {
      throw new ClearingError(
        `no feasible provider for ${nodeId}`,
        "NO_PROVIDER",
      );
    }

    const cost = providerCostMicro(best.p);
    const bond = providerBondMicro(
      best.p,
      node.task.bondRatio ?? 0.1,
      node.task.valueUsdc,
    );
    budgetLeft -= cost + bond;
    assignments.push({
      nodeId,
      providerId: best.p.id,
      score: best.score,
    });
  }
  return assignments;
}

export function objectiveFromAssignments(
  _input: SolverInput,
  assignments: NodeAssignment[],
): number {
  return assignments.reduce((sum, a) => sum + a.score, 0);
}

/** Large-neighborhood search: destroy random nodes and re-greedy repair. */
export function lnsImprove(
  input: SolverInput,
  seed = 42,
  iterations = 30,
): NodeAssignment[] {
  let best = greedyAssign(input);
  let bestObj = objectiveFromAssignments(input, best);
  const rng = mulberry32(seed);

  for (let i = 0; i < iterations; i++) {
    const destroyCount = Math.max(1, Math.floor(best.length * 0.3));
    const destroyed = new Set<string>();
    while (destroyed.size < destroyCount) {
      destroyed.add(best[Math.floor(rng() * best.length)]!.nodeId);
    }

    try {
      const partial = best.filter((a) => !destroyed.has(a.nodeId));
      const order = topologicalSort(input.graph);
      let budgetLeft = parseUsdcToMicro(input.graph.globalBudgetUsdc);

      for (const a of partial) {
        const node = input.graph.nodes.find((n) => n.nodeId === a.nodeId)!;
        const p = input.providers.find((x) => x.id === a.providerId)!;
        budgetLeft -=
          providerCostMicro(p) +
          providerBondMicro(
            p,
            node.task.bondRatio ?? 0.1,
            node.task.valueUsdc,
          );
      }

      const rebuilt = [...partial];
      for (const nodeId of order) {
        if (!destroyed.has(nodeId)) continue;
        const node = input.graph.nodes.find((n) => n.nodeId === nodeId)!;
        const cap = node.task.capability;
        let pick: { p: SolverProvider; score: number } | null = null;

        for (const p of input.providers.filter((x) =>
          x.capabilities.includes(cap),
        )) {
          const cost = providerCostMicro(p);
          const bond = providerBondMicro(
            p,
            node.task.bondRatio ?? 0.1,
            node.task.valueUsdc,
          );
          if (cost + bond > budgetLeft) continue;
          const score = scoreProviderForNode(input.graph, nodeId, p);
          if (!pick || score > pick.score) pick = { p, score };
        }
        if (!pick) continue;

        const cost = providerCostMicro(pick.p);
        const bond = providerBondMicro(
          pick.p,
          node.task.bondRatio ?? 0.1,
          node.task.valueUsdc,
        );
        budgetLeft -= cost + bond;
        rebuilt.push({ nodeId, providerId: pick.p.id, score: pick.score });
      }

      if (rebuilt.length !== best.length) continue;
      const obj = objectiveFromAssignments(input, rebuilt);
      if (obj > bestObj) {
        best = rebuilt;
        bestObj = obj;
      }
    } catch {
      /* keep best */
    }
  }
  return best;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export { scaleLogProbability, scaleProbability };
