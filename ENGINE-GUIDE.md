# Trapeza Engine Guide

How the off-chain algorithmic engine fits together, and how to run it. This is the operator/dev
companion to [ALGORITHMIC-SPEC.md](ALGORITHMIC-SPEC.md) (the math) and
[SOURCE-OF-TRUTH.md](SOURCE-OF-TRUTH.md) (the design contract).

## Architecture (polyglot, by design)

```
                    ┌──────────────────────── TypeScript ────────────────────────┐
  TaskGraph ──▶ createClearinghouse().submitGraph()                                │
                    │  validate DAG → score candidates (once) → call solver        │
                    │  → schedule → ENFORCE preflight → settle → (opt) Monte Carlo │
                    └───────────────┬──────────────────────────────┬──────────────┘
                                    │ HTTP JSON (localhost)         │ in-process fallback
                          shared contract/                          │
                                    ▼                               ▼
                    ┌──────── Python (FastAPI) ────────┐   Tier-2: greedy + LNS (TS)
                    │  Tier-1: OR-Tools CP-SAT          │   (degrade path + bake-off opponent)
                    │  + GLOP LP-dual shadow prices     │
                    │  Monte Carlo twin (NumPy)         │
                    └───────────────────────────────────┘
```

- **TypeScript owns** orchestration, the core primitive (`@trapeza/core`: calibration ledger, EV
  router, micro-USDC money), the deterministic oracle (`@trapeza/oracle`), settlement, and the demo.
- **Python owns** the heavy math: the Tier-1 CP-SAT constraint solver and the vectorized Monte Carlo
  twin. It is a **pure function** — no keys, no chain, no ledger. Every number arrives pre-calibrated.
- **The boundary is ONE file:** `contract/solver-contract.schema.json` (JSON Schema 2020-12). TS
  validates with AJV; Python mirrors it with Pydantic and pins it in `tests/test_contract.py`.

## Two tiers, one objective

The economic score for each eligible `(node, provider)` pair is computed **once, in TS**
(`scoreProviderForNode`) and shipped in `SolveRequest.candidates[].score`. Both solvers maximize the
same `Σ x·score`, so the CP-SAT-vs-greedy bake-off is apples-to-apples.

| Tier | Engine | Role |
| --- | --- | --- |
| **Tier-1** | Python OR-Tools **CP-SAT** | Exact global solve: assignment + RCPSP scheduling + budget + per-node & global quality + bond capacity + concurrency; returns allocation, schedule, LP-dual shadow prices. |
| **Tier-2** | TS **greedy + LNS** | In-process degrade path — runs when Python is down — and the bake-off opponent. Never requires Python. |

`submitGraph` prefers Tier-1 and **degrades to Tier-2 on any failure** (service down, timeout,
contract-validation error, or `infeasible`). The demo therefore runs with or without Python.

## Monte Carlo twin (feature-flagged, Amendment 1)

Off by default. Enable per-clearing:

```ts
createClearinghouse({ providers, monteCarlo: { enabled: true, iterations: 500 } });
```

When the service is up it uses Python/NumPy (`/simulate`); when down it falls back to the in-process
TS twin. Both report failure / budget-overrun / deadline-breach probabilities on the cleared plan.

## Directory map

```
contract/                         # SINGLE source of truth for the TS↔Python boundary
  solver-contract.schema.json     #   JSON Schema 2020-12 (4 messages)
  examples/                       #   shared request/response fixtures (pinned by Python tests)
solver/                           # Python service (pure function)
  trapeza_solver/
    app.py                        #   FastAPI: /health, /solve, /simulate
    cpsat.py                      #   Tier-1 CP-SAT model (§5.4)
    shadow.py                     #   GLOP LP-dual shadow prices
    montecarlo.py                 #   NumPy Monte Carlo twin
    contract.py                   #   Pydantic mirror of the schema
  tests/                          #   pytest: contract / cpsat / montecarlo
  requirements.txt                #   ortools, fastapi, uvicorn, pydantic, numpy, pytest
packages/
  core/                           # @trapeza/core — calibration, router, money, models
  oracle/                         # @trapeza/oracle — AJV schema + ground-truth diff
  clearinghouse/                  # @trapeza/clearinghouse — orchestration + Tier-2 + client
    src/solver-client.ts          #   TS client for the Python service (AJV both directions)
demo/run-clearing.ts              # narrated 6-beat demo (bake-off + flagged Monte Carlo)
```

## Run it

```bash
# 1. Python solver deps (one-time) — creates solver/.venv
npm run solver:install

# 2. Start the Tier-1 service (leave running)
npm run solver                    # uvicorn on 127.0.0.1:8000

# 3. Full verification (in another shell)
npm test                          # TS suites (57 pass with the service up)
npm run typecheck                 # tsc -b, exit 0
npm run solver:test               # Python pytest (14 pass)
npm run demo                      # narrated CP-SAT vs greedy bake-off

# Degradation check: stop the service and re-run — npm test still passes
# (4 live CP-SAT tests skip), and the demo/clearinghouse fall back to TS Tier-2.
```

`TRAPEZA_SOLVER_URL` overrides the service base URL (default `http://127.0.0.1:8000`).
