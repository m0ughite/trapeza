> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Paymaster

> Pay gas fees with USDC

Circle has a network of permissionless token paymasters that enables end-users
to pay for network (gas) fees using USDC tokens, instead of chain native tokens.

Paying for gas in USDC has the following advantages:

* USDC holders don't need to source native tokens to transact in USDC.
* End-users pay for network fees in a familiar unit, making network pricing
  easier to understand.

The Circle Paymaster supports the ERC-4337 standard and thus supports any wallet
adhering to that standard. This documentation provides information on how to
integrate with the permissionless Circle Paymaster so that your users can pay
for gas fees in USDC.

There is a 10% surcharge on gas fees to account for operational costs. The 10%
surcharge only applies to Arbitrum and Base (and their testnets). The Paymaster
only supports USDC tokens.

Circle Paymaster supports the
[ERC-4337 v0.7](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.7.0)
and
[ERC-4337 v0.8](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.8.0)
on multiple chains. For more information, see
[Supported chains](#supported-chains) below.

In the following pages, `Paymaster v0.7` denotes the Paymaster that supports
Entrypoint v0.7 and `Paymaster v0.8` denotes the Paymaster that supports
Entrypoint v0.8.

## Key features

The Circle Paymaster provides many enhancements for new crypto users who may not
be familiar with gas fees or native tokens. Paymasters allow you to build and
integrate wallets that don't require native tokens for gas, allowing you to
provide users with an experience similar to traditional finance.

### Reliable execution

Circle ensures that there is always a sufficient amount of native gas token for
each supported chain, managing swaps and balances behind-the-scenes to ensure a
reliable, consistent experience with the Paymaster smart contracts.

### Permissionless usage

The Paymaster is an onchain smart contract that any developer can integrate. You
don't need to sign up for a Circle Developer account or generate any API keys.
The Paymaster has no dependency on offchain APIs, and you can extend it for your
specific use case.

### Onboarding without native tokens

Using the USDC smart contract, you can set up an ERC-20 approval with the
Paymaster without using any native tokens. You can then pay for a smart contract
account deployment using USDC set to the pre-deployed account address with a
signed permit. This means that you can transact without ever needing to hold the
blockchain native token.

## Supported chains

| EntryPoint                                                                                 | Chains                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [ERC-4337 v0.7](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.7.0) | Arbitrum and Base                                                   |
| [ERC-4337 v0.8](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.8.0) | Arbitrum, Avalanche, Base, Ethereum, Optimism, Polygon and Unichain |

## Related products

Circle Paymaster allows users to pay gas fees in USDC. If you want to sponsor
network fees for your users, see [Gas Station](/wallets/gas-station).

### Comparison with Gas Station

| Category               | Circle Paymaster                                                                                    | Gas Station                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Description**        | A permissionless smart contract that allows users to pay gas fees in USDC instead of native tokens. | A feature of Wallets that allows developers to sponsor gas fees for their users. |
| **Circle account**     | Not required                                                                                        | Required                                                                         |
| **Compatible wallets** | Any ERC-4337-compliant wallet                                                                       | Circle Wallets                                                                   |
| **Gas fees paid in**   | USDC                                                                                                | Fiat currency via credit card                                                    |
| **Pricing model**      | 10% of the gas fee                                                                                  | 5% of the gas fee                                                                |
| **Paid by**            | End user                                                                                            | Developer                                                                        |
