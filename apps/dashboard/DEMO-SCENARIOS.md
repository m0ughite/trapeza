# Trapeza — Demo Scenarios

Scenario-based walkthroughs for presenting or testing the dashboard. Each one is
a short story with the exact clicks, what the viewer should see, and the point it
proves. All numbers below are the real engine output baked into the bundled
fixtures (`src/fixtures/*.json`), re-emitted from the **CP-SAT Tier-1** solver on
2026-07-10, so they are stable and reproducible offline. For a panel-by-panel
reference and the data-provenance breakdown, see
[`../../docs/DASHBOARD-EXPLAINED.md`](../../docs/DASHBOARD-EXPLAINED.md).

**Setup (30 seconds).** From the repo root:

```bash
npm run dev --workspace @trapeza/dashboard   # http://127.0.0.1:5173
```

The left sidebar is the map: **Overview → Clearing → Clearing vs. Greedy →
Calibration Ledger → Bottlenecks → Risk Preflight → Settlement → Run Your Own.**
The top-bar **Scenario** dropdown switches the workflow driving every section.
Nothing requires a backend, a wallet, or network access.

The one-line pitch to open with:

> *You hand Trapeza a whole workflow and a budget. It scores every provider on
> what it actually delivered, solves the entire task graph at once instead of
> picking each step blind, dry-runs the plan for risk, and settles in USDC on
> Arc — with honest receipts.*

## The six scenarios at a glance

| Run ID | Label | Steps | Proves | Headline number |
| --- | --- | --- | --- | --- |
| `invoice-processing` | Invoice processing | 6 | Calibration is the moat | Real success **41.3% (ON)** vs **0.02% (OFF)**, lift **+0.41** |
| `research-report` | Research → report | 8 | It scales to a real critical path | 8 steps cleared, plan score **1.7780**, lift **+0.29** |
| `data-reconciliation` | Data ETL & reconciliation | 2 | Graph clearing beats greedy | Greedy **busts**; CP-SAT clears at **1.5375**; budget dual **1.15** |
| `support-triage` | Customer-support triage | 6 | Fan-out/fan-in under a tight SLA | Lift **+0.46**, 2 steps re-routed |
| `code-pr-pipeline` | Code-PR review pipeline | 4 | Quality floors exclude the unreliable | Lift **+0.66** (largest) |
| `rag-qa` | RAG document Q&A | 5 | Realized-outcome pricing filters hallucinators | Real success **53.2% (ON)** vs **0.02% (OFF)**, lift **+0.53** |

For a cold audience, run three in this order: **data-reconciliation** (fastest
"aha" — greedy busts), **invoice-processing** or **rag-qa** (the calibration
moat), **research-report** (proves it isn't a two-node toy).

---

## Scenario 1 — Data ETL & reconciliation (`data-reconciliation`, the bake-off money shot)

**The story.** A two-step job — extract a batch of records, then reconcile them
against a source of truth — under a tight shared budget of **$1.00**. A per-task
router pays for the easy extraction first with no idea what's coming, and can't
afford the reconcile step. The whole-graph clearing sees both steps at once and
deliberately buys cheap-but-adequate extraction to keep enough for the bottleneck.

**Clicks.**

1. Top bar → **Scenario → "Data ETL & reconciliation."**
2. Sidebar → **Clearing vs. Greedy.**

**What the viewer should see.**

- **Greedy per-task router → "no feasible plan"** in red, badged **busts**.
- **Whole-graph clearing → 1.5375**, badged **winner**, plan:
  `extract → budget-extractor`, `reconcile → ledger-reconciler`.
- The plain-language note: greedy spends the budget in workflow order, overpays
  on the easy node, and cannot afford the bottleneck; the graph-aware clearing
  reserves budget for the bottleneck, so it clears where greedy busts.

**Follow-on.** Sidebar → **Bottlenecks.** This is the *one* scenario where a
constraint binds: **"budget" = 1.15** — the market telling you an extra dollar
here would return $1.15 of plan value. Every other scenario shows all-zero duals
because they are loosely constrained (which is also why greedy ties CP-SAT there).

**The point it proves.** *Picking each task greedily is a special case that
breaks the moment steps share a budget. Solving the graph is the product.*

---

## Scenario 2 — Invoice processing (`invoice-processing`, the calibration reveal)

**The story.** A six-step invoice pipeline (parse → extract line-items +
extract-totals → reconcile → validate → format). Every capability has a
**braggart** that claims 96–99% success but has delivered ~15%, and a quieter
**workhorse** that claims ~70–76% but has delivered ~90%. Believe the pitch and
you buy the liars; score the track record and you hire the performers.

**Clicks.**

1. Top bar → **Scenario → "Invoice processing."**
2. Sidebar → **Calibration Ledger.**
3. Toggle the segmented control **Calibration OFF ↔ ON** (top-right of the card).

**What the viewer should see.**

- The provider table: **claims** (amber bars) vs **delivers** (mint bars). The
  braggarts' amber bars are long and their mint bars are stubs; workhorses are
  the reverse.
- **Calibration ON:** every ★ (hired) sits on a workhorse. **Real end-to-end
  success 41.3%.**
- Flip to **Calibration OFF:** the ★s jump to the braggarts. **Real end-to-end
  success collapses to 0.02%** while the *claimed* number balloons to ~70%.
- The "success gained by ON" stat reads **+41.2%, 5 step(s) re-routed**.

**Why the collapse is so violent.** Success multiplies along the chain: five
braggart links at ~15% each is ~0.02%. One bad link at graph scale poisons
everything downstream. This is also the scenario whose cleared plan settles
on-chain (Scenario 6).

**The point it proves.** *Anyone can build a market that trusts bids. Pricing
realized outcomes is the moat, and at graph scale it's the difference between a
workflow that works and one that silently fails.*

---

## Scenario 3 — RAG document Q&A (`rag-qa`, calibration at cold-ish start)

**The story.** A five-step RAG stack (chunk → index → retrieve → answer →
grounding-check). Each capability offers an honest workhorse and a
confident-but-unreliable braggart — including a "99% accurate" answerer that is
really a hallucinator. Score the ledger and you route around it; trust the pitch
and you put it on the answer step.

> **Note (fixed 2026-07-10):** this scenario previously *inverted* — calibration
> ON looked ~14.5% worse than OFF because the providers had no track record and
> "realized" success fell back to their *claimed* numbers. The providers now
> carry real verified outcomes, so the moat shows the right way round.

**Clicks.**

1. Top bar → **Scenario → "RAG document Q&A."**
2. Sidebar → **Calibration Ledger.** Toggle **OFF ↔ ON.**

**What the viewer should see.**

- **Calibration ON:** hires splitter / embed-small / bm25-retriever /
  grounded-answerer / citation-checker. **Real end-to-end success 53.2%.**
- **Calibration OFF:** hires megachunk / embed-xl / vector-retriever /
  **confident-answerer (the hallucinator)** / vibe-checker. **Real success
  collapses to 0.02%**, claimed ~91%.
- **Success gained by ON: +53.2%, all 5 steps re-routed.**

**The point it proves.** *Realized-outcome pricing filters confident-but-
unreliable RAG providers; trusting claims buys a hallucinator to answer your
users.*

---

## Scenario 4 — Research → report (`research-report`, it scales)

**The story.** A denser eight-step research workflow (research → extract ×3 +
gather → reconcile → fact-check → format) with a real critical path. The
"not-a-toy" scenario: more nodes, real scheduling, and a visible risk preflight.

**Clicks.**

1. Top bar → **Scenario → "Research → report."**
2. Sidebar → **Clearing** (wide DAG + critical path), then **Calibration Ledger**
   (moat holds at scale: **+0.29**), then **Risk Preflight.**

**What the viewer should see.**

- **Clearing:** 8 steps cleared, **plan score 1.7780**, **$2.80 cleared**,
  makespan within the 12 s deadline.
- **Calibration:** ON real end-to-end **29.2%** vs OFF collapsing toward zero.
- **Risk Preflight:** 500 simulations of the cleared plan → **failure ≈ 70.8%**,
  deadline-miss and budget-overrun near 0%. *Think before you pay.*

> **Known caveat.** The **Bottlenecks** panel is empty for this scenario (all
> duals 0.00) even though its description advertises a shadow-price readout — the
> graph is loosely constrained, so nothing binds. Use `data-reconciliation` to
> demonstrate a binding shadow price. (Flagged; a follow-up may tighten this
> scenario's budget.)

**The point it proves.** *The approach holds its shape on a realistic multi-step
workflow with scheduling and risk, not just a two-node trick.*

---

## Scenario 5 — Customer-support triage (`support-triage`) & Code-PR pipeline (`code-pr-pipeline`)

Two more calibration/scheduling scenarios worth a quick tour:

- **support-triage** — classify → {kb-lookup, sentiment, entitlement} → draft →
  tone-check, fan-out/fan-in on a tight 8 s SLA with elevated risk-aversion (2).
  Calibration lift **+0.46** (ON 48.4% vs OFF 2.7%); it avoids the fast
  autoresponder that fabricates answers. Two steps re-route (kb-lookup, draft).
- **code-pr-pipeline** — generate → test → review → security-scan, where every
  step carries a **quality floor (0.6)**. The cheap, fast providers advertise
  near-perfect success but their realized record is below the floor, so they're
  ineligible. Largest calibration lift of all six: **+0.66** (ON 68.3% vs OFF
  2.5%). Check the **Calibration Ledger** to see the excluded providers.

---

## Walkthrough 6 — Run your own clearing (simple mode, interactive)

**The story.** Judges and devs poke it themselves. Change the budget and risk
appetite, flip calibration, and run a real clearing — with no wallet and no money.

**Clicks.**

1. Sidebar → **Run Your Own.**
2. Simple mode is the default: pick a **base workflow** (e.g. Invoice), leave
   **calibration = ON**, press **Run clearing ▸**.
3. Change **calibration → OFF** and run again.
4. (Optional) drag **global budget** down and re-run to force a failure.

**What the viewer should see.**

- A badge showing where it ran: **"ran on the server"** (if the Vercel function
  is deployed) or **"ran in your browser"** (the graceful fallback — no backend).
  Either way it says **cleared**.
- With calibration **ON**: real end-to-end success rises and the DAG routes to
  workhorses. With **OFF**: real success drops sharply — the live Tier-2 engine
  reproduces the moat in real time.
- Starve the budget and you get a clean **"no feasible plan"** empty state, not a
  crash — the same failure the reference bake-off shows.

**The point it proves.** *The result is reproducible and interactive, not a
canned screenshot.* Note the honest caveat in the panel: **"Run Your Own" uses
the portable Tier-2 greedy solver** (CP-SAT/OR-Tools can't run in the browser or
on Vercel). The exact whole-graph CP-SAT results and real on-chain receipts live
in the reference scenarios above; this is a safe, no-money preview.

---

## Walkthrough 7 — On-chain settlement (`invoice-processing`, the honest close)

**The story.** Cleared work settles in USDC on Circle's Arc. The credibility move
is honesty: real transaction hashes link out to the explorer; a batch settlement
ID is **not** a transaction and is never dressed up as one.

**Clicks.**

1. Top bar → **Scenario → "Invoice processing."** Sidebar → **Settlement.**
2. Hover the **?** next to *Agent identity*; open the honest-labels explainer.
3. Click a blue tx hash (e.g. the Gateway deposit) to open arcscan.

**What the viewer should see.**

- **Agent identity** — Agent ID **842573**, with two linkable ERC-8004
  transaction hashes (identity register `0x3cc0…`, reputation feedback `0x7b0d…`).
- Six settlement rows for the invoice plan (`parse → sonnet-parser`,
  `extract-line-items → sonnet-extractor`, …, `format → report-formatter`), each
  **$0.001**, badged **live**, sharing the real linkable **Gateway deposit** tx
  `0xb64a…`.
- Each **Gateway settlement ID** rendered as plain text with an amber
  **"batch ID · not a transaction"** badge — deliberately *not* a link.

**The point it proves.** *Real Arc-testnet settlement, and the honesty judges
reward: no fabricated `/tx/` links, every artifact labeled for what it is.*

---

## Reset / smoke checklist

- Refresh → defaults to the **Invoice processing** scenario, **Overview** section.
- Each sidebar item scrolls to and highlights its section (scroll-spy).
- Switching the **Scenario** dropdown updates every section's numbers.
- The **Calibration OFF/ON** toggle flips the allocation and the success stats.
- **Run clearing** returns a result (server or browser) and never errors.
- Every on-chain link that opens is a real `0x…64-hex` hash; UUIDs never link.

---

## Where the deeper detail lives

The dashboard UI intentionally speaks plain product language. The full technical
vocabulary — the exact solver (OR-Tools CP-SAT), the Bayesian calibration ledger,
LP shadow prices / duals, the State-Twins Monte-Carlo preflight, and how the
offline/live/on-chain data sources split — is documented in
[`../../docs/DASHBOARD-EXPLAINED.md`](../../docs/DASHBOARD-EXPLAINED.md),
[`README.md`](./README.md) and the repo root `README.md`.
