> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# App Kit: Swap

> Swap stablecoins and native tokens on the same blockchain with App Kit's Swap capability

[App Kit](/app-kit) includes the Swap capability that lets you swap two tokens
on the same blockchain in a few lines of code. It
[supports](/app-kit/references/supported-blockchains#supported-tokens) many
stablecoins (including USDC, EURC, USDT, USDe, DAI, and PYUSD) and native tokens
on supported blockchains. You need a (free)
[kit key](https://developers.circle.com/w3s/keys#kit-keys) from the
[Circle Console](https://console.circle.com) to use Swap.

<Note>
  Among testnets, only Arc Testnet supports Swap (USDC, EURC, and cirBTC only).
  Use mainnet for Swap on any other blockchains.
</Note>

## Quick look

This example swaps USDC for EURC in a single method call:

```typescript TypeScript theme={null}
// Swap 1.00 USDC for EURC on Arc Testnet
const result = await kit.swap({
  from: { adapter: viemAdapter, chain: "Arc_Testnet" },
  tokenIn: "USDC",
  tokenOut: "EURC",
  amountIn: "1.00",
  config: {
    kitKey: process.env.KIT_KEY as string, // Your kit key from the Circle Console
  },
});
```

For a complete end-to-end flow, follow the quickstart:
[Swap Tokens on a Blockchain](/app-kit/quickstarts/swap-tokens-same-chain).

## Installation

App Kit comes with the Swap capability installed by default. If you've already
[installed App Kit](/app-kit/tutorials/installation), you can skip this section.
If you only need to swap and don't want the full App Kit, you can install just
the Swap package.

Install the Swap package and the adapter that matches your environment:

<Tabs>
  <Tab title="Viem">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/swap-kit @circle-fin/adapter-viem-v2 viem
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/swap-kit @circle-fin/adapter-viem-v2 viem
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Ethers">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/swap-kit @circle-fin/adapter-ethers-v6 ethers
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/swap-kit @circle-fin/adapter-ethers-v6 ethers
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Solana">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/swap-kit @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/swap-kit @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Circle Wallets">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/swap-kit @circle-fin/adapter-circle-wallets
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/swap-kit @circle-fin/adapter-circle-wallets
      ```
    </CodeGroup>
  </Tab>
</Tabs>
