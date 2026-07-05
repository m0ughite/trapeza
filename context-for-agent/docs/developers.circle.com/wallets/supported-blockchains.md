> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Supported Blockchains

> Supported blockchains for Circle Wallets, including account types, token standards, and API limitations by blockchain.

Circle Wallets supports multiple blockchains. Account type support, token
standards, and API coverage vary by blockchain.

## Supported blockchains by account type

The following tables list supported blockchains and account types.
Developer-controlled and user-controlled wallets support Externally Owned
Accounts (EOA) and Smart Contract Accounts (SCA). Modular wallets use Modular
Smart Contract Accounts (MSCA) only. For a full comparison, see
[Choose your wallet and account types](/wallets/account-types).

<Note>
  For "Other EVM blockchains," create wallets using the `EVM` or `EVM-TESTNET`
  chain code. Wallet addresses are consistent across all EVM-compatible
  blockchains. See
  [Unified wallet addressing across EVM chains](/wallets/unified-wallet-addressing-evm).
</Note>

### Mainnet

| Blockchain            | Chain code |                        EOA                       | SCA | MSCA |
| --------------------- | :--------: | :----------------------------------------------: | :-: | :--: |
| Aptos                 |   `APTOS`  |                         ✅                        |  ❌  |   ❌  |
| Arbitrum              |    `ARB`   |                         ✅                        |  ✅  |   ✅  |
| Avalanche             |   `AVAX`   |                         ✅                        |  ✅  |   ✅  |
| Base                  |   `BASE`   |                         ✅                        |  ✅  |   ✅  |
| Ethereum              |    `ETH`   |                         ✅                        |  ✅  |   ❌  |
| Monad                 |   `MONAD`  |                         ✅                        |  ✅  |   ✅  |
| NEAR                  |   `NEAR`   | [Signing only](#blockchain-specific-limitations) |  ❌  |   ❌  |
| Optimism              |    `OP`    |                         ✅                        |  ✅  |   ✅  |
| Polygon PoS           |   `MATIC`  |                         ✅                        |  ✅  |   ✅  |
| Solana                |    `SOL`   |                         ✅                        |  ❌  |   ❌  |
| Unichain              |    `UNI`   |                         ✅                        |  ✅  |   ✅  |
| Other EVM blockchains |    `EVM`   |                         ✅                        |  ❌  |   ❌  |

### Testnet

| Blockchain            |    Chain code   |                        EOA                       | SCA | MSCA |
| --------------------- | :-------------: | :----------------------------------------------: | :-: | :--: |
| Aptos Testnet         | `APTOS-TESTNET` |                         ✅                        |  ❌  |   ❌  |
| Arbitrum Sepolia      |  `ARB-SEPOLIA`  |                         ✅                        |  ✅  |   ✅  |
| Arc Testnet           |  `ARC-TESTNET`  |                         ✅                        |  ✅  |   ✅  |
| Avalanche Fuji        |   `AVAX-FUJI`   |                         ✅                        |  ✅  |   ✅  |
| Base Sepolia          |  `BASE-SEPOLIA` |                         ✅                        |  ✅  |   ✅  |
| Ethereum Sepolia      |  `ETH-SEPOLIA`  |                         ✅                        |  ✅  |   ❌  |
| Monad Testnet         | `MONAD-TESTNET` |                         ✅                        |  ✅  |   ✅  |
| NEAR Testnet          |  `NEAR-TESTNET` | [Signing only](#blockchain-specific-limitations) |  ❌  |   ❌  |
| Optimism Sepolia      |   `OP-SEPOLIA`  |                         ✅                        |  ✅  |   ✅  |
| Polygon PoS Amoy      |   `MATIC-AMOY`  |                         ✅                        |  ✅  |   ✅  |
| Solana Devnet         |   `SOL-DEVNET`  |                         ✅                        |  ❌  |   ❌  |
| Unichain Sepolia      |  `UNI-SEPOLIA`  |                         ✅                        |  ✅  |   ✅  |
| Other EVM blockchains |  `EVM-TESTNET`  |                         ✅                        |  ❌  |   ❌  |

## Supported tokens and standards

* **Aptos**: native coin, Fungible Asset
* **EVM-compatible blockchains**: native coin, ERC-20, ERC-721, and ERC-1155
* **Solana**: native coin, SPL

## Blockchain-specific limitations

Every [Wallets API](/api-reference/wallets) endpoint is available on all
supported blockchains, except for the blockchains listed below.

* **Aptos**:
  * NFT lookup is not supported.
  * Balance queries return tokens in primary storage only. Tokens in secondary
    storage
    ([AIP-21](https://github.com/aptos-labs/aptos-core/releases/tag/aptos-node-v1.5.0))
    are excluded.
  * Contract execution
    ([developer-controlled](/api-reference/wallets/developer-controlled-wallets/create-developer-transaction-contract-execution),
    [user-controlled](/api-reference/wallets/user-controlled-wallets/create-user-transaction-contract-execution-challenge))
    is limited to batch transfers. The `abiFunctionSignature` and
    `contractAddress` fields must use fixed values. The request body below shows
    the required values (`entitySecretCiphertext` is required for
    developer-controlled wallets only).

    ```json JSON theme={null}
    {
      "idempotencyKey": "{{$YourUUID}}",
      "walletId": "639ff7f1-2fed-5de4-9976-c1706ca1ef88",
      "feeLevel": "MEDIUM",
      "abiFunctionSignature": "aptos_account::batch_transfer_fungible_assets(metadata:object::Object<fungible_asset::Metadata>,recipients:vector<address>,amounts:vector<u64>)",
      "abiParameters": [
        "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832",
        [
          "0xe78568bcfc30070fae04c1c4ba267eecc228e077672e18086baa042cbfb0ba70",
          "0xb8019c3e505fafe00edd1ba95c34f3f78e957da668c23ecb56ccd3a59ee8f21e"
        ],
        ["1", "1"]
      ],
      "contractAddress": "0x1",
      "refId": "aptos-testnet-contractExecution",
      "entitySecretCiphertext": "{{entity-secret-ciphertext}}"
    }
    ```

* **Arbitrum**: Accelerate and cancel transactions are not supported.

* **NEAR**: Developer-controlled wallets support signing only
  ([sign transaction](/api-reference/wallets/developer-controlled-wallets/sign-transaction)
  and
  [sign delegate action](/api-reference/wallets/developer-controlled-wallets/sign-delegate-action)).
  Transfers, balances, NFT lookup, and contract execution are not supported.
  User-controlled wallets are not supported.

* **Other EVM blockchains**: Wallet creation and signing are supported.
  Transfers are supported for developer-controlled wallets only. Contract
  execution, accelerate, and cancel are not supported.

* **Solana**: Contract execution is not supported. Signing typed data is not
  supported. Accelerate and cancel transactions are not supported.
