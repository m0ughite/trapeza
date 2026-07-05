> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Circle Wallets

> Add secure, embedded wallets to your application with Circle's APIs and SDKs. Manage keys, sign transactions, and support multiple blockchains.

Circle Wallets helps you add secure, embedded
<Tooltip tip="Wallets hold the keys that grant access to assets on blockchain networks. Wallets let users store, send, receive, and spend digital assets.">wallets</Tooltip>
to your application so your users can hold and use digital assets without the
usual complexity of keys, infrastructure, and chain-specific details. You
integrate using REST APIs or Web and Mobile SDKs (Android and iOS).

## Key features

Circle Wallets gives you the building blocks to ship embedded wallets without
running key infrastructure or blockchain nodes yourself.

<AccordionGroup>
  <Accordion title="Key storage and signing" icon="key">
    You don't manage raw private keys. Circle secures keys with MPC or passkeys
    depending on wallet product; you get APIs to create wallets, sign
    transactions, and authorize actions. Key backup, rotation, and recovery are
    built in so you can focus on your app logic.
  </Accordion>

  <Accordion title="Unified APIs and SDKs" icon="server">
    One integration surface for REST APIs and Web or Mobile SDKs (Android and
    iOS). Create wallets, send transfers, and run contract calls from your
    backend or client. Same patterns across developer-controlled,
    user-controlled, and modular wallets based on the supported feature set for
    each product.
  </Accordion>

  <Accordion title="Managed blockchain infrastructure" icon="layer-group">
    Circle handles broadcasting, indexing, and balance and event data for
    supported chains. You don't run or maintain nodes. For chains where full
    infrastructure is not offered, use Signing APIs with your own node.
  </Accordion>

  <Accordion title="Multi-chain and token support" icon="coins">
    Support for multiple chains and token types (including ERC-20, ERC-721,
    ERC-1155 on EVM and SPL on Solana). Unified addressing on EVM so one wallet
    can share the same address across chains. See [Supported
    blockchains](/wallets/supported-blockchains) and [Monitored
    tokens](/wallets/monitored-tokens) for details.
  </Accordion>
</AccordionGroup>

## Products

<CardGroup cols={3}>
  <Card title="Developer-controlled wallets" icon="server" href="/wallets/dev-controlled">
    You create and operate wallets for your users. Best when you need to move
    funds or run actions on their behalf (for example, payouts or automation).
  </Card>

  <Card title="User-controlled wallets" icon="users" href="/wallets/user-controlled">
    Your users control their own wallets inside your app, with familiar sign-in
    (social, email, or PIN). Best when users should own and approve every
    transaction.
  </Card>

  <Card title="Modular wallets" icon="puzzle-piece" href="/wallets/modular">
    Your users control their wallets with passkeys and optional modules, like
    gasless. Best when you need passkey-based custody and flexible account
    configuration.
  </Card>

  <Card title="Gas Station" icon="gas-pump" href="/wallets/gas-station">
    Sponsor network fees so your users don't need to hold native tokens. Set
    policies and pay gas with your credit card.
  </Card>

  <Card title="Paymaster" icon="credit-card" href="/paymaster">
    Let users pay gas fees with USDC instead of native tokens using Circle's
    permissionless ERC-4337 paymaster contracts.
  </Card>

  <Card title="Compliance Engine" icon="shield-check" href="/wallets/compliance-engine">
    Automate transaction screening for AML and CTF compliance. Define rules,
    manage allowlists and blocklists, and review alerts.
  </Card>
</CardGroup>

## Get started

The right wallet product depends on who controls the wallet:

| Custody model                                       | Best for                                                   | Product                                                 |
| :-------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------ |
| You control the wallet                              | Payouts, automation, backend-initiated actions             | [Developer-controlled wallets](/wallets/dev-controlled) |
| Your users control the wallet with familiar sign-in | Consumer apps where users approve transactions             | [User-controlled wallets](/wallets/user-controlled)     |
| Your users control the wallet with passkeys         | Apps requiring phishing-resistant auth and account modules | [Modular wallets](/wallets/modular)                     |

Confirm blockchain support and account type compatibility before you start
building.

<CardGroup cols={2}>
  <Card title="Choose your wallet and account types" icon="compass" href="/wallets/account-types">
    Compare wallet products and account types (EOA, SCA, MSCA) to find the right
    fit for your application.
  </Card>

  <Card title="Supported blockchains" icon="link" href="/wallets/supported-blockchains">
    Check which blockchains and tokens are available for each wallet product.
  </Card>
</CardGroup>

## Explore key topics

Explore the following topics as you build. They apply to all wallet products.

<CardGroup cols={2}>
  <Card title="Signing and authorization" icon="pen" href="/wallets/signing-and-authorization-models">
    How transactions are initiated, authorized, and signed across wallet types.
  </Card>

  <Card title="Batch operations" icon="layer-group" href="/wallets/batch-operations">
    Run multiple operations in one request for supported wallet types and
    chains.
  </Card>

  <Card title="Key management" icon="key" href="/wallets/key-management">
    How keys are secured (MPC vs passkeys), who controls them, and node hosting
    options.
  </Card>

  <Card title="Wallet infrastructure" icon="server" href="/wallets/blockchain-infrastructure">
    Broadcasting, indexing, gas, and bundling; how Circle runs wallet
    infrastructure.
  </Card>
</CardGroup>
