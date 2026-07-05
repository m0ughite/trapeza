> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# App Kit supported blockchains and tokens

> Review supported blockchains, tokens, and token aliases available for App Kit

## Supported blockchains

Pick a tab to check blockchain support for each of App Kit's capabilities or
adapters.

<Tabs>
  <Tab title="Capabilities">
    The following tables list blockchains that App Kit supports for each capability,
    split by mainnet and testnet.

    ### Mainnet

    | Blockchain  | [Send](/app-kit/send) | [Bridge](/app-kit/bridge) | [Swap](/app-kit/swap) | [Unified Balance](/app-kit/unified-balance) |
    | :---------- | :-------------------: | :-----------------------: | :-------------------: | :-----------------------------------------: |
    | Arbitrum    |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Avalanche   |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Base        |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Codex       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | EDGE        |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Ethereum    |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | HyperEVM    |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Ink         |           ✅           |             ✅             |           ✅           |                      ❌                      |
    | Linea       |           ✅           |             ✅             |           ✅           |                      ❌                      |
    | Monad       |           ✅           |             ✅             |           ✅           |                      ❌                      |
    | Morph       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | OP Mainnet  |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Pharos      |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Plume       |           ✅           |             ✅             |           ✅           |                      ❌                      |
    | Polygon PoS |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Sei         |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Solana      |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Sonic       |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Unichain    |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | World Chain |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | XDC         |           ✅           |             ✅             |           ✅           |                      ❌                      |

    ### Testnet

    <Note>
      Among testnets, only Arc Testnet supports Swap (USDC, EURC, and cirBTC only).
      Use mainnet for Swap on any other blockchains.
    </Note>

    | Blockchain          | [Send](/app-kit/send) | [Bridge](/app-kit/bridge) | [Swap](/app-kit/swap) | [Unified Balance](/app-kit/unified-balance) |
    | :------------------ | :-------------------: | :-----------------------: | :-------------------: | :-----------------------------------------: |
    | Arbitrum Sepolia    |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Arc Testnet         |           ✅           |             ✅             |           ✅           |                      ✅                      |
    | Avalanche Fuji      |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Base Sepolia        |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Codex Testnet       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | EDGE Testnet        |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Ethereum Sepolia    |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | HyperEVM Testnet    |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Ink Testnet         |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Linea Sepolia       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Monad Testnet       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Morph Testnet       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | OP Sepolia          |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Pharos Atlantic     |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Plume Testnet       |           ✅           |             ✅             |           ❌           |                      ❌                      |
    | Polygon PoS Amoy    |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Sei Testnet         |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Solana Devnet       |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Sonic Testnet       |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | Unichain Sepolia    |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | World Chain Sepolia |           ✅           |             ✅             |           ❌           |                      ✅                      |
    | XDC Apothem         |           ✅           |             ✅             |           ❌           |                      ❌                      |
  </Tab>

  <Tab title="Adapters">
    The following tables list blockchains that App Kit supports for each adapter,
    split by mainnet and testnet. The Viem and Ethers adapters support the same EVM
    blockchains. The Solana adapter supports only the Solana blockchain.

    ### Mainnet

    | Blockchain  | Viem / Ethers | Solana | Circle Wallets |
    | :---------- | :-----------: | :----: | :------------: |
    | Arc         |       ✅       |    ❌   |        ✅       |
    | Arbitrum    |       ✅       |    ❌   |        ✅       |
    | Avalanche   |       ✅       |    ❌   |        ✅       |
    | Base        |       ✅       |    ❌   |        ✅       |
    | Codex       |       ✅       |    ❌   |        ❌       |
    | EDGE        |       ✅       |    ❌   |        ❌       |
    | Ethereum    |       ✅       |    ❌   |        ✅       |
    | HyperEVM    |       ✅       |    ❌   |        ❌       |
    | Ink         |       ✅       |    ❌   |        ❌       |
    | Linea       |       ✅       |    ❌   |        ❌       |
    | Monad       |       ✅       |    ❌   |        ❌       |
    | Morph       |       ✅       |    ❌   |        ❌       |
    | OP Mainnet  |       ✅       |    ❌   |        ✅       |
    | Pharos      |       ✅       |    ❌   |        ❌       |
    | Plume       |       ✅       |    ❌   |        ❌       |
    | Polygon PoS |       ✅       |    ❌   |        ✅       |
    | Sei         |       ✅       |    ❌   |        ❌       |
    | Solana      |       ❌       |    ✅   |        ✅       |
    | Sonic       |       ✅       |    ❌   |        ❌       |
    | Unichain    |       ✅       |    ❌   |        ✅       |
    | World Chain |       ✅       |    ❌   |        ❌       |
    | XDC         |       ✅       |    ❌   |        ❌       |

    ### Testnet

    | Blockchain          | Viem / Ethers | Solana | Circle Wallets |
    | :------------------ | :-----------: | :----: | :------------: |
    | Arbitrum Sepolia    |       ✅       |    ❌   |        ✅       |
    | Arc Testnet         |       ✅       |    ❌   |        ✅       |
    | Avalanche Fuji      |       ✅       |    ❌   |        ✅       |
    | Base Sepolia        |       ✅       |    ❌   |        ✅       |
    | Codex Testnet       |       ✅       |    ❌   |        ❌       |
    | EDGE Testnet        |       ✅       |    ❌   |        ❌       |
    | Ethereum Sepolia    |       ✅       |    ❌   |        ✅       |
    | HyperEVM Testnet    |       ✅       |    ❌   |        ❌       |
    | Ink Testnet         |       ✅       |    ❌   |        ❌       |
    | Linea Sepolia       |       ✅       |    ❌   |        ❌       |
    | Monad Testnet       |       ✅       |    ❌   |        ❌       |
    | Morph Testnet       |       ✅       |    ❌   |        ❌       |
    | OP Sepolia          |       ✅       |    ❌   |        ✅       |
    | Pharos Atlantic     |       ✅       |    ❌   |        ❌       |
    | Plume Testnet       |       ✅       |    ❌   |        ❌       |
    | Polygon PoS Amoy    |       ✅       |    ❌   |        ✅       |
    | Sei Testnet         |       ✅       |    ❌   |        ❌       |
    | Solana Devnet       |       ❌       |    ✅   |        ✅       |
    | Sonic Testnet       |       ✅       |    ❌   |        ❌       |
    | Unichain Sepolia    |       ✅       |    ❌   |        ✅       |
    | World Chain Sepolia |       ✅       |    ❌   |        ❌       |
    | XDC Apothem         |       ✅       |    ❌   |        ❌       |
  </Tab>
</Tabs>

### Chain identifiers

For most blockchains, the identifier is the blockchain name with any spaces
replaced by underscores (for example, Arc Testnet → `Arc_Testnet`). Identifiers
are case-sensitive and match the `BridgeChain` enum exported from
`@circle-fin/app-kit`:

```ts theme={null}
import { BridgeChain } from "@circle-fin/app-kit";

const chain = BridgeChain.Arc_Testnet; // or "Arc_Testnet"
```

The blockchains below are exceptions:

| Blockchain       | Identifier             |
| :--------------- | :--------------------- |
| EDGE             | `Edge`                 |
| EDGE Testnet     | `Edge_Testnet`         |
| OP Mainnet       | `Optimism`             |
| OP Sepolia       | `Optimism_Sepolia`     |
| Pharos Atlantic  | `Pharos_Testnet`       |
| Polygon PoS      | `Polygon`              |
| Polygon PoS Amoy | `Polygon_Amoy_Testnet` |

## Supported tokens

<Note>
  You can specify either a contract address or an [alias](#token-aliases) for any
  supported token.
</Note>

Each App Kit capability supports different tokens:

* **[Send](/app-kit/send)**: Any token. Use [token aliases](#token-aliases) for
  common tokens or the token's contract address for other tokens.
* **[Bridge](/app-kit/bridge)**: USDC only.
* **[Swap](/app-kit/swap)**:
  * Any tokens with enough liquidity to trade with major stablecoins such as
    USDC, EURC, USDT, USDe, DAI, and PYUSD.
  * Native tokens on blockchains where Swap is supported.
  * On Arc Testnet, only USDC, EURC, and cirBTC.
* **[Unified Balance](/app-kit/unified-balance)**: USDC only.

### Token aliases

App Kit works with any supported token when you supply the contract address. For
convenience, you can use the following aliases for the most common tokens
instead:

* `USDC`
* `EURC`
* `USDT`
* `USDe`
* `DAI`
* `PYUSD`
* `cirBTC`
* `NATIVE`: Uses the blockchain's native token.
