# Trapeza — Agent Guide

Calibration-aware **broker / clearinghouse** for agent-to-agent nanopayment markets.
Lepton Agents Hackathon (Canteen × Circle). Settlement on **Arc testnet** in **USDC**
via **x402 + Circle Gateway**; identity/reputation via **ERC-8004**.

## Read order

1. **[SOURCE-OF-TRUTH.md](SOURCE-OF-TRUTH.md)** — canonical thesis, locked decisions, sprint plan
2. **[IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md)** — what's done, blocked, and current phase
3. **[ACTIVITY-LOG.md](ACTIVITY-LOG.md)** — recent sessions (who did what on which branch)
4. **[context-for-agent/docs/circlefin-skills/](context-for-agent/docs/circlefin-skills/)** — before any Arc/Circle/adapter work
5. **[context-for-agent/samples/](context-for-agent/samples/)** — reference implementations (read-only)
6. **[context/papers/](context/papers/)** + **[context/hackathon/](context/hackathon/)** — research grounding

Companion design docs: [DESIGN.md](DESIGN.md) (core primitive), [DESIGN-CLEARINGHOUSE.md](DESIGN-CLEARINGHOUSE.md) (graph clearing).

## Monorepo layout

```
packages/
  core/              @trapeza/core           chain-agnostic primitive (no UI/MCP/chain SDK)
  adapter-arc/       @trapeza/adapter-arc    Arc + ERC-8004
  adapter-gateway/   @trapeza/adapter-gateway Circle Gateway / x402 settlement
apps/                MCP, sim, dashboard (future)
context-for-agent/   Arc + Circle docs, skills, sample repos
context/             hackathon spec + research papers
```

**Module boundary (hard rule):** `@trapeza/core` is chain-agnostic. Every Circle/Arc call
lives in an adapter. The app layer imports only `@trapeza/core`. See DESIGN.md §4.3.

## Build commands

```bash
npm install
cp .env.example .env          # fill in — see SETUP.md
npm run typecheck             # core + both adapters
npm test                      # vitest (core)
npm run spike:nanopayment     # one x402/Gateway USDC payment on Arc testnet
npm run spike:erc8004         # register one ERC-8004 identity on Arc testnet
```

On-chain spikes need funded Arc-testnet wallets. See [SETUP.md](SETUP.md). Never commit
`.env` or private keys. Never fabricate tx hashes.

## Arc / Circle context routing

Full index: [context-for-agent/AGENTS.md](context-for-agent/AGENTS.md).

For most Arc/Circle questions, read the matching **circlefin-skills** file before diving
into per-page docs under `context-for-agent/docs/`.

| Task | Start with |
| --- | --- |
| Arc chain config, deploy | `context-for-agent/docs/circlefin-skills/use-arc.md` |
| USDC transfers / balances | `context-for-agent/docs/circlefin-skills/use-usdc.md` |
| Crosschain USDC (CCTP) | `context-for-agent/docs/circlefin-skills/bridge-stablecoin.md` |
| Wallet type selection | `context-for-agent/docs/circlefin-skills/use-circle-wallets.md` |
| Dev-controlled wallets | `context-for-agent/docs/circlefin-skills/use-developer-controlled-wallets.md` |
| Gateway / nanopayments | `context-for-agent/docs/circlefin-skills/use-gateway.md` |
| Agent Stack (CLI, Agent Wallets) | `context-for-agent/docs/developers.circle.com/agent-stack.md` |
| ERC-8004 / ERC-8183 | `context-for-agent/docs/docs.arc.network/build/agentic-economy.md` |
| API signatures / contract addrs | `context-for-agent/docs/developers.circle.com/api-reference.md` |

### Trapeza-specific sample map

| Trapeza need | Skill / doc | Sample or code |
| --- | --- | --- |
| x402 / Gateway settlement | `use-gateway.md` | clone `circlefin/arc-nanopayments` (see `context-for-agent/samples/README.md`) |
| Bond escrow + slash | `use-usdc.md` | `context-for-agent/samples/arc-escrow/` (`RefundProtocol.sol`) |
| ERC-8004 identity | agentic-economy docs | `packages/adapter-arc/scripts/spike-erc8004-identity.ts` |
| Dev-controlled wallets | `use-developer-controlled-wallets.md` | any `context-for-agent/samples/arc-*` with Circle Wallets |
| Agent Stack / MCP | `agent-stack.md` | `.cursor/mcp.json` (arc-docs + circle) |

## Documentation lookup

Training data alone is not enough for current APIs. Use this order:

1. **`context-for-agent/`** — Arc, Circle, USDC, Gateway, x402, wallets, Trapeza samples
2. **Context7** (`user-context7` MCP) — third-party libraries/SDKs: viem, vitest, TypeScript, OR-Tools, `@circle-fin/x402-batching`, Next.js, etc. Call `resolve-library-id` then `query-docs`.
3. **`arc-docs` / `circle` MCP** — live Arc/Circle product docs when the bundle is insufficient
4. **Web search** — Context7 miss, version migrations, changelogs, errors not covered above

## Logging

Every session that modifies files must append an entry to **[ACTIVITY-LOG.md](ACTIVITY-LOG.md)**
before finishing. Use your handle + `manual` or `assisted`. Never log secrets.

Promote milestones (phase complete, spike evidence, blocker resolution) to
**[IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md)**. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Current sprint

See SOURCE-OF-TRUTH.md §8. Critical path: **P0′ unblock on-chain spikes** — fund wallets,
run `spike:nanopayment` and `spike:erc8004`, wire real adapters behind core interfaces.
