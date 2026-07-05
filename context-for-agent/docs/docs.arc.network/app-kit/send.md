> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# App Kit: Send

> Send tokens between wallets on the same blockchain with App Kit's Send capability

[App Kit](/app-kit) includes the Send capability that lets you send tokens from
one wallet to another on the same blockchain. You can use an available
[token alias](/app-kit/references/supported-blockchains#token-aliases) or the
token's contract address.

## Quick look

This code snippet sends USDC from one wallet to another in a single method call:

```typescript TypeScript theme={null}
// Send 1.00 USDC to a wallet on Arc Testnet
const result = await kit.send({
  from: { adapter, chain: "Arc_Testnet" },
  to: "RECIPIENT_ADDRESS",
  amount: "1.00",
  token: "USDC",
});
```

For a complete end-to-end flow, follow the quickstart:
[Send Tokens Across Wallets](/app-kit/quickstarts/send-tokens-same-chain).

## Installation

[Install App Kit](/app-kit/tutorials/installation) to start sending tokens on
the same blockchain.
