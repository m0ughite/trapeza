> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Cross-Chain Transfer Protocol

Cross-Chain Transfer Protocol (CCTP) is a permissionless onchain utility that
facilitates native USDC transfers across blockchains. CCTP burns USDC on the
source blockchain and mints it on the destination blockchain, enabling secure
1:1 transfers without traditional bridge liquidity pools or wrapped tokens.

<Tip>
  **Use [Bridge Kit](https://www.npmjs.com/package/@circle-fin/bridge-kit) to
  simplify crosschain transfers with CCTP.**

  Bridge Kit is a lightweight SDK that uses CCTP as its protocol provider, letting
  you transfer USDC between blockchains in just a few lines of code.
</Tip>

## Key features

<CardGroup cols={3}>
  <Card title="Native USDC transfers" icon="coins">
    Transfer native USDC across blockchains without wrapped tokens or liquidity
    pools
  </Card>

  <Card title="Configurable transfer speeds" icon="gauge-high">
    Choose between [Fast
    Transfer](/cctp/concepts/finality-and-block-confirmations#fast-transfer-attestation-times)
    for speed or [Standard
    Transfer](/cctp/concepts/finality-and-block-confirmations#standard-transfer-attestation-times)
    for cost efficiency
  </Card>

  <Card title="Programmable hooks" icon="code">
    Trigger automated actions on the destination blockchain after USDC arrives
  </Card>
</CardGroup>

## What you can build

CCTP enables you to build applications that require moving USDC across
blockchains. Here are some common use cases:

<AccordionGroup>
  <Accordion title="Crosschain liquidity management" icon="arrow-right-arrow-left">
    Rebalance USDC holdings across blockchains to meet liquidity demands, manage
    treasury positions, or take advantage of market opportunities with minimal
    latency.
  </Accordion>

  <Accordion title="Crosschain swaps" icon="shuffle">
    Enable users to swap tokens on one blockchain for tokens on another blockchain
    by routing through USDC. Build seamless crosschain trading experiences that feel
    like a single transaction.
  </Accordion>

  <Accordion title="Crosschain payments" icon="credit-card">
    Accept USDC payments on one blockchain and automatically transfer funds to
    another blockchain where your business operations are based or where recipients
    prefer to receive funds.
  </Accordion>

  <Accordion title="Composable crosschain applications" icon="layer-group">
    Use CCTP hooks to chain together crosschain actions. Transfer USDC across
    blockchains and automatically deposit it into DeFi protocols, purchase NFTs, or
    execute smart contract logic.
  </Accordion>
</AccordionGroup>

## Get started

<CardGroup cols={2}>
  <Card title="Transfer USDC from Ethereum to Arc" icon="rocket" href="/cctp/quickstarts/transfer-usdc-ethereum-to-arc">
    Build a script to transfer USDC between EVM blockchains using CCTP
  </Card>

  <Card title="Transfer USDC from Solana to Arc" icon="rocket" href="/cctp/quickstarts/transfer-usdc-solana-to-arc">
    Transfer USDC from Solana to an EVM blockchain using CCTP
  </Card>

  <Card title="Transfer USDC to and from Stellar" icon="rocket" href="/cctp/quickstarts/transfer-usdc-stellar-arc">
    Transfer USDC between Arc and Stellar using CCTP
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
