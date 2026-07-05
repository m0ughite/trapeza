> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Supported Chains and Currencies

> Blockchains and currencies supported by Circle Mint and related APIs.

<Warning>
  **Unsupported assets**

  Circle Mint and Circle APIs only support USDC and EURC tokens on the indicated
  blockchains. Don't send unsupported tokens such as USDT or bridged USDC to your
  Circle Mint address. Doing so might result in a loss of funds.

  **Cosmos appchains**

  Circle Mint and Circle APIs only support USDC from Noble. If you transfer USDC
  from Noble to other appchains via IBC (Inter-Blockchain Communication), you must
  transfer it back to Noble before you transfer it to your Circle Mint address.

  Don't attempt to deposit USDC from an appchain other than Noble to your Circle
  Mint address. Doing so might result in a loss of funds.

  **Polkadot parachains**

  Circle Mint and Circle APIs only support USDC from Polkadot Asset Hub. If you
  transfer USDC from Polkadot Asset Hub to other parachains via XCM, you must
  transfer it back to Polkadot Asset Hub before you transfer it to your Circle
  Mint address.

  Don't attempt to deposit XCM-transferred USDC from a parachain other than
  Polkadot Asset Hub to your Circle Mint address. Doing so might result in a loss
  of funds.

  **Injective**

  Circle Mint only supports USDC deposits on Injective through the EVM layer.
  Cosmos-layer USDC deposits are not supported. If you deposit USDC through the
  Cosmos layer, your funds are stuck and not credited to your Circle Mint account.
  To recover stuck funds, contact
  [Circle Support](https://help.circle.com/s/submit-ticket).
</Warning>

## USDC

| Chain              | API Chain Code | API Currency Code |
| ------------------ | -------------- | ----------------- |
| Algorand           | `ALGO`         | `USD`             |
| Aptos              | `APTOS`        | `USD`             |
| Arbitrum           | `ARB`          | `USD`             |
| Avalanche C-Chain  | `AVAX`         | `USD`             |
| Base               | `BASE`         | `USD`             |
| Celo               | `CELO`         | `USD`             |
| Codex              | `CODEX`        | `USD`             |
| EDGE               | `EDGE`         | `USD`             |
| Ethereum           | `ETH`          | `USD`             |
| Hedera             | `HBAR`         | `USD`             |
| HyperEVM           | `HYPEREVM`     | `USD`             |
| Injective          | `INJECTIVE`    | `USD`             |
| Ink                | `INK`          | `USD`             |
| Linea              | `LINEA`        | `USD`             |
| Monad              | `MONAD`        | `USD`             |
| Morph              | `MORPH`        | `USD`             |
| NEAR               | `NEAR`         | `USD`             |
| Noble              | `NOBLE`        | `USD`             |
| OP Mainnet         | `OP`           | `USD`             |
| Pharos             | `PHAROS`       | `USD`             |
| Plume              | `PLUME`        | `USD`             |
| Polkadot Asset Hub | `PAH`          | `USD`             |
| Polygon PoS        | `POLY`         | `USD`             |
| Sei                | `SEI`          | `USD`             |
| Solana             | `SOL`          | `USD`             |
| Sonic              | `SONIC`        | `USD`             |
| Starknet           | `STRK`         | `USD`             |
| Stellar            | `XLM`          | `USD`             |
| Sui                | `SUI`          | `USD`             |
| Unichain           | `UNI`          | `USD`             |
| World Chain        | `WORLDCHAIN`   | `USD`             |
| XDC                | `XDC`          | `USD`             |
| XRPL               | `XRP`          | `USD`             |
| ZKsync Era         | `ZKS`          | `USD`             |

## EURC

| Chain             | API Chain Code | API Currency Code |
| ----------------- | -------------- | ----------------- |
| Avalanche C-Chain | `AVAX`         | `EUR`             |
| Base              | `BASE`         | `EUR`             |
| Ethereum          | `ETH`          | `EUR`             |
| Solana            | `SOL`          | `EUR`             |
| Stellar           | `XLM`          | `EUR`             |
| World Chain       | `WORLDCHAIN`   | `EUR`             |

## Crypto Deposits and Payouts APIs

The Crypto Deposits API and Crypto Payouts API support a subset of blockchains
that have USDC available. The following table outlines which blockchain each API
supports.

| Chain              | Crypto Deposits API | Crypto Payouts API |
| ------------------ | ------------------- | ------------------ |
| Algorand           | Yes                 | Yes                |
| Aptos              | No                  | No                 |
| Arbitrum           | Yes                 | Yes                |
| Avalanche C-Chain  | Yes                 | Yes                |
| Base               | Yes                 | Yes                |
| Celo               | No                  | No                 |
| Codex              | Yes                 | Yes                |
| EDGE               | Yes                 | Yes                |
| Ethereum           | Yes                 | Yes                |
| Hedera             | Yes                 | Yes                |
| HyperEVM           | Yes                 | Yes                |
| Injective          | Yes                 | Yes                |
| Ink                | Yes                 | Yes                |
| Linea              | Yes                 | Yes                |
| Monad              | Yes                 | Yes                |
| Morph              | Yes                 | Yes                |
| NEAR               | No                  | No                 |
| Noble              | Yes                 | Yes                |
| OP Mainnet         | Yes                 | Yes                |
| Pharos             | Yes                 | Yes                |
| Plume              | Yes                 | Yes                |
| Polkadot Asset Hub | No                  | No                 |
| Polygon PoS        | Yes                 | Yes                |
| Sei                | Yes                 | Yes                |
| Solana             | Yes                 | Yes                |
| Sonic              | Yes                 | Yes                |
| Starknet           | Yes                 | Yes                |
| Stellar            | Yes                 | Yes                |
| Sui                | No                  | No                 |
| Unichain           | No                  | No                 |
| World Chain        | Yes                 | Yes                |
| XDC                | Yes                 | Yes                |
| XRPL               | Yes                 | Yes                |
| ZKsync Era         | No                  | No                 |

## Using chains and currencies in the API

Any time you refer to a currency in a Circle Mint API call, you use a currency
and chain pair. For example, to
[create a USDC transfer](/api-reference/circle-mint/account/create-business-transfer)
on Ethereum, specify the `USD` currency on the `ETH` chain.

When referring to balances, you only need to refer to the currency because the
value of the currency for Circle-hosted assets is independent of the chain.
