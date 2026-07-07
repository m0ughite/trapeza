"""LP-dual shadow prices via OR-Tools GLOP.

The economically meaningful clearing prices are the dual variables of the LP
relaxation (SOURCE-OF-TRUTH.md §4.1): the dual on the budget row is the marginal
EV of a USDC of budget; the dual on a provider's bond-capacity row is the
congestion premium of that scarce provider. These are display-only (v1 settles
discriminatory min(ask, reserve), not on duals).

We relax the binary assignment to x ∈ [0,1] and read `constraint.dual_value()`.
GLOP exposes duals directly; CP-SAT does not, which is why shadow pricing uses
the continuous relaxation here.
"""

from __future__ import annotations

from ortools.linear_solver import pywraplp

from .contract import SolveRequest


def lp_shadow_prices(req: SolveRequest) -> dict[str, float]:
    """Return {"budget": v, "capacity:<providerId>": v, ...} in USDC-per-USDC.

    Values are duals scaled from per-micro to per-USDC and clamped to >= 0."""
    solver = pywraplp.Solver.CreateSolver("GLOP")
    if solver is None:  # pragma: no cover - GLOP always present with ortools
        return {}

    node_ids = [n.nodeId for n in req.nodes]
    by_node: dict[str, list] = {nid: [] for nid in node_ids}
    for c in req.candidates:
        by_node.setdefault(c.nodeId, []).append(c)

    x = {}
    for c in req.candidates:
        x[(c.nodeId, c.providerId)] = solver.NumVar(0.0, 1.0, f"x_{c.nodeId}_{c.providerId}")

    # one-assignment
    for nid in node_ids:
        cands = by_node.get(nid, [])
        if not cands:
            return {}
        solver.Add(sum(x[(nid, c.providerId)] for c in cands) == 1)

    # budget (in micro-USDC)
    budget_ct = solver.Add(
        sum(int(c.costPlusBondUsdcMicro) * x[(c.nodeId, c.providerId)] for c in req.candidates)
        <= int(req.budgetUsdcMicro),
        "budget",
    )

    # bond capacity per provider
    cands_by_prov: dict[str, list] = {}
    for c in req.candidates:
        cands_by_prov.setdefault(c.providerId, []).append(c)
    prov_bondcap = {p.id: int(p.bondCapacityUsdcMicro) for p in req.providers}
    cap_cts: dict[str, object] = {}
    for pid, cands in cands_by_prov.items():
        cap = prov_bondcap.get(pid)
        if cap is not None:
            cap_cts[pid] = solver.Add(
                sum(int(c.bondUsdcMicro) * x[(c.nodeId, c.providerId)] for c in cands) <= cap,
                f"capacity_{pid}",
            )

    solver.Maximize(
        sum(c.score * x[(c.nodeId, c.providerId)] for c in req.candidates)
    )

    status = solver.Solve()
    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return {}

    out: dict[str, float] = {}
    # dual_value() is per unit of the RHS (micro-USDC); scale to per-USDC (×1e6)
    out["budget"] = max(0.0, budget_ct.dual_value() * 1_000_000)
    for pid, ct in cap_cts.items():
        out[f"capacity:{pid}"] = max(0.0, ct.dual_value() * 1_000_000)
    return out
