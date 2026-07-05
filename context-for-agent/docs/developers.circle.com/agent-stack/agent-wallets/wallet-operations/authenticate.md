> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Authenticate an Agent Wallet

> Log in with your email to create an agent wallet session on all supported blockchains.

Authenticating creates an agent session and provisions agent wallets on all
[supported blockchains](/agent-stack/agent-wallets/supported-blockchains)
automatically. You only need to do this once per environment. Sessions last 7
days.

This is a prerequisite for all other wallet operations, including
[Fund wallet](/agent-stack/agent-wallets/wallet-operations/fund),
[Transfer USDC](/agent-stack/agent-wallets/wallet-operations/transfer),
[Bridge USDC](/agent-stack/agent-wallets/wallet-operations/bridge), and
[Pay for service](/agent-stack/agent-wallets/wallet-operations/pay-for-service).

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

Choose the flow that matches your environment. Use **Interactive** when you can
respond to prompts in a terminal. Use **Non-interactive** for scripts and AI
agents that can't respond to interactive prompts.

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run the login command">
        Run `circle wallet login` with your email address:

        ```bash theme={null}
        circle wallet login you@example.com
        ```

        <Note>
          To authenticate for testnet instead, add `--testnet` to the command.
          Sessions are stored separately for mainnet and testnet.
        </Note>

        On first run, Circle CLI prompts you to accept the Terms of Use and
        Privacy Policy.
      </Step>

      <Step title="Enter the one-time password">
        Check your email for the one-time password from Circle. Enter it in
        the terminal to verify your identity. You should see output similar
        to:

        ```text theme={null}
        Logged in as you@example.com
        ```

        Agent wallets are created automatically on all
        [supported blockchains](/agent-stack/agent-wallets/supported-blockchains).
      </Step>

      <Step title="Get your wallet address">
        List your wallets to find the address for the blockchain you want to
        use:

        ```bash theme={null}
        circle wallet list --type agent --chain BASE
        ```

        Copy the address returned. You'll need it for
        [funding your wallet](/agent-stack/agent-wallets/wallet-operations/fund),
        [transferring USDC](/agent-stack/agent-wallets/wallet-operations/transfer),
        [depositing for nanopayments](/agent-stack/agent-wallets/wallet-operations/nanopay),
        and other operations.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive (scripts and AI agents)">
    <Steps>
      <Step title="Initialize the login">
        Run `circle wallet login` with `--init` to send the OTP and capture a
        request ID. The `CIRCLE_ACCEPT_TERMS=1` prefix accepts the Circle CLI
        Terms of Use and Privacy Policy so the command doesn't pause for
        input on first run:

        ```bash theme={null}
        CIRCLE_ACCEPT_TERMS=1 circle wallet login you@example.com --init
        ```

        The CLI prints a request ID. Request IDs expire after 10 minutes and
        are consumed on first use.
      </Step>

      <Step title="Complete the login">
        Pass the request ID and the OTP from your inbox:

        ```bash theme={null}
        circle wallet login --request <request-id> --otp B1X-123456
        ```

        OTP codes are alphanumeric. Once login completes, agent wallets are
        created automatically on all
        [supported blockchains](/agent-stack/agent-wallets/supported-blockchains).
      </Step>

      <Step title="Get your wallet address">
        List your wallets to find the address for the blockchain you want to
        use:

        ```bash theme={null}
        circle wallet list --type agent --chain BASE
        ```

        Copy the address returned. You'll need it for
        [funding your wallet](/agent-stack/agent-wallets/wallet-operations/fund),
        [transferring USDC](/agent-stack/agent-wallets/wallet-operations/transfer),
        [depositing for nanopayments](/agent-stack/agent-wallets/wallet-operations/nanopay),
        and other operations.
      </Step>
    </Steps>
  </Tab>
</Tabs>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options.
