> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Circle Gateway

Circle Gateway enables a unified USDC balance across multiple blockchains.
Deposit USDC to non-custodial Gateway Wallet contracts on any supported source
blockchain, then mint USDC instantly (\<500 ms) on any destination blockchain
using a single API call.

Gateway is fully permissionless, and you can start integrating with it
immediately with no sign-up needed. Check out the quickstart guides for
[EVM](/gateway/quickstarts/unified-balance-evm) and
[Solana](/gateway/quickstarts/unified-balance-solana).

<Tip>
  **Use
  [Unified Balance Kit](https://www.npmjs.com/package/@circle-fin/unified-balance-kit)
  to simplify Gateway integrations.**

  Unified Balance Kit handles deposit, transfer, and spend flows so you can build
  Gateway-powered features in just a few lines of code.
</Tip>

## Key features

<CardGroup cols={3}>
  <Card title="Unified crosschain balance" icon="layer-group">
    Hold USDC across multiple blockchains and access it as a single balance on
    any supported destination blockchain
  </Card>

  <Card title="Instant transfers" icon="bolt">
    Transfer USDC in under 500 ms after your balance is established, with no
    waiting for source blockchain finality
  </Card>

  <Card title="Non-custodial" icon="key">
    Retain full ownership of deposited USDC with signature-based authorization
    and a 7-day trustless withdrawal option
  </Card>
</CardGroup>

## What you can build

Gateway enables applications that require instant access to USDC across
blockchains. Here are some common use cases:

<AccordionGroup>
  <Accordion title="Chain abstraction" icon="wand-magic-sparkles">
    Build applications where users interact with USDC without worrying about which
    blockchain it's on. Users deposit once and access their balance instantly on any
    supported blockchain.
  </Accordion>

  <Accordion title="Crosschain liquidity" icon="arrow-right-arrow-left">
    Provide instant liquidity across blockchains without maintaining separate
    balances on each chain. Consolidate USDC holdings and access them where needed.
  </Accordion>

  <Accordion title="Payment routing" icon="route">
    Route payments to any supported blockchain instantly. Accept USDC on one
    blockchain and settle on another without delays.
  </Accordion>

  <Accordion title="Treasury management" icon="vault">
    Reduce working capital requirements by consolidating USDC across blockchains
    into a unified balance that's accessible anywhere.
  </Accordion>
</AccordionGroup>

## Get started

<CardGroup cols={2}>
  <Card title="Create and transfer a unified balance" icon="rocket" href="/gateway/quickstarts/unified-balance">
    Build a script to deposit USDC on multiple blockchains and transfer it
    instantly to a destination blockchain
  </Card>

  <Card title="Set up webhooks" icon="bell" href="/gateway/webhooks">
    Receive real-time notifications for Gateway events on your registered wallet
    addresses
  </Card>

  <Card title="Supported blockchains" icon="link" href="/gateway/references/supported-blockchains">
    View the blockchains where you can deposit and mint USDC with Gateway
  </Card>
</CardGroup>

## Related products

CCTP and Gateway offer different approaches to crosschain transfers. This table
compares the two approaches.

| Attribute                 | CCTP                                                                               | Gateway                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Use case**              | Transfer USDC from one blockchain to another                                       | Hold a unified USDC balance accessible on any supported blockchain |
| **Transfer speed**        | Fast Transfer: \~8-20 seconds<br />Standard Transfer: 15-19 minutes (Ethereum/L2s) | Instant (\<500 ms) after balance is established                    |
| **Balance model**         | Point-to-point transfers                                                           | Unified crosschain balance                                         |
| **Custody**               | Non-custodial                                                                      | Non-custodial with 7-day trustless withdrawal option               |
| **Supported blockchains** | [View list](/cctp/concepts/supported-chains-and-domains)                           | [View list](/gateway/references/supported-blockchains)             |
