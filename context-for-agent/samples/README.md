# Arc + Circle sample repos

Reference implementations bundled with Trapeza's agent context. **Read-only** — do not
modify these repos in place; copy patterns into `packages/` or `apps/`.

## Bundled samples

| Sample | Description | Trapeza relevance |
| --- | --- | --- |
| `arc-escrow/` | AI work validation + USDC escrow on Arc | **Bond escrow + slash** — fork `RefundProtocol.sol` |
| `arc-commerce/` | USDC payments for credit purchases | Circle Wallets + payment flows |
| `arc-multichain-wallet/` | Unified USDC balance + crosschain | Gateway unified balance patterns |
| `arc-fintech/` | Multichain treasury | Crosschain capital movement |
| `arc-p2p-payments/` | Gasless P2P payments on Arc | USDC transfer patterns |

## Clone on demand

These are referenced by Trapeza design docs but not bundled (large, own `.git`):

```bash
# x402 + Gateway + LangChain paying agent — Trapeza's primary x402 reference
git clone https://github.com/circlefin/arc-nanopayments context-for-agent/samples/arc-nanopayments
```

Also referenced in the hackathon spec but not bundled:

```bash
git clone https://github.com/the-canteen-dev/circle-agent context-for-agent/samples/circle-agent
```

Cloned repos are gitignored. Re-clone anytime.

## Docs and skills

Arc/Circle documentation and LLM skills live in `context-for-agent/docs/`:

- `circlefin-skills/` — start here for integration tasks
- `docs.arc.network/` — Arc chain docs
- `developers.circle.com/` — Circle platform docs

See [context-for-agent/AGENTS.md](../AGENTS.md) for the full routing table.
