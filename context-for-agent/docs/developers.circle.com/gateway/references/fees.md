> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Gateway Fees

> Understanding Gateway transfer fees and gas costs

Gateway charges two types of fees for crosschain transfers: a transfer fee and a
gas fee.

## Transfer fee

Crosschain transfers incur a percentage-based fee of **0.005%** (0.5 basis
points) on the transfer amount.

* **When charged**: On crosschain transfers (source and destination are
  different blockchains)
* **Payment method**: Deducted from your unified USDC balance at the time of
  burn

Same-chain transfers (withdrawals where source and destination are the same
blockchain) do not incur the transfer fee.

## Gas fees

Each burn intent includes a gas fee that covers the cost of executing the burn
transaction on the source blockchain. The gas fee varies by source blockchain:

| Source blockchain | Gas fee (USDC) |
| ----------------- | -------------- |
| Arbitrum          | \$0.01         |
| Avalanche         | \$0.02         |
| Base              | \$0.01         |
| Ethereum          | \$2.00         |
| HyperEVM          | \$0.05         |
| OP                | \$0.0015       |
| Polygon PoS       | \$0.0015       |
| Sei               | \$0.001        |
| Solana            | \$0.15         |
| Sonic             | \$0.01         |
| Unichain          | \$0.001        |
| World Chain       | \$0.01         |

## Setting `maxFee`

When creating a [burn intent](/gateway/references/technical-guide#burn-intent),
set the `maxFee` field to cover both the gas fee and the transfer fee:

```text theme={null}
maxFee ≥ gas fee + (transfer amount * 0.00005)
```

For example, transferring 1,000 USDC from Base:

* Gas fee: \$0.01
* Transfer fee: 1,000 \* 0.00005 = \$0.05
* Minimum `maxFee`: \$0.06 (60,000 in USDC subunits)

<Tip>
  Add a buffer to your `maxFee` calculation to account for gas fee fluctuations.
</Tip>

<Note>
  When using the
  [Circle Forwarding Service](/gateway/references/forwarding-service), add
  forwarding fees to the `maxFee`. For transfers to Solana with
  [automatic Associated Token Account (ATA) creation](/gateway/references/forwarding-service#automatic-ata-creation-for-solana)
  enabled, the forwarding fee also includes the Solana rent cost for token account
  creation.
</Note>

## Optimizing costs

To reduce overall costs:

* **Use low-cost source blockchains**: Keep the majority of your Gateway balance
  on blockchains with lower gas fees (such as OP, Polygon PoS, Sei, or Unichain)
* **Consolidate burn intents**: The gas cost of minting scales slower than
  multiple individual [CCTP](/cctp) transfers. Each additional burn intent adds
  approximately 60k gas to the mint transaction.
