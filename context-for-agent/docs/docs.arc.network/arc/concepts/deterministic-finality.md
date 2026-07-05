> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Deterministic finality and settlement

> Arc's deterministic finality provides instant, irreversible transaction settlement in under one second.

Arc gives you deterministic, sub-second finality for every transaction. Once a
block is committed, any transaction in that block is instantly and irreversibly
final. This removes the uncertainty you may encounter on blockchains that rely
on probabilistic finality.

## Why deterministic finality matters

On proof-of-work or many proof-of-stake chains, transactions are considered
final only after multiple confirmation blocks. Even then, there's a risk of
chain reorganizations that can undo an arbitrary number of blocks and
transactions therein.

With Arc, a transaction is either unconfirmed or final. There is no intermediate
state. Once a transaction is included in a committed block, it cannot be
reversed.

This allows you to build applications that demand high assurance, especially
where financial risk must be minimized and operational standards are strict.

## Sub-second confirmation

Arc's consensus engine, [Malachite](/arc/concepts/consensus-layer), finalizes
blocks in less than one second. For comparison, Ethereum requires 12–15 minutes
for finality, and many Layer-2 networks inherit similar delays from their
settlement layer.

This speed enables use cases that are impractical on slower networks:

| **Use case**            | **How finality helps**                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Point-of-sale payments  | A merchant can confirm payment and release goods without waiting for additional block confirmations.                               |
| Cross-border settlement | Transfers between counterparties finalize instantly, eliminating the settlement windows that introduce counterparty risk.          |
| Institutional clearing  | Trades and margin calls settle with immediate certainty, matching the expectations of traditional financial infrastructure.        |
| Composable workflows    | Multi-step onchain flows (such as swap-then-bridge) can execute sequentially without polling or confirmation delays between steps. |

## Developer benefits

Deterministic finality simplifies application design by removing the edge cases
that probabilistic chains force you to handle.

<CardGroup cols={2}>
  <Card title="No reorg handling" icon="shield-check">
    You don't need retry logic, rollback mechanisms, or confirmation-count
    thresholds. A confirmed transaction stays confirmed.
  </Card>

  <Card title="Immediate offchain effects" icon="bolt">
    Safely trigger downstream actions (webhooks, database writes, notifications)
    as soon as a block is committed, without waiting for additional
    confirmations.
  </Card>

  <Card title="Simplified state management" icon="toggle-on">
    Your application only needs to track two transaction states — pending and
    final — rather than tracking a sliding confirmation window.
  </Card>

  <Card title="Enterprise compliance" icon="file-certificate">
    Settlement finality is auditable and provable, meeting the assurance
    requirements of regulated financial institutions.
  </Card>
</CardGroup>
