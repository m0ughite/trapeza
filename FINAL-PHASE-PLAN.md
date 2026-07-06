# Trapeza — Final-Phase Plan (T-minus ~24h)

> **Status of this doc:** review + ruthlessly-prioritized final-day plan. **Plan only — nothing here is
> implemented.** Deadline **Jul 6** (tomorrow). Branch `feature/demo-dashboard`, clean tree at `6a41207`
> (= the consolidation commit; **no dashboard work exists yet**).
> Judging weights (`context/hackathon/lepton-hackathon-spec.md` §How We Judge): **30% agentic / 30%
> traction / 20% Circle tooling / 20% innovation**. Async judging; deliverables = **public repo** +
> **<3-min video** (required) + **live link** (encouraged).

---

## 0. The one-paragraph hard truth

The engine is genuinely strong and **everything green** (57 TS tests, 14 Python tests, typecheck clean,
demo runs all 6 beats, solver service healthy). The on-chain spikes are **real and proven** (ERC-8004
identity Agent ID 842573; Gateway deposit tx + x402 settlement, buyer balance debited 0.001 USDC). **But
the two halves have never touched.** `submitGraph` computes `settlementPricesUsdc` as `min(ask, reserve)`
**numbers only** — it never calls a `SettlementAdapter`, never touches Arc
(`packages/clearinghouse/src/clearinghouse.ts:159-176`). The adapters are imported **only** by their own
spike scripts and the core type-seams — grep confirms `adapter-arc`/`adapter-gateway` appear in zero
clearinghouse/demo/pipeline files. And **there is no dashboard, no MCP server, no seeded loop** — `apps/`
contains a single `README.md`. So the "end-to-end demo + dashboard" the user wants is **~0% built as a
product surface**, sitting on top of a ~90%-built engine and two proven-but-orphaned on-chain rails. The
entire final day is a **wiring + visualization** job, not an algorithm job. **Confidence: high** (grounded
in the runs and greps below).

---

## 1. Current-state table (evidence-grounded)

| Component | Status | Evidence |
| --- | --- | --- |
| `@trapeza/core` — calibration, EV router, pipeline, money, oracleVerify/settle seams | **Works** | `calibration/router/pipeline/money/router-value` suites green; `npm test` 57/57 |
| `@trapeza/oracle` — AJV schema + ground-truth diff | **Works** | `schema-oracle` (4) + `schemas` (2) green |
| `@trapeza/clearinghouse` — greedy+LNS, DAG, schedule, score, shadow prices | **Works (off-chain)** | `greedy-lns`, `schedule`, `shadow-prices`, `solver-benchmark` green |
| Twin preflight + Monte Carlo | **Works (off-chain)** | `twin-preflight` (9), `twin-montecarlo` (4) green; demo beats 5–6 |
| `solver/` Python CP-SAT Tier-1 + GLOP shadow + NumPy MC (FastAPI) | **Works** | `pytest -q` → **14 passed**; `curl :8000/health` → `{"status":"ok"}` |
| TS↔Python contract + degrade path | **Works** | `cpsat-integration` (6) green; degrades to Tier-2 when service down |
| CP-SAT-vs-greedy bake-off | **Works** | `npm run demo` beat 4: greedy `NO_PROVIDER`, CP-SAT clears obj **1.2849** |
| `adapter-arc` — ERC-8004 identity + reputation | **Works, PROVEN on-chain, but ORPHANED** | Agent ID 842573; 2 real tx (IMPLEMENTATION-LOG P0'') |
| `adapter-arc` — bonded escrow (`openEscrow`/`resolveEscrow`) | **Missing** | IMPLEMENTATION-LOG "Open items" #1 (TODO, not built) |
| `adapter-gateway` — deposit + x402 verify/settle | **Works, PROVEN on-chain, but ORPHANED** | deposit tx `0xb64a…`; buyer balance −0.001; `GatewaySettlementAdapter.pay/deposit` |
| On-chain settlement wired into a cleared allocation | **Missing (the headline gap)** | `clearinghouse.ts:159-176` computes prices only; no adapter call anywhere |
| Batch-flush → real settlement tx surfaced | **Missing** | only Gateway settlement **UUID** returned, not an EVM tx (IMPLEMENTATION-LOG P0'') |
| **Dashboard / web UI** | **Missing (explicit user ask)** | `apps/` = README only |
| **MCP server** (`submit_task`/`submit_graph`) | **Missing** | `apps/README.md` "planned P4"; not built |
| **Seeded requester/provider loop** (traction) | **Missing** | `apps/README.md` "planned P4"; not built |
| Demo script / video | **Missing** | required deliverable |

**Read-only assessment actually run for this review** (Sun 19:58):
`npm test` → 57 passed (15 files) · `npm run typecheck` → exit 0 · `npm run solver:test` → 14 passed ·
`npm run demo` → all 6 beats · `lsof -i :8000` → stray but **healthy** uvicorn (PID 26783).

---

## 2. The central question: gap to a judge-ready, tangible end-to-end demo + dashboard

Four gaps, ordered by judge-impact. Confidence noted per item.

### Gap 1 — Dashboard (the user's explicit ask; **highest ROI**). Confidence: high.
The engine already produces every number a great dashboard needs; it's just trapped in console tables. A
dashboard is the single highest-leverage move because it **converts already-built, currently-invisible
work into visible points across all four axes at once**: it shows the agent *deciding* (agentic), the
Circle settlement links (Circle), the calibration moat + bake-off + shadow prices + twin (innovation),
and the volume/latency metrics (traction). Without it there is no "tangible product link," and the repo-only
submission undersells a strong engine.

### Gap 2 — On-chain integration (the "end-to-end" gap; **second-highest**). Confidence: high.
Right now the demo is a **simulation with real-looking numbers**. The spikes prove the rails work in
isolation; nothing drives them from a clearing. The minimal real wiring: after `submitGraph` clears, drive
**at least one real settled nanopayment per cleared node** through the **already-proven** buyer→x402-seller
path, and surface the deposit tx + settlement id (+ the ERC-8004 identity/reputation tx) in the dashboard.
This is the difference between "we built a solver" and "an agent solved *and paid* on Arc." **Because the
spikes are already proven, this gap has a bulletproof fallback** (show the existing real tx hashes as
labeled receipts) — so it is high-value *and* low-risk-to-ship-something.

### Gap 3 — MCP server + seeded loop (traction). Confidence: moderate → **cut-line**.
Traction is the structurally hardest axis in <24h: real external users are not realistically winnable
overnight. A thin MCP tool (one function wrapping `submitGraph`) is cheap and buys an "any agent hires the
market in one line" line; a seeded loop that runs N graphs generating **real self-volume** feeds the
dashboard's volume counter. **Both are below the demo/video on the priority list** — do them only if the
critical path is done with time to spare. Do **not** chase external users at the cost of the video.

### Gap 4 — Narrative / demo video (required). Confidence: high.
Non-negotiable deliverable. The <3-min script already exists in prose (SOURCE-OF-TRUTH §10); it needs to be
mapped shot-by-shot onto the dashboard and the four axes, then recorded. This is late in the sequence but
must not be squeezed to zero.

---

## 3. Prioritized TODO — ordered by judge-impact-per-hour

Each item: **what · why (judge axis) · effort · deps**.

1. **Engine → JSON driver.** Extend `demo/run-clearing.ts` (or add `demo/emit-run.ts`) to write a
   structured `dashboard/public/demo-run.json` (DAG, allocations+scores, schedule, settlement prices,
   shadow prices, bake-off CP-SAT-vs-greedy, calibration ON/OFF divergence, MC risk, meta).
   *Why:* decouples the UI from live Node/Python at record time — bulletproofs the demo. *Effort:* 1–1.5h.
   *Deps:* solver service up (for CP-SAT numbers).
2. **Dashboard app (Vite + React + TS).** Single-page app reading the JSON; 6 panels (spec in §5).
   *Why:* the user's explicit ask; visible points across all four axes. *Effort:* 5–7h. *Deps:* item 1.
3. **One real on-chain settlement per cleared node.** Drive the proven buyer→x402-seller path from the
   cleared allocation; emit `dashboard/public/onchain-receipts.json` (deposit tx, settlement ids, ERC-8004
   identity/reputation tx). *Why:* Circle (20%) + turns "sim" into "end-to-end"; the tangibility win.
   *Effort:* 1.5–2.5h **hard-timeboxed**. *Deps:* funded wallets (present), local x402 seller from the spike.
4. **On-chain panel in the dashboard.** Render `onchain-receipts.json` with live arcscan links per node.
   *Why:* makes gap-2 legible; Circle + traction. *Effort:* 1h. *Deps:* items 2, 3 (or fallback to the
   already-proven spike hashes).
5. **Demo dry-run + freeze + screenshots.** Run the whole thing end-to-end, capture stills. *Why:* de-risks
   recording. *Effort:* 1h. *Deps:* items 2–4.
6. **<3-min video mapped to the 4 axes.** *Why:* required deliverable. *Effort:* 2h. *Deps:* item 5.
7. **Submission: README "run it" + live link + form.** *Why:* required; judges read the repo. *Effort:*
   0.5–1h. *Deps:* item 6.
8. **(Stretch) Thin MCP server** — one `submit_graph` tool over stdio. *Why:* agentic/traction line.
   *Effort:* 1.5h. *Deps:* none. **Cut first.**
9. **(Stretch) Seeded loop** — script runs K graphs, accumulates real testnet volume for the counter.
   *Why:* traction. *Effort:* 1.5h. *Deps:* item 3. **Cut second (after MCP).**

---

## 4. Critical path & cut-lines

**Critical path (must-ship for "tangible end-to-end demo + dashboard"):**
`1 (JSON driver) → 2 (dashboard) → 3 (one real settlement) → 4 (on-chain panel) → 5 (freeze) → 6 (video) → 7 (submit)`.

**Always-shippable floor:** the repo *today* is already a valid submission (green tests, working CLI demo,
two proven on-chain spikes, deep docs). Everything below only raises the ceiling — so there is never a
"nothing to submit" state.

**Cut-lines, in the exact order to drop under time pressure:**
1. Drop **seeded loop** (item 9). Volume counter shows the runs you did by hand.
2. Drop **MCP server** (item 8).
3. Drop **batch-flush real-tx surfacing**; keep the Gateway settlement UUID + deposit tx (honestly labeled).
4. Drop **multi-node** on-chain; settle **one** cleared node live.
5. Drop **live wiring entirely** (item 3); the on-chain panel shows the **already-proven spike tx hashes**
   as labeled receipts (`0xb64a…` deposit, Agent ID 842573, the two ERC-8004 tx). Still a real-Arc story.
6. Drop dashboard panels from the bottom of §5 (traction strip → MC → shadow prices), never the top three.
7. Absolute floor: record the video over the **existing CLI demo** + arcscan links. Still a complete submission.

**Rule:** never let items 6–7 (video + submit) get squeezed to zero. A brilliant un-recorded demo scores nothing.

---

## 5. Dashboard spec (concrete)

**Stack:** **Vite + React + TypeScript** (single SPA). Rationale: no SSR/routing/auth needed; fastest cold
start and iteration; can import `@trapeza/core` types directly. **Reject Next.js** — its SSR/app-router
overhead buys nothing here and costs setup time. Charts: lightweight (`recharts` or hand-rolled SVG bars);
DAG: `@xyflow/react` (React Flow) if time allows, else a static SVG/dagre layout. **No backend required.**

**Data architecture (bulletproof for recording):** the dashboard reads two static JSON files emitted by an
offline driver — `demo-run.json` (engine output) and `onchain-receipts.json` (tx hashes). This means the
recorded demo has **zero live dependency** on Node/Python/RPC. *Optional* stretch: a tiny Fastify `/api/run`
that re-runs a clearing for a "live" button — but the snapshot path is the default and the safety net.

**Views (top = highest priority; cut from the bottom):**
1. **Clearing view** — the task DAG with each node labeled `provider · score`; the chosen allocation
   highlighted. *(agentic + innovation)*
2. **Bake-off (the money shot)** — CP-SAT vs greedy+LNS side-by-side: greedy `NO_PROVIDER` / busts budget vs
   CP-SAT clears (obj 1.2849). One glance = "the global solver beats greedy." *(innovation + agentic)*
3. **Calibration ON/OFF (the moat)** — bars of claimed-p vs calibrated-p per provider; a toggle that flips
   the allocation and shows the lemons-collapse vs quality-re-emerge. *Same market, one flag.* *(innovation + agentic)*
4. **On-chain settlement** — per cleared node: settlement price + **live arcscan links** (deposit tx,
   x402 settlement id, ERC-8004 identity/reputation). *(Circle + traction)*
5. **Shadow prices** — budget dual + capacity/deadline duals as "why the bottleneck clears at a premium." *(innovation)*
6. **Twin Monte Carlo** — failure / deadline-breach / budget-overrun probabilities on the cleared plan;
   "think before you pay." *(innovation)*
7. **Traction strip** — cumulative testnet-USDC volume, result-per-USDC, result-per-second, settlement
   latency, payment-chain depth, graph density (RFB-3's named metrics). *(traction)*

**Data sources per view:** all of 1–3, 5–7 come from `demo-run.json` (extend the existing demo computations,
which already produce every field); view 4 comes from `onchain-receipts.json`.

---

## 6. Hour-by-hour sequencing (~24h) with demo-freeze

Assume start ~Sun 20:00, deadline Mon evening. **Demo freeze ~Mon 14:00** to leave a hard 4–6h buffer for
record + submit + contingency. Adjust to the real submission cutoff time (confirm it).

| Block | Window (approx) | Work | Exit artifact |
| --- | --- | --- | --- |
| B0 | 20:00–21:00 | Lock solver lifecycle (kill stray uvicorn; `caffeinate` the machine); build the **JSON driver** (item 1) | `demo-run.json` validates |
| B1 | 21:00–23:00 | **On-chain wiring** (item 3), hard-timeboxed 90min; else fall to cut-line 5 | `onchain-receipts.json` (real or proven-spike) |
| B2 | 23:00–02:00 | Scaffold **Vite app**; build views 1–3 (clearing, bake-off, calibration toggle) | top-3 panels render from JSON |
| — | 02:00–08:00 | **Sleep** (caffeinate running; nothing long-running depends on the laptop staying awake) | — |
| B3 | 08:00–11:00 | Views 4–6 (on-chain, shadow prices, twin MC) + polish | full dashboard renders |
| B4 | 11:00–12:30 | View 7 (traction strip) + visual polish; **(stretch)** thin MCP / seeded loop if ahead | dashboard demo-ready |
| B5 | 12:30–14:00 | **Demo dry-run + FREEZE**; screenshots; write the shot list | frozen build + stills |
| B6 | 14:00–16:00 | **Record <3-min video** mapped to the 4 axes | video uploaded |
| B7 | 16:00–17:00 | README "run it" + live link + **submit the form** | submission in |
| B8 | 17:00–deadline | Contingency / re-submit (submit early + often is allowed) | buffer |

---

## 7. Biggest risks & mitigations

1. **On-chain wiring overruns and eats the day.** *Mitigation:* hard 90-min timebox (B1); the moment it
   slips, invoke cut-line 5 and display the **already-proven** spike tx hashes. There is always a real-Arc
   story. **Confidence this protects the ship: high.**
2. **Laptop sleep kills long runs / the solver service.** *Mitigation:* run `caffeinate -dimsu` for the
   duration; the JSON-snapshot architecture means the *recorded* demo depends on **no** live service, so a
   mid-night sleep costs nothing. Keep every run short (the demo is sub-2s).
3. **Solver service lifecycle** (a stray uvicorn is already on :8000; PID 26783). *Mitigation:* kill/restart
   deterministically before emitting `demo-run.json` so the CP-SAT bake-off numbers are the Python ones (the
   engine *degrades* to TS Tier-2 silently — you don't want the money-shot panel quietly showing the
   stand-in). Verify `curl :8000/health` before each JSON emit.
4. **Dashboard scope creep.** *Mitigation:* JSON-snapshot + no backend; cut panels from the bottom of §5;
   React Flow is optional (static SVG DAG is fine).
5. **Traction is structurally weak in 24h.** *Mitigation:* accept it. Show real self-volume + honest labels;
   do **not** burn the critical path chasing external users. Spend the 30% traction budget on *legibility*
   (the traction strip) rather than on manufacturing users overnight.
6. **Overclaiming the settlement** (the repo's own stated honesty rule). *Mitigation:* keep the
   IMPLEMENTATION-LOG discipline — a Gateway settlement **UUID is not an EVM tx**; label the deposit tx as
   the on-chain event and the batch transfer as pending-flush. Judges reward the honesty; a fabricated
   `/tx/` link is a credibility death.

---

## 8. Independent verdict (not a mirror of the existing docs)

- The docs' P4/P5/P6 (MCP → clearinghouse → dashboard → external traction) sequencing is **stale for a
  24h window**. The clearinghouse is already done, so P4 collapses; P6 external traction is not winnable
  overnight and should be **demoted below the video**. The real order is **visualize + wire on-chain +
  record** — nothing else.
- The single biggest lie the current build tells is *"end-to-end."* It is not end-to-end; it is a superb
  off-chain engine plus two orphaned on-chain proofs. **Closing that with even one real settled node is
  worth more than any new algorithm.**
- The dashboard is correctly the user's instinct: it is the highest points-per-hour move because the engine
  has already done the expensive work and is getting **zero visible credit** for it.
- Do not build escrow/slash on-chain in 24h (it's unbuilt, and `RefundProtocol.sol` forking is a rabbit
  hole). Show the slash **in the off-chain engine** (the oracle already does it) and settle the *releases*
  on-chain. That's the honest, shippable line.
