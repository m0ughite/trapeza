> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Nanopayments

> Gas-free USDC nanopayments down to $0.000001, powered by Circle Gateway batched settlement

Circle Gateway enables gas-free USDC nanopayments by batching thousands of
payments into a single onchain transaction. Instead of settling each payment
individually, buyers sign offchain authorizations and Gateway settles net
positions in bulk, eliminating per-transaction gas costs and making sub-cent
payments economically viable. Nanopayments power agentic commerce by giving
developers and AI agents a financial rail purpose-built for high-frequency
agentic payments at scale.

## Key features

<CardGroup cols={3}>
  <Card title="Gas-free transfers" icon="gas-pump">
    Buyers sign payment authorizations offchain at zero gas cost. Gateway
    settles in bulk, so neither party pays per-transaction fees.
  </Card>

  <Card title="Sub-cent minimums" icon="coins">
    Send as little as \$0.000001 USDC per payment. Batched settlement keeps fees
    from exceeding the payment itself.
  </Card>

  <Card title="Crosschain liquidity" icon="arrow-right-arrow-left">
    Sellers receive payments in their Gateway balance and can withdraw to any
    supported blockchain.
  </Card>
</CardGroup>

## What you can build

<AccordionGroup>
  <Accordion title="Agentic payments" icon="robot">
    Enable AI agents to pay autonomously for compute, data, memory, and services.
    Agents transact at high frequency and extreme granularity, executing thousands
    of sub-cent payments per minute without gas friction.
  </Accordion>

  <Accordion title="Usage-based billing" icon="chart-line">
    Charge per API call, per second of compute, or per dataset access. With
    transaction costs near zero, fine-grained billing models become practical for
    the first time.
  </Accordion>

  <Accordion title="Machine-to-machine marketplaces" icon="network-wired">
    Build decentralized marketplaces where services, models, and data is priced and
    traded in real time at sub-cent granularity.
  </Accordion>

  <Accordion title="Streaming value" icon="wave-sine">
    Implement pay-per-second content, micro-rewards, and continuous value flows
    where traditional payment rails are too expensive to operate.
  </Accordion>
</AccordionGroup>

## How it works

Nanopayments enables the [x402 protocol](/gateway/nanopayments/concepts/x402),
an open standard built on the HTTP `402 Payment Required` status code, by using
Circle Gateway's
[batched settlement](/gateway/nanopayments/concepts/batched-settlement)
infrastructure. Instead of settling each x402 payment individually onchain,
Gateway aggregates signed payment authorizations and settles net positions in
bulk. This is what makes sub-cent x402 payments economically viable.

The end-to-end flow is:

1. A buyer deposits USDC into a Gateway Wallet contract (one-time onchain
   transaction).
2. A buyer requests a paid resource from a seller's API.
3. The seller responds with `402 Payment Required` and payment details.
4. The buyer signs an EIP-3009 payment authorization (offchain, zero gas).
5. The buyer retries the request with the signed authorization attached.
6. The seller verifies the signature and serves the resource immediately.
7. Gateway collects authorizations and settles them in batches onchain,
   crediting the seller's Gateway balance.

## Get started

<CardGroup cols={2}>
  <Card title="Quickstart: Buy side" icon="cart-shopping" href="/gateway/nanopayments/quickstarts/buyer">
    Deposit USDC, pay for an x402-protected resource without gas fees, and check
    your balance
  </Card>

  <Card title="Quickstart: Sell side" icon="store" href="/gateway/nanopayments/quickstarts/seller">
    Add payment middleware to your Express API and start accepting gasless USDC
    payments
  </Card>

  <Card title="What is x402?" icon="circle-info" href="/gateway/nanopayments/concepts/x402">
    Learn about the open payment protocol that powers Nanopayments
  </Card>

  <Card title="How batched settlement works" icon="layer-group" href="/gateway/nanopayments/concepts/batched-settlement">
    Understand how Gateway aggregates payments and settles them onchain
  </Card>

  <Card title="API reference" icon="code" href="/api-reference/gateway/all/settle-x402payment">
    Explore the API endpoints for Nanopayments
  </Card>
</CardGroup>
