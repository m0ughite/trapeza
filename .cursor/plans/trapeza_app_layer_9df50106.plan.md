---
name: Trapeza app layer
overview: Build the missing app layer (MCP server, seeded agent loop, Next.js dashboard) on the existing green engine, backed by a durable SQLite Store, and close the clearinghouse->settlement join so cleared graphs actually produce ledger outcomes. App runs on mock adapters first; on-chain end-to-end is sequenced last. Every new module ships with typed contracts and vitest coverage gates.
todos:
  - id: a1-sqlite-store
    content: "packages/store-sqlite (@trapeza/store-sqlite): SqliteStore implements Store over better-sqlite3 with WAL, prepared statements, providers/calibration/tasks/bonds/outcomes/events tables; round-trip + upsert + calibration-keying vitest suite"
    status: completed
  - id: a2-provider-projection
    content: "Provider projection: toSolverProvider(profile, calibrationByCapability, quote?) mapping ProviderProfile+CalibrationRecord -> SolverProvider (evaluate priceSurface, pick per-capability calibration, capability filter); unit-tested"
    status: completed
  - id: a3-clearing-executor
    content: "executeClearing(core, graph, clearing, {clock}) runtime helper: run each cleared node postBond->execute->oracleVerify->settle->recordOutcome in schedule order, OVERRIDE outcome.providerId + inject real cost/latency, propagate upstream failure, emit events; happy/slash/providerId-override/failure-propagation tests"
    status: completed
  - id: a4-composition-root
    content: assemble({mode,dbPath,solverUrl,now}) composition root returning {core, clearinghouse, store, health()}; wires SqliteStore + mock|live adapters + SchemaOracle; the only module importing concrete adapters
    status: completed
  - id: b-mcp-server
    content: "apps/mcp (@trapeza/mcp): stdio MCP server, zod-typed tools (register_provider/get_providers/get_provider_calibration/submit_task/submit_graph/get_receipt/get_status), ClearingError.code->structured error mapping; verify SDK API via Context7; mock-mode e2e tests"
    status: completed
  - id: c-seeded-loop
    content: "apps/sim (@trapeza/sim): seeded requester+provider agents (single-capability, incl. lemon + bottleneck), continuous task/graph volume, CALIBRATION ON/OFF, result-per-USDC/second; determinism + ON-vs-OFF divergence assertion tests"
    status: completed
  - id: d-dashboard
    content: "apps/dashboard (@trapeza/app, Next.js): read SQLite via server route handlers; tx graph, calibration curves, slash feed, volume, result-per-USDC/second, CALIBRATION toggle, CP-SAT-vs-greedy bake-off, shadow prices"
    status: completed
  - id: e-onchain-e2e
    content: "On-chain E2E: finish openEscrow/resolveEscrow (deploy forked RefundProtocol.sol), graph batch Gateway settlement + seller balance confirmation, live StateSnapshotSource, flip assemble to live"
    status: completed
  - id: quality-gates
    content: Wire new packages into root typecheck; add v8 coverage (test:coverage) with >=85% line/branch thresholds on new packages + pytest-cov; keep npm run test:all + demo green; log ACTIVITY-LOG/IMPLEMENTATION-LOG
    status: completed
isProject: false
---

# Trapeza — Build the Missing App Layer

## Context (verified from the codebase)

- Engine is done and green: `@trapeza/core` broker ([packages/core/src/pipeline.ts](packages/core/src/pipeline.ts)), `@trapeza/clearinghouse` graph solve ([packages/clearinghouse/src/clearinghouse.ts](packages/clearinghouse/src/clearinghouse.ts)), Python CP-SAT Tier-1 ([solver/trapeza_solver/cpsat.py](solver/trapeza_solver/cpsat.py)) wired via [packages/clearinghouse/src/solver-client.ts](packages/clearinghouse/src/solver-client.ts).
- Two structural gaps drive this plan:
  1. **[apps/](apps/README.md) is an empty placeholder** — no MCP, no loop, no dashboard.
  2. **`submitGraph()` clears but never settles** — no path from a `GraphClearing` back through the broker pipeline, so cleared graphs produce zero ledger data.

## Guiding principles (non-negotiable, this is a review-grade build)

- **Interfaces over implementations.** App handlers depend only on `TrapezaCore` / `GraphClearinghouse` ([interfaces.ts](packages/core/src/interfaces.ts), [graph.ts](packages/core/src/graph.ts)). Only `assemble()` imports concrete adapters (same pattern as the spike scripts) — preserves the DESIGN.md §4.3 module boundary.
- **Determinism.** Everything seedable and clock-injectable. Core already accepts `now()`; the loop takes a seeded RNG. No `Date.now()`/`Math.random()` in library code.
- **Typed edges.** Every MCP tool and public function has an explicit input/output type; MCP tools validate with zod and expose JSON Schema. No `any` at boundaries.
- **Money stays integer.** Reuse micro-USDC helpers ([money.ts](packages/core/src/numeric/money.ts)); never do float USDC math.
- **Coverage is a gate, not an aspiration.** New packages fail CI below threshold.

## The hard seam (get this right or the ledger corrupts)

### Provider model impedance mismatch

Store holds `ProviderProfile` + one `CalibrationRecord` per (provider, capability) ([models.ts](packages/core/src/models.ts) L33-91). The clearinghouse wants `SolverProvider`, which carries a **single** `CalibrationRecord` ([types.ts](packages/clearinghouse/src/types.ts) L4-17). Bridge with:

```ts
// packages/store-sqlite or apps runtime (imports only @trapeza/core types)
function toSolverProvider(
  profile: ProviderProfile,
  calibrationFor: (capability: Capability) => CalibrationRecord,
  primaryCapability: Capability,
  quote?: Quote,
): SolverProvider
```

- `priceUsdc` = evaluate `profile.priceSurface(load, complexity)` (a function, not a field).
- `calibration` = the record for the node's capability (`calibrationFor`).
- `claimedSuccessProb`/`claimedLatencyMs` = from `quote` if present, else neutral priors.
- **Constraint:** `SolverProvider` is per-provider, so a provider serving multiple capabilities in one graph gets one calibration for all its nodes. **v1 decision: seeded providers are single-capability**, which sidesteps the mis-scoring. Follow-up (documented, not built): generalize `SolverProvider.calibration` to per-capability keyed by `nodeId`.

### The oracle does not know who/what/when — the executor must correct it

`SchemaOracle.verify` and `MockOracle.verify` return an `Outcome` whose `providerId` is scraped from the result payload (default `"unknown"`), `realizedCostUsdc` = the reserve budget, `realizedLatencyMs` = `0`/`100` ([schema-oracle.ts](packages/oracle/src/schema-oracle.ts) L74-95). Feeding that into `recordOutcome` updates the wrong calibration record with fake cost/latency. `executeClearing` **must** rebuild the `Outcome` before `settle`/`recordOutcome`:

```ts
const started = clock();
const result = await core.execute(allocation);          // { receipt:{amountUsdc,txHash}, provider, capability }
const verdict = await core.oracleVerify(node.task, result);
const outcome: Outcome = {
  ...verdict,
  providerId: allocation.providerId,                     // OVERRIDE (never trust the oracle's guess)
  realizedCostUsdc: result.receipt.amountUsdc,           // real paid amount, not reserve
  realizedLatencyMs: clock() - started,                  // measured, not fabricated
};
await core.settle(node.task.id, outcome);
await core.recordOutcome(outcome);
```

## Phase A — Shared foundation

### A1. `packages/store-sqlite` (`@trapeza/store-sqlite`)
`SqliteStore implements Store` over `better-sqlite3` (synchronous API wrapped in `async` methods to satisfy the interface). Open with `PRAGMA journal_mode=WAL` + `foreign_keys=ON`; use prepared statements. Schema:

- `providers(id PK, wallet, agent_id, capabilities JSON, endpoint, price_surface_kind, bond_balance_usdc, status)` — `priceSurface` is a function so store its parameters/kind and rehydrate to a closure on read.
- `calibration(provider_id, capability, success_alpha, success_beta, cost_mean, cost_var, latency_mean, latency_var, n_observations, last_update, PRIMARY KEY(provider_id, capability))` — `putCalibration` is an UPSERT.
- `tasks(id PK, json)`, `bonds(id PK, task_id, provider_id, amount_usdc, state, escrow_tx_hash)`, `outcomes(id, task_id, provider_id, passed, score, evidence_uri, realized_cost_usdc, realized_latency_ms, ts)`.
- `events(id INTEGER PK AUTOINCREMENT, ts, kind, task_id, provider_id, payload JSON)` — append-only dashboard feed (`register`, `route`, `bond`, `settle`, `slash`, `outcome`, `clearing`).

Mirror [interfaces.ts](packages/core/src/interfaces.ts) `Store` exactly. Tests: round-trip each entity, calibration UPSERT keying, `listProviders(capability)` filter, WAL survives reopen. Reuse the behavioral shape of [packages/core/src/testing/store.ts](packages/core/src/testing/store.ts).

### A2. Provider projection
`toSolverProvider(...)` per the hard-seam section, plus `store.solverProvidersFor(graph)` helper that loads eligible providers per node capability. Unit-tested against a fixture profile + calibration.

### A3. Clearing executor (the join)
`executeClearing(core, graph, clearing, { clock }): Promise<ExecutionReport>` where `ExecutionReport = { nodeId, providerId, outcome, txHash, action }[]`. Iterate `clearing.schedule` in `startMs` order; per node call `submitTask -> postBond -> execute -> oracleVerify -> (rebuild Outcome per above) -> settle -> recordOutcome`; write an `event` per step. **Failure propagation:** if an upstream node's outcome `passed === false`, mark dependents skipped/failed (do not pay) to mirror the DAG semantics the Monte-Carlo twin already models ([montecarlo.py](solver/trapeza_solver/montecarlo.py) L74-83). Lives in the app runtime; imports only `@trapeza/core` interfaces. Tests: happy-path release, scripted-failure slash, `providerId` override correctness, cost/latency capture, upstream-failure propagation, event emission count.

### A4. Composition root
`assemble({ mode: "mock" | "live", dbPath, solverUrl?, now? }): { core, clearinghouse, store, health }`.
- `mock`: `MockChainAdapter` + `MockSettlementAdapter` + `SchemaOracle` (real oracle even in mock mode) + `SqliteStore` + `MockQuoteSource`.
- `live`: `ArcChainAdapter` + `GatewaySettlementAdapter` + `SchemaOracle`.
- Threads `solverUrl` into `createClearinghouse` and injects `now` into `createTrapezaCore` for deterministic tests.
- `health()` returns `{ solver: await solverHealthy(), mode, db }` — this is how the solver's Tier-1/Tier-2 status becomes observable to any embedding system. The **only** module allowed to import concrete adapters.

## Phase B — `apps/mcp` (`@trapeza/mcp`) — the pairing surface

- stdio MCP server on `@modelcontextprotocol/sdk` (verify current API via Context7 before coding). Bootstraps `assemble({ mode: process.env.TRAPEZA_MODE ?? "mock" })`.
- Tools (all zod-schema'd input+output, so any MCP client gets discoverable typed contracts):
  - `register_provider`, `get_providers(capability)`, `get_provider_calibration(providerId, capability)`
  - `submit_task(TaskSpec)` -> runs the broker pipeline, returns receipt (`action`, `txHash`, `outcome`)
  - `submit_graph(TaskGraph)` -> `submitGraph` then `executeClearing`; returns `{ clearing.meta (solver, degraded, objectiveValue), settlementPricesUsdc, shadowPricesUsdc, executionReport }`
  - `get_receipt(taskId)`, `get_status()` -> `assemble().health()` (surfaces solver availability + mode)
- **Error contract:** map `ClearingError.code` (`INVALID_DAG|NO_PROVIDER|INFEASIBLE|PREFLIGHT_FAILED`) to structured MCP errors with a stable `code` field; never leak stack traces.
- Ship a one-line install snippet (Cursor/Claude `mcp.json` stanza) in the package README. Tests: tool input validation rejects malformed payloads; mock-mode e2e (`register -> submit_graph -> get_receipt`) asserts a settled report; error mapping for an infeasible graph.

## Phase C — `apps/sim` (`@trapeza/sim`)

- Deterministic seeded RNG (seedrandom, already a clearinghouse dep). Provider roster: single-capability providers spanning price/quality/latency tiers, incl. an overconfident-cheap **lemon** and a premium **bottleneck** provider.
- Requester agent submits a stream of single tasks + periodic 6-10 node graphs; results flow to the ledger + `events`. Exposes **CALIBRATION ON/OFF** via the existing `route(useCalibration)` flag.
- Emits `result-per-USDC` and `result-per-second` per provider into `events`.
- Tests: same seed => identical allocation trace (determinism); a statistical assertion that ON diverges from OFF (lemon wins share collapses under calibration) — the demo's central claim, tested not staged.

## Phase D — `apps/dashboard` (`@trapeza/app`, Next.js)

- Next.js app; server route handlers open the SQLite DB read-only (reuse `SqliteStore`), no separate API service.
- Panels: payment/tx graph (density + chain depth), per-provider calibration curves (Beta posteriors over time), slash feed (`events` kind=slash), cumulative USDC volume, result-per-USDC / result-per-second, **CALIBRATION ON/OFF** toggle, **CP-SAT vs greedy bake-off** (`clearing.meta.solver` + `objectiveValue`), shadow-price readout (`clearing.shadowPricesUsdc`).

## Phase E — On-chain end-to-end (sequenced last)

- Finish `openEscrow`/`resolveEscrow` in `ArcChainAdapter`: fork + deploy `RefundProtocol.sol` on Arc testnet; prove a live bond slash.
- Graph batch settlement via Gateway (batched nanopayments); confirm seller `balanceOf` increment + surface the post-flush settlement tx.
- Implement a live `StateSnapshotSource` (reads escrow + Gateway balances) so the preflight twin runs against real state instead of `defaultSettlementState`.
- Flip `assemble` to `mode: "live"`; run the seeded loop against testnet (watch wallet nonce management under fan-out — the known P4 risk).

## Testing & coverage strategy (gate, not garnish)

- **Runner:** extend [vitest.config.ts](vitest.config.ts) — add `packages/store-sqlite` + `apps/*` aliases and `test.coverage` (provider `v8`, reporters text+lcov). Add `test:coverage` script.
- **Thresholds:** new packages (`store-sqlite`, executor, projection, mcp) must hit **>=85% lines and branches**; build fails otherwise. Engine packages keep their current green suites untouched.
- **Determinism:** seeded RNG + injected `now` everywhere; no wall-clock/random in library code (only in `main()` entry shims).
- **Test matrix (per module):** Store (round-trip/upsert/filter/reopen), projection (priceSurface eval, per-capability calibration pick, capability filter), executor (release/slash/providerId-override/cost-latency/failure-propagation/events), MCP (schema-reject, mock e2e, error mapping), sim (determinism, ON-vs-OFF divergence).
- **Python:** keep `solver:test`; add `pytest-cov` to `requirements.txt` and report coverage on the solver.
- **Regression:** `npm run test:all` + `npm run demo` must stay green; degraded (solver-down) path stays green.

## Integration surface (answering "ready to be paired by a system")

- **MCP** (agents/tools): typed, discoverable, one-line install, structured errors, `get_status` exposes solver tier health.
- **Programmatic SDK**: `assemble()` returns the same `{ core, clearinghouse }` interfaces any TS service can embed directly — MCP is a thin shell over it.
- **Data**: SQLite `events` feed is a stable read model for dashboards or external observers.

## New dependencies (verify latest via Context7/npm at install)

- `better-sqlite3` (+ `@types/better-sqlite3`) — store
- `@modelcontextprotocol/sdk`, `zod` — MCP
- `next` + `react` + `react-dom` — dashboard
- `@vitest/coverage-v8` — coverage; `pytest-cov` — Python coverage
