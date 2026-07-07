"""CP-SAT Tier-1 tests, including the load-bearing 'Tier-1 objective >= Tier-2'
assertion on the budget-vs-bottleneck instance (mirrors the TS benchmark)."""

import pytest

from trapeza_solver.contract import SolveRequest
from trapeza_solver.cpsat import solve

# Budget-vs-bottleneck: budget $1.00. Greedy-by-score buys premium-easy and then
# cannot afford any bottleneck provider; the global solve buys cheap-easy to
# afford mid-bn. Scores computed with the TS scoreProviderForNode formula.
BENCHMARK = {
    "graphId": "bench",
    "budgetUsdcMicro": "1000000",
    "deadlineMs": 120000,
    "globalQualityFloor": None,
    "riskAversion": 1.0,
    "nodes": [
        {"nodeId": "easy", "capability": "cap.easy", "valueUsdcMicro": "2000000"},
        {"nodeId": "bottleneck", "capability": "cap.hard", "valueUsdcMicro": "1500000"},
    ],
    "edges": [{"from": "easy", "to": "bottleneck"}],
    "providers": [
        {"id": "premium-easy", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
        {"id": "cheap-easy", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
        {"id": "mid-bn", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
        {"id": "premium-bn", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
    ],
    "candidates": [
        {"nodeId": "easy", "providerId": "premium-easy", "score": 1.15566,
         "costPlusBondUsdcMicro": "750000", "bondUsdcMicro": "100000", "pHat": 0.98, "latencyMs": 100},
        {"nodeId": "easy", "providerId": "cheap-easy", "score": 0.58066,
         "costPlusBondUsdcMicro": "250000", "bondUsdcMicro": "100000", "pHat": 0.55, "latencyMs": 120},
        {"nodeId": "bottleneck", "providerId": "mid-bn", "score": 0.704245,
         "costPlusBondUsdcMicro": "575000", "bondUsdcMicro": "75000", "pHat": 0.9, "latencyMs": 200},
        {"nodeId": "bottleneck", "providerId": "premium-bn", "score": 0.498,
         "costPlusBondUsdcMicro": "875000", "bondUsdcMicro": "75000", "pHat": 0.95, "latencyMs": 150},
    ],
    "options": {"timeLimitMs": 5000, "seed": 42},
}


def _greedy_objective(req: SolveRequest):
    """Faithful Tier-2 replica: topo-order, pick max-score affordable candidate.
    Returns (objective, feasible)."""
    order = _topo(req)
    by_node = {}
    for c in req.candidates:
        by_node.setdefault(c.nodeId, []).append(c)
    budget_left = int(req.budgetUsdcMicro)
    obj = 0.0
    for nid in order:
        affordable = [c for c in by_node[nid] if int(c.costPlusBondUsdcMicro) <= budget_left]
        if not affordable:
            return obj, False
        best = max(affordable, key=lambda c: c.score)
        budget_left -= int(best.costPlusBondUsdcMicro)
        obj += best.score
    return obj, True


def _topo(req: SolveRequest):
    ids = [n.nodeId for n in req.nodes]
    indeg = {n: 0 for n in ids}
    adj = {n: [] for n in ids}
    for e in req.edges:
        adj[e.from_].append(e.to)
        indeg[e.to] += 1
    q = [n for n in ids if indeg[n] == 0]
    out = []
    while q:
        u = q.pop(0)
        out.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return out


def test_cpsat_feasible_where_greedy_fails():
    req = SolveRequest.model_validate(BENCHMARK)
    res = solve(req)
    assert res["status"] in ("optimal", "feasible")
    easy = next(a for a in res["assignments"] if a["nodeId"] == "easy")
    assert easy["providerId"] == "cheap-easy"  # global solve buys cheap to afford bottleneck
    _, greedy_feasible = _greedy_objective(req)
    assert greedy_feasible is False  # naive greedy busts the budget


def test_cpsat_objective_ge_tier2():
    req = SolveRequest.model_validate(BENCHMARK)
    res = solve(req)
    greedy_obj, feasible = _greedy_objective(req)
    tier2 = greedy_obj if feasible else 0.0
    assert res["objectiveValue"] >= tier2 - 1e-9


def test_shadow_price_budget_positive_when_binding():
    req = SolveRequest.model_validate(BENCHMARK)
    res = solve(req)
    assert float(res["shadowPrices"]["budget"]) > 0.0


def test_infeasible_when_budget_too_tight():
    tight = {**BENCHMARK, "budgetUsdcMicro": "1"}
    res = solve(SolveRequest.model_validate(tight))
    assert res["status"] == "infeasible"


def test_per_node_quality_floor_excludes_low_p():
    inst = {
        "graphId": "q",
        "budgetUsdcMicro": "5000000",
        "deadlineMs": 60000,
        "globalQualityFloor": None,
        "riskAversion": 1.0,
        "nodes": [{"nodeId": "n", "capability": "cap.q", "qualityFloor": 0.8, "valueUsdcMicro": "1000000"}],
        "edges": [],
        "providers": [
            {"id": "low", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
            {"id": "high", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"},
        ],
        "candidates": [
            {"nodeId": "n", "providerId": "low", "score": 5.0,
             "costPlusBondUsdcMicro": "10000", "bondUsdcMicro": "0", "pHat": 0.5, "latencyMs": 10},
            {"nodeId": "n", "providerId": "high", "score": 0.4,
             "costPlusBondUsdcMicro": "500000", "bondUsdcMicro": "0", "pHat": 0.95, "latencyMs": 10},
        ],
    }
    res = solve(SolveRequest.model_validate(inst))
    # 'low' has the far higher score but fails the 0.8 floor -> must pick 'high'
    assert res["assignments"][0]["providerId"] == "high"


def test_concurrency_serializes_two_parallel_nodes():
    # two independent nodes, same provider, concurrency 1 => makespan must be the
    # sum of the two latencies (they cannot run at once), not the max.
    inst = {
        "graphId": "conc",
        "budgetUsdcMicro": "10000000",
        "deadlineMs": 60000,
        "globalQualityFloor": None,
        "riskAversion": 1.0,
        "nodes": [
            {"nodeId": "a", "capability": "cap.x", "valueUsdcMicro": "1000000"},
            {"nodeId": "b", "capability": "cap.x", "valueUsdcMicro": "1000000"},
        ],
        "edges": [],
        "providers": [{"id": "solo", "concurrency": 1, "bondCapacityUsdcMicro": "10000000"}],
        "candidates": [
            {"nodeId": "a", "providerId": "solo", "score": 1.0,
             "costPlusBondUsdcMicro": "100000", "bondUsdcMicro": "0", "pHat": 0.9, "latencyMs": 1000},
            {"nodeId": "b", "providerId": "solo", "score": 1.0,
             "costPlusBondUsdcMicro": "100000", "bondUsdcMicro": "0", "pHat": 0.9, "latencyMs": 1000},
        ],
    }
    res = solve(SolveRequest.model_validate(inst))
    assert res["status"] in ("optimal", "feasible")
    assert res["makespanMs"] == 2000
