# Trapeza

A calibration-aware **broker / clearinghouse** for agent-to-agent nanopayment
markets. Settlement on **Arc** in **USDC** via **x402 + Circle Gateway**;
identity/reputation via **ERC-8004**. See [`DESIGN.md`](./DESIGN.md) for the
locked architecture and [`DESIGN-CLEARINGHOUSE.md`](./DESIGN-CLEARINGHOUSE.md)
for the graph-clearing extension.

## Monorepo layout

```
packages/
  core/             @trapeza/core            forkable primitive: data models,
                                             interfaces, pipeline signatures, the
                                             clearinghouse seam. No UI/MCP/chain
                                             SDK inline (DESIGN.md §4.3).
  adapter-arc/      @trapeza/adapter-arc     Arc + ERC-8004 (+ future escrow).
                    └─ scripts/spike-erc8004-identity.ts
  adapter-gateway/  @trapeza/adapter-gateway Circle Gateway / x402 settlement.
                    └─ scripts/spike-nanopayment.ts
apps/               app layer (MCP, sim, dashboard) — placeholder until P4–P5.
```

The **module boundary is the point**: `@trapeza/core` is chain-agnostic; every
Circle/Arc specific call lives in an adapter; the app layer (later) imports only
`@trapeza/core`.

## P0 status (this spike)

P0 de-risks the two hardest on-chain primitives. Both spike scripts are
**ready-to-run** and perform real on-chain transactions once credentials/funds
are supplied:

```bash
npm install
cp .env.example .env      # then fill it in — see SETUP.md
npm run spike:nanopayment # one x402/Gateway USDC nanopayment on Arc testnet
npm run spike:erc8004     # register one ERC-8004 identity on Arc testnet
npm run typecheck         # type-check core + both adapters
```

See [`SETUP.md`](./SETUP.md) for wallets, funding, and exactly what each spike
needs.
