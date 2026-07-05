> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Circle CLI

> A command-line tool to access Circle's product suite, including agent wallets, x402-compatible payments, and crosschain transfers.

Circle CLI gives developers and AI agents a unified interface for onchain
operations. Create and manage wallets, transfer, swap, and bridge USDC across
blockchains, execute smart contracts, and discover or pay for services. All
through a single command interface, without integrating multiple APIs and SDKs.

Use Circle CLI to access:

* **[Agent Wallets](/agent-stack/agent-wallets)**: Wallets with email OTP
  authentication, full onchain capabilities, and customizable policy
  enforcement.
* **Local wallets**: Self-custodial wallets imported from a private key or
  mnemonic, stored using the
  [Open Wallet Standard](https://github.com/open-wallet-standard/core).
* **Circle products**: [CCTP](/cctp) for USDC bridging and [Gateway](/gateway)
  for [x402 nanopayments](/gateway/nanopayments).

## Installation

Install Circle CLI from [npm](https://www.npmjs.com/) (requires
[Node.js v20.18.2 or later](https://nodejs.org/)):

```bash theme={null}
npm install -g @circle-fin/cli
```

Verify the installation:

```bash theme={null}
circle --version
```

Once installed, you can run any
[Circle CLI command](/agent-stack/circle-cli/command-reference).

## Get started

<CardGroup cols={2}>
  <Card title="Create an Agent Wallet" icon="wallet" href="/agent-stack/agent-wallets/quickstart">
    Create an agent wallet and fund it with USDC.
  </Card>

  <Card title="CLI Command Reference" icon="book" href="/agent-stack/circle-cli/command-reference">
    All Circle CLI commands, options, and examples.
  </Card>
</CardGroup>
