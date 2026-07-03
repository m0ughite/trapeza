"""State-Twins Monte Carlo robustness scoring (NumPy, vectorized).

Forks N futures under sampled success/failure draws from each provider's Beta
posterior, propagates DAG failure (a poisoned upstream fails all downstream on
its paths), and scores the cleared plan in the tail — not just at the mean.

Compute-heavy => Python (Amendment 1/3). Mirrors the semantics of the in-process
TS fallback in packages/clearinghouse/src/twin/montecarlo.ts (Beta draw ->
Bernoulli, cost charged only for succeeded nodes, longest-path makespan). The RNG
differs, so results match statistically, not bit-for-bit.
"""

from __future__ import annotations

import numpy as np

from .contract import SimulateRequest


def _topo_order(node_ids: list[str], edges: list[tuple[str, str]]) -> list[str]:
    indeg = {nid: 0 for nid in node_ids}
    adj: dict[str, list[str]] = {nid: [] for nid in node_ids}
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1
    queue = [nid for nid in node_ids if indeg[nid] == 0]
    order: list[str] = []
    while queue:
        u = queue.pop(0)
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return order


def simulate(req: SimulateRequest) -> dict:
    rng = np.random.default_rng(req.seed)
    node_ids = [n.nodeId for n in req.nodes]
    n = len(node_ids)
    idx = {nid: i for i, nid in enumerate(node_ids)}
    it = req.iterations

    edges = [(e.from_, e.to) for e in req.edges]
    parents: dict[str, list[str]] = {nid: [] for nid in node_ids}
    children_from: set[str] = set()
    for a, b in edges:
        parents[b].append(a)
        children_from.add(a)
    sinks = [nid for nid in node_ids if nid not in children_from]
    topo = _topo_order(node_ids, edges)

    prov = {p.id: p for p in req.providers}
    assign = {a.nodeId: a.providerId for a in req.assignments}

    success = np.zeros((it, n), dtype=bool)
    cost = np.zeros((it, n))
    latency = np.zeros((it, n))

    for nid in node_ids:
        p = prov[assign[nid]]
        i = idx[nid]
        draws = rng.beta(max(p.successAlpha, 1e-9), max(p.successBeta, 1e-9), size=it)
        success[:, i] = rng.random(it) < draws

        cost_mean = p.costMean if p.nObservations > 0 else p.priceUsdc
        cost_std = float(np.sqrt(max(p.costVar, 0.0)))
        cost[:, i] = np.clip(rng.normal(cost_mean, cost_std, it), 0.0, None)

        lat_std = float(np.sqrt(max(p.latencyVar, 0.0)))
        latency[:, i] = np.clip(rng.normal(p.latencyMean, lat_std, it), 0.0, None)

    # DAG failure propagation
    for nid in topo:
        i = idx[nid]
        for par in parents[nid]:
            success[:, i] &= success[:, idx[par]]

    if sinks:
        global_success = success[:, [idx[s] for s in sinks]].all(axis=1)
    else:
        global_success = np.ones(it, dtype=bool)

    charged = np.where(success, cost, 0.0)
    total_cost = charged.sum(axis=1)
    budget_usdc = int(req.budgetUsdcMicro) / 1_000_000

    # longest-path makespan per iteration
    start = np.zeros((it, n))
    end = np.zeros((it, n))
    for nid in topo:
        i = idx[nid]
        if parents[nid]:
            start[:, i] = np.max(
                np.stack([end[:, idx[par]] for par in parents[nid]], axis=1), axis=1
            )
        end[:, i] = start[:, i] + latency[:, i]
    makespan = end.max(axis=1) if n else np.zeros(it)

    return {
        "failureProbability": float(1.0 - global_success.mean()),
        "budgetOverrunProbability": float((total_cost > budget_usdc).mean()),
        "deadlineBreachProbability": float((makespan > req.deadlineMs).mean()),
        "expectedNetCostUsdc": float(total_cost.mean()),
        "seed": req.seed,
        "iterations": it,
    }
