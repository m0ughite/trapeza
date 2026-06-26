# Trapeza — P0 Spike Setup

This explains how to obtain the credentials and testnet funds the two P0 spikes
need, and how to run them. Everything here is **Arc testnet only**.

## 0. Prerequisites

- **Node.js ≥ 20.6** (Node 22+ recommended — see the version note at the bottom).
- This repo cloned, with deps installed from the repo root:

  ```bash
  npm install
  ```

- Copy the env template and fill it in:

  ```bash
  cp .env.example .env
  ```

The spikes read `.env` (and `.env.local`) automatically from the repo root.

---

## 1. Create wallets

You need EVM keypairs. Generate throwaway ones with Foundry's `cast`:

```bash
cast wallet new          # run once per wallet you need
```

or any EVM key generator. You need, at minimum:

| Spike | Wallet(s) | Env var |
| --- | --- | --- |
| Nanopayment | Buyer (pays) | `BUYER_PRIVATE_KEY` |
| Nanopayment | Seller (receives) | `SELLER_ADDRESS` (address only) |
| ERC-8004 | Owner (registers) | `OWNER_PRIVATE_KEY` |
| ERC-8004 (optional reputation) | Validator (rates) | `VALIDATOR_PRIVATE_KEY` |

You can reuse one funded key for both `BUYER_PRIVATE_KEY` and
`OWNER_PRIVATE_KEY` if you want to run both spikes from a single wallet — they
don't conflict. Keep `SELLER_ADDRESS` distinct so you can see the payment land.

---

## 2. Fund the wallets from the Circle faucet

1. Go to **https://faucet.circle.com/**.
2. Select **Arc Testnet**.
3. Paste each wallet **address** and request USDC.

What each wallet needs:

- **Buyer** (`BUYER_PRIVATE_KEY`): just fund the address with Arc-testnet USDC
  from the faucet. **There is only one USDC balance.** On Arc, USDC *is* the
  native gas asset, and the ERC-20 at `0x3600000000000000000000000000000000000000`
  is merely a 6-decimal *interface* over that same balance (the native view uses
  18 decimals). So a single faucet drop simultaneously gives you gas (18-dec
  native view) **and** the x402 payment token (6-dec ERC-20 view) — there is no
  separate "ERC-20 funding" step. The spike prints both views; they will move
  together. (Ref: `context/.../arc/references/contract-addresses.md#usdc`.)
- **Owner** (`OWNER_PRIVATE_KEY`): needs USDC for gas (~0.006 USDC/tx).
- **Validator** (optional): same as owner — USDC for gas.

> No Circle API key is required for either default spike. Both use self-managed
> wallets. The nanopayment uses the public x402 batching facilitator; ERC-8004
> uses the deployed registries directly via `viem`.

---

## 3. Run the spikes

From the repo root:

```bash
# Spike 1 — one x402/Gateway USDC nanopayment, settled on Arc testnet
npm run spike:nanopayment

# Spike 2 — register one ERC-8004 identity NFT on Arc testnet
npm run spike:erc8004
```

Each spike does a **preflight** (checks the required env + on-chain balances) and
**stops with a clear `[BLOCKED]` message** if anything is missing. On success it
prints real explorer links (`https://testnet.arcscan.app/tx/…`). The scripts
never fabricate a tx hash — a hash only appears if the transaction actually
settled.

### What "success" looks like

- **Nanopayment:** a settled-amount line + a settlement tx link, and the payment
  visible on the seller's address page on arcscan.
- **ERC-8004:** an `Agent ID`, the registration tx link, and the identity NFT on
  the owner's address page on arcscan.

---

## 4. (Optional) Circle Developer-Controlled Wallets path

DESIGN.md §5 specifies Circle Dev-Controlled Wallets + Gas Station for the agent
**fleet** (P1+). The P0 ERC-8004 spike deliberately uses the simpler viem
self-managed path (one funded key). To use the Circle path later you'd add
`CIRCLE_API_KEY` + `CIRCLE_ENTITY_SECRET` (from https://console.circle.com,
with a registered Entity Secret) and call `createContractExecutionTransaction`
instead — the calling convention is in
`context/samples/context-arc/docs/docs.arc.network/arc/tutorials/register-your-first-ai-agent.md`.

---

## Node version note

DESIGN.md §5 specifies **Node 22**. The reference repo `arc-nanopayments` runs
its scripts with `node --experimental-transform-types`, which only exists on
Node 22+. This monorepo instead runs the TypeScript spikes with **`tsx`**, so it
works on Node ≥ 20.6. If you hit a runtime error from a Circle SDK that requires
a newer Node, switch to Node 22 (`nvm use 22`).
