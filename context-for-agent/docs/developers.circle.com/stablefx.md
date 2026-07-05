> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# StableFX

> Institutional-grade stablecoin FX engine built on Arc

StableFX is an institutional-grade stablecoin FX engine built on Arc that
combines Request-for-Quote (RFQ) execution with onchain settlement. This
permissioned platform is designed for financial institutions including payment
service providers, fintechs, crypto OTC desks, and prime brokers.

StableFX supports USDC and EURC and will expand to a broad range of local
stablecoin pairs.

## Key features

<CardGroup cols={3}>
  <Card title="Aggregated Liquidity" icon="chart-network">
    Access competitive rates from multiple liquidity providers through a single
    API call
  </Card>

  <Card title="24/7 Settlement" icon="clock">
    Trade and settle around the clock with sub-second finality on Arc
  </Card>

  <Card title="Simplified Operations" icon="layer-group">
    Replace multiple bilateral agreements with one integration
  </Card>
</CardGroup>

StableFX reduces settlement risk through smart contract escrow that ensures both
sides of a trade settle simultaneously or not at all. With API and SDK-based
integration, you can implement programmatic quote requests and automated
settlement directly into your institutional workflows.

## What you can build

As a vetted institution, you can integrate StableFX to power a range of
financial services. Here are some common use cases:

<AccordionGroup>
  <Accordion title="Cross-border payment flows" icon="globe">
    Build payment systems with real-time currency conversion and settlement that
    enable instant international transfers without traditional correspondent banking
    delays. Your customers can send funds across borders with sub-second finality
    and transparent pricing.
  </Accordion>

  <Accordion title="Institutional treasury management" icon="building-columns">
    Implement automated treasury operations for managing multi-currency stablecoin
    positions. Set up programmatic rebalancing rules and execute trades 24/7 to
    maintain optimal currency allocations across your organization.
  </Accordion>

  <Accordion title="Embedded FX liquidity services" icon="arrows-rotate">
    Offer FX liquidity directly in your platform without building your own matching
    engine or sourcing liquidity. Your customers get seamless access to competitive
    rates and instant settlement while you maintain control over the user
    experience.
  </Accordion>

  <Accordion title="Next-generation remittance solutions" icon="paper-plane">
    Eliminate T+2 settlement delays and counterparty risk by leveraging smart
    contract escrow. Build remittance services with guaranteed simultaneous
    settlement on both sides, reducing operational risk and capital requirements.
  </Accordion>
</AccordionGroup>

## How it works

StableFX operates on a Request-for-Quote (RFQ) model that combines offchain
execution with onchain settlement:

<Steps>
  <Step title="Request a quote">
    Takers request quotes through the API, specifying the currency pair and amount.
    Multiple liquidity providers compete to offer the best rate.
  </Step>

  <Step title="Execute the trade">
    Accept a quote through the API. Execution happens offchain for speed and
    efficiency.
  </Step>

  <Step title="Settle onchain">
    Settlement occurs automatically through smart contract escrow on Arc, ensuring
    payment-versus-payment where both sides settle or neither does.
  </Step>
</Steps>

<Note>
  The StableFX API handles both offchain and onchain steps, so you don't need to
  interact with smart contracts directly.
</Note>

## Get started

<Info>
  Reach out to your [Circle representative](mailto:sales@circle.com) to get an
  API key for StableFX.
</Info>

Try StableFX in the testing environment. Whether you're looking to consume
liquidity as a **taker** or provide liquidity as a **maker**, these quickstart
guides will help you integrate:

<CardGroup cols={2}>
  <Card title="Create an FX trade as a taker" icon="arrow-right-arrow-left" href="/stablefx/quickstarts/fx-trade-taker">
    Request and execute a USDC to EURC trade
  </Card>

  <Card title="Fulfill an FX trade as a maker" icon="coins" href="/stablefx/quickstarts/fx-trade-maker">
    Fulfill existing trades and provide liquidity
  </Card>

  <Card title="Use the StableFX Console" icon="browser" href="/stablefx/concepts/console-overview">
    Trade, settle, and manage your account from the browser. No code required.
  </Card>
</CardGroup>
