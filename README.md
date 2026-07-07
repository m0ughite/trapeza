# Trapeza

**A calibration-aware clearinghouse for agent-to-agent nanopayment networks — settled in USDC on Circle's Arc.**

Trapeza (τράπεζα, *"the banker's table"*) takes a whole multi-agent workflow, decides which providers should do which work, prices the whole thing, stress-tests it before any money moves, and settles it on-chain in USDC. It scores providers on **what they actually delivered**, not on what they claim.

---

## The problem

Agent-to-agent networks are starting to pay each other per task, in sub-cent USDC nanopayments. The moment money is involved, the market breaks in a predictable way: **providers overpromise.** An agent advertises a 97% success rate and realizes 15%. A naive router that trusts the bid — or greedily picks the cheapest quote per task — burns budget and tokens on providers who cannot deliver, and only finds out after paying.

Worse, real work is a **graph**, not a task. An invoice pipeline is extract → reconcile → fact-check → format; a research pipeline fans out and rejoins. Routing each node in isolation ignores the global budget, the end-to-end deadline, and the bottleneck node that actually gates the whole plan. Per-task greedy routing looks locally optimal and is globally wrong.

## What Trapeza does

Trapeza is a **whole-graph clearinghouse**. You submit a task DAG with a global budget, deadline, and quality/risk constraints. Trapeza returns one jointly-optimal allocation across every node, a settlement price per hop, the bottleneck (shadow) prices, a Monte-Carlo risk verdict, and — on the on-chain path — real USDC settlement.

**Key differentiators:**

- **Whole-graph clearing, not per-task routing.** A single constrained solve over the entire DAG (objective: calibrated expected net value) instead of a locally-greedy per-node pick. The per-task broker is just the single-node special case.
- **A calibration ledger scored on realized outcomes.** Each provider carries a Bayesian **Beta-Binomial** posterior over its *realized* success rate, updated from actual outcomes. The advertised bid is a prior, never the allocation signal. Braggarts get discounted automatically; workhorses rise.
- **Risk preflight via State-Twins Monte-Carlo.** Before committing, Trapeza forks the settlement state off-chain and samples each provider's posterior to score failure, deadline-breach, and budget-overrun probabilities in the tail. A plan that looks fine in expectation but is fragile in the tail gets rejected.
- **Real USDC settlement on Arc.** Settlement runs on Circle's Arc testnet via x402 / Circle Gateway nanopayments, with ERC-8004 identity and reputation writes. On-chain artifacts are **honestly labeled**: only real `0x`+64-hex transactions link to arcscan.

## Architecture

```
packages/
  core/             @trapeza/core            chain-agnostic primitive: data models,
                                             calibration ledger, EV router, pipeline,
                                             the clearinghouse seam. No UI/chain SDK inline.
  clearinghouse/    @trapeza/clearinghouse   whole-graph solve: CP-SAT (via Python solver)
                                             + greedy+LNS Tier-2, schedule, shadow prices,
                                             State-Twins Monte-Carlo preflight.
  oracle/           @trapeza/oracle          deterministic outcome verification.
  adapter-arc/      @trapeza/adapter-arc     Arc + ERC-8004 identity/reputation.
  adapter-gateway/  @trapeza/adapter-gateway Circle Gateway / x402 USDC settlement.
solver/                                      Python OR-Tools CP-SAT + Monte-Carlo service.
demo/                                        deterministic, chain-free engine walkthrough.
apps/dashboard/     @trapeza/dashboard       Vite + React SPA visualizing clearings + receipts.
```

The **module boundary is a hard rule**: `@trapeza/core` is chain-agnostic; every Circle/Arc-specific call lives in an adapter. Full design detail lives in `[docs/PROJECT-DIAGRAMS.md](docs/PROJECT-DIAGRAMS.md)` and the canonical `[docs/SOURCE-OF-TRUTH.md](docs/SOURCE-OF-TRUTH.md)`.

## Quickstart

```bash
npm install                # install the TS monorepo
npm test                   # run the full test suite (57 tests)
npm run typecheck          # type-check core + clearinghouse + oracle + both adapters

# optional: the Python OR-Tools CP-SAT solver (Tier-1, exact clearing)
npm run solver:install     # python3.12 venv + OR-Tools/FastAPI
npm run solver             # serve the solver at 127.0.0.1:8000 (leave running)

# see the engine work end-to-end (deterministic, no chain, no secrets)
npm run demo:emit          # regenerate the dashboard fixtures from the real engine

# the dashboard
npm run dev   --workspace @trapeza/dashboard    # http://localhost:5173
npm run build --workspace @trapeza/dashboard    # tsc + vite build → dist/
```

`npm run demo` prints a narrated console walkthrough of a clearing; `npm run demo:onchain` regenerates the on-chain receipts (uses the proven fallback unless funded testnet wallets are supplied). The on-chain path and wallet/funding setup are documented in `[docs/SETUP.md](docs/SETUP.md)`.

## Demo scenarios

Three deterministic, real-engine scenarios ship as bundled dashboard fixtures:

- **Invoice workflow (6-node DAG)** — extract → reconcile → fact-check → format, where braggart providers claim 97–99% but realize ~15%. Shows the calibration mode (ON vs OFF).
- **Budget bottleneck (greedy busts)** — a two-node logo → code graph under a tight $1.00 budget: naive per-task greedy busts the budget; the CP-SAT clearing finds the feasible joint plan.
- **Research pipeline (8-node, tight deadline)** — research → extract×3 → reconcile → fact-check → format under a tight deadline, stressing the schedule and the Monte-Carlo risk preflight.

## On-chain settlement (Arc testnet, honestly labeled)

Settlement targets **Circle's Arc testnet** (`eip155:5042002`) using USDC via **x402 / Circle Gateway** nanopayments and **ERC-8004** identity/reputation. Trapeza applies a strict honesty rule to on-chain artifacts:

- **Real EVM transactions** (`0x`+64-hex) are the only things linked to [arcscan](https://testnet.arcscan.app). Proven prior on-chain receipts include:
  - ERC-8004 identity register — `[0x3cc07a93…489e1735](https://testnet.arcscan.app/tx/0x3cc07a9310283fddc7c6c1de1aede992985fe7e89ea0de32b1cbbb40489e1735)`
  - ERC-8004 reputation feedback — `[0x7b0d7d3a…86f7f982](https://testnet.arcscan.app/tx/0x7b0d7d3a2d8574483b10ecfd5c4072274eb0ce697811ace8c5b2f16186f7f982)`
  - Circle Gateway deposit (real on-chain tx into the unified balance) — `[0xb64a686a…d4fff6e0](https://testnet.arcscan.app/tx/0xb64a686acb4951a394f797d7439f1c9afc88e02655377f31240e5d2cd4fff6e0)`
- **A Circle Gateway settlement id is a batch UUID, NOT an EVM transaction.** It is never rendered as a `/tx/` link. (The batch settles on-chain when it flushes.)

Both on-chain integrations — one x402/Gateway USDC nanopayment and one ERC-8004 identity registration — are written, run against the live testnet, and gated by a `[BLOCKED]` preflight so a hash only ever appears if a transaction actually settled. They never fabricate a tx hash. See `[docs/SETUP.md](docs/SETUP.md)`.

## Tech stack

- **TypeScript monorepo** (npm workspaces, Node ≥ 20.6): `@trapeza/core`, `clearinghouse`, `oracle`, `adapter-arc`, `adapter-gateway`.
- **Python OR-Tools CP-SAT solver** (CPython 3.12, FastAPI) for the exact Tier-1 clearing + Monte-Carlo twin; a portable TypeScript greedy+LNS Tier-2 solver runs in-process and in the browser as the degrade path.
- **Vite + React + TypeScript dashboard** — bundled historical runs (zero backend) plus an optional serverless live-run.
- **Chain:** Circle Arc testnet, USDC, x402, Circle Gateway, ERC-8004; `viem`.
- **Tests:** Vitest (57 tests across core, clearinghouse, oracle) + pytest for the solver.

## Hackathon alignment

Built for the **Lepton Agents Hackathon (Canteen × Circle)**. Trapeza targets the overlap of **RFB 01 — Autonomous Paying Agents**, **RFB 02 — Selling Agent Services via Nanopayments**, and **RFB 03 — Agent-to-Agent Nanopayment Networks**, with **RFB 03 as the core**. Real Circle/Arc USDC settlement is the rail.

## Roadmap / coming next

- Realistic, use-case scenarios beyond the three seed graphs.
- A generic **bring-your-own-workflow** builder: submit any DAG, not just the bundled fixtures.
- **Per-node on-chain settlement** — wire cleared allocations to live per-hop ERC-8183 escrow release / x402 payment (the chain-layer adapter plan is staged).
- **Constrained natural-language → workflow generation** — describe a task in plain language; a guardrailed, schema-validated planner emits the task DAG.
- An **MCP server** so any agent can hire the clearinghouse in one call.
- **Live provider integrations** (e.g. agentcash.dev) to route real paid demand.
- **Quality-adjusted unified clearing price (UCP)** per capability class.

## License

[AGPL-3.0](LICENSE).