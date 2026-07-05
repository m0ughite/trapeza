> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Circle Payments Network

> Fast, cost-effective, and compliant global payments

Circle Payments Network (CPN) is a next-generation payment infrastructure
designed to reduce reliance on multiple intermediaries while enhancing
transparency, security, and speed. Using onchain primitives and built-in
compliance capabilities, CPN delivers near-instant cross-border settlement. CPN
allows participating financial institutions to rapidly expand their global
footprint with a single integration.

This developer documentation focuses on **Originating Financial Institutions
(OFIs)** that facilitate cross-border payments for their customers. The main
institution roles in CPN are:

<CardGroup cols={3}>
  <Card title="OFIs" icon="building-columns">
    Work with senders, onramp fiat to crypto, and connect through CPN for
    cross-border payments.
  </Card>

  <Card title="BFIs" icon="hand-holding-dollar">
    Receive stablecoins through CPN and offramp into local fiat for receivers in
    the destination market.
  </Card>

  <Card title="CPN" icon="chart-network">
    Coordinates OFIs and BFIs by aggregating quotes, routing payments, and
    managing onchain settlement between participants.
  </Card>
</CardGroup>

CPN is part of Circle's broader ecosystem of financial products and is designed
to work with the USDC ecosystem for global payment operations.

## Prerequisites

As an OFI, plan for the following before onboarding:

* Access to USDC liquidity from your own sources or through Circle. If you use
  Circle, see
  [How-to: Set Up Circle On/Off-Ramps for CPN Payments](/cpn/guides/circle-liquidity/setup-circle-on-off-ramps-for-cpn-payments)
  for fiat-to-USDC and related transfers.
* A custodial or signing solution for USDC and technical capability to interact
  with blockchains (sign and observe transactions). If you use Circle for the
  operational wallet, see
  [How-to: Set Up a Circle Wallet for CPN Payments](/cpn/guides/wallets/setup-circle-wallet-for-cpn-payments).
  If you use your own wallet stack, see
  [Bring your own wallet for CPN](/cpn/concepts/wallets/bring-your-own-wallet)
  and the
  [Wallet provider compatibility](/cpn/references/blockchains/wallet-provider-compatibility)
  reference.
* Established Know Your Customer (KYC) and Anti-Money Laundering (AML) processes
  in place for your customers

<Note>
  Circle Wallets and Circle On/Off-Ramps are **optional** capabilities for CPN.
  Many institutions already hold USDC and use their own wallets. The same
  developer documentation applies to every CPN customer; the linked how-tos are
  for teams that choose Circle for those layers. If you're a BFI or payout
  partner, Circle may reach out proactively as CPN grows.
</Note>

## Key features

<CardGroup cols={2}>
  <Card title="Real-time FX quoting and locking" icon="chart-line">
    CPN returns quotes from several BFIs in one step and locks the FX rate for
    the payment, limiting exchange-rate risk for the OFI and customer.
  </Card>

  <Card title="Smart routing" icon="diagram-project">
    Each payment is assigned to a BFI according to the OFI's pricing and
    operational preferences, for example cost and settlement speed.
  </Card>

  <Card title="Stablecoin-powered transfers" icon="coins">
    Payments are settled using USDC across [supported
    blockchains](/cpn/references/blockchains/supported-blockchains) and
    exchanged to local fiat currencies for the receiver through the BFI.
  </Card>

  <Card title="API integration" icon="code">
    REST APIs and webhooks support payment flows and status monitoring, with
    detailed documentation and support for integrators.
  </Card>

  <Card title="End-to-end encryption" icon="lock">
    Travel rule and beneficiary account data is encrypted by the OFI throughout
    the payment process and can only be decrypted by the designated BFI.
  </Card>

  <Card title="Ticketing support" icon="ticket">
    CPN allows institutions to create and manage support tickets for payments,
    disputes, and reversals through the API. Circle handles routing and
    resolution across the network.
  </Card>
</CardGroup>

<Note>
  **CPN White Paper**

  Read the
  [CPN White Paper](https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/PDFs/Whitepapers/CPN_Whitepaper.pdf)
  to learn more about the motivation for creating CPN and its intended use cases.
</Note>

## Entities in CPN

The following entities are referenced in this documentation and make up the key
entities that allow CPN to perform cross-border transactions.

* **Senders** (external): Businesses or individuals initiating cross-border
  payments
* **Receivers** (external): Businesses or individuals receiving cross-border
  payments
* **Originating Financial Institutions (OFIs)**: Financial institutions that
  interface with senders, onramp fiat to USDC, and connect with BFIs through CPN
  for transfer and fiat offramp
* **Beneficiary Financial Institutions (BFIs)**: Financial institutions that
  receive USDC from OFIs through CPN and provide an offramp to local fiat
  currency
* **Circle Payments Network (CPN)**: Orchestration layer that aggregates
  financial institutions, vets participants, and facilitates money movement
  through onchain and offchain services.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/18D1O5_C359Zz2z5/cpn/images/cpn-overview.png?fit=max&auto=format&n=18D1O5_C359Zz2z5&q=85&s=13bca2942c8d0d97f65003f1956d4151" width="1059" height="518" data-path="cpn/images/cpn-overview.png" />
</Frame>

## CPN workflow

The following is a generic example of how a payment in CPN is performed. In this
example, the OFI has a sender in the United States. The sender already has an
account and completed KYC with the OFI. The sender wants to pay a receiver in
Brazil. The sender wants to pay with USD and the receiver wants to receive the
payment in Brazilian real (BRL).

<Steps>
  <Step title="Quote generation">
    * OFI requests a list of quotes for the payment (USDC to BRL) from CPN
    * CPN aggregates quotes from multiple BFIs
    * CPN returns a list of quotes to the OFI
    * OFI selects the best quote or asks the sender to select their preferred
      quote
  </Step>

  <Step title="Payment creation">
    * Sender accepts the quote
    * OFI gets the requirements for travel rule data and beneficiary account
      information
    * OFI creates a payment request (USDC to BRL) in CPN
    * OFI collects and
      [encrypts](/cpn/guides/payments/encrypt-travel-rule-beneficiary-data)
      necessary payment details, such as travel rule data and beneficiary account
      information, and includes the encrypted data in the payment request
    * BFI reviews the travel rule data (and may [request additional
      information](/cpn/concepts/compliance/rfis)) and approves the payment
      request
  </Step>

  <Step title="Onchain transaction">
    * OFI ensures the required USDC balance is available in the operational
      wallet that will sign the transfer (onramping or internal treasury
      movements may be required first)
    * OFI requests an onchain transaction object to transfer USDC to the
      destination address from CPN to sign
    * OFI signs the onchain transaction object and sends it to CPN
    * CPN validates and broadcasts the transaction
    * CPN notifies the OFI and BFI when the onchain transaction is confirmed
  </Step>

  <Step title="Fiat settlement (no OFI action required)">
    * BFI initiates fiat payment after the onchain transaction is confirmed
      (transfer BRL to receiver's bank account)
    * BFI notifies CPN when the fiat payment is initiated and complete
    * CPN notifies the OFI with the appropriate payment statuses
  </Step>

  <Step title="Payment management">
    * OFI can query payment status at any time from the CPN API
    * CPN provides real-time status updates on the payment via webhooks
    * You can use payment history and reporting for reconciliation
  </Step>
</Steps>

## Get started

Run the OFI quickstart, learn how the CPN API fits together, then subscribe to
payment webhooks:

<CardGroup cols={3}>
  <Card title="Integrate with CPN as an OFI" icon="rocket" href="/cpn/quickstarts/integrate-with-cpn-ofi">
    Request a quote, create a payment, complete the onchain USDC transfer, and
    track status using Transactions V1 or V2.
  </Card>

  <Card title="CPN Integration Concepts" icon="diagram-project" href="/cpn/concepts/api/api-integration">
    Understand how CPN APIs work together, including quotes, payments,
    transactions, and the JSON request and response model.
  </Card>

  <Card title="Set up Webhook Notifications" icon="bell" href="/cpn/guides/webhooks/setup-webhook-notifications">
    Expose a subscriber endpoint and register for CPN notifications so your
    systems react to payment and transaction updates.
  </Card>
</CardGroup>
