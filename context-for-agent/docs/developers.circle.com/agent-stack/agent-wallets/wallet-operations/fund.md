> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Fund an Agent Wallet

> Add USDC to your agent wallet using a wallet transfer or fiat onramp.

Add USDC to your agent wallet before sending transfers or paying for services.

This is a prerequisite for
[transferring USDC](/agent-stack/agent-wallets/wallet-operations/transfer),
[bridging USDC](/agent-stack/agent-wallets/wallet-operations/bridge),
[paying for services](/agent-stack/agent-wallets/wallet-operations/pay-for-service),
and other operations that spend USDC.

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v20.18.2 or later](https://nodejs.org/).

* Installed Circle CLI:

  ```bash theme={null}
  npm install -g @circle-fin/cli
  ```

* [Authenticated](/agent-stack/agent-wallets/wallet-operations/authenticate)
  your agent wallet.

## Steps

<Steps>
  <Step title="Fund your wallet">
    Run `circle wallet fund` with your wallet address, blockchain, amount, and
    method (crypto or fiat). Replace `0xYourWalletAddress` with your wallet
    address.

    <Tabs>
      <Tab title="Crypto">
        ```bash theme={null}
        circle wallet fund --address 0xYourWalletAddress \
          --chain BASE --amount 10 --method crypto
        ```

        The CLI prints a terminal QR code and an
        [EIP-681](https://eips.ethereum.org/EIPS/eip-681) deposit URI. Scan
        the QR code with your mobile wallet to send the funds. Pass
        `--export <dir>` to save a PNG instead, or `--open` to render the QR
        code in a browser tab.
      </Tab>

      <Tab title="Fiat">
        ```bash theme={null}
        circle wallet fund --address 0xYourWalletAddress \
          --chain BASE --amount 10 --method fiat
        ```

        Your browser opens to the onramp provider where you can purchase USDC
        with a card or bank transfer. Pass `--no-open` to print the URL
        instead of opening the browser.
      </Tab>
    </Tabs>

    <Note>
      To use testnet, replace `BASE` with a testnet blockchain (for example,
      `ARC-TESTNET`) and omit `--method` and `--amount`. Testnet wallets are
      auto-funded with 20 USDC from the Circle faucet. See
      [supported blockchains](/agent-stack/agent-wallets/supported-blockchains)
      for the full list.
    </Note>
  </Step>

  <Step title="Verify the funds arrived">
    Check your balance to confirm the deposit:

    ```bash theme={null}
    circle wallet balance --address 0xYourWalletAddress --chain BASE
    ```
  </Step>
</Steps>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options, including `--token` to fund with ETH or native tokens.
