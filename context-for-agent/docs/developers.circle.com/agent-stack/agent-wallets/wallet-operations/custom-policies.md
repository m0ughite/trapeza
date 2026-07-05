> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Set Spending Policies

> Set transfer limits or address allowlists and blocklists on your agent wallet to control how it can move USDC and interact with contracts.

Spending policies let you cap your agent wallet's USDC transfers over a rolling
time window, or restrict the wallet to specific recipient or contract addresses.
Policies apply to mainnet agent wallets only.

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v20.18.2 or later](https://nodejs.org/).

* Installed Circle CLI:

  ```bash theme={null}
  npm install -g @circle-fin/cli
  ```

* [Authenticated](/agent-stack/agent-wallets/wallet-operations/authenticate)
  your agent wallet.

<Note>
  Spending policies require a mainnet agent wallet. Testnet is not supported.
  Setting a policy triggers a second email OTP to confirm the change. The OTP is
  used once and not stored.
</Note>

## Steps

Choose the policy type that matches your goal.

<Tabs>
  <Tab title="Transfer limits">
    <Steps>
      <Step title="Set the limits">
        Run `circle wallet limit set` with per-transaction, daily, weekly, and
        monthly caps:

        ```bash theme={null}
        circle wallet limit set \
          --address 0xYourWalletAddress \
          --chain BASE \
          --policy-type stablecoin \
          --per-tx 100 \
          --daily 500 \
          --weekly 2000 \
          --monthly 5000
        ```

        Circle sends an email OTP to your agent session email to confirm the
        policy change. Limits must satisfy: per-transaction ≤ daily ≤ weekly
        ≤ monthly.
      </Step>

      <Step title="Verify the policy">
        Confirm the limits are in effect:

        ```bash theme={null}
        circle wallet limit --address 0xYourWalletAddress --chain BASE
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Allowlists and blocklists">
    Allowlists and blocklists restrict your wallet to specific recipient or
    contract addresses.

    <Steps>
      <Step title="Set the rule">
        Run `circle wallet limit set` with `--rule-type` and a bracketed,
        comma-separated `--targets` list of EVM addresses. The example below
        blocks transfers to two recipient addresses:

        ```bash theme={null}
        circle wallet limit set \
          --address 0xYourWalletAddress \
          --chain BASE \
          --policy-type stablecoin \
          --rule-type recipient-blocklist \
          --targets "[0xBAD1,0xBAD2]"
        ```

        `--rule-type` accepts:

        * `recipient-allowlist` / `recipient-blocklist`: allow or block USDC
          transfers to specific addresses.
        * `contract-allowlist` / `contract-blocklist`: allow or block contract
          interactions with specific addresses.

        Circle sends an email OTP to your agent session email to confirm the
        policy change.
      </Step>

      <Step title="Verify the policy">
        Confirm the rule is in effect:

        ```bash theme={null}
        circle wallet limit --address 0xYourWalletAddress --chain BASE
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options.
