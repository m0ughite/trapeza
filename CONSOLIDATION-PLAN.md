# Trapeza — Consolidation Plan

> **Status:** PLAN ONLY. No source has been edited. The only file created is this one.
> Assessment commands run (read-only): `npm install`, `tsc -b`, `vitest run`. Findings below are
> reproduced from the working tree at branch `feature/deterministic-part`, commit `dced925`.
>
> **Author stance:** critical review, independent reasoning, explicit confidence levels. Where the
> teammate (or my own sub-reviewers) got something wrong, it is called out.

---

## 0. TL;DR — the verdict up front

The teammate (`mindsmith`, commit `dced925`) shipped a **real, working, mostly-correct off-chain
algorithmic engine** (`@trapeza/oracle` + `@trapeza/clearinghouse` + core extensions + a narrated
demo). It is not vaporware: after a build, **51/51 tests pass**. But it diverges from the canonical
plan on three axes that must be reconciled before we build further:

1. **Language boundary violation (the headline).** The constraint-optimization solver was specified
   in **Python + OR-Tools CP-SAT** (`ALGORITHMIC-SPEC.md` §4, L136–219; `SOURCE-OF-TRUTH.md` §3
   architecture L95–96, §8.2 L379). The teammate reimplemented it in **TypeScript on HiGHS-WASM**
   (`packages/clearinghouse/src/milp.ts`). This is a deliberate substitution recorded in
   `OLD-PLAN.md` L3 ("TypeScript only … no Python, no OR-Tools") — a plan he wrote himself that was
   never ratified against `SOURCE-OF-TRUTH.md`.

2. **A broken, non-hermetic test harness (the trap).** On a clean checkout, `npm test` **fails to
   load 9 of 14 test suites** (0 tests collected) and only 19 core tests run. The 51-pass figure the
   teammate logged (`ACTIVITY-LOG.md` L161–162) is only reproducible **after** a manual `tsc -b`.
   Root cause is a two-line omission in `vitest.config.ts`. This is the single most dangerous item:
   our CI/"green" signal is currently a lie for anyone who clones fresh.

3. **Documentation drift and scope creep.** `ALGORITHMIC-SPEC.md` still describes the Python/FastAPI
   stack the code abandoned; `ACTIVITY-LOG.md` L153 claims the spec was rewritten to TS-only — it was
   **not**. State-Twins Monte Carlo, which `SOURCE-OF-TRUTH.md` §6.3/§7 explicitly defers to
   post-hackathon, was shipped as a first-class v1 export.

**Overall recommendation (confidence: high):** *Keep the engine, do not throw it away.* Fix the
harness, **re-establish the Python/OR-Tools solver boundary** (the teammate's TS solver becomes the
Tier-2 degrade path + bake-off opponent, which is exactly the role `SOURCE-OF-TRUTH.md` §4.3 assigns
to greedy+LNS), reconcile the docs, and demote Monte Carlo behind a flag. Net new work is bounded and
mostly additive; almost nothing needs to be discarded.

---

## 1. What actually exists — measured state (not claimed)

### 1.1 Test reality (confidence: high — reproduced twice)

| Command | Result |
| --- | --- |
| `npm test` (clean, no build) | **19 passed**, **9 suites FAILED to load** (0 tests). All `@trapeza/clearinghouse` and `@trapeza/oracle` suites error: *"Failed to resolve entry for package … incorrect main/module/exports"*. |
| `tsc -b packages/core packages/oracle packages/clearinghouse` | exit 0 (builds `dist/`) |
| `npm test` (after build) | **51 passed / 51** across 14 files |

**Root cause** (`vitest.config.ts` L11–17): the alias map wires only `@trapeza/core` and
`@trapeza/core/testing` to their `src`. It does **not** alias `@trapeza/clearinghouse` or
`@trapeza/oracle`, whose `package.json` `exports` point to `./dist/index.js`
(`packages/clearinghouse/package.json` L7–14, `packages/oracle/package.json` L7–14), which does not
exist until a build. Core tests pass only because core is aliased to source. The comment in
`vitest.config.ts` L6–9 ("no build step is needed") is **false** for two of the three packages.

**Also broken:** root `npm run typecheck` (`package.json` L15) is
`tsc -b packages/core packages/adapter-arc packages/adapter-gateway` — it **omits the new
`oracle` and `clearinghouse` packages entirely**, so the new code is not typechecked by the canonical
script. (`npx tsc -b` with no project fails outright: `error TS5083: Cannot read file …
tsconfig.json` — there is no root `tsconfig.json`, only `tsconfig.base.json`.)

**Verdict:** the engine's tests are genuine and green, but the **harness is not hermetic**. This is a
~5-line fix (below), but until it lands, every "tests pass" claim is checkout-dependent.

### 1.2 What the engine does, in one paragraph

`createClearinghouse().submitGraph(graph)` (`clearinghouse.ts` L23–136): validate the DAG → solve
assignment via HiGHS-WASM MILP (`solveMilp`), falling back to greedy+LNS on any non-`NO_PROVIDER`
error → compute a longest-path schedule and reject if makespan > deadline → take a settlement
snapshot (injected, else a fixture) → run a **non-blocking** settlement preflight → compute a budget
shadow price from an LP relaxation → emit per-node `min(ask, reserve)` settlement prices + metadata.
The oracle (`schema-oracle.ts`) validates a deliverable against a JSON-Schema-2020 contract + a
field-level ground-truth diff, returning a deterministic pass/fail + score.

---

## 2. Module-by-module assessment (keep / refactor / rewrite / discard)

Legend: **KEEP** = correct and in scope as-is; **REFACTOR** = keep the code, fix bugs / rewire;
**REWRITE** = replace the implementation (interface may survive); **DISCARD (v1)** = remove from the
v1 surface (may return post-hackathon).

| Module | File | Verdict | Justification (grounded) |
| --- | --- | --- | --- |
| Money math | `core/src/numeric/money.ts` | **KEEP** | Integer micro-USDC + `parseUsdcToMicro`/`formatMicroToUsdc` are clean and correct (L14–39). `scaleLogProbability` floor of `-20·scale` for p≤0 (L64) is a sane guard. |
| Data models | `core/src/models.ts`, `core/src/graph.ts` | **KEEP** | `TaskSpec` gains `valueUsdc/qualityFloor/bondRatio` (models L52–59); `TaskGraph`/`GraphClearing`/`SettlementState` seams (graph.ts) are the right boundary. One cosmetic fix: `ClearingMeta.solver` union is `"highs_milp"|"greedy_lns"` (graph.ts L44) — must include a CP-SAT tier. |
| EV router | `core/src/router.ts` | **KEEP** | `score = p·v − price − riskPremium` (L98); risk premium = expected-unrecovered-loss `(1−p)·max(0,value−bond)` + uncertainty `stddev(p)·value` (L122–136). Grounded and correct. |
| Calibration ledger | `core/src/calibration.ts` | **KEEP** | Beta(1,1) prior (L28–29), posterior mean α/(α+β) (L51–52), variance (L60–65), pass→α++ / fail→β++ (L84–85), Welford cost/latency (L124–137). Textbook-correct; the moat. |
| Oracle | `oracle/src/schema-oracle.ts`, `schemas.ts` | **REFACTOR** | AJV-2020 + `useDefaults:false` + ground-truth diff with numeric tolerance (L57–97) is correct and matches intent. Bugs: `stableHash` = `JSON.stringify` is **key-order-sensitive** (L23–25) → cache misses/false splits; partial-score branch `×0.5` for shape-invalid (L72) is arbitrary/undocumented; `realizedLatencyMs: 0` hardcoded (L95). Small fixes, not a rewrite. |
| DAG utils | `clearinghouse/src/dag.ts` | **KEEP** | Cycle detection (three-color DFS) + Kahn topo sort correct. Add duplicate-`nodeId` guard (L4–19 never checks). |
| Scheduler | `clearinghouse/src/schedule.ts` | **REFACTOR** | Longest-path makespan is correct **as a post-check** but is not inside the optimization and ignores provider concurrency `k_p` and per-node `deadlineMs`. Once the solver moves to CP-SAT, scheduling belongs **in** the model; this becomes a verification/echo utility. |
| Greedy + LNS | `clearinghouse/src/score.ts`, `greedy-lns.ts` | **REFACTOR → becomes Tier-2** | `greedyAssign` is budget- and per-node-quality-aware (score.ts L81,L88). LNS (L124–201) is a real destroy(30%)-repair loop but **repair drops the quality floor** (L165–177 checks only budget) and **omits the global quality floor** entirely. This is the correct home for the "degrade path / bake-off opponent" role — keep it in TS, fix the two quality gaps. |
| MILP solver | `clearinghouse/src/milp.ts` | **REWRITE (as Tier-1) / DEMOTE to Tier-2** | Real HiGHS MILP, but models only assignment + budget + log-quality — **no scheduling `s_n`, no makespan, no concurrency, no per-node bond-capacity `B_p`, no risk ceiling** (L79–156). It solves a *different, smaller* problem than `SOURCE-OF-TRUTH.md` §5.4 claims. Decision in §3: replace Tier-1 with Python CP-SAT; keep this HiGHS solver as the honest Tier-2/bake-off engine. |
| Shadow prices | `clearinghouse/src/milp.ts` `computeShadowPrices` | **REFACTOR** | Genuinely reads the HiGHS LP **dual** on the budget row (L261–262) with a finite-difference fallback when the dual is 0 (L264–273) — *not faked*. But the relaxation (`buildLpRelaxation` L184–241) **drops all quality constraints**, so the dual describes budget scarcity in a quality-free world. For a "why the bottleneck clears at a premium" story this is economically incomplete. Move to the Python service (OR-Tools/HiGHS exposes duals) or keep TS but include quality. |
| Settlement preflight (twin) | `clearinghouse/src/twin/preflight.ts` | **REFACTOR** | Correct deterministic forward sim of release/slash (L18–71). **Two real bugs:** (1) it is computed but **never enforced** — `assertPreflight` is imported (`clearinghouse.ts` L11) and **never called**; failure only sets a boolean flag (`clearinghouse.ts` L80,L131); (2) success path does **not** decrement locked bond (L53–54), so a provider assigned to multiple nodes can pass per-node bond checks while over-committing `B_p` (violates `SOURCE-OF-TRUTH.md` §5.4 `Σ bond_n ≤ B_p`). |
| Twin snapshot | `clearinghouse/src/twin/snapshot.ts` | **KEEP** | Harmless fixture. But the default fixture uses **2× graph budget** (`clearinghouse.ts` L77), which masks insolvency in the happy path — remove that multiplier so preflight is meaningful. |
| Monte Carlo | `clearinghouse/src/twin/montecarlo.ts` | **DISCARD (v1 surface)** | Competent seeded Beta/Gamma MC with failure propagation, but `SOURCE-OF-TRUTH.md` §6.3 (L316–322) and §7 (L349–352) **explicitly defer** heavy MC to post-hackathon (small fixed-N visual only). Exported first-class from `index.ts` L140 and used in `demo/run-clearing.ts` §5. Gate behind a flag / move to a `twin/experimental` path; keep for the optional demo visual. |
| Types | `clearinghouse/src/types.ts` | **KEEP** | Adequate seam; extend `solver` union for CP-SAT. |
| Package index | `clearinghouse/src/index.ts` | **REFACTOR** | Trim `runMonteCarlo` from the public v1 API; add CP-SAT client export. |
| Demo | `demo/run-clearing.ts`, `data.ts`, `format.ts` | **KEEP (retarget)** | Well-structured 6-beat narrated demo. Beat 5 (Monte Carlo) should be relabeled "experimental / illustrative"; beat 4 bake-off should become **CP-SAT vs greedy+LNS** once Tier-1 is Python. |

### 2.1 Independent correction to my own sub-reviewer (confidence: high)

A sub-reviewer flagged the **per-node** quality constraint in `milp.ts` L125–138 as "wrong constraint
family" for using `log(p̂)` instead of the spec's linear `Σ x·p̂ ≥ q_n`. **That critique is wrong.**
Because the assignment constraint forces exactly one `x_{n,p}=1` per node (L86–92), the per-node sum
`Σ_p log(p̂)·x_{n,p} ≥ log(q_n)` collapses to `log(p̂_chosen) ≥ log(q_n)`, and since `log` is monotone
this is **identically** `p̂_chosen ≥ q_n` — exactly the linear floor. The log form is only *necessary*
for the **global** product constraint (L111–123), where it linearizes `Π p̂ ≥ q_min` into
`Σ log p̂ ≥ log q_min` (`SOURCE-OF-TRUTH.md` §5.4 L262). So the MILP's quality encoding is correct.
The real defect is elsewhere: the **LP relaxation used for shadow prices omits quality altogether**.

### 2.2 Correctness bugs, prioritized (all grounded)

| # | Severity | Bug | Location |
| --- | --- | --- | --- |
| 1 | **Critical** | Clean `npm test` loads 0 tests for 9/14 suites; "green" is build-dependent | `vitest.config.ts` L11–17 |
| 2 | **Critical** | `typecheck` script doesn't include `oracle`/`clearinghouse` | `package.json` L15 |
| 3 | **High** | Preflight never enforced — bad clearings settle anyway | `clearinghouse.ts` L80, L131 (`assertPreflight` unused) |
| 4 | **High** | Default snapshot = 2× budget hides insolvency | `clearinghouse.ts` L77 |
| 5 | **High** | Provider bond not decremented across multi-node assignment → `B_p` over-commit | `preflight.ts` L53–54 |
| 6 | **Med** | LNS repair drops per-node quality floor; greedy+LNS ignore global quality floor | `score.ts` L165–177 (repair), no `globalQualityFloor` anywhere in score.ts |
| 7 | **Med** | Shadow-price LP relaxation omits quality constraints | `milp.ts` L184–241 |
| 8 | **Med** | Solver accepts HiGHS `"Feasible"` (possibly time-cut / suboptimal) as success without flagging | `milp.ts` L154 |
| 9 | **Low** | Oracle schema cache key is order-sensitive `JSON.stringify` | `schema-oracle.ts` L23–25 |
| 10 | **Low** | `validateDag` allows duplicate node IDs | `dag.ts` L4–19 |
| 11 | **Low** | Two budget semantics: solver uses `cost+bond ≤ budget`; settlement totals `min(ask,reserve)` — never reconciled/asserted equal-or-≤ | `milp.ts` L94–109 vs `clearinghouse.ts` L105–115 |

### 2.3 Test-quality assessment (confidence: high)

- **Strong:** `twin-preflight.test.ts` (9 tests: overdraw, slash, insufficient bond, multi-node
  negative balance); `schedule.test.ts` (parallel-branch makespan). These test real behavior.
- **The one load-bearing test:** `solver-benchmark.test.ts` budget-vs-bottleneck case — MILP finds a
  feasible allocation where `solveGreedyOnly` throws. This is the *only* evidence for the §5.5 thesis
  ("global solve beats greedy"). **Gap:** it never asserts `MILP objective ≥ greedy+LNS objective`, so
  it proves "greedy can fail," not "our Tier-1 is better than our Tier-2." Add that assertion.
- **Weak/tautological:** `greedy-lns.test.ts` LNS≥greedy (true by construction — LNS only keeps
  improvements, score.ts L192); `shadow-prices.test.ts` slack-budget dual==0 is tautological given
  `Math.max(0, …)` clamp (milp.ts L275); `integration.test.ts` asserts "solver ∈ {milp,lns}" and
  "shadow ≥ 0" — smoke, not allocation quality.
- **Missing entirely:** no test that preflight **blocks** a clearing (because it doesn't); no
  MILP-vs-LNS objective comparison; no dual-consistency check (dual ≈ finite-difference).

---

## 3. Python / TypeScript boundary correction

### 3.1 The intended boundary, restated crisply

`SOURCE-OF-TRUTH.md` and `ALGORITHMIC-SPEC.md` §1 agree on a **polyglot split**: TypeScript owns
orchestration, the core primitive, the oracle, chain adapters, MCP, and the demo; **Python owns the
constraint-optimization solver** (and, post-hackathon, the vectorized robustness simulator). The
teammate collapsed everything into TS. We restore the split as follows.

### 3.2 What stays TS vs what becomes Python

| Concern | Runtime | Rationale |
| --- | --- | --- |
| `@trapeza/core` (models, calibration ledger, EV router, money) | **TS** | Already correct; forkable primitive; no reason to move. |
| `@trapeza/oracle` (schema + ground-truth) | **TS** | AJV is the right tool; deterministic; stays. |
| Chain adapters (`adapter-arc`, `adapter-gateway`), MCP, seeded loop, dashboard, demo | **TS** | Ecosystem is Node/Viem. |
| Clearinghouse **orchestration** (`submitGraph`: validate DAG → call solver → schedule echo → preflight → settle) | **TS** | Glue + settlement live where the chain lives. |
| **Tier-1 solver** (assignment + RCPSP scheduling + budget + quality chance-constraint + bond capacity + risk) → allocation, schedule, **shadow prices (LP duals)** | **Python + OR-Tools CP-SAT** | This is the spec's headline and the thing OR-Tools is purpose-built for; TS/HiGHS cannot express the scheduling/interval part cleanly. |
| **Tier-2 solver** (greedy + LNS) | **TS (existing)** | Becomes the in-process degrade path *and* the bake-off opponent (`SOURCE-OF-TRUTH.md` §4.3). No degrade path should require Python to be up. |
| Settlement preflight (twin) | **TS (existing)** | It touches settlement accounting; keep next to settlement. |
| Robustness Monte Carlo | **Python (post-hackathon)** or TS-flagged visual | Deferred per §6.3/§7. NumPy version is the eventual home. |

**Design principle:** the Python solver is a **pure function** — deterministic, no keys, no chain, no
storage. It receives a fully-resolved problem (calibrated numbers already computed by TS) and returns
an allocation. This keeps the trust boundary in TS and makes the solver trivially testable and
swappable (HiGHS Tier-2 must produce the *same-shaped* output so the bake-off is apples-to-apples).

### 3.3 The interface payload (the contract)

**Request (TS → Python):** the fully-resolved problem, all numbers pre-calibrated in TS so the solver
never touches the ledger:

```json
{
  "graph": {
    "id": "g1",
    "nodes": [{ "nodeId": "n1", "capability": "extract.invoice.v1",
                "valueUsdcMicro": "500000", "qualityFloor": 0.8, "bondRatio": 0.2,
                "latencyCapMs": 8000 }],
    "edges": [{ "from": "n1", "to": "n2" }],
    "globalBudgetUsdcMicro": "2000000",
    "globalDeadlineMs": 15000,
    "globalQualityFloor": 0.7,
    "riskAversion": 1.0
  },
  "providers": [{ "id": "p1", "capabilities": ["extract.invoice.v1"],
                  "pHat": 0.91, "pHatStdDev": 0.04,
                  "costUsdcMicro": "120000", "latencyMs": 5000,
                  "concurrency": 2, "bondCapacityUsdcMicro": "5000000",
                  "riskMicro": "30000" }],
  "options": { "timeLimitMs": 5000, "seed": 42 }
}
```

**Response (Python → TS):**

```json
{
  "status": "optimal | feasible | infeasible",
  "objectiveValue": 1.2345,
  "assignments": [{ "nodeId": "n1", "providerId": "p1", "score": 0.31 }],
  "schedule": [{ "nodeId": "n1", "startMs": 0, "durationMs": 5000, "endMs": 5000 }],
  "shadowPrices": { "budget": "0.42", "deadline": "0.00",
                    "capacity:p1": "0.10" },
  "makespanMs": 12000,
  "solver": "cp_sat"
}
```

This is **exactly** the `SolverInput`/`SolverResult` shape already in `clearinghouse/src/types.ts`
(L4–49) plus a `schedule` and richer `shadowPrices` — so the TS Tier-2 solver already conforms and the
bake-off is free. All money crosses the boundary as **integer micro-USDC strings** (never floats), to
preserve the discipline `core/src/numeric/money.ts` establishes.

---

## 4. Transport decision: FastAPI vs gRPC (vs subprocess)

**Recommendation: FastAPI + Pydantic + JSON over localhost HTTP. Reject gRPC for v1.
Confidence: high.**

The call is a **single unary request/response** of a tiny payload (≤ ~10 nodes × ~a few providers),
invoked a handful of times per demo, where wall-clock is dominated by CP-SAT compute (ms–seconds), not
serialization. gRPC's advantages are real but **none of them apply here**:

- **Schema strictness:** Pydantic already gives typed validation + JSON-Schema export at the boundary
  (`ALGORITHMIC-SPEC.md` §3 L100–132 already sketches the Pydantic models). gRPC's proto strictness
  buys nothing extra we need.
- **Streaming:** irrelevant — the solver returns once. There is no progress stream, no server-push,
  no bidirectional flow. gRPC's flagship feature is unused.
- **Latency/throughput:** binary framing matters at high QPS or large payloads; our payload is a
  kilobyte and our QPS is ~single digits. The perf delta is noise against CP-SAT solve time.
- **Dev speed for a 4-day window:** FastAPI is `uvicorn app:app` + a decorator; debuggable with
  `curl`; no `.proto` authoring, no dual codegen toolchain (`buf`/`ts-proto` + `grpcio-tools`), no
  generated-stub churn. gRPC would burn hours of hackathon time for zero demo value.

**Even lighter alternative (worth considering, confidence: moderate):** a **subprocess call** — TS
spawns `python solve.py`, writes the JSON request to stdin, reads the JSON response from stdout. Zero
network surface, zero server lifecycle to manage in the demo, trivially deterministic and testable,
and it cannot "be down." The tradeoff is per-call Python/OR-Tools startup (~hundreds of ms) and no
persistent warm process for the dashboard to hit directly. **Pick FastAPI if the dashboard or MCP will
call the solver live; pick subprocess if the solver is only ever called from the TS clearinghouse.**
Given we want a visible, running "solver service" in the demo and possible dashboard hits, **FastAPI is
the primary; subprocess is the documented fallback if the service seam wobbles.**

gRPC is the right answer only if this later becomes a high-QPS multi-tenant solver farm or needs
streaming partial solutions — a post-hackathon concern.

---

## 5. Phased plan to July 6

Today is **Jul 2**. Deadline **Jul 6**. This follows the `IMPLEMENTATION-LOG.md` habit: dated phases,
each ending in a pointable artifact + a test, evidence-backed, no fabricated results. Phases C0–C1 are
prerequisites and are cheap; the solver port (C2) is the highest-risk item and is deliberately pulled
early with the TS Tier-2 as a standing fallback.

| Phase | Date | Goal | Pointable artifact | Test / evidence | Risk |
| --- | --- | --- | --- | --- | --- |
| **C0 — Harness + honesty** | Jul 2 | Fix `vitest.config.ts` aliases (add `clearinghouse`, `oracle` → `src`); fix root `typecheck` to include both packages; make `npm test` pass on a clean checkout with **no** prior build. | Clean `git clean -fdx && npm i && npm test` → 51/51. | The exact command above, captured. | Low. ~5 lines. |
| **C1 — Enforce what exists** | Jul 2–3 | Call `assertPreflight` in `submitGraph`; remove 2× budget fixture; fix bond decrement in preflight (`Σ bond ≤ B_p`); add global-quality floor to greedy/LNS + fix LNS repair to respect per-node floor; add the missing `MILP objective ≥ greedy+LNS objective` assertion. | Updated `clearinghouse.ts` + `preflight.ts` + `score.ts`; new tests. | A test proving a bad clearing is **rejected** by preflight; a test proving Tier-1 objective ≥ Tier-2 on the benchmark. | Low–Med. |
| **C2 — Python CP-SAT Tier-1** | Jul 3–4 | Stand up `solver/` (Python, OR-Tools CP-SAT) implementing full §5.4: assignment + precedence/makespan + budget + per-node & global quality + bond-capacity + risk ceiling; return allocation + schedule + LP-dual shadow prices. Wrap in **FastAPI + Pydantic**. TS `submitGraph` calls it; on any error, degrades to TS Tier-2. | `solver/app.py` + a TS solver-client; `submit_graph` cleared by CP-SAT end to end. | Golden-instance test: same DAG, Python vs TS Tier-2 bake-off, both feasible, CP-SAT objective ≥ TS; solver returns duals. | **High** — CP-SAT encoding of RCPSP + chance constraint; degrade path is the mitigation. |
| **C3 — Doc reconciliation** | Jul 4 | Update `ALGORITHMIC-SPEC.md` to reflect TS-orchestrator + Python-CP-SAT + TS-HiGHS-Tier-2 + FastAPI (it currently still says Python-only-FastAPI-*and*-the-code-is-TS — both halves stale); insert the **risk taxonomy** subsection (§6c below) into `ALGORITHMIC-SPEC.md` and `SOURCE-OF-TRUTH.md`; fix `SOURCE-OF-TRUTH.md` §8.1 stale spike/wallet status; add the six Design-Q&A rationales; retract/replace the false `ACTIVITY-LOG.md` L153 claim; resolve the missing `ENGINE-GUIDE.md` reference (`IMPLEMENTATION-LOG.md` L228). | Reconciled docs; one `IMPLEMENTATION-LOG.md` milestone entry. | Docs match code; `grep` for "OR-Tools"/"FastAPI"/"CP-SAT" consistent across docs. | Low. |
| **C4 — Bake-off + demo retarget** | Jul 5 | Demo beat 4 = **CP-SAT vs greedy+LNS**; relabel Monte-Carlo beat as experimental/optional; wire shadow-price (with quality) readout; gate `runMonteCarlo` out of the v1 public export. | Updated `demo/run-clearing.ts`; screenshot/recording. | `npm run demo` produces the narrated bake-off with duals. | Low–Med. |
| **C5 — Integrate with on-chain broker track** | Jul 5–6 | Reconcile the two parallel tracks: the engine (this branch) with the on-chain broker (`P0''` done, real tx hashes in `IMPLEMENTATION-LOG.md`). Ensure `submitGraph` → batch settlement path lines up with the settled per-task path. | One coherent story: broker (single node) is the clearinghouse's one-node case. | Existing core + engine tests both green in one run. | Med — track merge friction. |

**Highest-risk items (ranked):**
1. **C2 CP-SAT port** — the RCPSP + chance-constraint encoding in OR-Tools within a day. Mitigation:
   TS Tier-2 is always the fallback; ship the bake-off even if CP-SAT only matches (not beats) Tier-2.
2. **C5 track merge** — two people built in parallel; the branch has never been reconciled with the
   on-chain broker path. Mitigation: keep the solver a pure function; the seam is narrow.
3. **C0/C1 being skipped** — if we don't fix the harness first, C2's "it passes" is meaningless.

---

## 6. Design Q&A / rationale

> These answer the user's six refinement remarks in writing. Where a spec insertion is proposed, the
> **exact prose** and **insertion point** are given, but **the target files are NOT edited** — that is
> gated on approval (C3).

### (a) Is the bond worth it under nanopayments? (confidence: high)

**The strongest objection first, and it's correct:** a bond is an incentive only if losing it hurts.
`risk_premium` already encodes this — `computeRiskPremium` sets expected-unrecovered-loss to
`(1−p)·max(0, value − bond)` (`router.ts` L132–133), which is **zero when the bond covers the value**
and does nothing extra as the bond grows past `value`. So for a sub-USDC nanopayment node, a "bond"
that is a fraction of a fraction of a cent is economically **inert**: it neither deters a rational
underdeliverer (its expected slash is negligible) nor moves the router's score. Worse, a
mandatory-bond-everywhere rule adds on-chain escrow gas/latency to *every* trivial task — pure
overhead against `SOURCE-OF-TRUTH.md`'s own "mechanism overhead must be < trade value" rule (§4 L142).
Insisting on bonds at nanopayment scale is **cargo-culting skin-in-the-game**.

**But bonds are not the primary quality lever here — calibration is.** The moat is the Beta-Binomial
ledger + deterministic oracle: a provider that underdelivers gets `β++` (`calibration.ts` L85), its
`p̂` drops, and the EV router stops routing to it *regardless of any bond*. Reputation is the slow,
cheap, always-on deterrent; the bond is the fast, expensive, occasional one.

**Concrete stance — value-tiered bonding (mirror the existing value-tiered mechanism, §4 L143):**
- **Below a value threshold** (nanopayment tier): **skip or nominal bond**; rely on
  calibration + reputation + the always-verify deterministic oracle. Slashing a dust bond is theater.
- **Mid value:** **bond ∝ value** (the current `bondRatio·value`, score.ts L26–35), which the risk
  premium already prices.
- **High value / high confidentiality / high downstream impact:** **real bonds**, possibly
  `> value`, plus mandatory verification — here skin-in-the-game genuinely dominates reputation
  because a single defection can exceed all accrued reputation value.

This ties directly to the **verification policy** (`SOURCE-OF-TRUTH.md` §6.1.3): verify-vs-trust and
bond-vs-no-bond are the *same* decision surface — cheap, low-stakes, high-reputation work is
trusted-with-spot-check-and-no-bond; high-stakes or low-reputation work is always-verify-and-bonded.
The bond is a **tail-risk instrument**, not a per-task quality gate. **Recommendation:** make the
value threshold a config dial; default nanopayment tier to nominal bond; document that reputation is
the primary lever and the bond is the escalation.

### (b) MarketBench + Bayesian Calibration Ledger + Beta-Binomial (confidence: high)

**Plain English.** MarketBench (`context/papers/marketbench.md`) put 6 frontier LLMs on 93 real
SWE-bench tasks and asked each to predict *its own* chance of success and its *own* token cost, then
compared to what actually happened. The finding: agents are **badly miscalibrated** — pass rates
clustered at 75–81% while stated confidence ranged 61–93% (Gemini wildly overconfident, GPT-5-mini
underconfident), and token estimates were **~50× too low** (median est/actual ratio 0.02). Auctions
built on these self-reports leave enormous money on the table (GPT-5.2 realized $0.006/task vs a
$0.385 oracle). **Conclusion: never trust an agent's word about itself.** Trapeza's response is to
throw away self-reports for allocation and instead *learn* each provider's success rate from what it
actually delivered — a running scorecard updated only by verified outcomes.

**Technical / mathematical.** For each `(provider, capability)` we hold a **Beta(α, β)** posterior
over the true success probability `θ`. Each task is a **Bernoulli trial** (oracle pass = 1, fail = 0);
over many tasks that's a **Binomial**. Beta is the **conjugate prior** of the Bernoulli/Binomial:
if the prior is `Beta(α, β)` and we observe `s` successes and `f` failures, the posterior is
**`Beta(α + s, β + f)`** — same family, closed form. That is exactly the ledger update
(`calibration.ts` L84–85: `α += passed?1:0`, `β += passed?0:1`). Consequences we use:
- **Posterior mean** `p̂ = (α + s)/(α + β + s + f)` (`pSuccessMean`, L51–52) — the number the router
  trusts.
- **Posterior variance** `Var = αβ / ((α+β)²(α+β+1))` (`pSuccessVariance`, L60–65) — shrinks as
  observations accumulate; this is the *uncertainty* the risk premium charges for.
- **Conjugacy ⇒ O(1) online updates:** no refit, no stored history — just two integer increments.
  This is why it scales to a live nanopayment loop.
- **Cold-start via the prior:** default `Beta(1, 1)` (L28–29) is uniform on [0,1], mean 0.5 — a new
  provider is a coin flip until it earns a record. Crucially the prior is **not** seeded from the
  provider's own claim (L20–26), because that would leak a self-report into the allocation signal,
  which is the exact failure MarketBench documents.

**How it feeds the router.** `scoreCandidate` computes
`score = p̂·value − price − risk_premium` (`router.ts` L98), where with calibration ON `p̂` comes
from `calibratedEstimate` (L76–79) and the uncertainty term `stddev(p̂)·value` (L134) penalizes thin
ledgers. Flipping calibration OFF swaps `p̂` for the self-reported claim (L84) — the one-line switch
that reproduces MarketBench's lemons collapse on stage.

### (c) Risk factors beyond task-failure variance (confidence: high) — **proposed spec insertion**

The current model reduces risk to bond-at-risk × failure variance (`router.ts` L114–120,
`SOURCE-OF-TRUTH.md` §5.3 L237–239). That is one axis of several. The important additional factors:

1. **Data sensitivity / confidentiality** — trading signals, transactions, PII. A schema-valid answer
   that also leaks the input is a catastrophic "success." Enters as a per-node **sensitivity weight**
   on the risk term and, at high levels, as a **hard eligibility constraint** (only bonded/attested
   providers).
2. **Time sensitivity / deadline risk** — beyond the hard makespan constraint, *lateness* has convex
   cost near the deadline (a result that arrives at T+1 may be worthless). Enters as a **tardiness
   penalty** in the objective and/or a per-node latency-cap `λ_n^max` constraint.
3. **Correctness-verifiability risk** — how cheaply/deterministically an output can be checked. Low
   verifiability ⇒ higher residual risk even on "pass," ⇒ push toward bonding + reputation (ties to
   the verification policy). Enters as a per-capability **verifiability discount**.
4. **Provider correlation / systemic risk** — assigning many nodes to one provider (or correlated
   providers) concentrates failure. Enters as a **diversification/anti-concentration** term or a
   per-provider node cap.
5. **Dependency / cascade risk in the DAG** — one node failing poisons all downstream nodes on its
   paths. A node with many descendants carries more risk than its local variance implies. Enters as a
   **criticality weight** = (descendant value at risk) multiplying that node's risk term.
6. **Counterparty / settlement risk** — bond insufficiency, escrow revert, balance shortfall. Already
   partially handled by the settlement preflight twin; belongs as a hard feasibility check.
7. **Operational risk** — provider downtime, nonce/tx failures observed in the loop. Enters via a
   reliability multiplier learned alongside `p̂`.

**How they enter the math:** generalize the objective's risk term from a scalar to a weighted sum,
`risk_{n,p} = Σ_k w_k · risk^{(k)}_{n,p}`, where `w_k` are requester-set dials; add hard constraints
for confidentiality eligibility, latency caps, and anti-concentration; add a DAG-criticality
multiplier so bottleneck/high-fan-out nodes are treated as riskier.

**Proposed insertion — `ALGORITHMIC-SPEC.md`:** new subsection **`## 4.1 Risk factors beyond
task-failure variance`** placed **between the §4 CP-SAT flow diagram (ends L235) and §5 (L239)**.
Exact prose to insert:

> ### 4.1 Risk factors beyond task-failure variance
>
> The solver's `risk_premium` is not a single scalar. `risk_{n,p}` is a weighted sum of independent
> risk axes, each with a requester-tunable weight `w_k`:
> `risk_{n,p} = Σ_k w_k · risk^{(k)}_{n,p}`.
>
> 1. **Failure variance** — posterior uncertainty on `p̂` × exposed value (the v1 term).
> 2. **Data sensitivity** — confidentiality of the node's input (signals, transactions, PII); high
>    sensitivity also gates eligibility to bonded/attested providers (hard constraint).
> 3. **Time/deadline risk** — convex tardiness cost near the deadline, in addition to the hard
>    makespan constraint and per-node latency cap `λ_n^max`.
> 4. **Verifiability** — how cheaply/deterministically the output can be checked; low verifiability
>    raises residual risk and pushes toward bond + reputation (see verification policy).
> 5. **Provider correlation** — anti-concentration penalty / per-provider node cap to avoid
>    single-point-of-failure clearings.
> 6. **DAG cascade criticality** — a node's risk is scaled by the downstream value it poisons on
>    failure (descendant value at risk), so bottleneck/high-fan-out nodes are priced as riskier.
> 7. **Counterparty/settlement** — bond sufficiency and escrow solvency, enforced as hard feasibility
>    via the settlement-preflight twin.
>
> Only axes (1), (3-as-constraint), and (7-as-preflight) are active in v1; axes (2), (4), (5), (6) are
> defined here so the objective and constraint set are forward-compatible.

**Proposed insertion — `SOURCE-OF-TRUTH.md`:** new subsection **`### 5.3.1 The risk term, unpacked`**
placed **immediately after §5.3 (after L251, before §5.4 at L253)**. Exact prose:

> ### 5.3.1 The risk term, unpacked — beyond failure variance
>
> `risk_{n,p}` in §5.3 is a placeholder for a weighted sum of risk axes, not just bond-at-risk ×
> variance. The axes: (1) **failure variance** (v1); (2) **data sensitivity/confidentiality**
> (signals, transactions, PII) — also a hard eligibility gate at high sensitivity; (3) **time/deadline
> risk** — convex tardiness near the deadline on top of the hard makespan; (4) **verifiability** —
> low deterministic-checkability raises residual risk (couples to the §6 verification policy);
> (5) **provider correlation/systemic** — anti-concentration; (6) **DAG cascade criticality** — scale
> a node's risk by the downstream value it poisons on failure; (7) **counterparty/settlement** —
> handled as hard feasibility by the State-Twins preflight (§7). v1 activates (1), (3), (7); the rest
> are specified for forward-compatibility of the objective/constraints.

### (d) §5.5 "Why this beats per-task routing" — the crossover (confidence: high)

The clearinghouse is **not always the right tool, and saying so is a feature, not a weakness.** For a
single, easy, predictable task with one obvious provider, the global solve is pure overhead — that is
precisely the domain of the **Trapeza Core primitive**: the per-task EV router/broker
(`router.ts`), which is the clearinghouse's **one-node special case** (`SOURCE-OF-TRUTH.md` §2 L65,
§5 L189). No precedence, no shared budget, no cross-task coupling — the objective collapses to a single
argmax ranking (`route`, L172–202).

**The crossover.** The solver only earns its compute (and the Python round-trip) when there is
**cross-task coupling** that a per-node greedy decision cannot see:
- **Shared budget** — buy cheap-but-adequate on easy nodes to *afford* the premium bottleneck
  (the demo's budget-vs-bottleneck instance, `solver-benchmark.test.ts`).
- **Shared deadline/makespan** across a DAG with parallel/serial structure.
- **Global quality floor** requiring the *product* of per-node `p̂` to clear a bar (§5.4 L262).
- **Substitutable providers** with **capacity limits** (`k_p`, `B_p`) contended across nodes.
- **Dependencies** where a node's value is contingent on upstream success.

A greedy per-node router spends in topological order and can blow the budget on early easy nodes,
starving the bottleneck that decides success (exactly what `solveGreedyOnly` does when it throws on the
benchmark). **One-line rule to put in the spec/README:** *use the core broker for a single decoupled
task; escalate to the clearinghouse only when tasks share a budget, deadline, quality floor, or
contended providers — i.e., when the right choice for one node depends on the choices for the others.*

### (e) Deterministic Verification Oracle — schema-valid ≠ correct (confidence: high)

**The mechanism.** A **provider declares an interface/schema** for its output; the **requester agrees
to it as the contract**; the oracle (`schema-oracle.ts`) checks the delivered output against that
schema (AJV-2020) plus a field-level ground-truth diff (L57–97). Pass/fail is deterministic and
machine-checkable — which is what makes an on-chain bond slash **credible** (no LLM judge to bribe).

**The honest limitation.** **Schema-valid ≠ semantically correct.** AJV confirms the output has the
right *shape and types*; the ground-truth diff confirms specific fields match *known* answers. Neither
proves the answer is *right* in general — a provider can return a well-typed, wrong invoice total that
passes the schema and, absent ground truth for that field, passes the oracle. The oracle is a
**cheap, deterministic first gate**, not a correctness proof. The requester will, in most real
deployments, still **reconcile the returned values in its own system** (the whole point of delegation
is that the requester couldn't cheaply produce the answer, but it can often cheaply *check* it against
downstream effects).

**The core tension — provider must execute and return values.** The provider genuinely has to do the
work and return data; the requester pays for that. So: **what happens when the requester is
dissatisfied despite schema-valid output?** The escalation ladder (this is where the nuance belongs):
1. **Oracle pass with ground truth** → deterministic release/slash; no dispute possible. (v1 path.)
2. **Oracle pass, no ground truth, requester unsatisfied** → this is a **dispute**, not an oracle
   failure. Options: reputation hit (log a soft-fail into the ledger), **partial slash** under a
   pre-agreed policy, **re-run** with a different provider, or **escrow arbitration** for high-value
   nodes. This is exactly the **multi-tiered oversight** (`SOURCE-OF-TRUTH.md` §6.2: automated →
   adjudication → human) that the paper grounding calls for.
3. **The design guardrail** (`SOURCE-OF-TRUTH.md` §6.2, DeepMind "Intelligent AI Delegation"): *only
   delegate what you can verify; decompose until you can; use bond + reputation for the residual.*
   The oracle is the machine tier; the bond+reputation is the credential for what the oracle can't
   catch.

**Proposed spec note (small, no big change):** add a 3-line note to `SOURCE-OF-TRUTH.md` §6.1.1 (after
L291) stating: *"Schema validity + ground-truth diff is a deterministic gate, not a correctness proof;
where no ground truth exists, an unsatisfied requester enters the dispute ladder (reputation soft-fail
→ partial slash per policy → re-run → escrow arbitration), and high-residual-risk nodes should be
decomposed until oracle-checkable or escalated to bond + arbitration."*

### (f) OR-Tools constraint-optimization solver — the algorithm, pedagogically (confidence: high)

**What we're optimizing.** Pick, for every node in the task DAG, exactly one provider, and pick start
times, so that expected net value is maximized subject to the graph's global constraints.

- **Decision variables:** `x_{n,p} ∈ {0,1}` (assign provider `p` to node `n`) and `s_n ≥ 0` (start
  time of node `n`). In CP-SAT, `x` are `NewBoolVar`, `s` are `NewIntVar(0, deadline)`
  (`ALGORITHMIC-SPEC.md` §4 L149–158). Node duration is `dur_n = Σ_p x_{n,p}·λ̂_{n,p}` (L167–174).
- **Objective:** maximize `Σ_{n,p} x_{n,p}·(p̂_{n,p}·v_n − ĉ_{n,p} − ρ·risk_{n,p})` — calibrated
  expected value minus cost minus risk (`SOURCE-OF-TRUTH.md` §5.3 L228–240). Built on AEX's
  `max Σ[p·v − c]` but with **calibrated `p̂`** and graph terms.
- **Constraints:** assignment `Σ_p x_{n,p}=1`; budget `Σ (ĉ + bond)·x ≤ B`; precedence
  `s_v ≥ s_u + dur_u` for each edge; makespan `s_sink + dur_sink ≤ T`; per-node quality `p̂ ≥ q_n`;
  **global** quality as a **log-linearized chance constraint** `Σ log p̂ ≥ log q_min` (because the true
  end-to-end reliability is the *product* along paths, and `log` turns the product into a sum a linear
  solver can handle — `SOURCE-OF-TRUTH.md` §5.3 L246–251, §5.4 L262); bond capacity `Σ_n bond·x_{n,p}
  ≤ B_p`; concurrency `≤ k_p`; risk ceiling.
- **Why it's a MILP / CP-SAT problem:** binary assignment (integer) + linear objective/constraints =
  MILP; adding start-time scheduling with precedence over a DAG makes it a **Resource-Constrained
  Project Scheduling Problem (RCPSP)** layered on a **Generalized Assignment Problem** plus a **chance
  constraint** — NP-hard in general. CP-SAT is OR-Tools' constraint-programming-over-SAT engine, which
  handles exactly this mix (booleans + integer intervals + linear constraints) far more naturally than
  a pure LP/MILP tool, because it has first-class interval/no-overlap primitives for the scheduling
  part.
- **Why we don't need the global optimum:** at hackathon scale (6–10 nodes, a handful of providers)
  the instance is *trivial* — CP-SAT returns a proven optimum in milliseconds. Even if it didn't, a
  **good feasible** solution beats greedy; the thesis (§5.5) only needs "sees the whole graph," not
  "provably optimal." Hence the tiering: **CP-SAT (Tier-1, exact) + greedy-topo + LNS (Tier-2,
  heuristic degrade + bake-off opponent).**

**Contrast with the teammate's TS `milp.ts` / `score.ts`:**
- `milp.ts` (HiGHS) encodes **assignment + budget + quality only** (L79–156). It has **no `s_n`, no
  precedence, no makespan, no concurrency, no bond-capacity constraint** — scheduling is a *separate
  post-check* (`schedule.ts` + `clearinghouse.ts` L61–72) that can only *reject*, never *optimize
  around*, a deadline. So the TS solver cannot make the scheduling tradeoffs the RCPSP framing
  promises; it's a Generalized Assignment solver wearing an RCPSP's name.
- `score.ts` greedy+LNS is a legitimate Tier-2: topo-order greedy (L62–115) + 30-iteration
  destroy-repair LNS (L124–201). It is *not* large-neighborhood search over **schedules**, only over
  **assignments**, and its repair drops the quality floor (L165–177).
- **The fix (C2):** move Tier-1 to Python CP-SAT with the full constraint set + real interval
  scheduling + LP-dual shadow prices; keep the HiGHS/TS solver as the honest Tier-2, so the bake-off
  is CP-SAT-exact vs heuristic — the CoW-style "best clearing wins" story `SOURCE-OF-TRUTH.md` §4.3
  wants, now truthful.

---

## 7. Documentation reconciliation checklist (C3, gated on approval)

1. `vitest.config.ts` — add `@trapeza/clearinghouse`/`@trapeza/oracle` src aliases (fixes clean
   `npm test`).
2. `package.json` L15 — add `oracle` + `clearinghouse` to `typecheck`.
3. `ALGORITHMIC-SPEC.md` §1 — replace "Python-only-FastAPI / but-code-is-TS" contradiction with the
   ratified boundary: TS orchestrator/oracle + Python CP-SAT Tier-1 (FastAPI) + TS HiGHS Tier-2;
   fix §2 example `useDefaults:true` → `false` to match `schema-oracle.ts` L36; add §4.1 risk taxonomy.
4. `SOURCE-OF-TRUTH.md` — insert §5.3.1 risk taxonomy; add §6.1.1 oracle-dispute note; refresh §8.1
   stale spike/wallet status (spikes are done per `IMPLEMENTATION-LOG.md` P0'').
5. `ACTIVITY-LOG.md` L153 — retract the false "ALGORITHMIC-SPEC rewritten to TS-only" claim.
6. `IMPLEMENTATION-LOG.md` L228 — create `ENGINE-GUIDE.md` or remove the dangling reference; add a C0–C5
   milestone entry.
7. `graph.ts` L44 / `types.ts` L24 — extend `solver` union with `"cp_sat"`.

---

## 8. What NOT to do (guardrails)

- **Do not rewrite the engine in one shot.** It works; the fixes are surgical.
- **Do not port Tier-2 to Python.** The degrade path must survive the Python service being down.
- **Do not resurrect general open-ended quality evaluation** — the §6 scope line holds: deterministic
  oracle + reputation + verification policy; twin = settlement preflight; heavy MC deferred.
- **Do not let the Python solver touch keys, chain, or the ledger.** It is a pure function.
- **Do not adopt gRPC** unless a post-hackathon high-QPS/streaming requirement appears.
