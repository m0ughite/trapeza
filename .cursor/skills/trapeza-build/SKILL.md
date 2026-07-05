---
name: trapeza-build
description: >-
  Build Trapeza — calibration-aware broker on Arc/Circle. Use when implementing
  features, adapters, MCP, clearinghouse, on-chain spikes, or continuing the
  hackathon sprint.
---

# Build Trapeza

## 1. Orient

Read the tail of [IMPLEMENTATION-LOG.md](../../IMPLEMENTATION-LOG.md) for current status.
Read [SOURCE-OF-TRUTH.md](../../SOURCE-OF-TRUTH.md) §8 for the active sprint phase.

## 2. Identify the layer

| Layer | Path | Rule |
| --- | --- | --- |
| Core primitive | `packages/core/` | Chain-agnostic. No viem, Circle SDK, UI, or MCP. |
| Adapters | `packages/adapter-arc/`, `packages/adapter-gateway/` | All on-chain / Circle code here. |
| App | `apps/` (future) | MCP, sim loop, dashboard — imports only `@trapeza/core`. |

If asked to add chain code to core, refuse and place it in the correct adapter.

## 3. Route to Arc/Circle skills

Before adapter or settlement work, read the relevant file from
`context-for-agent/docs/circlefin-skills/`:

| Task | File |
| --- | --- |
| Arc chain config, deploy | `use-arc.md` |
| USDC transfers / balances | `use-usdc.md` |
| Crosschain USDC (CCTP) | `bridge-stablecoin.md` |
| Wallet type selection | `use-circle-wallets.md` |
| Dev-controlled wallets | `use-developer-controlled-wallets.md` |
| User-controlled wallets | `use-user-controlled-wallets.md` |
| Modular / 4337 wallets | `use-modular-wallets.md` |
| Gateway / nanopayments | `use-gateway.md` |
| Contract deploy / monitor | `use-smart-contract-platform.md` |
| Agent Stack (CLI, Agent Wallets) | `../developers.circle.com/agent-stack.md` |
| ERC-8004 / ERC-8183 | `../docs.arc.network/build/agentic-economy.md` |

Full index: [context-for-agent/AGENTS.md](../../context-for-agent/AGENTS.md).

## 3b. Verify APIs (up to date)

Before writing integration code for a third-party library or SDK, query **Context7**
(`user-context7`: `resolve-library-id` → `query-docs`). Use **web search** if Context7
has no match or docs look stale. Do not guess API signatures from training data.

## 4. Sample references (read-only)

| Trapeza need | Sample |
| --- | --- |
| x402 + Gateway batching | clone `circlefin/arc-nanopayments` → `context-for-agent/samples/arc-nanopayments` |
| Bond escrow + slash | `context-for-agent/samples/arc-escrow/` (`RefundProtocol.sol`) |
| Circle Wallets patterns | any `context-for-agent/samples/arc-*` |

See [context-for-agent/samples/README.md](../../context-for-agent/samples/README.md).

## 5. Build and test

```bash
npm run typecheck    # after TypeScript changes
npm test             # after core logic changes
```

## 6. On-chain spikes

Follow [SETUP.md](../../SETUP.md). Run from repo root:

```bash
npm run spike:nanopayment
npm run spike:erc8004
```

Record real tx hashes and blockers in ACTIVITY-LOG.md (every session) and IMPLEMENTATION-LOG.md (milestones). Never fabricate receipts.

## 7. Design constraints (do not violate)

- Allocation signal is **calibrated expected value**, not self-reported bids (MarketBench).
- v1 oracle: deterministic JSON Schema + ground-truth match (no LLM judge for slashing).
- Settlement: discriminatory `min(ask, reserve)` per hop; UCP is display-only in v1.
- `@trapeza/core` public API is the forkable primitive — keep the boundary clean.

## 8. Log the session

1. Append an [ACTIVITY-LOG.md](../../ACTIVITY-LOG.md) entry (author, manual/assisted, branch, done, files, verification).
2. Update [IMPLEMENTATION-LOG.md](../../IMPLEMENTATION-LOG.md) only if phase status or open items changed.
