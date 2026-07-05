> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Deposit for Nanopayments

> Deposit USDC into Gateway to enable gas-free, sub-cent payments powered by Circle Gateway.

Nanopayments, powered by [Gateway](/gateway/nanopayments), enable gas-free USDC
payments at sub-cent scale, purpose-built for high-frequency agent transactions.
Deposit USDC into Gateway once, then make payments without incurring gas costs
on each transaction.

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v20.18.2 or later](https://nodejs.org/).

* Installed Circle CLI:

  ```bash theme={null}
  npm install -g @circle-fin/cli
  ```

* Completed the
  [Agent Wallets quickstart](/agent-stack/agent-wallets/quickstart)
  (authenticates and funds your wallet).

## Steps

Follow these steps to deposit USDC into Gateway and check your balance.

<Steps>
  <Step title="Deposit USDC into Gateway">
    Deposit USDC with your amount, wallet address, and blockchain:

    ```bash theme={null}
    circle gateway deposit --amount 5 --address 0xYourWalletAddress --chain BASE --method eco
    ```

    Eco deposits always settle on Polygon (`MATIC` on mainnet, `MATIC-AMOY`
    on testnet) regardless of the source blockchain. For supported source
    blockchains, see
    [Gateway supported blockchains](/gateway/references/supported-blockchains).

    <Note>
      Eco is a third-party fast-deposit service. Circle does not operate, endorse,
      or audit Eco. Review [Eco's
      docs](https://eco.com/docs/getting-started/programmable-addresses/gateway-deposits)
      and test the flow before using it in production.
    </Note>
  </Step>

  <Step title="Check your Gateway balance">
    Confirm the deposit arrived. Because the deposit used `--method eco`, the
    balance lives on `MATIC`:

    ```bash theme={null}
    circle gateway balance --address 0xYourWalletAddress --chain MATIC
    ```
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options.

## Next steps

* [Pay for a service](/agent-stack/agent-wallets/wallet-operations/pay-for-service)
  using your Gateway balance.
