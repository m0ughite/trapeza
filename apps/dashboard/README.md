# Trapeza Dashboard

A Vite + React + TypeScript single-page app that visualizes the Trapeza
**graph clearinghouse**: multi-node CP-SAT clearing, the realized-outcome
**calibration moat** (ON vs OFF), State-Twins Monte-Carlo risk, LP shadow prices,
and real Arc-testnet on-chain settlement receipts.

It runs in two modes:

- **Historical runs (always-on, zero backend).** Bundled `demo-run.json` fixtures
  emitted offline by the real engine (Python OR-Tools CP-SAT Tier-1). Fully static
  — works on any host, including a pure static Vercel deploy.
- **Run-your-own (live).** Two ways in: **Simple mode** (default) — describe a
  workflow as a few plain steps and Trapeza auto-fills providers/prices/bonds from a
  capability catalog; or the **advanced full contract** (visual Builder / JSON paste)
  where you supply the whole market. Both run the same clearing: it prefers a Vercel
  serverless function (`/api/run`, TS Tier-2 engine) and degrades gracefully to the
  **same** engine in the browser, clearly labeled. CP-SAT (Tier-1) is Python-only and
  does not run in live mode by design — it is the always-on historical content. Both
  input shapes, the capability catalog and the risk mapping are documented in
  [`INPUT-CONTRACT.md`](./INPUT-CONTRACT.md).

The live path performs **no on-chain action** (no funded wallet, no faucet). A
real capped testnet nanopayment would sit behind an explicit, rate-limited,
env-gated flag; it is off by default.

For a presenter/tester script, see [`DEMO-SCENARIOS.md`](./DEMO-SCENARIOS.md).

## Concepts — plain language ↔ the technical detail

The UI speaks plain product language on purpose. The academic/technical
vocabulary and the research it rests on are documented here (and in the repo's
`SOURCE-OF-TRUTH.md`), not dumped into the interface.

| In the dashboard | What it actually is | Grounding |
| --- | --- | --- |
| **Calibration ledger** — "scored on what they delivered" | A Bayesian **Beta-Binomial** posterior over each provider's realized success, updated from outcomes; the bid is only a prior, never the allocation signal | *MarketBench* (arXiv 2604.23897): agents are miscalibrated about their own success/cost, so bid-trusting markets misallocate |
| **Whole-graph clearing** / "graph solver" | An exact **OR-Tools CP-SAT** solve of a Resource-Constrained Project Scheduling + generalized-assignment problem over the task DAG (objective = calibrated expected net value); degrades to a greedy+LNS Tier-2 solver | *CASTER* (arXiv 2601.19793) cost-aware graph routing; *AEX* (arXiv 2507.03904) `max Σ[p·v − c]` objective |
| **Greedy per-task router** | Per-node topological greedy — the naive baseline and the Tier-2 degrade path | DESIGN-CLEARINGHOUSE §5.5 (why global beats per-task) |
| **Solver bake-off** — "best plan wins" | A CoW-Protocol-style 2-solver competition (CP-SAT vs greedy+LNS) on the same DAG | CoW Protocol solver/batch-auction docs |
| **Bottleneck prices** — "value of one more dollar/second" | **LP shadow prices** = the dual variables of the relaxed clearing (budget dual, deadline dual, provider-capacity duals). Display-only; settlement is discriminatory `min(ask, reserve)` per hop | ISO-NE / Cramton uniform-vs-pay-as-bid; DESIGN-CLEARINGHOUSE §4 |
| **Risk preflight** — "dry-run before you pay" | **State-Twins** Monte-Carlo: fork the settlement state off-chain and sample each provider's Beta posterior to score failure / deadline-breach / budget-overrun in the tail before committing | *State Twins* (arXiv 2605.11522) off-chain fork-and-evaluate |
| **What the market moved** (traction) | RFB-3's named metrics: cleared volume, value-per-USDC, settlement makespan, payment-chain depth, graph density | hackathon spec RFB-3 |
| **Batch ID · not a transaction** | A Circle **Gateway settlement UUID** (a batch identifier), distinct from a real EVM tx hash | repo honesty rule; ERC-8004 identity/reputation writes and Gateway deposits are real `0x`+64-hex tx |

## Data contract

Both artifacts conform to `src/types/contract.ts` (the single source of truth,
imported by the browser and by the offline driver):

- `src/fixtures/*.json` — one `DemoRun` per historical run (+ `manifest.json`).
- `src/fixtures/onchain-receipts.json` — `OnchainReceipts`.
- Live "run your own" payload — [`LiveRunInput` in `INPUT-CONTRACT.md`](./INPUT-CONTRACT.md).

Honesty rule enforced in the UI: a Circle Gateway settlement id is a **batch
UUID, not an EVM tx** and is never rendered as a `/tx/` link. Only real
`0x`+64hex hashes (the Gateway deposit and the ERC-8004 identity/reputation
writes) link to arcscan.

## Run locally

From the **repo root** (installs the workspace, including this app):

```bash
npm install

# (optional) regenerate the bundled fixtures from the real engine.
# Start the Python CP-SAT solver first for Tier-1 numbers:
npm run solver            # leave running in another shell (127.0.0.1:8000)
npm run demo:emit         # writes apps/dashboard/src/fixtures/*.json
npm run demo:onchain      # writes onchain-receipts.json (LIVE=0 for proven fallback)
```

Then run the dashboard:

```bash
npm run dev   --workspace @trapeza/dashboard    # http://localhost:5173
npm run build --workspace @trapeza/dashboard    # tsc + vite build → dist/
npm run preview --workspace @trapeza/dashboard  # serve the production build
```

## Deploy to Vercel

The app is self-contained: the static build has **no dependency** on the rest of
the monorepo, so the simplest deploy points Vercel at this directory.

**Option A — static-only (recommended, zero config beyond `vercel.json`).**

- Set the Vercel project **Root Directory** to `apps/dashboard`.
- Framework preset: **Vite** (auto-detected). Build: `npm run build`, output `dist`.
- The historical runs work immediately. The live "run your own" button degrades
  to the in-browser Tier-2 engine (labeled), since `/api/run` isn't deployed here.

```bash
cd apps/dashboard
vercel        # preview
vercel --prod # production
```

**Option B — with the serverless live backend.**

- Deploy `apps/dashboard` as above; `api/run.ts` is a Vercel Node function that
  runs the TS Tier-2 engine server-side (rate-limited, no on-chain action).
- No secrets are required. Environment variables, if any are added later for a
  capped testnet settlement, MUST be **server-side only** (Vercel env vars,
  testnet keys) — never `VITE_`-prefixed, so they never enter the client bundle.

Do not put private keys in this app. The client bundle contains only public
fixtures and public arcscan links.

## Structure

```
apps/dashboard/
  api/run.ts                 # Vercel serverless live-run (TS Tier-2, rate-limited)
  src/
    types/contract.ts        # THE data contract (shared with demo/emit-*.ts)
    fixtures/                 # bundled DemoRun + OnchainReceipts JSON
    lib/liveEngine.ts         # portable Tier-2 solver (browser + serverless)
    services/                 # format helpers + live-run client
    components/               # DAG, bake-off, calibration, shadow, twin, on-chain…
    App.tsx, main.tsx, styles.css
  vercel.json, vite.config.ts, tsconfig.json, index.html
```
