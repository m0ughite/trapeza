> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# xReserve Supported Blockchains and Domains

## Supported blockchains

xReserve operates across multiple blockchains. Each supported blockchain serves
one or more of the following roles:

* **Source chains** where Circle-deployed xReserve smart contracts hold
  [USDC reserves](/xreserve/concepts/technical-guide#usdc-reserve).
* **Remote chains** where USDC-backed stablecoins are issued.
* **Destination chains** where USDC or USDC-backed stablecoins are ultimately
  withdrawn.

### Source chains

The following tables list the mainnet and testnet blockchains where xReserve
smart contracts have been deployed. Users deposit USDC into these contracts to
receive an equal amount of USDC-backed stablecoins on remote blockchains.

**Mainnet**

| Blockchain | USDC token address                                                                                                    | xReserve contract address                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Ethereum   | [`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48) | [0x8888888199b2Df864bf678259607d6D5EBb4e3Ce](https://etherscan.io/address/0x8888888199b2Df864bf678259607d6D5EBb4e3Ce) |

**Testnet**

| Blockchain       | USDC token address                                                                                                            | xReserve contract address                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Arc Testnet      | [`0x3600000000000000000000000000000000000000`](https://testnet.arcscan.app/token/0x3600000000000000000000000000000000000000)  | [0x008888878f94C0d87defdf0B07f46B93C1934442](https://testnet.arcscan.app/address/0x008888878f94C0d87defdf0B07f46B93C1934442)  |
| Ethereum Sepolia | [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](https://sepolia.etherscan.io/token/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238) | [0x008888878f94C0d87defdf0B07f46B93C1934442](https://sepolia.etherscan.io/address/0x008888878f94C0d87defdf0B07f46B93C1934442) |

### Remote chains

The following tables list the mainnet and testnet xReserve partner blockchains
where USDC-backed stablecoins can be minted.

**Mainnet**

| Blockchain | Token symbol | Token address or identifier                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aleo       | USDCx        | [`usdcx_stablecoin.aleo`](https://explorer.provable.com/program/usdcx_stablecoin.aleo)                                                                                                                                                                                                                                                                                                |
| Canton     | USDCx        | `InstrumentId.id`: `USDCx` <br /> `InstrumentId.admin`: [`decentralized-usdc-interchain-rep::12208115f1e168dd7e792320be9c4ca720c751a02a3053c7606e1c1cd3dad9bf60ef`](https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/decentralized-usdc-interchain-rep::12208115f1e168dd7e792320be9c4ca720c751a02a3053c7606e1c1cd3dad9bf60ef/registry/metadata/v1/instruments) |
| Cardano    | USDCx        | [`1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e345553444378`](https://cardanoscan.io/token/1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e345553444378)                                                                                                                                                                                                               |
| Movement   | USDCx        | [`0xba11833544a2f99eec743f41a228ca6ffa7f13c3b6b04681d5a79a8b75ff225e`](https://explorer.movementnetwork.xyz/fungible_asset/0xba11833544a2f99eec743f41a228ca6ffa7f13c3b6b04681d5a79a8b75ff225e?network=mainnet)                                                                                                                                                                        |
| Stacks     | USDCx        | [`SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx`](https://explorer.hiro.so/txid/SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx?chain=mainnet)                                                                                                                                                                                                                                      |

**Testnet**

| Blockchain       | Token symbol | Token address or identifier                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aleo Testnet     | USDCx        | [`test_usdcx_stablecoin.aleo`](https://testnet.explorer.provable.com/program/test_usdcx_stablecoin.aleo)                                                                                                                                                                                                                                                                                      |
| Canton TestNet   | USDCx        | `InstrumentId.id`: `USDCx` <br /> `InstrumentId.admin`: [`decentralized-usdc-interchain-rep::122049e2af8a725bd19759320fc83c638e7718973eac189d8f201309c512d1ffec61`](https://api.utilities.digitalasset-staging.com/api/token-standard/v0/registrars/decentralized-usdc-interchain-rep::122049e2af8a725bd19759320fc83c638e7718973eac189d8f201309c512d1ffec61/registry/metadata/v1/instruments) |
| Cardano Preprod  | USDCx        | [`31dde3db98ad05feb688d4dbb146b3b6054e1246cbcef98c79b0bf665553444378`](https://preprod.cardanoscan.io/token/31dde3db98ad05feb688d4dbb146b3b6054e1246cbcef98c79b0bf665553444378)                                                                                                                                                                                                               |
| Movement Bardock | USDCx        | [`0x63f169ba69623ba6ccf34620857644feb46d0f87e1d7bbcf8c071d30c3d94bd6`](https://explorer.movementnetwork.xyz/fungible_asset/0x63f169ba69623ba6ccf34620857644feb46d0f87e1d7bbcf8c071d30c3d94bd6?network=bardock+testnet)                                                                                                                                                                        |
| Stacks Testnet   | USDCx        | [`ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx`](https://explorer.hiro.so/txid/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx?chain=testnet)                                                                                                                                                                                                                                              |

### Destination chains

These are the destination blockchains where USDC or USDC-backed stablecoins are
ultimately withdrawn:

* [Gateway supported blockchains](/gateway/references/supported-blockchains):
  Because xReserve holds USDC in Gateway wallets, users can withdraw USDC on any
  Gateway supported blockchain, including the source chain.
* [CCTP supported blockchains](/cctp/cctp-supported-blockchains): If a
  blockchain is not supported by Gateway, xReserve uses CCTP to forward the
  funds to another blockchain. This lets users withdraw USDC on any CCTP
  supported blockchain.
* Another [remote blockchain](#remote-chains): Users can burn USDC-backed
  stablecoins on one remote blockchain to withdraw USDC-backed stablecoins on a
  different remote blockchain.

## Domain identifiers

A domain is a Circle-issued numeric identifier for a blockchain. xReserve uses
domain identifiers in messages and attestations. Domain identifiers don't map to
any existing public chain ID.

xReserve domains fall into two categories:

* **Source domains** are the blockchains on which USDC is held in an xReserve
  contract.
* **Remote domains** are the blockchains on which USDC-backed stablecoins are
  deployed, minted, and circulated.

<Tip>
  Use the [Get domain information](/api-reference/xreserve/all/get-info)
  endpoint to retrieve a list of all source and remote domains.
</Tip>

### Source domains

| Domain | Name        |
| ------ | ----------- |
| 0      | Ethereum    |
| 26     | Arc Testnet |

### Remote domains

| Domain | Name     |
| ------ | -------- |
| 10001  | Canton   |
| 10002  | Aleo     |
| 10003  | Stacks   |
| 10004  | Cardano  |
| 10005  | Movement |
