"""FastAPI service exposing the Trapeza Tier-1 solver over localhost JSON.

Transport is FastAPI + Pydantic + JSON over HTTP (CONSOLIDATION-PLAN.md §4;
gRPC rejected). The service is a PURE FUNCTION of its input: no keys, no chain,
no storage, no ledger access — every number arrives pre-calibrated from TS.

Run:  uvicorn trapeza_solver.app:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI

from . import __version__
from .contract import SimulateRequest, SolveRequest
from .cpsat import solve as cpsat_solve
from .montecarlo import simulate as mc_simulate

app = FastAPI(title="Trapeza Solver", version=__version__)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "trapeza-solver", "version": __version__}


@app.post("/solve")
def solve(req: SolveRequest) -> dict:
    """Tier-1 CP-SAT clearing: allocation + schedule + LP-dual shadow prices."""
    return cpsat_solve(req)


@app.post("/simulate")
def simulate(req: SimulateRequest) -> dict:
    """State-Twins Monte Carlo robustness scoring over the cleared assignment."""
    return mc_simulate(req)
