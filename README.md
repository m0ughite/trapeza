# Trapeza

A calibration-aware **broker / clearinghouse** for agent-to-agent nanopayment
markets. Settlement on **Arc** in **USDC** via **x402 + Circle Gateway**;
identity/reputation via **ERC-8004**. See [`DESIGN.md`](./DESIGN.md) for the
locked architecture and [`DESIGN-CLEARINGHOUSE.md`](./DESIGN-CLEARINGHOUSE.md)
for the graph-clearing extension.

## Flagship demo (LLM providers + live dashboard)

One command for reviewers/investors — narrated console + auto-updating dashboard.
Mock LLM by default (zero API keys); lemon-vs-accurate divergence is illustrated
with the scripted mock. Set `LLM_BASE_URL` for OpenAI / NIM / Groq / Ollama.

```bash
npm install
npm run showcase                 # seeds LLM market, runs tasks, opens dashboard
```

With a real OpenAI-compatible endpoint:

```bash
LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3 npm run showcase
```

## Quickstart (mock mode — no wallets required)

```bash
npm install
npm run demo                       # one-shot clearing showcase (no DB)
npm run sim                        # generate market volume into ~/.trapeza/trapeza.db
npm run dev -w @trapeza/app        # dashboard at http://localhost:3000
```

Optional: start the Python CP-SAT solver for Tier-1 graph clearing (degrades to
greedy in-process if the solver is down):

```bash
npm run solver:install             # once
npm run solver                     # http://127.0.0.1:8000
```

Pair agents via MCP: see [`apps/mcp/README.md`](apps/mcp/README.md).

## Monorepo layout

```
packages/
  core/             @trapeza/core            chain-agnostic broker primitive
  clearinghouse/    @trapeza/clearinghouse   graph solve + preflight twin
  oracle/           @trapeza/oracle          schema oracle
  store-sqlite/     @trapeza/store-sqlite    durable SQLite ledger + events feed
  runtime/          @trapeza/runtime         assemble() composition root
  provider-llm/     @trapeza/provider-llm    OpenAI-compatible LLM provider template
  adapter-arc/      @trapeza/adapter-arc     Arc + ERC-8004 + escrow
  adapter-gateway/  @trapeza/adapter-gateway Circle Gateway / x402 settlement
apps/
  mcp/              @trapeza/mcp             stdio + HTTP MCP server
  sim/              @trapeza/sim             seeded requester + provider loop
  showcase/         @trapeza/showcase        one-command visual LLM demo
  dashboard/        @trapeza/app             Next.js observability dashboard
solver/                                       Python CP-SAT Tier-1 + Monte Carlo twin
```

The **module boundary is the point**: `@trapeza/core` is chain-agnostic; every
Circle/Arc call lives in an adapter; apps import `@trapeza/core` (or
`assemble()` from `@trapeza/runtime`) only.

## Shared database

Sim, MCP, and the dashboard default to the same SQLite file:

`~/.trapeza/trapeza.db`

Override with `TRAPEZA_DB_PATH` on any surface.

## On-chain spikes (Arc testnet)

P0 de-risks the two hardest on-chain primitives. Both spike scripts perform real
transactions once credentials/funds are supplied:

```bash
npm install
cp .env.example .env      # then fill it in — see SETUP.md
npm run spike:nanopayment # one x402/Gateway USDC nanopayment on Arc testnet
npm run spike:erc8004     # register one ERC-8004 identity on Arc testnet
npm run typecheck         # type-check core + adapters + app packages
npm test                  # vitest (core + clearinghouse + apps)
```

See [`SETUP.md`](./SETUP.md) for wallets, funding, and exactly what each spike
needs.

## Agent guide

See [`AGENTS.md`](./AGENTS.md) for read order, build commands, and Arc/Circle
context routing.
