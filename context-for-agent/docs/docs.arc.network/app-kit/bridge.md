> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# App Kit: Bridge

> Transfer USDC across blockchains with App Kit's Bridge capability

[App Kit](/app-kit) includes the Bridge capability that lets you move USDC
across blockchains in a few lines of code. It abstracts the underlying
[CCTP](https://developers.circle.com/cctp) flow so you can bridge without
orchestrating the low-level burn, attestation, and mint steps yourself.

## Quick look

This code snippet bridges between an EVM and non-EVM chain in a single method
call:

```typescript TypeScript theme={null}
// Transfer 1.00 USDC from Solana to Arc
const result = await kit.bridge({
  from: { adapter: solanaAdapter, chain: "Solana_Devnet" },
  to: { adapter: viemAdapter, chain: "Arc_Testnet" },
  amount: "1.00",
});
```

For a complete end-to-end flow, follow the
[quickstart](/app-kit/quickstarts/bridge-tokens-across-blockchains).

## Installation

App Kit comes with the Bridge capability installed by default. If you've already
[installed App Kit](/app-kit/tutorials/installation), you can skip this section.
If you only need to bridge and don't want the full App Kit, you can follow the
steps below to install just the Bridge package.

Install the Bridge package and the adapter that matches your environment:

<Steps>
  <Step title="Install the Bridge package">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/bridge-kit
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/bridge-kit
      ```
    </CodeGroup>
  </Step>

  <Step title="Install adapters">
    Install the [adapters](/app-kit/tutorials/adapter-setups) you need for the
    chains you plan to bridge between.

    <Tabs>
      <Tab title="Viem">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-viem-v2 viem
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-viem-v2 viem
          ```
        </CodeGroup>
      </Tab>

      <Tab title="Ethers">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-ethers-v6 ethers
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-ethers-v6 ethers
          ```
        </CodeGroup>
      </Tab>

      <Tab title="Solana">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
          ```
        </CodeGroup>
      </Tab>

      <Tab title="Circle Wallets">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-circle-wallets
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-circle-wallets
          ```
        </CodeGroup>
      </Tab>
    </Tabs>
  </Step>
</Steps>
