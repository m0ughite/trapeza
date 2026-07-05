> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Execute a Smart Contract

> Call a write function on a smart contract from your agent wallet.

Execute write functions on any smart contract from your agent wallet. Common
uses include approving token allowances, interacting with DeFi protocols, or
calling custom contract logic.

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

Follow these steps to execute a smart contract function.

<Steps>
  <Step title="Find the contract address">
    For Circle contracts (USDC, CCTP, Gateway), look up the address for your
    blockchain:

    ```bash theme={null}
    circle contract address usdc --chain BASE
    ```
  </Step>

  <Step title="Execute the contract function">
    Run `circle wallet execute` with the ABI function signature, parameters,
    and contract address:

    ```bash theme={null}
    circle wallet execute "approve(address,uint256)" 0xSpender 1000000 \
      --contract 0xUSDC \
      --address 0xYourWalletAddress \
      --chain BASE
    ```

    The CLI waits for the transaction to reach a terminal state and returns the
    result:

    ```json theme={null}
    {
      "data": {
        "id": "abc-123-...",
        "state": "CONFIRMED",
        "blockchain": "BASE",
        "txHash": "0xabc...",
        "operation": "CONTRACT_EXECUTION",
        "contractAddress": "0xUSDC",
        "abiFunctionSignature": "approve(address,uint256)"
      }
    }
    ```

    If the transaction fails, the CLI prints the reason. Verify the contract
    address, function signature, and parameters, then retry.
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including `--amount` to send native token value with
the call.
