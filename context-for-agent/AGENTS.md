# Agent context for Arc + Circle

This repo bundles developer documentation and sample codebases for
working on the **Arc** Layer-1 blockchain and the **Circle** developer
platform (USDC, EURC, CCTP, wallets, gateway, smart-contract platform,
etc.). It is consumed by AI agents (Claude Code, Cursor, Cody,
Continue, …) and synced into `~/.arc-canteen/context/` by
`arc-canteen context sync`.

## Layout

```
docs/
  docs.arc.network/         # Arc chain + App Kit docs (mirrored, .md per page)
    llms.txt                # the upstream index this mirror was built from
    arc-chain.md
    arc/concepts/*.md
    arc/references/*.md
    arc/tutorials/*.md
    arc/tools/*.md
    app-kit/**/*.md
    ai/mcp.md
    build/*.md
    integrate/*.md
  developers.circle.com/    # Circle developer platform docs
    llms.txt
    api-reference.md
    agent-stack/**/*.md     # Agent Stack — Circle CLI, Agent Wallets, x402 payments
    ai/mcp.md               # Circle MCP server setup
    ai/skills.md            # Circle Skills overview (the SKILL.md files live in circlefin-skills/)
    cctp/**/*.md
    contracts/**/*.md
    cpn/**/*.md
    gateway/**/*.md
    paymaster/**/*.md
    stablecoins/**/*.md
    stablefx/**/*.md
    wallets/**/*.md
    xreserve/**/*.md
    openapi/*.yaml          # OpenAPI specs for the Circle APIs
  circlefin-skills/         # SKILL.md files extracted from circlefin/skills
    use-arc.md
    use-usdc.md
    use-circle-wallets.md
    use-developer-controlled-wallets.md
    use-user-controlled-wallets.md
    use-modular-wallets.md
    use-gateway.md
    use-smart-contract-platform.md
    bridge-stablecoin.md
samples/                    # full sample codebases as git submodules
  arc-commerce/             # github.com/circlefin/arc-commerce
  arc-multichain-wallet/    # github.com/circlefin/arc-multichain-wallet
  arc-escrow/               # github.com/circlefin/arc-escrow
  arc-fintech/              # github.com/circlefin/arc-fintech
  arc-p2p-payments/         # github.com/circlefin/arc-p2p-payments
```

## Where to start

For most "build something on Arc" questions, the `circlefin-skills/`
files are the LLM-optimized entry points — they cover architecture
decisions, correct flows, and common pitfalls. Read the relevant
skill before diving into the per-page docs.

| Task                                            | Start with                                |
| ----------------------------------------------- | ----------------------------------------- |
| Anything Arc-specific (chain config, deploy)    | `circlefin-skills/use-arc.md`             |
| USDC transfers / balances / approvals           | `circlefin-skills/use-usdc.md`            |
| Crosschain USDC (CCTP, Bridge Kit)              | `circlefin-skills/bridge-stablecoin.md`   |
| Choosing a wallet type                          | `circlefin-skills/use-circle-wallets.md`  |
| Custodial / dev-controlled wallets              | `circlefin-skills/use-developer-controlled-wallets.md` |
| Embedded / user-controlled wallets              | `circlefin-skills/use-user-controlled-wallets.md` |
| Smart-contract wallets / 4337 / passkeys        | `circlefin-skills/use-modular-wallets.md` |
| Unified balance / nanopayments                  | `circlefin-skills/use-gateway.md`         |
| Contract templates, deploy, monitor             | `circlefin-skills/use-smart-contract-platform.md` |
| Building an AI agent that holds & spends USDC itself | `docs/developers.circle.com/agent-stack.md` (Circle CLI + Agent Wallets) |
| Onchain agent identity / job settlement (ERC-8004/8183) | `docs/docs.arc.network/build/agentic-economy.md` |
| Reference live SDK signatures / contract addrs  | docs/developers.circle.com/api-reference.md and openapi/*.yaml |

The Arc and Circle sides of "agents" are complements, not duplicates:
**Agent Stack** (`developers.circle.com/agent-stack.md`) is the *tooling* an
agent runs — Circle CLI (`@circle-fin/cli`), Agent Wallets, Gateway
nanopayments, the x402 service marketplace, and Circle Skills. The Arc
**Agentic Economy** docs cover the *onchain standards* agents settle with —
ERC-8004 identity/reputation and ERC-8183 job contracts — plus the `arc-escrow`
sample.

## Using arc-canteen against this context

The `arc-canteen` CLI uses the same Postgres session token to talk to:

- `arc-cli-server.thecanteenapp.com` for event logging (telemetry from
  `arc-canteen login`, `update-traction`, `update-product`, `events`)
- `rpc.testnet.arc-node.thecanteenapp.com` for JSON-RPC against the
  Arc testnet (`arc-canteen rpc <method> [params]`)

A typical interaction:

```bash
arc-canteen login                                # GitHub device flow → swrm_ token
arc-canteen rpc eth_chainId                      # → 0x4cef52
arc-canteen rpc eth_getBalance '["0xabc...", "latest"]'
```

The proxy enforces a method allowlist (read-mostly Eth RPC plus
`eth_sendRawTransaction`). The full list lives in the proxy code; if
you hit `method '<x>' not allowed by the proxy`, that method isn't
exposed by design.

## Refreshing the context

Run `arc-canteen context sync` to git-pull this repo (with submodules)
into `~/.arc-canteen/context/`. The upstream is
`https://github.com/the-canteen-dev/context-arc`.

## License and provenance

- `docs/docs.arc.network/`, `docs/developers.circle.com/`, and
  `docs/circlefin-skills/` are mirrors of upstream Circle content.
  Source URLs follow the mirrored path (e.g. `arc/concepts/foo.md` →
  `https://docs.arc.network/arc/concepts/foo.md`).
- `samples/` are git submodules pointing at the original `circlefin/*`
  repositories. Their licenses apply to each sample.
