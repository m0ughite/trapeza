> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Build on Arc

> Quickstarts, tutorials, and SDKs for building onchain finance applications on Arc.

Arc gives you a complete developer platform for building financial applications
with stablecoins. Use [App Kit](/app-kit) to add crosschain payment workflows in
a few lines of code, deploy smart contracts on a purpose-built L1 network, or
integrate third-party developer tools for RPC access, data indexing, and
compliance.

## Get started

<CardGroup cols={2}>
  <Card title="Connect to Arc" icon="plug" href="/arc/references/connect-to-arc">
    RPC endpoints, chain ID, and network configuration for Arc testnet.
  </Card>

  <Card title="Deploy on Arc" icon="rocket" href="/arc/tutorials/deploy-on-arc">
    Deploy, test, and interact with a Solidity smart contract on Arc.
  </Card>
</CardGroup>

## App Kit

[App Kit](/app-kit) is an SDK for building payment and liquidity workflows
across blockchains. Add bridging, swapping, token transfers, and unified
crosschain balances to your app in a few lines of code.

<CardGroup cols={2}>
  <Card title="Send" icon="paper-plane" href="/app-kit/send">
    Transfer tokens between wallets on the same blockchain.
  </Card>

  <Card title="Bridge" icon="bridge" href="/app-kit/bridge">
    Transfer USDC across blockchains using CCTP.
  </Card>

  <Card title="Swap" icon="arrows-rotate" href="/app-kit/swap">
    Exchange one token for another on the same blockchain.
  </Card>

  <Card title="Unified Balance" icon="coins" href="/app-kit/unified-balance">
    Combine USDC from multiple blockchains into a single, instantly spendable
    balance.
  </Card>
</CardGroup>

### App Kit quickstarts

| Quickstart                                                                                    | What you'll build                                                                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Send tokens](/app-kit/quickstarts/send-tokens-same-chain)                                    | Transfer stablecoins between wallets on the same blockchain.                                |
| [Bridge tokens across blockchains](/app-kit/quickstarts/bridge-tokens-across-blockchains)     | Bridge USDC between EVM chains, Solana, or using Circle Wallets.                            |
| [Swap tokens](/app-kit/quickstarts/swap-tokens-same-chain)                                    | Exchange one token for another on the same blockchain.                                      |
| [Swap tokens across chains](/app-kit/quickstarts/swap-tokens-crosschain)                      | Swap and bridge tokens in a single flow.                                                    |
| [Deposit and spend a Unified Balance](/app-kit/quickstarts/unified-balance-deposit-and-spend) | Deposit USDC from multiple chains into a Unified Balance, then spend on another blockchain. |
| [Delegate deposit and spend](/app-kit/quickstarts/unified-balance-delegate-deposit-and-spend) | Let a backend delegate wallet fund and spend a user's Unified Balance.                      |

See the full [installation guide](/app-kit/tutorials/installation) to get
started, or browse
[supported blockchains](/app-kit/references/supported-blockchains) and the
[SDK reference](/app-kit/references/sdk-reference).

## Network quickstarts

Step-by-step guides for working directly with the Arc network. Most tutorials
require an [Arc testnet RPC connection](/arc/references/connect-to-arc) and a
funded wallet.

| Quickstart                                                        | What you'll build                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Deploy contracts](/arc/tutorials/deploy-contracts)               | Deploy pre-audited ERC-20, ERC-721, and ERC-1155 templates with Circle Contracts. |
| [Interact with contracts](/arc/tutorials/interact-with-contracts) | Mint, transfer, and airdrop tokens using deployed contracts.                      |
| [Monitor contract events](/arc/tutorials/monitor-contract-events) | Set up webhooks and event monitors for onchain activity.                          |

## Developer tools

<CardGroup cols={2}>
  <Card title="Account abstraction" icon="wallet" href="/arc/tools/account-abstraction">
    Smart wallets, paymasters, and session keys from ecosystem providers.
  </Card>

  <Card title="Node providers" icon="server" href="/arc/tools/node-providers">
    Managed RPC access from Alchemy, QuickNode, Blockdaemon, and dRPC.
  </Card>

  <Card title="Data indexers" icon="database" href="/arc/tools/data-indexers">
    Query onchain data with Envio, Goldsky, The Graph, and Thirdweb.
  </Card>

  <Card title="Compliance" icon="shield-check" href="/arc/tools/compliance-vendors">
    Transaction monitoring and wallet screening from Elliptic and TRM Labs.
  </Card>
</CardGroup>

## Sample applications

Browse working examples and reference implementations in the
[sample apps](/arc/references/sample-applications) gallery.
