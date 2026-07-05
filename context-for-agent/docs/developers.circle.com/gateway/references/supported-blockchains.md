> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Gateway Supported Blockchains

> List of blockchains that Gateway supports

Gateway supports a subset of blockchains where USDC is natively issued. The
following sections show the chains that Gateway supports.

Circle identifies each blockchain by a numeric domain identifier. These domain
identifiers are not tied to any existing public chain ID. Gateway uses the same
domain identifiers as [CCTP](/cctp/cctp-supported-blockchains).

## Testnet

| Blockchain          | Domain | Nanopayments | `SupportedChainName` |
| ------------------- | ------ | ------------ | -------------------- |
| Arc Testnet         | 26     | Yes          | `arcTestnet`         |
| Arbitrum Sepolia    | 3      | Yes          | `arbitrumSepolia`    |
| Avalanche Fuji      | 1      | Yes          | `avalancheFuji`      |
| Base Sepolia        | 6      | Yes          | `baseSepolia`        |
| Ethereum Sepolia    | 0      | Yes          | `sepolia`            |
| HyperEVM Testnet    | 19     | Yes          | `hyperEvmTestnet`    |
| OP Sepolia          | 2      | Yes          | `optimismSepolia`    |
| Polygon Amoy        | 7      | Yes          | `polygonAmoy`        |
| Sei Atlantic        | 16     | Yes          | `seiAtlantic`        |
| Solana Devnet       | 5      | No           |                      |
| Sonic Testnet       | 13     | Yes          | `sonicTestnet`       |
| Unichain Sepolia    | 10     | Yes          | `unichainSepolia`    |
| World Chain Sepolia | 14     | Yes          | `worldChainSepolia`  |

## Mainnet

| Blockchain  | Domain | Nanopayments |
| ----------- | ------ | ------------ |
| Arbitrum    | 3      | Yes          |
| Avalanche   | 1      | Yes          |
| Base        | 6      | Yes          |
| Ethereum    | 0      | Yes          |
| HyperEVM    | 19     | Yes          |
| OP          | 2      | Yes          |
| Polygon PoS | 7      | Yes          |
| Sei         | 16     | Yes          |
| Solana      | 5      | No           |
| Sonic       | 13     | Yes          |
| Unichain    | 10     | Yes          |
| World Chain | 14     | Yes          |

## Required block confirmations

Before updating the unified USDC balance or issuing
[attestations](/gateway/references/technical-guide#attestation), the Gateway API
waits for a specific number of block confirmations so that the deposit
transaction is unlikely to be reverted.

The following table shows the number of block confirmations and the average time
to attestation for each supported chain. The average time to attestation is the
time it takes for a transaction to be included in a block and confirmed by the
network.

| Blockchain  | Number of blocks | Average time       |
| ----------- | ---------------- | ------------------ |
| Arbitrum    | \~65 ETH blocks  | \~13 to 19 minutes |
| Arc Testnet | \~1              | \~0.5 seconds      |
| Avalanche   | 1                | \~8 seconds        |
| Base        | \~65 ETH blocks  | \~13 to 19 minutes |
| Ethereum    | \~65             | \~13 to 19 minutes |
| HyperEVM    | \~1              | \~5 seconds        |
| OP          | \~65 ETH blocks  | \~13 to 19 minutes |
| Polygon PoS | \~2-3            | \~8 seconds        |
| Sei         | \~1              | \~5 seconds        |
| Solana      | \~2-3            | \~8 seconds        |
| Sonic       | \~1              | \~8 seconds        |
| Unichain    | \~65 ETH blocks  | \~13 to 19 minutes |
| World Chain | \~65 ETH blocks  | \~13 to 19 minutes |

## Fast deposits

Some deposit times may be too long for certain use cases. Third parties may
offer alternative methods for depositing funds into Gateway with faster deposit
times. For example, [Eco](https://www.eco.com) offers a
[Gateway deposit service](https://eco.com/docs/getting-started/programmable-addresses/gateway-deposits).
Circle does not endorse, maintain, or audit Eco or any other similar third-party
service. Use of any such third-party service involves risks, and you are solely
responsible for conducting your own diligence and reviewing the applicable terms
and conditions before using such service. This guide is provided solely for
informational purposes and may become outdated.
