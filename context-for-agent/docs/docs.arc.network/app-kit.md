> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# App Kit

> Build payment and liquidity workflows across blockchains with App Kit

The Arc App Kit SDK helps you ship multichain payment and liquidity experiences
in just a few lines of code. Instead of orchestrating separate, low-level
protocol flows for each blockchain or use case, you use one type-safe interface
to combine [capabilities](#core-capabilities) into a coherent product flow. It
works with Viem, Ethers, Solana Web3.js, and Circle Wallets, and you can extend
it to support other wallet providers and frameworks.

## Quick install

To get started quickly, install the core package and the Viem adapter:

<CodeGroup>
  ```bash npm theme={null}
  npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem
  ```

  ```bash yarn theme={null}
  yarn add @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem
  ```
</CodeGroup>

Need a different adapter or standalone packages? See the full
[installation](/app-kit/tutorials/installation) guide.

## Core capabilities

Combine and use any of App Kit's core capabilities in your app.

<CardGroup cols={3}>
  <Card title="Bridge" icon="bridge" href="/app-kit/bridge">
    Transfer USDC across blockchains.
  </Card>

  <Card title="Swap" icon="arrows-rotate" href="/app-kit/swap">
    Exchange one token for another on the same blockchain.
  </Card>

  <Card title="Send" icon="paper-plane" href="/app-kit/send">
    Transfer tokens between wallets on the same blockchain.
  </Card>

  <Card title="Unified Balance" icon="layer-group" href="/app-kit/unified-balance">
    Create a chain-abstracted balance and spend it instantly.
  </Card>
</CardGroup>

## Key benefits

* **Simple setup**: Get up and running with minimal configuration and a few
  lines of code.
* **Application monetization**: Collect a custom fee from end users without
  writing new code.
* **Flexible configurations**: Specify custom RPC endpoints and wallet clients.
* **Broad compatibility**: Works with Viem, Ethers, Solana, and Circle Wallets,
  integrating smoothly with existing developer workflows.
* **Protocol abstraction**: Build against a single interface over underlying
  protocols such as [Gateway](https://developers.circle.com/gateway) and
  [CCTP](https://developers.circle.com/cctp).
* **Composable workflows**: Combine multiple capabilities in one product flow
  without stitching together separate protocol integrations.

## Quick look

The following examples show how each capability can be integrated with a single
method call.

<Tabs>
  <Tab title="Bridge">
    ```typescript TypeScript theme={null}
    // Transfer 1.00 USDC from Ethereum to Arc
    const result = await kit.bridge({
      from: { adapter: viemAdapter, chain: "Ethereum_Sepolia" },
      to: { adapter: viemAdapter, chain: "Arc_Testnet" },
      amount: "1.00",
    });
    ```

    Ready to start bridging? Follow the
    [quickstart](/app-kit/quickstarts/bridge-tokens-across-blockchains).
  </Tab>

  <Tab title="Swap">
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

    Ready to start swapping? Follow the quickstart:
    [Swap Tokens on a Blockchain](/app-kit/quickstarts/swap-tokens-same-chain).
  </Tab>

  <Tab title="Unified Balance">
    ```typescript TypeScript theme={null}
    // Deposit 1.00 USDC into the Unified Balance from Base
    const depositBase = await kit.unifiedBalance.deposit({
      from: { adapter: viemAdapter, chain: "Base_Sepolia" },
      amount: "1.00",
      token: "USDC",
    });
    // Deposit 1.00 USDC into the Unified Balance from Arbitrum
    const depositArb = await kit.unifiedBalance.deposit({
      from: { adapter: viemAdapter, chain: "Arbitrum_Sepolia" },
      amount: "1.00",
      token: "USDC",
    });
    // Spend 1.50 USDC from the Unified Balance on Arc
    const spendResult = await kit.unifiedBalance.spend({
      from: { adapter: viemAdapter },
      amountIn: "1.50",
      to: {
        adapter: viemAdapter,
        chain: "Arc_Testnet",
        recipientAddress: "0xRecipientAddress",
      },
    });
    ```

    Ready to start using a Unified Balance? Follow the quickstarts:

    * [Deposit and Spend a Unified Balance](/app-kit/quickstarts/unified-balance-deposit-and-spend)
    * [Use a Delegate to Deposit and Spend a Unified Balance](/app-kit/quickstarts/unified-balance-delegate-deposit-and-spend)
  </Tab>

  <Tab title="Send">
    ```typescript TypeScript theme={null}
    // Send 1.00 USDC from one wallet to another on Arc Testnet
    const result = await kit.send({
      from: { adapter, chain: "Arc_Testnet" },
      to: "RECIPIENT_ADDRESS",
      amount: "1.00",
      token: "USDC",
    });
    ```

    Ready to start sending tokens? Follow the quickstart:
    [Send Tokens Across Wallets](/app-kit/quickstarts/send-tokens-same-chain).
  </Tab>
</Tabs>

Want to combine capabilities? Follow the
[Swap Tokens Across Chains](/app-kit/quickstarts/swap-tokens-crosschain)
quickstart to swap and bridge tokens in the same flow.
