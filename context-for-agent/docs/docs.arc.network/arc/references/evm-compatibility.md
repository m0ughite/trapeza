> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# EVM compatibility

> Arc EVM compatibility details covering USDC as gas, deterministic sub-second finality, and key differences for developers.

Arc is compatible with the Ethereum Virtual Machine (EVM). Developers can deploy
and interact with smart contracts using the same tools, languages, and
frameworks they use on Ethereum such as Solidity, Foundry, and Hardhat.

While the execution environment mirrors Ethereum's, Arc introduces a few key
differences:

* **USDC as native gas:** All fees and balances are denominated in USDC, not
  ETH.
* **Deterministic finality:** Transactions finalize instantly and cannot be
  reversed.
* **Simplified block times:** Blocks are timestamped by real time, not epochs or
  slots.
* **Stable fee model:** Gas prices are smoothed for predictability.
* **Permissioned validators:** Arc uses a BFT consensus model (Malachite) for
  speed and reliability.

These changes make Arc predictable and stable while preserving EVM
compatibility.

## ERC-20 interface

Arc uses USDC as its native network token. Native balances behave like ETH on
Ethereum and are represented with **18 decimals** (see
[Gas and fees](/arc/references/gas-and-fees) for how this applies to gas
accounting). A linked ERC-20 interface is also available at the
[USDC contract address](/arc/references/contract-addresses#USDC). This interface
uses **6 decimals** to match the standard USDC representation on other EVM
networks and provides familiar ERC-20 features such as `transferFrom`,
`approve`, and allowance management.

<Warning>
  USDC on Arc is a single asset with two interfaces, not two separate tokens.
  The native representation and the ERC-20 interface share the same underlying
  balance. An ERC-20 transfer directly moves the native balance, and a native
  send is reflected in the ERC-20 balance.
</Warning>

This linked model has two important effects:

1. Tiny USDC amounts (less than 1 x 10⁻⁶ USDC) cannot be transferred using the
   ERC-20 interface because the 6-decimal precision cannot represent them.
2. Protocols that hold USDC as an ERC-20 automatically hold equivalent native
   balances. No additional Solidity changes are required (for example, `payable`
   or `receive` functions) because ERC-20 transfers are directly reflected in
   the native balance.

### Integration guidance

Because USDC has two interfaces on Arc, the best approach depends on your use
case:

* **DeFi protocols:** Interact with USDC through the ERC-20 interface only. This
  is consistent with how USDC works on every other EVM chain and avoids
  dual-entry-point edge cases.
* **Wallets:** Arc emits a unified transfer event for every USDC movement,
  whether it originates from a native send or an ERC-20 call. Listen for this
  event as the single source of truth for balance changes. For outbound
  transfers, send as **ERC-20** for the best block-explorer traceability.
  Display a single unified USDC balance rather than separate native and ERC-20
  balances.
* **Exchanges and custodians:** Use the native interface for deposits and
  withdrawals. Native events are the most complete record of balance changes.

### Common pitfalls

* **Double counting:** Because both interfaces operate on the same balance, code
  that tracks native deposits *and* ERC-20 deposits independently can count the
  same funds twice. If your protocol handles both entry points, make sure your
  accounting logic deduplicates them.
* **Event coverage:** ERC-20 `Transfer` events are emitted only for ERC-20
  calls. A plain native send (equivalent to an ETH transfer on Ethereum) does
  not emit an ERC-20 event. Arc addresses this by emitting a unified transfer
  event for all USDC movements regardless of interface. Use this unified event
  for the most complete record of transfers. See
  [Data indexers](/arc/tools/data-indexers) for indexing solutions on Arc.
* **Decimal mismatch:** The native representation uses 18 decimals while the
  ERC-20 uses 6. Never mix raw values from the two interfaces without converting
  first. When in doubt, use the ERC-20 `decimals()` function and work
  exclusively with the 6-decimal representation for application logic.

## EVM differences

Arc targets the **Prague** EVM hard fork with minor differences in execution and
consensus behavior.\
The table below summarizes key distinctions from Ethereum mainnet.

| Area                           | Ethereum                              | Arc                                                                                                 |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Native token**               | ETH, volatile pricing                 | USDC, stable pricing with 18 decimals; used as gas                                                  |
| **Fee market**                 | EIP-1559 base fee per block           | Fee smoothing with moving average; stable, bounded base fee, inspired by EIP-1559                   |
| **Finality**                   | Probabilistic (≈12–15 min for safety) | Deterministic and instant (\<1 s)                                                                   |
| **Consensus**                  | Proof-of-Stake (slot/epoch model)     | Malachite (Tendermint-based) BFT with permissioned validators                                       |
| **Block timestamps**           | Derived from slots and epochs         | Wall-clock time from proposer with second-level granularity; sub-second blocks may share timestamps |
| **`SELFDESTRUCT`**             | Allowed with value transfers to self  | Not allowed during deployment to prevent burning native tokens                                      |
| **`PARENT_BEACON_BLOCK_ROOT`** | Root of parent beacon block (SSZ)     | Hash of parent execution payload header (`keccak256(RLP(header))`); no beacon chain                 |
| **`PREV_RANDAO`**              | Randomness mix of proposer reveals    | Always `0`; not used for randomness                                                                 |
| **USDC blocklist handling**    | Runtime revert on transfer            | Pre-block inclusion check when possible; reverts or blocks as described below                       |
| **EIP-4844 blobs**             | Supported post-Dencun                 | Currently disabled                                                                                  |

### USDC blocklist revert handling

Arc enforces USDC blocklists both pre- and post-execution:

* **Pre-mempool check:** If the sender is blocklisted, the transaction is
  rejected before entering the mempool. No fees are collected.
* **Post-mempool check:** If the address becomes blocklisted after acceptance
  but before execution, the transaction reverts at runtime and consumes gas.
* **Runtime transfer check:** If a valid transaction attempts to move USDC to or
  from a blocklisted address, only that operation reverts. Fees are still
  collected.

## Developer impact

For most use cases, Ethereum-based tooling and smart contracts will work on Arc
without modification. However, developers should note a few practical
differences:

* **Gas denomination:** All values are in USDC. When using libraries like
  `ethers.js` or `viem`, display and accounting logic should format values in
  USD terms, not ETH.
* **Timestamps:** Multiple blocks may share the same timestamp; avoid assuming
  strictly increasing values for onchain time comparisons.
* **Randomness:** `block.prevrandao` is always zero. Do not use it as a source
  of randomness; use an external oracle or verifiable randomness function (VRF)
  instead.
* **Finality:** Transactions finalize immediately after inclusion. Offchain
  systems can safely act on events after a single confirmation: no additional
  block waiting is required.
* **SELFDESTRUCT restrictions:** Contracts that self-destruct during deployment
  will revert if they attempt to send USDC value to themselves.

These differences are designed to make Arc's execution environment predictable
and stable while remaining interoperable with the Ethereum developer ecosystem.
