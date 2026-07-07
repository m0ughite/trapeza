"""Pydantic mirror of the shared solver contract.

The canonical definition is ``contract/solver-contract.schema.json``. These
models exist for ergonomic parsing/serialization only; ``tests/test_contract.py``
pins them to the schema + shared examples so they cannot drift.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# contract/ lives at the repo root, two levels up from this file's package dir.
REPO_ROOT = Path(__file__).resolve().parents[2]
CONTRACT_DIR = REPO_ROOT / "contract"
SCHEMA_PATH = CONTRACT_DIR / "solver-contract.schema.json"


def load_contract_schema() -> dict:
    """Load the canonical JSON Schema (single source of truth)."""
    return json.loads(SCHEMA_PATH.read_text())


def subschema(name: str) -> dict:
    """Return a standalone schema for one $defs message, keeping $defs in scope
    so internal $ref pointers still resolve."""
    root = load_contract_schema()
    node = root["$defs"][name]
    return {**node, "$defs": root["$defs"]}


_STRICT = ConfigDict(extra="forbid", populate_by_name=True)


class Edge(BaseModel):
    model_config = _STRICT
    from_: str = Field(alias="from")
    to: str


class SolveRequestNode(BaseModel):
    model_config = _STRICT
    nodeId: str
    capability: str
    valueUsdcMicro: str
    qualityFloor: Optional[float] = None
    latencyCapMs: Optional[int] = None


class SolveRequestProvider(BaseModel):
    model_config = _STRICT
    id: str
    concurrency: int
    bondCapacityUsdcMicro: str


class SolveRequestCandidate(BaseModel):
    model_config = _STRICT
    nodeId: str
    providerId: str
    score: float
    costPlusBondUsdcMicro: str
    bondUsdcMicro: str
    pHat: float
    latencyMs: int


class SolveOptions(BaseModel):
    model_config = _STRICT
    timeLimitMs: Optional[int] = None
    seed: Optional[int] = None


class SolveRequest(BaseModel):
    model_config = _STRICT
    graphId: str
    budgetUsdcMicro: str
    deadlineMs: int
    globalQualityFloor: Optional[float] = None
    riskAversion: float
    nodes: list[SolveRequestNode]
    edges: list[Edge]
    providers: list[SolveRequestProvider]
    candidates: list[SolveRequestCandidate]
    options: Optional[SolveOptions] = None


class SolveResponseAssignment(BaseModel):
    model_config = _STRICT
    nodeId: str
    providerId: str
    score: float


class SolveResponseScheduleEntry(BaseModel):
    model_config = _STRICT
    nodeId: str
    startMs: int
    durationMs: int
    endMs: int


class SolveResponse(BaseModel):
    model_config = _STRICT
    status: str
    objectiveValue: float
    assignments: list[SolveResponseAssignment]
    schedule: list[SolveResponseScheduleEntry]
    shadowPrices: dict[str, str]
    makespanMs: int
    solver: str


class SimulateRequestProvider(BaseModel):
    model_config = _STRICT
    id: str
    successAlpha: float
    successBeta: float
    costMean: float
    costVar: float
    latencyMean: float
    latencyVar: float
    nObservations: int
    priceUsdc: float


class SimulateAssignment(BaseModel):
    model_config = _STRICT
    nodeId: str
    providerId: str


class SimulateNode(BaseModel):
    model_config = _STRICT
    nodeId: str


class SimulateRequest(BaseModel):
    model_config = _STRICT
    graphId: str
    deadlineMs: int
    budgetUsdcMicro: str
    nodes: list[SimulateNode]
    edges: list[Edge]
    assignments: list[SimulateAssignment]
    providers: list[SimulateRequestProvider]
    iterations: int
    seed: int


class SimulateResponse(BaseModel):
    model_config = _STRICT
    failureProbability: float
    budgetOverrunProbability: float
    deadlineBreachProbability: float
    expectedNetCostUsdc: float
    seed: int
    iterations: int
