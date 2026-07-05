---
name: arc-circle-context
description: >-
  Arc blockchain and Circle developer platform reference. Use when asked about Arc,
  Circle, USDC, EURC, CCTP, Gateway, x402, nanopayments, wallets, Agent Stack,
  ERC-8004, or ERC-8183 integration for Trapeza.
---

# Arc + Circle context

Trapeza bundles offline docs and samples under `context-for-agent/`. Read local files
first for Arc/Circle domain knowledge. For third-party library/SDK APIs, use **Context7**
(`user-context7`: `resolve-library-id` → `query-docs`). For live Arc/Circle product docs,
use MCP (`arc-docs`, `circle`). Use **web search** when Context7 or bundled docs are
insufficient or may be stale.

## Entry points

- Index: [context-for-agent/AGENTS.md](../../context-for-agent/AGENTS.md)
- Arc docs mirror: `context-for-agent/docs/docs.arc.network/`
- Circle docs mirror: `context-for-agent/docs/developers.circle.com/`
- LLM-optimized skills: `context-for-agent/docs/circlefin-skills/`
- Sample repos: `context-for-agent/samples/`

## Task routing

| Question | Read first |
| --- | --- |
| Arc chain, deploy, testnet | `context-for-agent/docs/circlefin-skills/use-arc.md` |
| USDC on Arc | `context-for-agent/docs/circlefin-skills/use-usdc.md` |
| Gateway / nanopayments / x402 | `context-for-agent/docs/circlefin-skills/use-gateway.md` |
| Crosschain USDC | `context-for-agent/docs/circlefin-skills/bridge-stablecoin.md` |
| Which wallet type? | `context-for-agent/docs/circlefin-skills/use-circle-wallets.md` |
| Agent Wallets / Circle CLI | `context-for-agent/docs/developers.circle.com/agent-stack.md` |
| ERC-8004 identity / reputation | `context-for-agent/docs/docs.arc.network/build/agentic-economy.md` |
| Contract addresses / API | `context-for-agent/docs/developers.circle.com/api-reference.md` |
| OpenAPI specs | `context-for-agent/docs/developers.circle.com/openapi/*.yaml` |

## Live MCP (fallback)

Configured in `.cursor/mcp.json`:

- **arc-docs** — `https://docs.arc.network/mcp` (search + full-page retrieval)
- **circle** — `https://api.circle.com/v1/codegen/mcp` (Wallets, CCTP, Gateway, Contracts)

## Context7 + web search

- **Context7** (`user-context7`) — viem, x402 packages, vitest, and other npm libs used in adapters
- **Web search** — when Context7 has no match or docs may have changed since the bundle

## Arc testnet quick facts

| Field | Value |
| --- | --- |
| Chain ID | `5042002` (`0x4CEF52`) |
| RPC | `https://rpc.testnet.arc.network` |
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` (6 dec) |
| Gateway Wallet (testnet) | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| Faucet | https://faucet.circle.com |

Trapeza's locked constants also live in `packages/adapter-gateway/src/constants.ts`
and `packages/adapter-arc/src/constants.ts`.

## Samples (read-only)

Do not modify files under `context-for-agent/samples/`. Clone `arc-nanopayments`
on demand — see `context-for-agent/samples/README.md`.
