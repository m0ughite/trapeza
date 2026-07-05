> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Arc Network

> A developer platform for onchain finance, built on a purpose-built Layer-1 blockchain with stablecoins, deterministic finality, and predictable fees.

Arc is a developer platform for building and scaling financial applications with
stablecoins. At its core is a purpose-built,
[EVM-compatible](/arc/references/evm-compatibility) Layer-1 network that
combines [predictable fiat-based fees](/arc/concepts/stable-fee-design) using
stablecoins as gas,
[sub-second deterministic finality](/arc/concepts/deterministic-finality), and
[opt-in configurable privacy](/arc/concepts/opt-in-privacy) to support payments,
lending, capital markets, and FX at scale.

Beyond the network, Arc provides [App Kit](/app-kit) for crosschain payment
workflows, [AI tooling](/ai/mcp) for agent-based development, and a growing
[ecosystem of infrastructure partners](/build#developer-tools).

## Key features

The Arc network is purpose-built for real-world economic activity, not
general-purpose computation. Each design choice directly supports the needs of
financial applications.

<CardGroup cols={2}>
  <Card title="Stable fee design" icon="dollar-sign" href="/arc/concepts/stable-fee-design">
    Transaction fees are denominated in USDC, so costs stay predictable
    regardless of token volatility.
  </Card>

  <Card title="Deterministic finality" icon="circle-check" href="/arc/concepts/deterministic-finality">
    Transactions finalize in under one second with no risk of chain
    reorganization.
  </Card>

  <Card title="Opt-in privacy" icon="eye-slash" href="/arc/concepts/opt-in-privacy">
    Confidential transfers and selective disclosure for regulated use cases,
    available when you need them.
  </Card>

  <Card title="EVM compatibility" icon="ethereum" href="/arc/references/evm-compatibility">
    Deploy existing Solidity contracts and use standard Ethereum tooling like
    Hardhat, Foundry, and Viem.
  </Card>
</CardGroup>

## Network architecture

Arc separates consensus from execution so each layer can optimize independently
while maintaining full compatibility with the Ethereum ecosystem.

* **[Consensus layer](/arc/concepts/consensus-layer)**: Built on Malachite, a
  BFT consensus engine designed for sub-second finality and high throughput. A
  permissioned validator set provides security and compliance guarantees while
  keeping the network open for developers and users.
* **[Execution layer](/arc/concepts/execution-layer)**: Runs the EVM, so
  Solidity contracts, development tools, and wallet infrastructure work without
  modification.

For a complete view of how the layers interact, see the
[system overview](/arc/concepts/system-overview).

## Stablecoins on Arc

USDC is the native [gas token](/arc/references/gas-and-fees) on Arc, so
transaction fees are denominated in dollars and you don't need to hold or manage
a separate token to transact. The base fee targets \$0.01 per transaction and
uses an [EIP-1559-style smoothing mechanism](/arc/concepts/stable-fee-design) to
keep costs predictable even under varying network load. USDC on Arc has both a
native representation (18 decimals, used for gas) and a standard
[ERC-20 interface (6 decimals)](/arc/references/evm-compatibility#erc-20-interface)
that matches USDC on other chains.

Arc also supports EURC for euro-denominated transfers. Both USDC and EURC are
available on the [Circle Faucet](https://faucet.circle.com/) for testnet
development, and their contract addresses are listed on the
[contract addresses](/arc/references/contract-addresses) page.

## Network details

| **Property**            | **Value**                 |
| ----------------------- | ------------------------- |
| Consensus               | Malachite BFT             |
| Execution environment   | EVM                       |
| Gas token               | USDC                      |
| Finality                | Deterministic, sub-second |
| Validator participation | Permissioned              |
| Developer access        | Permissionless            |

For RPC endpoints, chain ID, and connection details, see
[Connect to Arc](/arc/references/connect-to-arc). For deployed contract
addresses, see [contract addresses](/arc/references/contract-addresses).

## Start building

Ready to build on Arc? Head to the [Build](/build) section for quickstarts and
tutorials covering App Kit workflows, smart contract deployment, crosschain
bridging, and AI agent integration.
