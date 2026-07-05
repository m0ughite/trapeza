> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Create an Agent Wallet

> Get your first agent wallet set up in minutes.

Create an agent wallet and fund it with USDC on Base.

Prefer a guided setup?
[Prompt your AI agent](/agent-stack/agent-wallets#get-started) to set it up.

<Note>
  Your agent can only operate the wallet if it has access to the email address
  used during authentication. By default, only you receive the OTP. If you grant
  your agent access to your inbox, it can authenticate on your behalf and
  perform all wallet operations.
</Note>

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v20.18.2 or later](https://nodejs.org/).
* Installed Circle CLI:

  ```bash theme={null}
  npm install -g @circle-fin/cli
  ```

## Steps

Follow these steps to create an agent wallet and fund it with USDC.

<Steps>
  <Step title="Authenticate">
    ```bash theme={null}
    circle wallet login you@example.com
    ```

    <Note>
      To use testnet instead, add `--testnet` to the command. Sessions are
      stored separately for mainnet and testnet and expire after 7 days.
    </Note>

    On first run, Circle CLI prompts you to accept the Terms of Use and
    Privacy Policy. Then Circle sends a one-time password to verify your
    identity. After authentication, agent wallets are created automatically
    on all supported blockchains.
  </Step>

  <Step title="Get your wallet address">
    ```bash theme={null}
    circle wallet list --type agent --chain BASE
    ```

    Copy the wallet address returned. You will use it in the steps below.
  </Step>

  <Step title="Fund your wallet">
    Run `circle wallet fund` to add USDC to your wallet from another wallet you
    own. Replace `0xYourWalletAddress` with the address from the previous step:

    ```bash theme={null}
    circle wallet fund --address 0xYourWalletAddress --chain BASE --amount 10 --method crypto
    ```

    The CLI prints a terminal QR code and an
    [EIP-681](https://eips.ethereum.org/EIPS/eip-681) deposit URI. Scan the QR
    code with your mobile wallet to send the funds.

    To buy USDC with a card instead, pass `--method fiat` to open the onramp
    provider in your browser. See
    [Fund wallet](/agent-stack/agent-wallets/wallet-operations/fund) for all
    funding options.

    <Tip>
      To use testnet, replace `BASE` with a testnet blockchain (for example,
      `ARC-TESTNET`) and omit `--method` and `--amount`. Testnet wallets are
      auto-funded with 20 USDC from the Circle faucet. See
      [supported blockchains](/agent-stack/agent-wallets/supported-blockchains)
      for the full list.
    </Tip>
  </Step>

  <Step title="Check your balance">
    Confirm the funds arrived. Replace `0xYourWalletAddress` with your wallet
    address:

    ```bash theme={null}
    circle wallet balance --address 0xYourWalletAddress --chain BASE
    ```
  </Step>
</Steps>

## Next steps

Now that you have a funded wallet, you can:

* [Deposit for nanopayments](/agent-stack/agent-wallets/wallet-operations/nanopay)
  and
  [pay for a service](/agent-stack/agent-wallets/wallet-operations/pay-for-service).
* [Transfer USDC](/agent-stack/agent-wallets/wallet-operations/transfer) to
  another address.
* [Bridge USDC](/agent-stack/agent-wallets/wallet-operations/bridge) to another
  blockchain.
* [Swap tokens](/agent-stack/agent-wallets/wallet-operations/swap) using your
  agent wallet.
* Explore [wallet operations](/agent-stack/agent-wallets/wallet-operations) for
  more tasks.
