> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Agent Wallets

> Wallets that let your agent autonomously hold, spend, trade, and earn USDC and other tokens with built-in spending controls.

Agent Wallets let your AI agent hold funds and transact onchain autonomously,
within spending policies you define. Your agent operates the wallet through
Circle CLI without writing integration code.

Built on [Circle's user-controlled wallets](/wallets/user-controlled) with
2-of-2 MPC key management, key shares are never exposed to the agent. The user
retains custody, and Circle cannot unilaterally move funds without their
involvement. All transfers are screened against sanctions controls before
submission onchain.

## Get started

Paste this prompt into your AI agent:

```text theme={null}
curl -sL https://agents.circle.com/skills/setup.md and follow the instructions to set up Circle Agent Wallet
```

The agent installs Circle CLI, creates and funds your agent wallet, and helps
you discover and pay for services with it. Prefer a manual setup? Follow the
[quickstart](/agent-stack/agent-wallets/quickstart) instead.

## Use cases

<CardGroup cols={2}>
  <Card title="Pay for APIs and services" icon="bolt">
    Discover and pay for APIs or services using USDC on a per-call or usage
    basis using x402-compatible services.
  </Card>

  <Card title="Autonomous trading" icon="chart-line">
    Run onchain strategies like dollar-cost averaging or token monitoring for
    autonomous execution in user-defined rules.
  </Card>

  <Card title="AI assistants with budgets" icon="robot">
    Execute real-world tasks like booking flights or paying for subscriptions in
    a scoped USDC budget.
  </Card>

  <Card title="Agent-to-agent commerce" icon="arrows-left-right">
    Enable machine-to-machine payments and real-time service exchange between
    agents.
  </Card>
</CardGroup>

<Warning>
  When running autonomous trading strategies, start with small amounts and
  validate your approach before scaling. Only commit funds you are comfortable
  spending.
</Warning>

## Features

<AccordionGroup>
  <Accordion title="User-custody wallet" icon="shield-check">
    Built on [Circle user-controlled wallets](/wallets/user-controlled). Key
    shares are never exposed to the agent. Users retain custody while agents
    operate in defined spending limits.
  </Accordion>

  <Accordion title="Command-line interface" icon="terminal">
    Operate wallets through Circle CLI commands from any agent framework. No
    custom integration code required.
  </Accordion>

  <Accordion title="Spending policies" icon="sliders">
    Set USDC spending limits for outbound transfers and x402 payments. Limits
    can be time-bound (for example, daily, or monthly). Configure allowlists and
    blocklists for wallet and contract addresses.
  </Accordion>

  <Accordion title="x402 and nanopayments" icon="coins">
    Integrated with [x402](/gateway/nanopayments/concepts/x402) for
    machine-to-machine payments. Extends to Circle Gateway
    [Nanopayments](/gateway/nanopayments) for gas-free USDC payments at sub-cent
    scale, purpose-built for high-frequency agent transactions.
  </Accordion>

  <Accordion title="Built-in compliance controls" icon="scale-balanced">
    All transfers are screened against sanctions controls before submission
    onchain. Transactions involving sanctioned entities are blocked, ensuring
    agents operate within regulatory requirements.
  </Accordion>

  <Accordion title="Token support" icon="coins">
    Agent Wallets support USDC, EURC, and other ERC20 tokens, and native tokens
    (for example, ETH, MATIC). USDC is the primary asset for transfers,
    bridging, and x402 payments.
  </Accordion>
</AccordionGroup>

<Note>
  Agent wallet transactions are gas-sponsored. Sponsorship is capped and subject
  to change. See [Fees](/agent-stack/agent-wallets/fees) for the full breakdown.
</Note>
