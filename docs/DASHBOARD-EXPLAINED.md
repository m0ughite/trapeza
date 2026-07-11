# Dashboard, explained

What every panel of the Trapeza dashboard means, and — precisely — where each
number comes from (real offline engine output vs. live in-browser preview vs.
real on-chain receipts). Written to be read top-to-bottom by someone who has
never seen the codebase.

All figures below are the **real engine output** baked into
`apps/dashboard/src/fixtures/*.json`, re-emitted from the CP-SAT Tier-1 solver
on 2026-07-10. They are stable and reproducible offline.

---

## 1. The three data sources (this is the whole trick)

The dashboard has **zero backend at runtime**. Everything you see is one of
three kinds of data, and it matters which is which:

| Source | What it is | Produced by | Real engine? | Live? |
| --- | --- | --- | --- | --- |
| **Historical fixtures** | The six scenario runs the dropdown switches between | `demo/emit-run.ts` → `demo/run-scenario.ts`, offline | **Yes — real CP-SAT Tier-1** (Python OR-Tools) when the solver is up, else TS Tier-2 fallback | No — replayed verbatim from JSON |
| **On-chain receipts** | The settlement panel (Agent identity + per-node USDC receipts) | `demo/emit-onchain.ts`, offline | Real Arc-testnet transactions (or clearly-labeled proven-prior fallback) | No — replayed from JSON |
| **"Run your own"** | The interactive clearing at the bottom | `apps/dashboard/src/lib/liveEngine.ts` (browser) or `apps/dashboard/api/run.ts` (Vercel serverless) | **Tier-2 only** — a portable greedy solver, never CP-SAT | **Yes — computed on the spot** |

### How the historical "e2e" runs actually work

1. `demo/scenario-registry.ts` defines the six scenarios (graph + providers +
   expectations). The provider/graph primitives live in `demo/data.ts` and the
   concrete workflows in `demo/scenarios.ts`.
2. `npm run demo:emit` runs `demo/emit-run.ts`, which calls `computeRun()` in
   `demo/run-scenario.ts` for each scenario. That function drives the **real
   engine** end-to-end:
   - It calls the clearinghouse (`createClearinghouse(...).submitGraph(...)`),
     which prefers **CP-SAT Tier-1** (the Python OR-Tools service on
     `127.0.0.1:8000`) and degrades to the **TS Tier-2** greedy+LNS solver only
     if the service is down.
   - It computes the bake-off (greedy vs. CP-SAT), the calibration ON/OFF
     contrast, the shadow prices, and the State-Twins Monte-Carlo risk preflight
     (500 iterations, run through the same Python service).
   - It writes `apps/dashboard/src/fixtures/<runId>.json`.
   - `meta.headlineSolver` records which solver actually ran. In the current
     fixtures it is **`cp_sat` for all six** — i.e. real Tier-1 output, not
     degraded.
3. The dashboard imports those JSON files directly (`src/fixtures/index.ts`) and
   replays them. Switching the **Scenario** dropdown just swaps which fixture
   drives every panel.

So "historical run" = a real solver run frozen to disk. It is not faked and not
recomputed in the browser. The only browser-side computation is section 08.

### How "Run your own" differs

`liveEngine.ts` is a deliberately smaller, dependency-free **greedy Tier-2**
solver so it can run in the browser or on Vercel (OR-Tools/CP-SAT cannot). It
optimizes the same economic signal — `p̂·value − cost − risk` per step under the
shared budget — but it is a *preview*, not the exact optimizer. The exact
whole-graph (CP-SAT) result and the real on-chain receipts live in the
historical scenarios. This is stated in the panel's own copy.

### How the on-chain receipts work

`demo/emit-onchain.ts` loads the cleared allocation of the **invoice-processing**
fixture and settles each node in USDC over the Circle Gateway / x402 path on Arc
testnet. If live keys are present it writes real per-node receipts; otherwise it
writes clearly-labeled proven-prior receipts (from an earlier confirmed spike).
It **never fabricates a tx hash** and never renders a Gateway batch UUID as a
`/tx/` link. The bundled `onchain-receipts.json` is currently in `live` mode with
six real per-node settlements plus the ERC-8004 identity/reputation writes.

---

## 2. The eight sections

The left sidebar is the map. Numbers refer to the currently-selected scenario.

**01 · Overview.** The pitch, four headline stats (steps cleared, USDC cleared,
real end-to-end success with calibration ON, settlement makespan), and the
scenario picker. Everything here is read straight from the selected fixture.

**02 · Clearing ("The cleared workflow").** The task graph (DAG) with the hired
provider on each node and the bottleneck highlighted. `plan score` is the
objective value `Σ (p̂·value − cost − risk)`. "What each step pays" is the
settlement price per node (settles at the lower of ask and reserve). A callout
shows the same plan rejected under an under-funded buyer (preflight is enforced,
not advisory). Includes a step-by-step engine trace.

**03 · Clearing vs. Greedy (the bake-off).** The same workflow solved two ways:
the **greedy per-task router** (Tier-2, decides each step blind) vs. the
**whole-graph clearing** (CP-SAT). Each card shows the plan score and the
per-step picks. See §3 below for exactly what these numbers mean and why they
often tie.

**04 · Calibration Ledger.** The heart of the thesis. Each provider shows what it
*claims* vs. what it has *delivered* (a Bayesian posterior over its verified
outcome ledger). Toggle **ON/OFF**:
- **ON** prices on realized outcomes → hires the honest workhorses.
- **OFF** trusts self-reported claims → hires the confident braggarts.
The headline is **realized end-to-end success** (product of the *actual* success
probabilities of the hired providers) and the **success lift** = ON − OFF.
Because success multiplies along the chain, one bad link poisons the whole
workflow, so the OFF number often collapses toward zero.

**05 · Bottlenecks (shadow prices).** The dual values from the LP relaxation:
how much one more dollar of budget (or one more unit of any constrained
resource) would be worth in plan value. A **non-zero** shadow price means that
constraint is *binding*. In the current scenarios only **data-reconciliation**
has a binding constraint (**budget = 1.15**); the others are loosely constrained,
so every shadow price is 0.00. (This is honest, but see §4 — the
research-report narrative oversells this panel.)

**06 · Risk Preflight (State-Twins Monte-Carlo).** The cleared plan is simulated
500 times to estimate the probability it fails, misses the deadline, or overruns
the budget — before any money moves. `failure probability` is the headline.

**07 · Settlement (on-chain).** Agent identity (ERC-8004 register + reputation,
linkable tx hashes) and the per-node USDC settlement receipts on Arc testnet.
Real `0x…64-hex` hashes link to arcscan; Gateway batch UUIDs are labeled and
never linked.

**08 · Run Your Own.** The interactive Tier-2 preview described above, plus a
"what the market moved" traction strip.

---

## 3. Why the bake-off "always shows the same score" — root cause

**Finding: legitimate ties on loosely-constrained graphs, plus one real
greedy-bust. Not a display bug, not a solver bug.** (Confidence: high.)

The objective is **fully separable**: `objectiveFromAssignments` (in
`packages/clearinghouse/src/score.ts`) is just the *sum of per-node scores*, and
each node's score `p̂·value − price − risk` depends only on that node's provider.
The only things that couple the nodes are the **global/per-node budget, the
deadline, quality floors, and bond limits**.

Consequences:
- When none of those coupling constraints binds, the greedy per-node argmax
  **is** the global optimum. Greedy and CP-SAT return the *same allocation and
  the same objective* (CP-SAT's number is merely rounded to 6 dp on the Python
  side; greedy carries full float precision — same value).
- The one scenario with a genuinely tight budget (**data-reconciliation**,
  global budget $1.00) is where greedy busts: it spends in topological order,
  overpays on `extract`, and can't afford `reconcile` → `NO_PROVIDER`. CP-SAT
  reserves budget for the bottleneck and clears at 1.5375. This is the real
  contrast — and note it is *also* the only scenario with a non-zero shadow
  price (budget = 1.15). The two facts corroborate each other.

Actual per-scenario numbers (re-emitted, CP-SAT Tier-1):

| Scenario | greedy | CP-SAT (optimal) | Verdict |
| --- | --- | --- | --- |
| invoice-processing | 1.9443 | 1.9443 | tie (loose) |
| research-report | 1.7780 | 1.7780 | tie (loose) |
| **data-reconciliation** | **BUSTS (no feasible plan)** | **1.5375** | **CP-SAT wins — the money shot** |
| support-triage | 1.4124 | 1.4124 | tie (loose) |
| code-pr-pipeline | 1.5741 | 1.5741 | tie (loose) |
| rag-qa | 1.9480 | 1.9480 | tie (loose) |

The dashboard is *correct* to show equal numbers here. The panel renders
`greedy.objectiveValue` and `optimal.objectiveValue` independently — there is no
"one number shown for both." The display path is clean.

Cosmetic caveat (for the UI follow-up, not fixed here): on a tie the panel still
badges CP-SAT the "winner" and the generated narrative calls greedy's number an
"infeasible upper bound." When the numbers are equal, greedy's plan is in fact
feasible and identical, so that wording is misleading. This is copy, not an
algorithm defect.

---

## 4. Full per-scenario number analysis

Re-emitted from CP-SAT Tier-1 on 2026-07-10. `lift` = realized end-to-end
success ON − OFF. `twinFail` = Monte-Carlo failure probability (500 iters).

| Scenario | obj | greedy vs CP-SAT | ON realized | OFF realized | lift | cleared USDC | binding shadow | twinFail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| invoice-processing | 1.9443 | tie | 0.4126 | 0.0002 | **+0.4124** | 2.01 | none | 0.568 |
| research-report | 1.7780 | tie | 0.2916 | 0.0000 | **+0.2916** | 2.80 | none | 0.708 |
| data-reconciliation | 1.5375 | **greedy busts** | 0.4950 | 0.4950 | 0.0000 | 0.65 | **budget 1.15** | 0.766 |
| support-triage | 1.4124 | tie | 0.4840 | 0.0268 | **+0.4572** | 1.54 | none | 0.510 |
| code-pr-pipeline | 1.5741 | tie | 0.6830 | 0.0249 | **+0.6581** | 1.65 | none | 0.300 |
| rag-qa (fixed) | 1.9480 | tie | 0.5324 | 0.0002 | **+0.5322** | 1.43 | none | 0.418 |

Read-out per scenario:

- **invoice-processing** — Calibration demo. ON hires workhorses
  (sonnet-parser, sonnet-extractor, ledger-reconciler, …) → realized 0.41; OFF
  hires braggarts (budget-ocr, flash-extractor, quick-reconciler, skip-check) →
  realized 0.0002 (six ~15% links multiply to near-zero). Lift +0.41. Correct,
  plausible. This is also the scenario the on-chain receipts settle.
- **research-report** — Dense 8-node DAG, tight 10 s twin deadline. ON 0.29 vs
  OFF ~0. Scheduling holds. **Flag:** its `proves` string advertises a
  shadow-price readout, but the graph is loose enough that every shadow price is
  0.00 — the Bottlenecks panel shows nothing for this scenario. See §5.
- **data-reconciliation** — The bake-off / budget money-shot. Greedy busts,
  CP-SAT clears at 1.5375, budget shadow price 1.15. Calibration is intentionally
  off for this scenario (`solverUseCalibration: false`), so ON == OFF (lift 0) —
  by design; its story is budget, not calibration.
- **support-triage** — Fan-out/fan-in, tight 8 s deadline, risk-aversion 2. ON
  0.48 vs OFF 0.03, lift +0.46. Two nodes diverge (kb-lookup, draft). Correct.
- **code-pr-pipeline** — Per-step quality floors (0.6). The cheap braggarts are
  below the floor on their realized record, so ON hires the pricier reliable
  providers. Largest lift (+0.66). Correct.
- **rag-qa (FIXED)** — See §5. Was inverted (lift −0.768); now +0.532.

Nothing else looks wrong or implausible after the fix.

---

## 5. The rag-qa fix (Part B1)

**Symptom.** rag-qa showed calibration ON ≈ 14.5% success, *worse* than OFF
≈ 91.3% (lift −0.768) — the exact opposite of the product thesis.

**Root cause.** rag-qa built its providers with `makeUncalibratedProvider`
(zero track record). In `demo/run-scenario.ts`, `realizedPHat()` falls back to
`claimedSuccessProb` when a provider has no observations. So: calibration ON
priced everyone at the neutral 0.5 prior and picked the *cheaper* provider at
each step (which happened to be the honest low-claimers); OFF trusted the loud
braggarts. Then "realized" end-to-end success was computed from each chosen
provider's **claimed** probability — so the braggart-heavy OFF plan
*mechanically* scored higher. The scenario had no ground-truth outcomes to
distinguish claim from reality.

**Fix (approved).** Convert the ten rag providers from
`makeUncalibratedProvider` to `makeProvider` + `trackRecord`, mirroring the other
five scenarios: each capability now pairs an honest **workhorse** (modest claim,
~18–19/20 realized) with a confident **braggart** (near-perfect claim, ~2–4/20
realized). Kept the same prices, claims, latencies, and the genuine RAG workflow
(chunk → index → retrieve → answer → grounding-check). Updated the scenario
narrative/`proves`/tags away from the stale "cold-start" framing, and added
`expect.minSuccessLift` so the harness locks in a positive lift. Re-emitted from
the real engine — never hand-edited the fixture.

**Result.**

| | realized end-to-end | claimed | lift |
| --- | --- | --- | --- |
| **Before** — ON | 0.1452 | 0.1452 | **−0.7678** |
| **Before** — OFF | 0.9130 | 0.9130 | |
| **After** — ON | **0.5324** | 0.1452 | **+0.5322** |
| **After** — OFF | **0.0002** | 0.9130 | |

ON now hires splitter / embed-small / bm25-retriever / grounded-answerer /
citation-checker; OFF hires megachunk / embed-xl / vector-retriever /
confident-answerer (a hallucinator) / vibe-checker. `headlineSolver` is `cp_sat`.

**Other fixes (Part B2).** None required. The bake-off is not a bug (§3), and the
data-reconciliation money-shot already shows the greedy-vs-CP-SAT contrast, so no
scenario was tightened (fabricating a tighter budget elsewhere was explicitly
avoided). One item is *flagged, not fixed*: research-report's `proves` string
promises a shadow-price readout the loose graph never delivers (all duals 0.00).
Fixing that would mean tightening its budget and re-emitting — a scenario-design
change left for a follow-up to avoid scope creep, since it is a correct result,
not a defect.
