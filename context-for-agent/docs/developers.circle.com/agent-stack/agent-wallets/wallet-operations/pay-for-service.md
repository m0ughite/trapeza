> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Pay for a Service

> Discover and pay for x402-compatible API services using USDC.

Pay for [x402](/gateway/nanopayments/concepts/x402)-compatible API services
directly from your agent wallet. Payment is processed before the request is
forwarded to the service.

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

<Note>
  Most x402 services require a Gateway balance. See [Deposit for
  nanopayments](/agent-stack/agent-wallets/wallet-operations/nanopay) to set one
  up.
</Note>

## Steps

Follow these steps to find and pay for a service.

<Steps>
  <Step title="Find a service">
    Browse available services at
    [agents.circle.com/services](https://agents.circle.com/services), or search
    by keyword from the CLI:

    ```bash theme={null}
    circle services search "weather data"
    ```

    To inspect the payment requirements for a specific URL before paying:

    ```bash theme={null}
    circle services inspect https://api.example.com/weather
    ```
  </Step>

  <Step title="Pay for the service">
    Run `circle services pay` with the service URL and your wallet details. Use
    `--max-amount` to set a spending cap and avoid unexpected charges. Use
    `--estimate` to preview payment requirements without paying:

    ```bash theme={null}
    # Preview payment requirements without paying
    circle services pay https://api.example.com/weather \
      --address 0xYourWalletAddress \
      --chain BASE \
      --estimate

    # Pay for the service
    circle services pay https://api.example.com/weather \
      --address 0xYourWalletAddress \
      --chain BASE \
      --max-amount 0.01
    ```

    The API response body from the service is returned.
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including `-X` for HTTP method and `-d` for a request
body.
