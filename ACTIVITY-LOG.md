# Trapeza — Activity Log

Per-session record of who changed what, on which branch, and how it was verified.
Append **newest at the bottom**. One entry per work session that touched the repo.

**Two-tier logging:**

| File | When |
| --- | --- |
| **ACTIVITY-LOG.md** (this file) | Every session — code, config, docs, spikes, tests |
| **[IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md)** | Milestones only — phase complete, spike pass/fail, design lock, blocker resolution |

**Rule:** changed files or ran spikes → append here. Sprint phase shifted → also update IMPLEMENTATION-LOG.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the collaboration contract.

---

## Entry template

```markdown
## YYYY-MM-DD — <handle> — <manual|assisted> — <scope>

**Branch:** `branch-name`
**Mode:** manual | assisted
**Scope:** short label

### Done
- …

### Files
- …

### Verification
- …

### Notes
- …

---
```

| Field | Meaning |
| --- | --- |
| **Author** | Your handle (`mindsmith`, etc.) |
| **Mode** | `manual` = you drove edits/commands; `assisted` = you directed an AI session |
| **Branch** | git branch name |
| **Verification** | commands, test counts, tx hashes — never fabricate |

Filter your own work:

```bash
grep "mindsmith — manual" ACTIVITY-LOG.md
grep "mindsmith — assisted" ACTIVITY-LOG.md
```

Never log secrets, private keys, or `.env` contents.

---

## 2026-06-27 — mindsmith — assisted — agent-config

**Branch:** `(unknown — retroactive)`
**Mode:** assisted
**Scope:** agent configuration, docs

### Done
- Added `.cursor/` rules, skills, subagents, MCP (`arc-docs`, `circle`)
- Added root `AGENTS.md` — Trapeza entry point with context routing
- Added `context-for-agent/samples/README.md` — bundled samples + clone instructions for `arc-nanopayments`
- Updated stale `context/samples/context-arc/` → `context-for-agent/` path references

### Files
- `.cursor/rules/trapeza-project.mdc`, `.cursor/rules/trapeza-adapters.mdc`
- `.cursor/skills/trapeza-build/SKILL.md`, `.cursor/skills/arc-circle-context/SKILL.md`
- `.cursor/agents/trapeza-builder.md`, `.cursor/agents/arc-circle-expert.md`, `.cursor/agents/onchain-verifier.md`
- `.cursor/mcp.json`
- `AGENTS.md`, `context-for-agent/samples/README.md`
- `DESIGN.md`, `SETUP.md`, `IMPLEMENTATION-LOG.md`, `context/README.md` (path fixes)
- `.gitignore` (optional clone paths for `arc-nanopayments`, `circle-agent`)

### Verification
- `npm run typecheck && npm test` — attempted; `npm install` failed in sandbox (config-only change)

### Notes
- Retroactive entry for work done 2026-06-27; milestone summary in IMPLEMENTATION-LOG Phase A0

---

## 2026-06-27 — mindsmith — assisted — activity-logging

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** collaboration activity logging

### Done
- Added `ACTIVITY-LOG.md` — per-session log with author + manual/assisted attribution
- Added `CONTRIBUTING.md` — collaboration logging contract
- Updated `AGENTS.md`, `.cursor/rules/trapeza-project.mdc`, `trapeza-build` skill, subagents for ACTIVITY-LOG requirement
- Added Phase A0 milestone to IMPLEMENTATION-LOG; extended logging habit to two-tier model

### Files
- `ACTIVITY-LOG.md`, `CONTRIBUTING.md`
- `AGENTS.md`, `IMPLEMENTATION-LOG.md`
- `.cursor/rules/trapeza-project.mdc`, `.cursor/skills/trapeza-build/SKILL.md`
- `.cursor/agents/trapeza-builder.md`, `.cursor/agents/onchain-verifier.md`

### Verification
- Docs-only change; no code or spike runs

### Notes
- Implements collaboration activity logging plan

---

## 2026-06-27 — mindsmith — assisted — up-to-date-docs-rules

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** agent rules — Context7 + web search doc lookup

### Done
- Added **Up-to-date documentation** section to `trapeza-project.mdc`
- Added SDK docs guidance to `trapeza-adapters.mdc`
- Added **Documentation lookup** hierarchy to `AGENTS.md`
- Updated `arc-circle-context` skill, `trapeza-build` skill (step 3b), `arc-circle-expert` subagent

### Files
- `.cursor/rules/trapeza-project.mdc`, `.cursor/rules/trapeza-adapters.mdc`
- `AGENTS.md`
- `.cursor/skills/arc-circle-context/SKILL.md`, `.cursor/skills/trapeza-build/SKILL.md`
- `.cursor/agents/arc-circle-expert.md`

### Verification
- Docs-only change; grep confirms Context7 references in rules, AGENTS.md, skills, subagent

### Notes
- Doc hierarchy: local bundle → Context7 → arc-docs/circle MCP → web search

---

## 2026-06-29 — mindsmith — assisted — ts-only-engine-complete

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** Full TS-only algorithmic engine per plan (core + oracle + clearinghouse)

### Done
- `@trapeza/core`: micro-USDC money, `OracleSpec`, `valueUsdc`/`qualityFloor`/`bondRatio`, extended `GraphClearing`/`SettlementState`/`StateSnapshotSource`, router `taskValueUsdc()`
- `@trapeza/oracle`: `SchemaOracle` (AJV + ground-truth, schema cache, `useDefaults: false`)
- `@trapeza/clearinghouse`: DAG validate/topo, schedule (longest-path makespan), greedy+LNS, HiGHS MILP, LP shadow prices (HiGHS dual + FD fallback), twin preflight + Monte Carlo, `createClearinghouse().submitGraph()`
- Tests: 42 vitest (budget-vs-bottleneck MILP beats greedy, integration 6-node, oracle, twin, shadow prices)
- Docs: `ALGORITHMIC-SPEC.md` TS-only header, `PROJECT-DIAGRAMS.md` Beta(1,1) prior fix
- Tooling: vitest aliases, `fileParallelism: false` + singleFork for HiGHS WASM

### Files
- `packages/core/src/numeric/money.ts`, `models.ts`, `graph.ts`, `router.ts`, `index.ts`
- `packages/oracle/` (new), `packages/clearinghouse/` (new)
- `vitest.config.ts`, `package.json`, `PROJECT-DIAGRAMS.md`, `ALGORITHMIC-SPEC.md`

### Verification
- `npm test` → 42/42 pass
- `npm run typecheck` → exit 0

> **[RETRACTED 2026-07-03 — see consolidation entry below]** The "TS-only" framing and the
> `ALGORITHMIC-SPEC.md TS-only header` claim are superseded: the ratified boundary is polyglot
> (TS orchestrator/oracle + Python OR-Tools CP-SAT Tier-1 over FastAPI + TS HiGHS/greedy Tier-2).
> The clean-checkout `npm test` count logged here was also **not reproducible without a prior
> `tsc -b`** (see CONSOLIDATION-PLAN.md §1.1); the C0 vitest-alias fix makes clean `npm test` honest.

### Notes
- HiGHS WASM via `highs/runtime`; engine never reads private keys; twin uses injected snapshot

---

## 2026-06-29 — mindsmith — assisted — test-coverage

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** vitest coverage for engine packages

### Done
- Added `@vitest/coverage-v8`, `test:coverage` script, coverage config in `vitest.config.ts`
- Scoped to `packages/core`, `packages/oracle`, `packages/clearinghouse` src (excludes testing mocks)

### Verification
- `npm run test:coverage` → 42/42 pass; **92.87%** statements/lines, **76.3%** branches, **93.02%** functions

### Notes
- Lowest coverage: `preflight.ts` (71.87%), `clearinghouse.ts` MILP fallback paths; type-only files (`graph.ts`, `models.ts`, `interfaces.ts`) show 0% (no executable lines)

---

## 2026-06-29 — mindsmith — assisted — preflight-coverage

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** preflight twin test coverage

### Done
- Extended `twin-preflight.test.ts` with 6 tests: insufficient bond, negative bond after slash, exact slash OK, multi-node aggregate negative balance, `assertPreflight` throw/pass, `formatPreflightSummary`
- Exported `assertPreflight` and `formatPreflightSummary` from `@trapeza/clearinghouse`

### Verification
- `npm run test:coverage` → **48/48** pass; **`preflight.ts` 100%** statements (was ~72%)

---

## 2026-06-29 — mindsmith — assisted — clearinghouse-audit-fixes

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** fix five clearinghouse audit issues

### Done
- Monte Carlo: sample per-node latency when calibrated; per-iteration longest-path makespan; `parseUsdcToMicro` for budget
- Error taxonomy: `greedyAssign` throws `ClearingError` `NO_PROVIDER`; MILP fallback rethrows `NO_PROVIDER` instead of swallowing
- Cost basis: `providerCostUsdc()` unifies objective price term and `providerCostMicro`
- `totalClearedUsdc` sums settlement micro (`min(ask, reserve)`) to match `settlementPricesUsdc`
- Added 3 tests: MC deadline non-degenerate, greedy `NO_PROVIDER`, `submitGraph` rethrow `NO_PROVIDER`

### Files
- `packages/clearinghouse/src/twin/montecarlo.ts`
- `packages/clearinghouse/src/score.ts`
- `packages/clearinghouse/src/clearinghouse.ts`
- `packages/clearinghouse/test/twin-montecarlo.test.ts`
- `packages/clearinghouse/test/solver-benchmark.test.ts`
- `packages/clearinghouse/test/integration.test.ts`

### Verification
- `npm run typecheck` → pass
- `npm run test:coverage` → **51/51** pass; **94.44%** statements, **77.83%** branches; `montecarlo.ts` **98.4%**, `clearinghouse.ts` **82.52%**

> **[RETRACTED 2026-07-03]** The "51/51 pass" figure was **build-dependent** — reproducible only
> after a manual `tsc -b`. On a clean checkout (no prior build) `npm test` loaded 0 tests for 9/14
> suites and only 19 ran (CONSOLIDATION-PLAN.md §1.1). Fixed in C0 (vitest src aliases). Current
> honest counts are in the 2026-07-03 consolidation entry below.

---

## 2026-06-29 — mindsmith — assisted — clearinghouse-demo

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** runnable clearinghouse demo folder

### Done
- Added `demo/` with calibrated provider data (braggart vs workhorse), budget-vs-bottleneck graph, six-node workflow DAG, funded/under-funded snapshots
- `demo/run-clearing.ts` — six narrated sections: scenario, calibration vs claims, clearing, MILP vs greedy bake-off, Monte Carlo twin, preflight guard
- Root `npm run demo` script (build-free via `tsx --tsconfig` path aliases)

### Files
- `demo/tsconfig.json`, `demo/format.ts`, `demo/data.ts`, `demo/run-clearing.ts`, `demo/README.md`
- `package.json` (`demo` script)

### Verification
- `npm run demo` → all six sections print; greedy `NO_PROVIDER` on bake-off; `deadlineBreachProbability` **12.2%** (non-degenerate)
- `npm run typecheck` → pass
- `npm run test:coverage` → **51/51** pass (no regression)

> **[RETRACTED 2026-07-03]** Same build-dependent "51/51" caveat as above. See the consolidation
> entry below for the current clean-checkout counts (TS 57 pass, Python 14 pass).

---

## 2026-07-03 — consolidation — assisted — python-cpsat-boundary + docs reconciliation (C0–C5)

**Branch:** `feature/deterministic-part`
**Mode:** assisted
**Scope:** finish the approved CONSOLIDATION-PLAN (C0–C5) after a mid-flight crash; restore the
polyglot Python/OR-Tools boundary; reconcile docs; verify honestly.

### Done
- **C0 (harness honesty):** verified the `vitest.config.ts` src aliases for `@trapeza/clearinghouse`
  + `@trapeza/oracle` make a **clean, no-build `npm test`** load all 15 suites; `typecheck` script
  now includes `oracle` + `clearinghouse`.
- **C1 (enforce):** confirmed `assertPreflight`/preflight enforced in `submitGraph` (throws
  `PREFLIGHT_FAILED`); 2×-budget fixture removed; bond decremented (`Σ bond ≤ B_p`); per-node +
  global quality floors in greedy/LNS (`meetsGlobalQuality`, LNS repair floor); CP-SAT ≥ Tier-2
  objective assertion present.
- **C2 (Python CP-SAT Tier-1):** `solver/` FastAPI service implements the full §5.4 model (assignment,
  budget, DAG precedence/makespan, per-node + global log-quality, latency caps, bond capacity, RCPSP
  concurrency via cumulative intervals) + GLOP LP-dual shadow prices; TS `solver-client.ts` validates
  both directions against the ONE shared `contract/solver-contract.schema.json` and degrades to TS
  Tier-2 on any failure.
- **Amendment 1 (Monte Carlo shipped-and-flagged):** Python NumPy `/simulate` + TS in-process fallback,
  gated by `monteCarlo: { enabled }`, tested both engine paths.
- **C3 (docs):** inserted §4.1 risk taxonomy into `ALGORITHMIC-SPEC.md` (+ `useDefaults:false` fix);
  §5.3.1 risk taxonomy + §6.1.1 oracle dispute-ladder note into `SOURCE-OF-TRUTH.md`; retracted the
  build-dependent "51/51" and "TS-only" claims above.
- **C4 (demo):** bake-off is CP-SAT (Python) vs greedy+LNS (TS); Monte Carlo behind the flag.
- **Hygiene:** `.gitignore` now excludes `solver/.venv/`, `__pycache__/`, `.pytest_cache/`, `*.pyc`.

### Files
- `.gitignore`, `ALGORITHMIC-SPEC.md`, `SOURCE-OF-TRUTH.md`, `ACTIVITY-LOG.md`, `IMPLEMENTATION-LOG.md`
- (verified, mostly pre-existing from the crashed run) `solver/**`, `contract/**`,
  `packages/clearinghouse/src/solver-client.ts`, `packages/clearinghouse/test/cpsat-integration.test.ts`

### Verification (clean checkout, no prior build)
- `npm test` → **57 passed (15 files)** with the Python service UP (the 4 live CP-SAT tests run);
  **53 passed / 4 skipped** with the service down (degradation path still green).
- `npm run typecheck` → exit 0
- `cd solver && .venv/bin/python -m pytest -q` → **14 passed**
- `npm run demo` → all 6 beats; bake-off shows greedy `NO_PROVIDER` where CP-SAT clears (obj 1.2849);
  Monte Carlo via Python engine; preflight rejects the under-funded plan.

### Notes
- Deviation from CONSOLIDATION-PLAN §3.3: risk is carried as resolved per-`(node,provider)`
  `candidates[].score` computed once in TS (not `riskMicro` on the provider) — economically correct
  and DRY (documented in `contract/README.md`). No commits made; user reviews first.

---

## 2026-07-05 — assisted — app layer (P3/P5)

**Branch:** (current)
**Mode:** assisted
**Scope:** Build missing app layer per approved plan — SQLite store, runtime join, MCP, sim, dashboard, on-chain escrow seam

### Done
- **`@trapeza/store-sqlite`:** `SqliteStore` implements `Store` + append-only `events` feed (WAL, UPSERT calibration, price-surface encode/decode).
- **`@trapeza/runtime`:** `toSolverProvider` / `solverProvidersFor`, `executeClearing` (outcome providerId override + upstream failure propagation), `assemble({mode,dbPath})` composition root.
- **`@trapeza/mcp`:** stdio MCP server with zod-typed tools (`register_provider`, `get_providers`, `get_provider_calibration`, `submit_task`, `submit_graph`, `get_receipt`, `get_status`); structured `ClearingError` mapping.
- **`@trapeza/sim`:** seeded lemon/workhorse/bottleneck roster, single-task loop + graph iteration, CALIBRATION ON/OFF divergence test.
- **`@trapeza/app`:** Next.js dashboard reading SQLite via route handlers (volume, slashes, bake-off, calibration table, event feed).
- **On-chain seam:** `ArcChainAdapter.openEscrow`/`resolveEscrow` via RefundProtocol when `TRAPEZA_ESCROW_ADDRESS` set; `LiveStateSnapshotSource`; `spike:bond-slash` script.
- **Harness:** vitest aliases for new packages; `pool: forks` for better-sqlite3; `test:coverage` with v8 gates; adapter tsconfig `rootDir` fix.

### Files
- `packages/store-sqlite/**`, `packages/runtime/**`, `apps/mcp/**`, `apps/sim/**`, `apps/dashboard/**`
- `packages/adapter-arc/src/chain.ts`, `packages/adapter-arc/src/abis.ts`, `packages/adapter-arc/src/constants.ts`
- `packages/adapter-gateway/src/live-snapshot.ts`, `vitest.config.ts`, `package.json`, `.env.example`, `apps/README.md`

### Verification
- `npm run typecheck` → exit 0
- `npm test` → **83 passed | 4 skipped** (22 files)
- `npm run test:coverage` → **97.6% lines / 89.1% branches** (85% gates pass)
- `npm run test:all` → typecheck + vitest + solver pytest green (solver uses `env -u PYTHONPATH` for ROS-safe runs)
- `npm run demo` → 6 beats green

---

## 2026-07-05 — Phase D dashboard gap closure

**Author:** assisted  
**Branch:** (current)  
**Mode:** assisted  
**Scope:** Close remaining Phase D panels — shadow prices, result metrics, CALIBRATION toggle

### Done
- **`executeClearing`:** `clearing` events now include `shadowPricesUsdc` + `settlementPricesUsdc` in payload.
- **Dashboard:** shadow-price readout card, result-per-USDC/second aggregation panel, CALIBRATION ON/OFF display toggle.
- **Docs:** [apps/dashboard/README.md](apps/dashboard/README.md) — build sequence + authoritative `TRAPEZA_CALIBRATION` env note.

### Files
- `packages/runtime/src/execute-clearing.ts`, `packages/runtime/test/execute-clearing.test.ts`
- `apps/dashboard/src/app/page.tsx`, `apps/dashboard/README.md`

### Verification
- `npm run typecheck` → exit 0
- `npm test` → 83 passed | 4 skipped
- `npm run test:coverage` → >=85% gates pass
- `npm run build -w @trapeza/app` → next build exit 0
- `npm run demo` → 6 beats green
---

## 2026-07-05 — Seamless onboarding polish

**Author:** assisted  
**Branch:** (current)  
**Mode:** assisted  
**Scope:** Align default DB path + root quickstart so sim → dashboard works with zero env vars

### Done
- **Shared default DB:** sim CLI now uses `~/.trapeza/trapeza.db` (same as dashboard + MCP).
- **Dashboard:** empty-state banner when no events exist.
- **Docs:** root [README.md](README.md) mock-mode quickstart; [apps/README.md](apps/README.md) and [apps/dashboard/README.md](apps/dashboard/README.md) cross-linked.

### Files
- `apps/sim/src/cli.ts`, `apps/dashboard/src/app/page.tsx`
- `README.md`, `apps/README.md`, `apps/dashboard/README.md`

### Verification
- `npm run typecheck` → exit 0
- `npm test` → 83 passed | 4 skipped
- `npm run build -w @trapeza/app` → exit 0
- Zero-env: `node apps/sim/dist/cli.js` → writes `~/.trapeza/trapeza.db` (21 outcomes)

---

## 2026-07-05 — LLM providers + MCP HTTP + showcase

**Author:** assisted  
**Branch:** (current)  
**Mode:** assisted  
**Scope:** Real LLM deliverables through SchemaOracle, HTTP MCP transport, one-command visual demo

### Done
- **Core deliverable gap:** `SettlementAdapter.pay` returns optional `result`; `execute-clearing` + MCP `submitTask` pass `receipt.result` to `oracleVerify` (no-op in mock mode).
- **`@trapeza/provider-llm`:** `LlmClient`, `MockLlmClient`, `OpenAiCompatClient`, `LlmSettlementAdapter`, `LlmQuoteSource`, demo Q&A roster, `seedLlmProviders`.
- **`assemble({ mode: "llm" })`:** `SchemaOracle` + `LlmSettlementAdapter` + `LlmQuoteSource` + `MockChainAdapter` + `SqliteStore`.
- **MCP HTTP:** stateless `StreamableHTTPServerTransport` (per-request transport); `npm run mcp:http`; HTTP `tools/list` test.
- **`@trapeza/showcase`:** `npm run showcase` — seeds LLM market, narrated Q&A loop, spawns dashboard.
- **Dashboard:** 2s auto-refresh; live headline for result-per-USDC + lemon win share.
- **Docs:** root README flagship demo; `.env.example` LLM vars; `apps/showcase/README.md` limitations.

### Files
- `packages/core/src/interfaces.ts`, `packages/runtime/src/execute-clearing.ts`, `apps/mcp/src/tools.ts`
- `packages/provider-llm/` (new), `packages/runtime/src/assemble.ts`
- `apps/mcp/src/http.ts`, `apps/mcp/src/http-cli.ts`, `apps/mcp/test/http.test.ts`
- `apps/showcase/` (new), `apps/dashboard/src/app/page.tsx`
- `README.md`, `.env.example`, `apps/mcp/README.md`, `apps/showcase/README.md`, `package.json`, `vitest.config.ts`

### Verification
- `npm run typecheck` → exit 0
- `npm test` → 100 passed | 4 skipped
- `npm run test:coverage` → 97.22% lines / 85.6% branches (gates pass)
- `npm run demo` → 6 beats green
- `npm run build -w @trapeza/app` → exit 0
- `TRAPEZA_SHOWCASE_NO_DASHBOARD=1 npm run showcase` → mock LLM Q&A, SchemaOracle PASS, calibration routes away from lemon
- MCP HTTP: `initialize` + `tools/list` → 7 tools including `register_provider`

---

## 2026-07-05 — LLM-mode deep-check fixes

**Author:** assisted  
**Branch:** (current)  
**Mode:** assisted  
**Scope:** Fix llm-mode gaps found in deep review (MCP submit_task, showcase loop, docs)

### Done
- **MCP `submit_task` in llm mode:** `registerProvider` seeds `rt.llm.settlement` + `rt.llm.quotes`; `submitTask` only throws `NO_QUOTES` in live mode (mock seeds quotes; llm uses pre-seeded roster).
- **Showcase loop:** replaced `setInterval` with awaited self-scheduling `setTimeout`; index advances at iteration start to prevent overlap/spin on slow real endpoints.
- **Docs:** real-endpoint homogeneity noted in `apps/showcase/README.md` and root README (lemon divergence is mock-mode illustration).
- **Regression test:** `apps/mcp/test/llm-mode.test.ts` — seeded roster + `submitTask` returns outcome (no `NO_QUOTES`).

### Files
- `apps/mcp/src/tools.ts`, `apps/mcp/test/llm-mode.test.ts`
- `apps/showcase/src/loop.ts`
- `README.md`, `apps/showcase/README.md`

### Verification
- `npm run typecheck` → exit 0
- `npm test` → 101 passed | 4 skipped
- `npm run test:coverage` → 96.33% lines / 86.04% branches (gates pass)
- `npm run demo` → 6 beats green
- `npm run build -w @trapeza/app` → exit 0
- Manual: MCP HTTP `submit_task` in llm mode → outcome (no `NO_QUOTES`)

---
