> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Bridge USDC

> Move USDC from one blockchain to another using CCTP.

Bridge USDC across blockchains using [CCTP](/cctp). Circle handles attestation
and minting on the destination chain. You don't need a funded wallet or gas on
the destination.

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

Follow these steps to bridge USDC to another blockchain.

<Steps>
  <Step title="Check the fee">
    Get the estimated fee before bridging:

    ```bash theme={null}
    circle bridge get-fee ARB --chain BASE
    ```
  </Step>

  <Step title="Bridge USDC">
    Run `circle bridge transfer` with the destination chain, amount, and your
    wallet details:

    ```bash theme={null}
    circle bridge transfer ARB --amount 10.0 --address 0xYourWalletAddress --chain BASE
    ```

    USDC is burned on the source chain and minted on the destination. The
    command returns once the bridge is complete:

    ```json theme={null}
    {
      "data": {
        "message": "Bridge complete: 10.0 USDC from BASE to ARB",
        "burnTxHash": "0xabc...",
        "forwardTxHash": "0xdef...",
        "fromChain": "BASE",
        "toChain": "ARB"
      }
    }
    ```

    If the bridge is still processing, you can check its status:

    ```bash theme={null}
    circle bridge status 0xabc... --chain BASE
    ```
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including specifying a different recipient address on
the destination chain.
