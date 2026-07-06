/**
 * Portable Tier-2 clearing — a dependency-free greedy+scan solver that runs in
 * BOTH the browser (graceful fallback) and the Vercel serverless function.
 *
 * This is intentionally the Tier-2 path only: the canonical Tier-1 optimizer is
 * the Python OR-Tools CP-SAT service, which cannot run on Vercel. So "run your
 * own" is explicitly a greedy preview over the same economic signal
 * (p̂·value − cost − risk); the CP-SAT + real-receipt content lives in the
 * always-on historical runs. It reuses the contract's ProviderView / GraphView
 * so no engine types are duplicated.
 */

import type { GraphView, ProviderView } from "../types/contract";

export interface LiveOptions {
  budgetUsdc: string;
  riskAversion: number;
  calibration: "on" | "off";
  engine: "browser" | "serverless";
}

export interface LiveAllocation {
  nodeId: string;
  providerId: string;
  score: number;
  priceUsdc: number;
  pHat: number;
}

export interface LiveResult {
  ok: boolean;
  reason: string | null;
  solver: "greedy_tier2";
  engine: "browser" | "serverless";
  calibration: "on" | "off";
  budgetUsdc: string;
  riskAversion: number;
  objectiveValue: number;
  allocations: LiveAllocation[];
  totalSpendUsdc: string;
  realizedEndToEndSuccess: number;
  claimedEndToEndSuccess: number;
  note: string;
}

function topoOrder(graph: GraphView): string[] {
  const indeg = new Map<string, number>();
  const succ = new Map<string, string[]>();
  for (const n of graph.nodes) {
    indeg.set(n.nodeId, 0);
    succ.set(n.nodeId, []);
  }
  for (const e of graph.edges) {
    succ.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const q = graph.nodes.filter((n) => (indeg.get(n.nodeId) ?? 0) === 0).map((n) => n.nodeId);
  const order: string[] = [];
  while (q.length) {
    const cur = q.shift()!;
    order.push(cur);
    for (const nx of succ.get(cur) ?? []) {
      indeg.set(nx, (indeg.get(nx) ?? 0) - 1);
      if ((indeg.get(nx) ?? 0) === 0) q.push(nx);
    }
  }
  return order;
}

function pHatOf(p: ProviderView, mode: "on" | "off"): number {
  if (mode === "off") return p.claimedSuccessProb;
  return p.calibratedSuccessProb;
}

function costOf(p: ProviderView, mode: "on" | "off"): number {
  if (mode === "on" && p.nObservations > 0) return p.costMeanUsdc;
  return Number(p.priceUsdc);
}

/** Greedy per-node clearing over the shared budget. Deterministic. */
export function runLive(
  graph: GraphView,
  providers: ProviderView[],
  opts: LiveOptions,
): LiveResult {
  const order = topoOrder(graph);
  let budgetLeft = Number(opts.budgetUsdc);
  const allocations: LiveAllocation[] = [];

  for (const nodeId of order) {
    const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
    const eligible = providers.filter((p) => p.capabilities.includes(node.capability));
    let best: LiveAllocation | null = null;
    for (const p of eligible) {
      const pHat = pHatOf(p, opts.calibration);
      const price = costOf(p, opts.calibration);
      const bondOffered = Number(p.bondOfferedUsdc);
      const bond = bondOffered > 0 ? bondOffered : Number(node.valueUsdc) * node.bondRatio;
      if (price + bond > budgetLeft) continue;
      if (node.qualityFloor != null && pHat < node.qualityFloor) continue;
      const value = Number(node.valueUsdc);
      const risk = opts.riskAversion * p.pSuccessStdDev * value;
      const score = pHat * value - price - risk;
      if (!best || score > best.score) {
        best = { nodeId, providerId: p.id, score, priceUsdc: price, pHat };
      }
    }
    if (!best) {
      return {
        ok: false,
        reason: `No feasible provider: the shared budget ($${opts.budgetUsdc}) can't afford a qualifying provider for "${nodeId}".`,
        solver: "greedy_tier2",
        engine: opts.engine,
        calibration: opts.calibration,
        budgetUsdc: opts.budgetUsdc,
        riskAversion: opts.riskAversion,
        objectiveValue: 0,
        allocations,
        totalSpendUsdc: "0",
        realizedEndToEndSuccess: 0,
        claimedEndToEndSuccess: 0,
        note: "The greedy router spends in workflow order and ran out of budget before the bottleneck — exactly the failure the whole-graph clearing avoids.",
      };
    }
    const node2 = node;
    const bondOffered = Number(providers.find((p) => p.id === best.providerId)!.bondOfferedUsdc);
    const bond = bondOffered > 0 ? bondOffered : Number(node2.valueUsdc) * node2.bondRatio;
    budgetLeft -= best.priceUsdc + bond;
    allocations.push(best);
  }

  const byId = new Map(providers.map((p) => [p.id, p]));
  const spend = allocations.reduce((s, a) => s + a.priceUsdc, 0);
  const realized = allocations.reduce(
    (prod, a) => prod * (byId.get(a.providerId)!.nObservations > 0
      ? byId.get(a.providerId)!.calibratedSuccessProb
      : byId.get(a.providerId)!.claimedSuccessProb),
    1,
  );
  const claimed = allocations.reduce((prod, a) => prod * byId.get(a.providerId)!.claimedSuccessProb, 1);

  return {
    ok: true,
    reason: null,
    solver: "greedy_tier2",
    engine: opts.engine,
    calibration: opts.calibration,
    budgetUsdc: opts.budgetUsdc,
    riskAversion: opts.riskAversion,
    objectiveValue: allocations.reduce((s, a) => s + a.score, 0),
    allocations,
    totalSpendUsdc: spend.toFixed(6),
    realizedEndToEndSuccess: realized,
    claimedEndToEndSuccess: claimed,
    note:
      opts.calibration === "on"
        ? "Calibration ON: routed by each provider's realized track record."
        : "Calibration OFF: routed by self-reported claims — watch the real end-to-end success drop.",
  };
}
