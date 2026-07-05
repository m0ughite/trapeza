> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# API Reference

> Overview of Circle's available APIs and endpoints.

Circle provides a suite of REST APIs for building financial applications on
blockchain infrastructure. Whether you're creating wallets, deploying smart
contracts, moving USDC across blockchains, or building institutional payment
flows, there is an API tailored to your use case.

## Before you begin

Many Circle APIs require an API key to authenticate requests. Permissionless
products like CCTP and Gateway are open and require no API key.

<CardGroup cols={2}>
  <Card title="API keys" icon="key" href="/api-reference/keys">
    Learn about API keys, client keys, and kit keys, and how to authenticate
    requests to Circle's platform
  </Card>

  <Card title="Idempotent requests" icon="arrows-rotate" href="/api-reference/idempotent-requests">
    Use idempotency keys to safely retry API calls without creating duplicate
    operations
  </Card>
</CardGroup>

## Available APIs

<CardGroup cols={2}>
  <Card title="Wallets" icon="wallet" href="/api-reference/wallets/common/ping">
    Create and manage developer-controlled and user-controlled wallets, execute
    transactions, and sign messages across EVM, Solana, and other supported
    blockchains
  </Card>

  <Card title="Contracts" icon="file-contract" href="/api-reference/contracts/common/ping">
    Deploy and interact with smart contracts using Circle's managed
    infrastructure, including event monitoring and contract templates
  </Card>

  <Card title="CCTP" icon="bridge" href="/api-reference/cctp/all/get-public-keys-v2">
    Fetch attestations and support native USDC transfers across blockchains
    using Cross-Chain Transfer Protocol
  </Card>

  <Card title="Gateway" icon="dungeon" href="/api-reference/gateway/all/get-token-balances">
    Access and manage a unified USDC balance across multiple blockchains with
    instant transfers in under 500 ms
  </Card>

  <Card title="Circle Mint" icon="building-columns" href="/api-reference/circle-mint/account/list-business-balances">
    Manage USDC and EURC balances, process crypto deposits and payouts, execute
    cross-currency trades, and manage reserves
  </Card>

  <Card title="Circle Payments Network" icon="chart-network" href="/api-reference/cpn/common/ping">
    Route and settle stablecoin payments across Circle's network with support
    for quotes, payments, and transactions
  </Card>

  <Card title="StableFX" icon="swap" href="/api-reference/stablefx/all/create-quote">
    Request quotes and execute institutional FX trades between USDC and EURC
    with onchain settlement on Arc
  </Card>

  <Card title="xReserve" icon="vault" href="/api-reference/xreserve/all/get-balances">
    Deposit USDC into xReserve, retrieve attestations, and manage withdrawals
    for USDC-backed stablecoins
  </Card>
</CardGroup>
