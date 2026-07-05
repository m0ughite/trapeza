> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Dev-Controlled Wallets

> Understand how dev-controlled wallets work, when to use them, and how Circle enables programmatic wallet infrastructure.

Dev-controlled wallets are blockchain wallets you manage programmatically from
your application. You control wallet creation, transaction execution, and
signing through Circle APIs and SDKs. For a comparison of all wallet products,
see [Choose your wallet product and account types](/wallets/account-types).

## Key features

<CardGroup cols={2}>
  <Card title="API-driven" icon="server">
    Create wallets and send transactions with Circle APIs and SDKs. No node
    setup or low-level signing required for supported chains. For unsupported chains, bring your own node with [Signing APIs](/wallets/signing-apis).
  </Card>

  <Card title="You retain custody" icon="key">
    Your
    <Tooltip tip="A 32-byte secret that secures your dev-controlled wallets. Circle never stores it; you pass it in API calls to authorize signing. You are responsible for keeping it safe.">entity secret</Tooltip>
    stays with you: built-in encryption, registration, rotation, and recovery
    keep compliance and custody clear.
  </Card>

  <Card title="Web3 for users" icon="users">
    Run transfers, smart contract interactions, and other onchain actions on
    behalf of your users so they can hold and use digital assets without
    managing keys or understanding blockchain details.
  </Card>

  <Card title="Scalability" icon="layer-group">
    Scale to many wallets across chains from a single entity secret. Support for
    unified EVM addresses and high throughput.
  </Card>
</CardGroup>

Dev-controlled wallets are designed for server-side, automated, or custodial use
cases. You define policies, execute transactions, and manage wallet operations.
Unlike user-controlled wallets, end users don't control the private keys
directly.

## What you can build

Use dev-controlled wallets when you need funds you control, automation, or many
wallets from a single API. Here are some common use cases:

<AccordionGroup>
  <Accordion title="Custodial wallets" icon="wallet">
    You hold and manage assets on behalf of users; they don't control keys
    directly. You create and fund wallets per user or account, execute
    withdrawals and transfers when users request them, and enforce your own
    policies (limits, KYC, fraud checks) before any onchain action.
  </Accordion>

  <Accordion title="Treasury and liquidity management" icon="building-columns">
    Manage platform reserves, liquidity pools, and rebalancing from programmatic
    wallets. You hold and move funds between pools or protocols, execute
    rebalancing or yield strategies, and keep operational and reserve wallets
    under one entity secret and API surface.
  </Accordion>

  <Accordion title="Automated payouts" icon="paper-plane">
    Run scheduled or event-driven disbursements to many recipients. You trigger
    payouts (payroll, rebates, refunds, incentives) to a list of addresses or to
    wallets you create per recipient, with full control over timing, amounts,
    and auditability.
  </Accordion>

  <Accordion title="Exchange or marketplace infrastructure" icon="chart-network">
    Use programmatic wallets for deposits, withdrawals, and settlement. Incoming
    funds land in wallets you control; you move assets between hot/cold or
    operational wallets, process withdrawals to user addresses, and settle
    marketplace or P2P trades without handing keys to end users.
  </Accordion>

  <Accordion title="Gaming or rewards systems" icon="coins">
    Power in-game or loyalty balances and automated distribution. You create and
    fund wallets for players or reward recipients. You credit and debit balances
    using your logic, then run batch payouts or airdrops without each user
    managing their own keys.
  </Accordion>
</AccordionGroup>

## Account types

On EVM chains, a developer-controlled wallet is created as either an externally
owned account (EOA) or a smart contract account (SCA). Pick one based on your
needs. For non-EVM chains such as Aptos or Solana, see
[Choose your wallet product and account types](/wallets/account-types) for a
full breakdown by blockchain.

<CardGroup cols={2}>
  <Card title="EOA (Externally Owned Account)" icon="wallet">
    Select when the source wallet can hold native token for gas, you want simple
    key-controlled accounts, and you don't need multiple operations in one
    transaction (batch execution).
  </Card>

  <Card title="SCA (Smart Contract Account)" icon="cube">
    Select when you need gas paid by a relayer or platform (gas sponsorship),
    batch execution, or other programmable behavior. For details on gas
    sponsorship, see [Gas Station](/wallets/gas-station).
  </Card>
</CardGroup>

## Get started

Create your first dev-controlled wallet or jump straight to a fee-paying
transfer after the quickstart:

<CardGroup cols={2}>
  <Card title="Create a dev-controlled wallet" icon="wallet" href="/wallets/dev-controlled/create-your-first-wallet">
    Create a wallet set and EOA wallet on Arc Testnet, then use it in the
    transfer and signing guides.
  </Card>

  <Card title="Send a transaction with fee" icon="arrow-right-arrow-left" href="/wallets/dev-controlled/transfer-tokens-across-wallets">
    Send USDC from one dev-controlled wallet to another and verify the recipient
    balance.
  </Card>
</CardGroup>
