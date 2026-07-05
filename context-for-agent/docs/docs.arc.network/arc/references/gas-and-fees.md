> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Gas and fees

> How gas and transaction fees work on Arc, including the base fee model, pricing mechanics, and configuration guidelines.

Arc uses USDC as the native gas token for stable transaction costs. The Arc
Testnet enforces a minimum base fee of 20 Gwei.

## Gas mechanics

| Key                    | Value                                                                                                                                                                |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**               | USDC (18 decimals)                                                                                                                                                   |
| **Pricing**            | EIP-1559–like base fee with exponentially weighted moving-average smoothing                                                                                          |
| **Base fee (testnet)** | 20 Gwei minimum                                                                                                                                                      |
| **Best practice**      | Surface gas fees in USDC; fetch the current base fee dynamically before submitting transactions by calling `eth_gasPrice` or `eth_feeHistory` on the Arc Testnet RPC |

<Info>
  The 18-decimal precision shown above applies to Arc's native gas accounting.
  USDC on Arc also provides a standard [ERC-20 interface with 6
  decimals](/arc/references/evm-compatibility#erc-20-interface) that matches
  USDC on other EVM networks. For application-level transfers and balance
  display, use the ERC-20 interface. See [contract
  addresses](/arc/references/contract-addresses#usdc) for details.
</Info>

## Policy overview

* The base fee is dynamically adjusted using a bounded, moving-average mechanism
  designed to stabilize around 20 Gwei under normal network load.
* Transactions submitted with a max fee below 20 Gwei may remain pending or fail
  to execute.
* To ensure timely inclusion, set `maxFeePerGas ≥ 20 Gwei`.

## Monitoring

You can view real-time gas metrics and recent averages using the
[Arc Gas Tracker](https://testnet.arcscan.app/gas-tracker).

<Info>
  This configuration applies to the Arc Testnet and may evolve as network
  parameters are tuned for mainnet launch.
</Info>

For an overview of Arc's fee architecture and design principles, see
[Stable Fee Design](/arc/concepts/stable-fee-design).
