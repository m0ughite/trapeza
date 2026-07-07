"""Drift guard: the shared examples must validate against the single canonical
JSON Schema AND parse through the Pydantic mirror. If any of the three (schema,
examples, Pydantic models) drift apart, this fails."""

import json

from jsonschema import Draft202012Validator

from trapeza_solver.contract import (
    CONTRACT_DIR,
    SimulateRequest,
    SimulateResponse,
    SolveRequest,
    SolveResponse,
    subschema,
)

EXAMPLES = CONTRACT_DIR / "examples"


def _load(name: str) -> dict:
    return json.loads((EXAMPLES / name).read_text())


def test_schema_itself_is_valid():
    for msg in ["SolveRequest", "SolveResponse", "SimulateRequest", "SimulateResponse"]:
        Draft202012Validator.check_schema(subschema(msg))


def test_solve_request_example_matches_schema_and_pydantic():
    data = _load("solve-request.json")
    Draft202012Validator(subschema("SolveRequest")).validate(data)
    SolveRequest.model_validate(data)


def test_solve_response_example_matches_schema_and_pydantic():
    data = _load("solve-response.json")
    Draft202012Validator(subschema("SolveResponse")).validate(data)
    SolveResponse.model_validate(data)


def test_simulate_request_example_matches_schema_and_pydantic():
    data = _load("simulate-request.json")
    Draft202012Validator(subschema("SimulateRequest")).validate(data)
    SimulateRequest.model_validate(data)


def test_simulate_response_example_matches_schema_and_pydantic():
    data = _load("simulate-response.json")
    Draft202012Validator(subschema("SimulateResponse")).validate(data)
    SimulateResponse.model_validate(data)
