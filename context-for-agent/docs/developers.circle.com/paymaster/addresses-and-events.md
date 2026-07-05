> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Paymaster Addresses and Events

This page contains information on the addresses of the Circle Paymaster
contracts, and the events the contracts emit during operation.

## Paymaster addresses

You can access the permissionless paymaster contracts at the following addresses
on supported blockchains:

<Tabs>
  <Tab title="Paymaster v0.7">
    ### Mainnet

    | Blockchain | Symbol | Paymaster contract address                                                                                              |
    | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
    | Arbitrum   | `ARB`  | [`0x6C973eBe80dCD8660841D4356bf15c32460271C9`](https://arbiscan.io/address/0x6C973eBe80dCD8660841D4356bf15c32460271C9)  |
    | Base       | `BASE` | [`0x6C973eBe80dCD8660841D4356bf15c32460271C9`](https://basescan.org/address/0x6C973eBe80dCD8660841D4356bf15c32460271C9) |

    ### Testnet

    | Blockchain       | Symbol         | Paymaster contract address                                                                                                      |
    | ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
    | Arbitrum Sepolia | `ARB-SEPOLIA`  | [`0x31BE08D380A21fc740883c0BC434FcFc88740b58`](https://sepolia.arbiscan.io/address/0x31BE08D380A21fc740883c0BC434FcFc88740b58)  |
    | Arc Testnet      | `ARC-TESTNET`  | [`0x31BE08D380A21fc740883c0BC434FcFc88740b58`](https://testnet.arcscan.app/address/0x31BE08D380A21fc740883c0BC434FcFc88740b58)  |
    | Base Sepolia     | `BASE-SEPOLIA` | [`0x31BE08D380A21fc740883c0BC434FcFc88740b58`](https://sepolia.basescan.org/address/0x31BE08D380A21fc740883c0BC434FcFc88740b58) |
  </Tab>

  <Tab title="Paymaster v0.8">
    ### Mainnet

    | Blockchain | Symbol  | Paymaster contract address                                                                                                         |
    | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
    | Arbitrum   | `ARB`   | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://arbiscan.io/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec)             |
    | Avalanche  | `AVAX`  | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://snowtrace.io/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec)            |
    | Base       | `BASE`  | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://basescan.org/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec)            |
    | Ethereum   | `ETH`   | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://etherscan.io/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec)            |
    | Optimism   | `OP`    | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://optimistic.etherscan.io/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec) |
    | Polygon    | `MATIC` | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://polygonscan.com/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec)         |
    | Unichain   | `UNI`   | [`0x0578cFB241215b77442a541325d6A4E6dFE700Ec`](https://unichain.blockscout.com/address/0x0578cFB241215b77442a541325d6A4E6dFE700Ec) |

    ### Testnet

    | Blockchain       | Symbol         | Paymaster contract address                                                                                                                 |
    | ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
    | Arbitrum Sepolia | `ARB-SEPOLIA`  | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://sepolia.arbiscan.io/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)             |
    | Arc Testnet      | `ARC-TESTNET`  | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://testnet.arcscan.app/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)             |
    | Avalanche Fuji   | `AVAX-FUJI`    | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://testnet.snowtrace.io/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)            |
    | Base Sepolia     | `BASE-SEPOLIA` | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://sepolia.basescan.org/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)            |
    | Ethereum Sepolia | `ETH-SEPOLIA`  | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://sepolia.etherscan.io/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)            |
    | Optimism Sepolia | `OP-SEPOLIA`   | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://sepolia-optimistic.etherscan.io/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966) |
    | Polygon Amoy     | `MATIC-AMOY`   | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://amoy.polygonscan.com/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966)            |
    | Unichain Sepolia | `UNI-SEPOLIA`  | [`0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`](https://unichain-sepolia.blockscout.com/address/0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966) |
  </Tab>
</Tabs>

## Paymaster events

This section explains the events from the Circle Paymaster and when they are
emitted. You can use these events to debug or track the state after submitting a
user operation (user op) to a bundler.

### TokenPaymasterV07.sol and TokenPaymasterV08.sol

These files are the main contract of the Circle Paymaster that support
EntryPoint v0.7 and v0.8. The primary functions they integrate are:

* `_validatePaymasterUserOp`: validates the user op and charges the prefund
  token from the sender before execution.
* `_postOp`: refunds the token back to the sender when the actual amount of
  tokens needed is known after execution.

#### UserOperationSponsored

The contract emits this event after the `_postOp` is executed and the prefund
token (if any) is refunded.

**Attributes**

| Name                | Type      | Description                                                                                  |
| ------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `token`             | `IERC20`  | The ERC-20 token paid by the sender                                                          |
| `sender`            | `address` | The sender address                                                                           |
| `userOpHash`        | `bytes32` | The hash of the user op                                                                      |
| `nativeTokenPrice`  | `uint256` | The price of 1 ether = 1e18 wei, denominated in token                                        |
| `actualTokenNeeded` | `uint256` | The final transaction cost to the smart contract account (SCA), denominated in token         |
| `feeTokenAmount`    | `uint256` | The fee spread used to cover the slippage from exchanging USDC for ETH, denominated in token |

**Example**

Using
[this transaction](https://sepolia.etherscan.io/tx/0x44727688a0bc343ce73b422ac46b2b14a352ccc59f9ff0203588d3718458931e#eventlog)
as an example, the `userOperationSponsored` event contains the following data:

| Name                | Type      | Value                                                                |
| ------------------- | --------- | -------------------------------------------------------------------- |
| `token`             | `IERC20`  | `0x0000000000000000000000001c7d4b196cb0c7b01d743fbc6116a902379c7238` |
| `sender`            | `address` | `0x000000000000000000000000148cab4b1a7e8c23ae62967cfc8df6292ecf27a8` |
| `userOpHash`        | `bytes32` | `cc6f71a0ba8d9b72e75c45fae7b830c403b46964eb1d3f8daa0b73d14e6c5b0d`   |
| `nativeTokenPrice`  | `uint256` | `3000000000`                                                         |
| `actualTokenNeeded` | `uint256` | `4551712`                                                            |
| `feeTokenAmount`    | `uint256` | `0`                                                                  |
