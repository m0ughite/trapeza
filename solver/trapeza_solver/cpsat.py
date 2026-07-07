"""Tier-1 constraint-optimization solver (Google OR-Tools CP-SAT).

Implements the full SOURCE-OF-TRUTH.md §5.4 model:

  decision vars : x_{n,p} in {0,1} (assignment), s_n >= 0 (start time)
  objective     : maximize  Σ x_{n,p} · score_{n,p}     (calibrated EV net value,
                  scored ONCE in TS and shipped in candidates[].score)
  constraints   : one-assignment            Σ_p x_{n,p} = 1
                  budget                     Σ (cost+bond)·x ≤ B
                  DAG precedence             s_v ≥ s_u + dur_u   ∀(u,v)∈E
                  makespan                   max_n (s_n + dur_n) ≤ deadline
                  per-node quality floor     p̂_chosen ≥ q_n
                  global quality (log)       Σ log p̂ · x ≥ log q_min
                  per-node latency cap       Σ latency·x ≤ λ_n^max
                  bond capacity              Σ_n bond·x_{n,p} ≤ B_p
                  concurrency (RCPSP)        cumulative(intervals_p) ≤ k_p

The concurrency/interval part is exactly what CP-SAT does well and TS/HiGHS
cannot express cleanly — the reason this tier is Python (Amendment 3).
"""

from __future__ import annotations

import math
from typing import Optional

from ortools.sat.python import cp_model

from .contract import SolveRequest
from .shadow import lp_shadow_prices

SCALE = 1_000_000  # fixed-point scale for scores / log-probabilities


def _log_scaled(p: float) -> int:
    """log(p) scaled to int; mirrors core/src/numeric/money.ts scaleLogProbability."""
    if not math.isfinite(p) or p <= 0:
        return -SCALE * 20
    return round(math.log(p) * SCALE)


def _build_and_solve(req: SolveRequest, deadline_ms: int) -> dict:
    """Build and solve the CP-SAT model for a given deadline (used for both the
    real solve and deadline finite-difference shadow pricing)."""
    model = cp_model.CpModel()

    node_ids = [n.nodeId for n in req.nodes]
    node_quality = {n.nodeId: n.qualityFloor for n in req.nodes}
    node_latency_cap = {n.nodeId: n.latencyCapMs for n in req.nodes}
    prov_conc = {p.id: p.concurrency for p in req.providers}
    prov_bondcap = {p.id: int(p.bondCapacityUsdcMicro) for p in req.providers}

    # x_{n,p}
    x: dict[tuple[str, str], cp_model.IntVar] = {}
    by_node: dict[str, list] = {nid: [] for nid in node_ids}
    for c in req.candidates:
        var = model.NewBoolVar(f"x_{c.nodeId}_{c.providerId}")
        x[(c.nodeId, c.providerId)] = var
        by_node.setdefault(c.nodeId, []).append(c)

    # one-assignment (also fails fast for a node with no eligible candidate)
    for nid in node_ids:
        cands = by_node.get(nid, [])
        if not cands:
            return {"status": "infeasible"}
        model.Add(sum(x[(nid, c.providerId)] for c in cands) == 1)

    # budget
    model.Add(
        sum(int(c.costPlusBondUsdcMicro) * x[(c.nodeId, c.providerId)] for c in req.candidates)
        <= int(req.budgetUsdcMicro)
    )

    # per-node quality floor (linear: exactly one assignment => p̂_chosen ≥ q_n)
    for nid in node_ids:
        q = node_quality.get(nid)
        if q is not None and q > 0:
            model.Add(
                sum(round(c.pHat * SCALE) * x[(nid, c.providerId)] for c in by_node[nid])
                >= round(q * SCALE)
            )

    # global quality floor (log-linearized chance constraint)
    if req.globalQualityFloor is not None and req.globalQualityFloor > 0:
        model.Add(
            sum(_log_scaled(c.pHat) * x[(c.nodeId, c.providerId)] for c in req.candidates)
            >= _log_scaled(req.globalQualityFloor)
        )

    # per-node latency cap
    for nid in node_ids:
        cap = node_latency_cap.get(nid)
        if cap is not None:
            model.Add(sum(c.latencyMs * x[(nid, c.providerId)] for c in by_node[nid]) <= cap)

    # bond capacity per provider: Σ_n bond·x_{n,p} ≤ B_p
    cands_by_prov: dict[str, list] = {}
    for c in req.candidates:
        cands_by_prov.setdefault(c.providerId, []).append(c)
    for pid, cands in cands_by_prov.items():
        cap = prov_bondcap.get(pid)
        if cap is not None:
            model.Add(sum(int(c.bondUsdcMicro) * x[(c.nodeId, c.providerId)] for c in cands) <= cap)

    # scheduling: start vars, durations, precedence, makespan
    horizon = max(0, deadline_ms)
    s = {nid: model.NewIntVar(0, horizon, f"s_{nid}") for nid in node_ids}
    dur = {nid: model.NewIntVar(0, horizon, f"dur_{nid}") for nid in node_ids}
    end = {nid: model.NewIntVar(0, horizon, f"end_{nid}") for nid in node_ids}
    for nid in node_ids:
        model.Add(dur[nid] == sum(c.latencyMs * x[(nid, c.providerId)] for c in by_node[nid]))
        model.Add(end[nid] == s[nid] + dur[nid])

    for e in req.edges:
        if e.from_ in s and e.to in s:
            model.Add(s[e.to] >= end[e.from_])

    makespan = model.NewIntVar(0, horizon, "makespan")
    model.AddMaxEquality(makespan, [end[nid] for nid in node_ids]) if node_ids else None
    if node_ids:
        model.Add(makespan <= deadline_ms)

    # concurrency (cumulative over optional intervals per provider)
    for pid, cands in cands_by_prov.items():
        k = prov_conc.get(pid, 1)
        if k >= len(cands):
            continue  # cannot exceed capacity; skip the (expensive) cumulative
        intervals = []
        for c in cands:
            size = c.latencyMs
            iv = model.NewOptionalIntervalVar(
                s[c.nodeId],
                size,
                model.NewIntVar(0, horizon, f"iend_{c.nodeId}_{pid}"),
                x[(c.nodeId, c.providerId)],
                f"iv_{c.nodeId}_{pid}",
            )
            intervals.append(iv)
        if intervals:
            model.AddCumulative(intervals, [1] * len(intervals), k)

    # objective
    model.Maximize(
        sum(round(c.score * SCALE) * x[(c.nodeId, c.providerId)] for c in req.candidates)
    )

    solver = cp_model.CpSolver()
    if req.options and req.options.timeLimitMs:
        solver.parameters.max_time_in_seconds = req.options.timeLimitMs / 1000.0
    if req.options and req.options.seed is not None:
        solver.parameters.random_seed = int(req.options.seed) & 0x7FFFFFFF
    solver.parameters.num_search_workers = 1  # determinism

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status": "infeasible"}

    assignments = []
    schedule = []
    for nid in node_ids:
        chosen = next(
            (c for c in by_node[nid] if solver.Value(x[(nid, c.providerId)]) == 1),
            None,
        )
        if chosen is None:
            return {"status": "infeasible"}
        assignments.append(
            {"nodeId": nid, "providerId": chosen.providerId, "score": chosen.score}
        )
        st = int(solver.Value(s[nid]))
        du = int(solver.Value(dur[nid]))
        schedule.append({"nodeId": nid, "startMs": st, "durationMs": du, "endMs": st + du})

    return {
        "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
        "objectiveScaled": solver.ObjectiveValue(),
        "assignments": assignments,
        "schedule": schedule,
        "makespanMs": int(solver.Value(makespan)) if node_ids else 0,
    }


def _fmt(v: float) -> str:
    return f"{max(0.0, v):.6f}"


def solve(req: SolveRequest) -> dict:
    """Solve the clearing and attach LP-dual + finite-difference shadow prices."""
    base = _build_and_solve(req, req.deadlineMs)
    if base["status"] == "infeasible":
        return {
            "status": "infeasible",
            "objectiveValue": 0.0,
            "assignments": [],
            "schedule": [],
            "shadowPrices": {},
            "makespanMs": 0,
            "solver": "cp_sat",
        }

    shadow = lp_shadow_prices(req)  # {"budget": float, "capacity:<p>": float}

    # deadline shadow via finite difference on the CP-SAT objective
    deadline_dual = 0.0
    has_schedule = bool(req.edges) and any(c.latencyMs > 0 for c in req.candidates)
    if has_schedule and req.deadlineMs > 0:
        delta = max(1, req.deadlineMs // 10)
        bumped = _build_and_solve(req, req.deadlineMs + delta)
        if bumped["status"] != "infeasible":
            d_obj = (bumped["objectiveScaled"] - base["objectiveScaled"]) / SCALE
            deadline_dual = d_obj / delta  # marginal EV per ms of deadline

    shadow_prices = {"budget": _fmt(shadow.get("budget", 0.0)), "deadline": _fmt(deadline_dual)}
    for key, val in shadow.items():
        if key.startswith("capacity:"):
            shadow_prices[key] = _fmt(val)

    return {
        "status": base["status"],
        "objectiveValue": base["objectiveScaled"] / SCALE,
        "assignments": base["assignments"],
        "schedule": base["schedule"],
        "shadowPrices": shadow_prices,
        "makespanMs": base["makespanMs"],
        "solver": "cp_sat",
    }
