> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Transfer USDC

> Send USDC from your agent wallet to another address on a supported blockchain.

The transfer confirms onchain before the command returns, so no manual polling
is required.

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

## Send USDC

Run `circle wallet transfer` with the recipient address, amount, and your wallet
details:

```bash theme={null}
circle wallet transfer 0xRecipient --amount 1.0 --address 0xYourWalletAddress --chain BASE
```

The command returns the result once the transaction reaches a terminal state:

```json theme={null}
{
  "data": {
    "id": "abc-123-...",
    "state": "CONFIRMED",
    "blockchain": "BASE",
    "txHash": "0xabc...",
    "sourceAddress": "0xYourWalletAddress",
    "destinationAddress": "0xRecipient",
    "amounts": ["1"],
    "operation": "TRANSFER"
  }
}
```

If the transfer fails, the command prints the reason. Check your wallet balance
and retry.

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including `--token` to transfer tokens other than USDC.
