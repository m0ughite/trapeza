> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Swap Tokens

> Swap one token for another from your agent wallet.

Swap tokens from your agent wallet using `circle wallet swap`. Optionally get a
price quote first to verify the expected output before committing funds.

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

<Steps>
  <Step title="Get a quote (optional)">
    Run `circle wallet swap` with `--quote` to see the estimated output without
    executing the swap:

    ```bash theme={null}
    circle wallet swap EURC 10 USDC --chain BASE --quote
    ```

    ```json theme={null}
    {
      "data": {
        "message": "Quote: 10 EURC → ~9.95 USDC (min 0.000001) on BASE",
        "sellToken": "EURC",
        "sellAmount": "10",
        "buyToken": "USDC",
        "chain": "BASE",
        "estimatedOutput": "9.95",
        "stopLimit": "0.000001"
      }
    }
    ```
  </Step>

  <Step title="Swap tokens">
    Run `circle wallet swap` with your wallet address and a `<buyAmount>`
    stop-limit. If the estimated output falls below this value onchain, the swap
    fails instead of settling at an unfavorable rate:

    ```bash theme={null}
    circle wallet swap EURC 10 USDC 9.9 --address 0xYourWalletAddress --chain BASE
    ```

    ```json theme={null}
    {
      "data": {
        "message": "Swap complete: 10 EURC → min 9.9 USDC on BASE",
        "sellToken": "EURC",
        "sellAmount": "10",
        "buyToken": "USDC",
        "buyMin": "9.9",
        "chain": "BASE"
      }
    }
    ```
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including `--slippage-bps` to set maximum slippage.
