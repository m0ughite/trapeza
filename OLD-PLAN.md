# TS-only Algorithmic & Deterministic Engines

Runtime decision is locked: **TypeScript only**. Solver via `highs` (HiGHS-WASM, MILP + LP duals), no Python, no OR-Tools. Greedy-topo + LNS is both the second bake-off solver and the degrade path. Twin is plain TS with a seeded PRNG.

## Ownership & scope (deterministic algorithmic engine ONLY)

This plan is strictly the **pure-computation** engine. It contains **no** chain, MCP, wallet, settlement-execution, or dashboard work — those are the teammate's.

- **In scope (this plan):** money helpers, shared model/type fields, deterministic oracle (schema validation + standardization + ground-truth diff), graph solver (MILP + greedy/LNS), DAG scheduler, state twin (deterministic preflight + seeded Monte Carlo), LP-dual shadow prices, the algorithmic docs. Calibration ledger + EV router are already built.
- **Out of scope (teammate):** `adapter-arc` / `adapter-gateway`, `RefundProtocol.sol` / ERC-8183 escrow, Gateway/x402 on-chain settlement execution, MCP `submit_graph` server, seeded loop, dashboard, wallets, ERC-8004 reputation writes. The non-deterministic **LLM schema transformer/sanitizer** (raw-text→JSON) is also out (non-deterministic by nature).
- **Coordination touchpoints (yours, but shared contract):** (1) new fields in `models.ts`/`graph.ts` are shared types — sync before editing; (2) the twin *models* the teammate's `RefundProtocol`/ERC-8183 release/slash rules as a pure spec (no chain calls) and must track changes to them; (3) `submitGraph()` returns a pure `GraphClearing` — exposing it over MCP and the actual batch settle are the teammate's.

## Module boundaries (respect `AGENTS.md` / DESIGN §4.3)

- `@trapeza/core` stays chain-agnostic and dependency-light. Only pure additions go here (money helpers, model fields, extended graph types).
- Concrete `Oracle` implementation → **new** `packages/oracle/` (`@trapeza/oracle`, dep: `ajv`, `ajv-formats`). Implementations of injected boundaries live outside core, like the existing mocks.
- Solver + twin + clearing → **new** `packages/clearinghouse/` (`@trapeza/clearinghouse`, deps: `highs`, `seedrandom`). Imports `@trapeza/core`, implements the `GraphClearinghouse` seam in [packages/core/src/graph.ts](https://app.notion.com/p/packages/core/src/graph.ts); does not modify core behavior.

## 1. Shared numeric foundation (core, pure)

- New [packages/core/src/numeric/money.ts](https://app.notion.com/p/packages/core/src/numeric/money.ts): integer **micro-USDC** (1e6) parse/format/scale helpers. All budget/cost/bond math and the MILP/oracle comparisons go through these to kill float drift and preserve nanopayment precision (×1e6, not the spec's ×1000).
- Export from [packages/core/src/index.ts](https://app.notion.com/p/packages/core/src/index.ts).

## 2. Model fixes (core)

In [packages/core/src/models.ts](https://app.notion.com/p/packages/core/src/models.ts) and [packages/core/src/graph.ts](https://app.notion.com/p/packages/core/src/graph.ts):

- Add node `valueUsdc` to `TaskSpec` (the `v_n` marginal value, distinct from `budgetUsdc`). The router currently conflates them at [packages/core/src/router.ts](https://app.notion.com/p/packages/core/src/router.ts) line 67; switch scoring to `valueUsdc` with `budgetUsdc` as the willingness-to-pay cap.
- Add per-node `qualityFloor` and `bondRatio`; add `globalQualityFloor` + `riskAversion` to `TaskGraph`.
- Extend `GraphClearing` to carry the **schedule** (`startMs` per node), `objectiveValue`, and per-node settlement price (not just shadow prices).

## 3. Deterministic oracle + schema standardization (`@trapeza/oracle`)

### 3a. Schema standardization (the engine's I/O contract — `PROJECT-DIAGRAMS.md` §1)

- New `packages/oracle/src/schemas.ts`: pin **JSON Schema Draft 2020-12** and define the three standardized schema slots every node carries, so downstream nodes never receive unexpected keys/types (the failure-propagation guard):
  - **Input schema** — what the requester must feed a node.
  - **Output / deliverable schema** — the exact keys/types a provider must return.
  - **Oracle / verification schema** — how the oracle checks the outcome (shape + ground-truth rules).
- Tighten `TaskSpec.oracleSpec` (currently `unknown` in [packages/core/src/models.ts](https://app.notion.com/p/packages/core/src/models.ts) line 43) into a typed `{ schema, groundTruth }` contract; have the solver/twin read the standardized schemas, not ad-hoc objects.
- Excluded by design: the **LLM schema transformer/sanitizer** (non-deterministic) — keep the engine strictly schema-validated; coercion of malformed provider text is a separate middleware (teammate / post-hackathon).

### 3b. Deterministic verification oracle

- `packages/oracle/src/schema-oracle.ts`: implements `Oracle.verify(spec, result)` from [packages/core/src/interfaces.ts](https://app.notion.com/p/packages/core/src/interfaces.ts).
  - Compile JSON Schema from `spec.oracleSpec.schema` **at runtime** (not a hardcoded schema), with an AJV **compiled-schema cache** keyed by a stable hash.
  - `useDefaults: false` (defaults-injection would let omitted fields pass and break credible slashing).
  - Add the missing **field-level ground-truth diff**: compare against `spec.oracleSpec.groundTruth` with typed comparators — exact, **numeric tolerance in micro-USDC**, normalized string.
  - Binary `passed` for slashing; `score` = fraction of fields correct (0..100) for the reputation signal.
- Replace `MockOracle` usage in the real path; keep mock for unit tests.

## 4. Graph solver (`@trapeza/clearinghouse`)

- `milp.ts` — build the MILP for HiGHS (CPLEX-LP string or `lp-model`) and solve:
  - vars `x[n,p]` binary; objective `Σ x·(p̂·v_n − ĉ − ρ·risk)` (fixes the spec dropping the `−cost−risk` terms).
  - constraints: **capability mask**, assignment `Σ_p x=1`, **budget incl. bonds** `Σ cost + Σ bond ≤ B` (spec omits bonds), per-node quality floor + **global log-linearized chance constraint** `Σ x·round(log p̂·S) ≥ round(log q_min·S)` (spec omits this entirely).
  - all coefficients integer micro-USDC / scaled-log; set HiGHS `time_limit`; deterministic.
  - **capability-empty guard**: detect nodes with no eligible provider and return a structured error before solving (don't emit `0==1`).
- `schedule.ts` — after assignment, compute start times by topological order and **makespan = DAG longest path** (fixes spec's additive makespan); check `makespan ≤ deadline`, per-node latency caps.
- `greedy-lns.ts` — greedy-topo seed (assign by calibrated EV with budget reservation for descendants) + Large-Neighborhood-Search destroy/repair scored on the twin. Doubles as **degrade path** and the **2-solver bake-off** opponent.
- `shadow-prices.ts` — solve the **LP relaxation** with HiGHS and read `Rows[].Dual` for the budget/deadline/capacity duals (display-only shadow prices; CP-SAT couldn't give these).
- `clearinghouse.ts` — `submitGraph()` orchestrator: validate DAG (acyclic, edges resolve) → MILP solve (fallback to greedy+LNS on infeasible/timeout) → schedule → twin preflight → assemble `GraphClearing`. Implements `GraphClearinghouse`.

## 5. State twin (`@trapeza/clearinghouse/twin.ts`)

- **Deterministic settlement preflight (locked v1 scope, build first):** one forward pass over an in-memory escrow twin applying releases/slashes/splits; assert no overdraw / no negative balance / bond invariants, with accounting matched **exactly** to the `RefundProtocol`/ERC-8183 state machine in [PROJECT-DIAGRAMS.md](https://app.notion.com/p/PROJECT-DIAGRAMS.md) §1.4 (success → provider gets fee+bond; failure → requester gets fee+bond).
- **Small-N Monte Carlo (demo visual, second):** seeded `default_rng`style PRNG (`seedrandom`/mulberry32); **sample** `p ~ Beta(α,β)` per iteration (not the posterior mean — that throws away the uncertainty the twin exists to measure) via a Gamma sampler; **topological** failure propagation (AND all parents, fixing the order-dependent one-hop bug); non-negative (lognormal/clamped) cost+latency draws; longest-path makespan; report `P(failure)`, `P(budget overrun)`, `P(deadline breach)`, `E[net]`, and the seed.

## 6. Doc reconciliation

- [PROJECT-DIAGRAMS.md](https://app.notion.com/p/PROJECT-DIAGRAMS.md) §2.1 and the scratch [.md](https://app.notion.com/p/.md): change claim-seeded prior `α0=C·p_claim` → **Beta(1,1)** to match [packages/core/src/calibration.ts](https://app.notion.com/p/packages/core/src/calibration.ts) and the "bids are never the signal" thesis.
- Rewrite [ALGORITHMIC-SPEC.md](https://app.notion.com/p/ALGORITHMIC-SPEC.md) to the TS-only stack (HiGHS-WASM, greedy/LNS, deterministic twin) and fix every dropped item: full objective, budget-incl-bonds, quality chance-constraint, micro-USDC scaling, seeded RNG, Beta sampling, topo propagation, longest-path makespan, RefundProtocol-matched accounting.
- Fold any unique content from the scratch [.md](https://app.notion.com/p/.md) into [ALGORITHMIC-SPEC.md](http://ALGORITHMIC-SPEC.md) and **delete** `.md`.
- Align all money fields to micro-USDC/string across docs (Pydantic `float` examples removed).

## 7. Tests (vitest, mirror existing `packages/core/test/`)

- oracle: dynamic-schema compile, ground-truth pass/fail, numeric tolerance, missing-field fails (no default rescue).
- solver: the **budget-vs-bottleneck benchmark** where MILP provably beats greedy (the demo gap must be real); quality-floor enforced; infeasible → degrade to greedy; capability-empty → structured error; fixed seed/time-limit → reproducible.
- twin: preflight catches overdraw; Monte Carlo reproducible under a seed; failure propagation transitive on a 3-deep chain; makespan = longest path; no negative draws.
- shadow prices: budget dual > 0 when the budget binds.

## Sequencing (protects the demo, keeps the degrade contract free)

1. money helpers + model fields (2) — unblocks everything.
2. oracle (3) — pure TS, locked v1, makes slashing credible.
3. greedy-topo + LNS + scheduling (4) — guarantees a working solver/degrade path even if MILP wiring slips.
4. MILP via HiGHS + capability guard (4).
5. deterministic preflight twin (5).
6. shadow prices + Monte-Carlo visual (4/5).
7. doc reconciliation + delete `.md` (6), tests alongside each step (7).

Here's the tech stack per engine component (all TypeScript, ESM, Node — matching the existing `@trapeza/core` setup):


| Component                      | Language / Runtime | Core libraries                                                                             | Notes                                        |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| **Money ruler** (micro-USDC)   | TypeScript         | none (native `BigInt` / integer math)                                                      | Pure helpers; zero deps                      |
| **Schema standardization**     | TypeScript         | JSON Schema Draft 2020-12 (spec, not a lib)                                                | Typed `oracleSpec = { schema, groundTruth }` |
| **Deterministic oracle**       | TypeScript         | `ajv` + `ajv-formats`                                                                      | Compiled-schema cache; `useDefaults:false`   |
| **Calibration ledger** (built) | TypeScript         | none (hand-written Beta-Binomial + Welford)                                                | Already shipped, 0 deps                      |
| **EV router** (built)          | TypeScript         | none                                                                                       | Already shipped, 0 deps                      |
| **Graph solver — Solver A**    | TypeScript + WASM  | `highs` (HiGHS-WASM); optionally `lp-model` for model building                             | MILP + LP duals; `time_limit` set            |
| **Graph solver — Solver B**    | TypeScript         | none (hand-written greedy-topo + LNS)                                                      | Degrade path + bake-off opponent             |
| **Scheduler**                  | TypeScript         | none (topological sort + longest-path)                                                     | Pure graph algorithm                         |
| **State twin — preflight**     | TypeScript         | none (in-memory escrow model)                                                              | Mirrors teammate's contract rules            |
| **State twin — Monte Carlo**   | TypeScript         | `seedrandom` (seeded PRNG) + small custom Beta/Gamma sampler (or `@stdlib/random`/`jstat`) | Deterministic via fixed seed                 |
| **Shadow prices**              | TypeScript + WASM  | `highs` (LP relaxation, reuse)                                                             | Reads `Rows[].Dual`                          |
| **Clearing orchestrator**      | TypeScript         | imports `@trapeza/core`                                                                    | Returns pure `GraphClearing`                 |
| **Tests**                      | TypeScript         | `vitest`                                                                                   | Mirrors existing `packages/core/test/`       |
| **Build / tooling**            | TypeScript         | `tsc -b`, `tsx`, npm workspaces                                                            | Same as current monorepo                     |


Packaging:


| Package                        | Depends on      | New deps it introduces                                                |
| ------------------------------ | --------------- | --------------------------------------------------------------------- |
| `@trapeza/core` (existing)     | —               | none (stays dependency-light; adds money helpers + model fields only) |
| `@trapeza/oracle` (new)        | `@trapeza/core` | `ajv`, `ajv-formats`                                                  |
| `@trapeza/clearinghouse` (new) | `@trapeza/core` | `highs`, `seedrandom` (+ optional `lp-model`, stats lib)              |


A few stack decisions worth confirming before I build:

- **Stats sampling**: hand-roll a ~15-line Marsaglia-Tsang Gamma/Beta sampler (zero deps, fully controlled) vs pull in `jstat`/`@stdlib/random`. I lean hand-rolled to keep deps minimal and determinism tight.
- **MILP model building**: write the CPLEX-LP string directly vs add `lp-model` for ergonomics. I lean direct string (one fewer dep) unless the encoding gets unwieldy.
- **HiGHS package**: `highs` (WASM, works in Node + browser, good for the dashboard later) vs `highs-solver` (native Node binding, faster, but native build). I lean `highs` (WASM) for portability.

