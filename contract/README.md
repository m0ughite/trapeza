# Trapeza solver contract (single source of truth)

`solver-contract.schema.json` is the **one** canonical definition of the TS↔Python
solver boundary. It is JSON Schema Draft 2020-12 with four messages under `$defs`:

| Message | Direction | Endpoint |
| --- | --- | --- |
| `SolveRequest` | TS → Python | `POST /solve` |
| `SolveResponse` | Python → TS | `POST /solve` |
| `SimulateRequest` | TS → Python | `POST /simulate` (Monte Carlo twin) |
| `SimulateResponse` | Python → TS | `POST /simulate` |

## Why one file

Amendment 2 (DRY): no duplicated logic across TS and Python. Both sides validate
against **this** schema — they do not maintain drifting hand-written copies:

- **TypeScript** (`packages/clearinghouse/src/solver-client.ts`) compiles the
  schema with AJV and validates every request before send and every response
  after receive.
- **Python** (`solver/trapeza_solver/contract.py`) mirrors it with Pydantic
  models for ergonomic parsing, and `solver/tests/test_contract.py` validates the
  shared `examples/*.json` against this schema with `jsonschema` **and** parses
  them through Pydantic — so any drift between the schema, the examples, and the
  Pydantic models fails a test.

## Money discipline

All monetary quantities cross the wire as **integer micro-USDC strings**
(`^-?[0-9]+$`, 1e-6 USDC), never floats — mirroring `core/src/numeric/money.ts`.
Probabilities, scores, and the objective value are floats.

## The `candidates` design decision

The score for each eligible `(node, provider)` pair is computed **once, in TS**
(`scoreProviderForNode`) and shipped in `SolveRequest.candidates[].score`. Python
never re-derives the economic score. This guarantees the CP-SAT (Tier-1) vs
greedy+LNS (Tier-2) bake-off is apples-to-apples (identical objective semantics)
and eliminates a second scoring formula that could drift.

> Deviation from `CONSOLIDATION-PLAN.md` §3.3: the plan's sketch put `riskMicro`
> on the provider, but the risk premium is a per-`(node, provider)` cross term
> (it depends on node value and the provider's posterior). Carrying resolved
> `candidates` is the economically correct and DRY-est encoding.
