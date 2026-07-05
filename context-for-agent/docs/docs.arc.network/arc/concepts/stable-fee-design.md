> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Fees

> Arc's fee model uses USDC as gas to provide predictable, low-cost, and auditable onchain transaction fees.

Arc's fee design eliminates the volatility of gas costs and ensures predictable
transaction fees. You benefit from fees denominated in USDC, a protocol-level
smoothing mechanism, and flexible paymaster services.

<Tip>
  On Arc, the base fee is designed to remain around one cent (≈ \$0.01) per
  transaction on average. This target aims to make onchain finance fast, simple,
  and affordable.
</Tip>

## USDC for network fees

Arc uses USDC as the native gas token instead of a native token. This means you
don't need to manage token price swings.

On most blockchains, you pay gas in a native token (for example, ETH on
Ethereum). That means the cost of network fees in dollars can fluctuate based on
token price and network demand. On Arc, the gas unit is USDC which is stable
with USD.

As a result:

* You can estimate fees in advance in dollar terms.
* You don't need to hold additional tokens just to pay network fees.
* Accounting and treasury processes are simplified, because the unit of value
  you transfer and the unit you pay in are the same.

<Info>
  Gas fees use USDC's native 18-decimal precision. For application-level
  transfers and balance display, USDC also offers a standard [ERC-20 interface
  with 6 decimals](/arc/references/evm-compatibility#erc-20-interface).
</Info>

For example, if a transaction requires `g` gas units, the fee is:

```text theme={null}
fee = g × base_fee_in_USDC
```

The base fee is set in USDC, so you avoid the market volatility of a token-based
gas fee. The only variable is block space demand, which Arc mitigates using a
smoothing mechanism.

## Fee smoothing mechanism

Arc's fee market builds on EIP-1559 but changes how the base fee adjusts.
Instead of recalculating fees every block, Arc uses an exponentially weighted
moving average (EWMA) of block utilization.

This means:

* Fees adjust gradually, not abruptly.
* Short-term demand spikes have less impact.
* Base fees remain bounded, keeping costs low and predictable.

For developers, this means you don't need complex fee estimation logic. You can
expect stable base fees over time, even under varying network load.

## Developer benefits

Building on Arc's stable fee design simplifies cost management and removes
common integration hurdles.

<CardGroup cols={2}>
  <Card title="Predictable costs" icon="dollar-sign">
    Transaction fees are dollar-based and typically around 1 cent, so you can
    quote costs to users with confidence.
  </Card>

  <Card title="Congestion resistant" icon="gauge-high">
    The smoothing mechanism keeps fees stable even under varying network load,
    so spikes in demand don't surprise your users.
  </Card>

  <Card title="Enterprise ready" icon="building">
    Dollar-denominated fees simplify accounting, treasury management, and
    compliance reporting for fintech and institutional use cases.
  </Card>

  <Card title="Flexible fee payment" icon="coins">
    Sponsor transactions on behalf of users or accept fees in multiple
    stablecoins without custom workarounds.
  </Card>
</CardGroup>

For implementation details and blockchain fee parameters, see
[Gas and Fees](/arc/references/gas-and-fees).
