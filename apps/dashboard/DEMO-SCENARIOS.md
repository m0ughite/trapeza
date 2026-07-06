# Trapeza — Demo Scenarios

Scenario-based walkthroughs for presenting or testing the dashboard. Each one is
a short story with the exact clicks, what the viewer should see, and the point it
proves. All numbers below are the real engine output baked into the bundled
fixtures (`src/fixtures/*.json`), so they are stable and reproducible offline.

**Setup (30 seconds).** From the repo root:

```bash
npm run dev --workspace @trapeza/dashboard   # http://127.0.0.1:5173
```

The left sidebar is the map: **Scenarios (explorer) → Overview → Clearing → Run trace →
Solver bake-off → Calibration ledger → Bottleneck prices → Risk preflight →
On-chain settlement → Run your own.** The **Scenario Explorer** at the top (or the
top-bar dropdown) switches the workflow driving every section. Nothing requires a
backend, a wallet, or network access.

The one-line pitch to open with:

> *You hand Trapeza a whole workflow and a budget. It scores every provider on
> what it actually delivered, solves the entire task graph at once instead of
> picking each step blind, dry-runs the plan for risk, and settles in USDC on
> Arc — with honest receipts.*

---

## The three differentiators, one scenario each

| Scenario | Proves | Headline number |
| --- | --- | --- |
| **Budget bottleneck** | Graph clearing beats per-task routing | Greedy → *no feasible plan*; whole-graph clears at **1.2849** |
| **Invoice workflow** | Calibration is the moat | Real success **37.2% (ON)** vs **0.003% (OFF)** — same market, one switch |
| **Research pipeline** | It scales to a real critical path | 8 steps cleared under a 3 s deadline; **+24.9%** success from calibration |

Run them in that order for a cold audience: the bake-off is the fastest "aha",
calibration is the deepest, research shows it isn't a toy.

---

## Scenario 1 — Budget bottleneck (the bake-off money shot)

**The story.** A two-step job: make a logo, then write code that depends on it.
The shared budget is a tight **$1.00**. A per-task router pays for the logo first
with no idea what's coming — and can't afford the code step. The whole-graph
clearing sees both steps at once and deliberately buys cheap-but-adequate on the
logo to keep enough for the code.

**Clicks.**

1. Top bar → **Scenario → "Budget bottleneck (greedy busts)."**
2. Sidebar → **Solver bake-off.**

**What the viewer should see.**

- **Greedy per-task router → "no feasible plan"** in red, badged **busts**.
- **Whole-graph clearing → 1.2849**, badged **winner**, with the plan:
  `logo → cheap-logo`, `code → mid-code`.
- The plain-language note: *greedy spends the budget in workflow order, overpays
  on the easy node, and cannot afford the bottleneck; the graph-aware clearing
  reserves budget for the bottleneck, so it clears where greedy busts.*

**Follow-on (optional).**

- Sidebar → **Bottleneck prices.** This is the one scenario where a constraint
  binds: **"Budget — value of one more dollar" = 1.15.** That's the market telling
  you an extra dollar here would return $1.15 of plan value — which is *why* the
  bottleneck step is worth paying up for.
- Sidebar → **Clearing** to see the same result on the DAG: two boxes, the
  bottleneck (`code`) drawn with a dashed amber border.

**The point it proves.** *Picking each task greedily is a special case that
breaks the moment steps share a budget. Solving the graph is the product.*

---

## Scenario 2 — Invoice workflow (the calibration reveal)

**The story.** A six-step invoice pipeline (extract → reconcile → fact-check →
format). Every capability has two providers: a **braggart** that claims a
97–99% success rate but has delivered ~15%, and a quieter **workhorse** that
claims ~65–70% but has delivered ~85%. Believe the sales pitch and you buy the
liars; score the track record and you hire the performers.

**Clicks.**

1. Top bar → **Scenario → "Invoice workflow (6-node DAG)."**
2. Sidebar → **Calibration ledger.**
3. Toggle the segmented control **Calibration OFF ↔ Calibration ON** (top-right
   of the card).

**What the viewer should see.**

- The provider table: **claims** (amber bars) vs **delivers** (mint bars). The
  braggarts' amber bars are long and their mint bars are stubs; the workhorses
  are the reverse.
- **Calibration ON:** every ★ (hired) sits on a workhorse. Headline stats:
  **real end-to-end success 37.2%**, what the claims promised 9.57%.
- Flip to **Calibration OFF:** the ★s jump to the braggarts. **Real end-to-end
  success collapses to 0.003%** while the *claimed* number balloons to ~88.6%.
- The "success gained by ON" stat reads **+37.2%, 6 step(s) re-routed** — the
  whole workflow changes hands.

**Why the collapse is so violent.** Success multiplies along the chain: six
steps at ~15% each is ~0.003%. One bad link at graph scale poisons everything
downstream — which is exactly what a per-task, bid-trusting market can't see.

**The point it proves.** *Anyone can build a market that trusts bids. Pricing
realized outcomes is the moat, and at graph scale it's the difference between a
workflow that works and one that silently fails.*

---

## Scenario 3 — Research pipeline (it scales)

**The story.** A denser eight-step research workflow (research → extract ×3 →
reconcile → fact-check → format) with a real critical path and a **tight 3-second
deadline**. This is the "not a toy" scenario: more nodes, real scheduling
pressure, and a visible risk preflight.

**Clicks.**

1. Top bar → **Scenario → "Research pipeline (8-node, tight deadline)."**
2. Sidebar → **Clearing** (see the wider DAG and the critical path).
3. Sidebar → **Calibration ledger** (the moat holds at scale: **+24.9%**).
4. Sidebar → **Risk preflight.**

**What the viewer should see.**

- **Clearing:** 8 steps cleared, **plan score 2.8142**, **$1.60 cleared**,
  makespan **3.00 s** (right at the deadline).
- **Calibration:** ON delivers **real end-to-end 24.9%** vs claimed 4.69%; OFF
  collapses toward zero. Lift **+24.9%**.
- **Risk preflight:** thousands of simulations of the cleared plan →
  **chance the plan fails ≈ 73.6%**, deadline-miss and budget-overrun near 0%.
  The takeaway line: *think before you pay* — the market can see a fragile plan
  before any money moves.

**The point it proves.** *The approach isn't a two-node parlor trick — it holds
its shape on a realistic multi-step workflow with scheduling and risk.*

---

## Walkthrough 4 — Run your own clearing (interactive)

**The story.** Judges and devs get to poke it themselves. Change the budget and
risk appetite, flip calibration, and run a real clearing — with no wallet and no
money.

**Clicks.**

1. Sidebar → **Run your own.**
2. Leave **base workflow = Invoice**, **calibration = ON**, press **Run
   clearing ▸**.
3. Change **calibration → OFF** and run again.
4. (Optional) drag **global budget** down and re-run to force a failure.

**What the viewer should see.**

- A badge showing where it ran: **"ran on the server"** (if the serverless
  function is deployed) or **"ran in your browser"** (the graceful fallback — no
  backend needed). Either way it says **cleared**.
- With calibration **ON**: **real end-to-end success ≈ 37.2%** vs claimed 9.57%,
  and the DAG routes to workhorses.
- With calibration **OFF**: the same real-success number drops sharply — the live
  engine reproduces the moat in real time.
- Starve the budget and you get a clean **"no feasible plan"** empty state, not a
  crash — the same failure the reference bake-off shows.

**The point it proves.** *The result is reproducible and the product is
interactive, not a canned screenshot. The exact optimal (whole-graph) results and
real on-chain receipts live in the reference scenarios above; this is a safe,
no-money preview.*

---

## Walkthrough 5 — On-chain settlement (the honest close)

**The story.** Cleared work settles in USDC on Circle's Arc. The credibility move
is honesty: real transaction hashes link out to the explorer; a batch settlement
ID is **not** a transaction and is never dressed up as one.

**Clicks.**

1. Sidebar → **On-chain settlement.**
2. Hover the **?** next to *Agent identity*; open **"Why the honest labels
   matter."**
3. Click a blue tx hash (e.g. the Gateway deposit) to open arcscan.

**What the viewer should see.**

- **Agent identity** — Agent ID **842573**, with two linkable ERC-8004
  transaction hashes (identity register + reputation feedback).
- A settlement row **step n1 → workhorse-1 · $0.001**, badged **proven prior**,
  with a real linkable **Gateway deposit** tx (`0xb64a…`).
- The Gateway settlement ID rendered as plain text with an amber
  **"batch ID · not a transaction"** badge — deliberately *not* a link.

**The point it proves.** *Real Arc-testnet settlement, and the honesty judges
reward: no fabricated `/tx/` links, every artifact labeled for what it is.*

---

## Scenario Explorer (start here for new viewers)

**The story.** Eleven bundled workflows, each tagged by what they exercise
(`calibration`, `budget`, `scheduling`, `preflight`, `degrade`, etc.). Pick a
card to drive every section below.

**Clicks.**

1. Sidebar → **Scenarios** (first item).
2. Filter by tag chip (e.g. `calibration`, `preflight`).
3. Click a card — e.g. **Preflight rejected** shows `status=rejected`.

**What the viewer should see.**

- Each card shows **what it proves**, tags, node/provider counts, and a headline.
- Failure stories (`preflight-underfunded`, `solver-degrade`) are explorable too.

---

## Run trace (step-by-step clearing log)

**The story.** Every fixture includes a `trace` array: ordered steps from the
real engine (`validate-dag` → `assign` → `schedule` → `preflight` → `settlement`)
plus driver enrichment (`score-candidates`, `bake-off`, `calibration`, `twin`).

**Clicks.**

1. Pick any scenario.
2. Sidebar → **Run trace**.
3. Use **play / prev / next** — the highlighted node in **Clearing** follows the
   current step.

**CLI.** `npm run demo:emit -- --trace` prints the same log to stdout.

---

## Additional scenarios (4–11)

| Scenario | Tags | Proves |
| --- | --- | --- |
| **Cold-start calibration** | calibration, cold-start | ON is claim-free at n=0; OFF buys braggarts |
| **Quality floor** | quality-floor | Global quality floor enforced on the plan |
| **Scale stress (14-node)** | scheduling, budget | Clears a larger DAG within budget/deadline |
| **Deadline tight** | scheduling, risk | Makespan pressed to global deadline |
| **Preflight under-funded** | preflight | `PREFLIGHT_FAILED` — partial trace, no settlement |
| **Solver degrade** | degrade | CP-SAT down → greedy+LNS with `status=degraded` |
| **Concurrency (tier-1)** | scheduling | Provider concurrency cap serializes parallel nodes |
| **Bond capacity (tier-1)** | budget, risk | Per-provider bond capacity binds |

Regenerate fixtures: `npm run demo:emit`. Filter: `npm run demo:emit -- --tag calibration`.

---

## Reset / smoke checklist

- Refresh the page → defaults to the **Invoice** scenario, **Scenarios** section.
- Each sidebar item scrolls to and highlights its section (scroll-spy).
- Switching scenario (explorer card or dropdown) updates every section's numbers.
- **Run trace** play/step highlights the active node in the DAG.
- The **Calibration OFF/ON** toggle flips the allocation and the success stats.
- **Run clearing** returns a result (server or browser) and never errors.
- Every on-chain link that opens is a real `0x…64-hex` hash; UUIDs never link.

---

## Where the deeper detail lives

The dashboard UI intentionally speaks plain product language. The full technical
vocabulary — the exact solver (OR-Tools CP-SAT), the Bayesian calibration ledger,
LP shadow prices / duals, the State-Twins Monte-Carlo preflight, and the research
these build on — is documented in [`README.md`](./README.md) and the repo's
`SOURCE-OF-TRUTH.md`.
