> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Adapter setups

> Configure Viem, Ethers, Solana, or Circle Wallets adapters for App Kit

App Kit works with common adapter libraries to integrate smoothly with your
existing workflow:

* [`viem`](https://viem.sh/) v2 for EVM-compatible blockchains
* [`ethers`](https://ethers.org/) v6 for EVM-compatible blockchains
* [`solana`](https://solana.com/) for the Solana blockchain
* [`circle-wallets`](https://developers.circle.com/wallets/dev-controlled) for
  your existing Circle Wallets account

Pick your adapter to see its setup options.

<Tabs>
  <Tab title="Viem">
    ## Standard setup

    The standard setup is the fastest way to start. Create one adapter from your
    wallet private key that works across multiple blockchains. This setup uses
    built-in public RPC endpoints and factory functions.

    <Note>
      Default RPC URLs are shared and may be rate-limited or unreliable. For a more
      stable connection, configure a [custom RPC](#custom-rpc).
    </Note>

    ```typescript TypeScript theme={null}
    import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });
    ```

    ## Custom RPC

    Use your own connection to override the default RPC URLs from
    [standard setup](#standard-setup), which may be rate-limited and unreliable.
    [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/),
    and [chainlist.org](https://chainlist.org/) are common places to source
    endpoints. This example uses Alchemy:

    ```typescript TypeScript theme={null}
    import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
    import { EthereumSepolia, ArcTestnet } from "@circle-fin/app-kit/chains";
    import { createPublicClient, http } from "viem";

    // Map RPC endpoints by chain name
    const RPC_BY_CHAIN_NAME: Record<string, string> = {
      [EthereumSepolia.name]: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      [ArcTestnet.name]: `https://arc-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    };

    // Create an adapter
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
      // Replace the default connection
      getPublicClient: ({ chain }) => {
        const rpcUrl = RPC_BY_CHAIN_NAME[chain.name];
        if (!rpcUrl) {
          throw new Error(`No RPC configured for chain: ${chain.name}`);
        }
        return createPublicClient({
          chain,
          transport: http(rpcUrl, {
            retryCount: 3,
            timeout: 10000,
          }),
        });
      },
    });
    ```

    ## Browser wallet

    This setup expects a wallet extension in the browser (for example
    `window.ethereum` or `window.solana`), not a Node.js server. You can use wallets
    like [MetaMask](https://metamask.io/) or [Phantom](https://phantom.com/):

    ```typescript TypeScript theme={null}
    import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
    import type { EIP1193Provider } from "viem";

    declare global {
      interface Window {
        ethereum?: EIP1193Provider;
      }
    }

    // Check if wallet provider is available
    if (!window.ethereum) {
      throw new Error("No wallet provider found");
    }

    const adapter = await createViemAdapterFromProvider({
      provider: window.ethereum,
    });
    ```
  </Tab>

  <Tab title="Ethers">
    ## Standard setup

    The standard setup is the fastest way to start. Create one adapter from your
    wallet private key that works across multiple blockchains. This setup uses
    built-in public RPC endpoints and factory functions.

    <Note>
      Default RPC URLs are shared and may be rate-limited or unreliable. For a more
      stable connection, configure a [custom RPC](#custom-rpc).
    </Note>

    ```typescript TypeScript theme={null}
    import { createEthersAdapterFromPrivateKey } from "@circle-fin/adapter-ethers-v6";

    const adapter = createEthersAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });
    ```

    ## Custom RPC

    Use your own connection to override the default RPC URLs from
    [standard setup](#standard-setup), which may be rate-limited and unreliable.
    [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/),
    and [chainlist.org](https://chainlist.org/) are common places to source
    endpoints. This example uses Alchemy:

    ```typescript TypeScript theme={null}
    import { createEthersAdapterFromPrivateKey } from "@circle-fin/adapter-ethers-v6";
    import { EthereumSepolia, ArcTestnet } from "@circle-fin/app-kit/chains";
    import { JsonRpcProvider } from "ethers";

    // Map RPC endpoints by chain name
    const RPC_BY_CHAIN_NAME: Record<string, string> = {
      [EthereumSepolia.name]: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      [ArcTestnet.name]: `https://arc-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    };

    // Create an adapter
    const adapter = createEthersAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
      // Replace the default connection
      getProvider: ({ chain }) => {
        const rpcUrl = RPC_BY_CHAIN_NAME[chain.name];
        if (!rpcUrl) {
          throw new Error(`No RPC configured for chain: ${chain.name}`);
        }
        return new JsonRpcProvider(rpcUrl);
      },
    });
    ```

    ## Browser wallet

    This setup expects a wallet extension in the browser (for example
    `window.ethereum` or `window.solana`), not a Node.js server. You can use wallets
    like [MetaMask](https://metamask.io/) or [Phantom](https://phantom.com/):

    ```typescript TypeScript theme={null}
    import { createEthersAdapterFromProvider } from "@circle-fin/adapter-ethers-v6";
    import type { Eip1193Provider } from "ethers";

    declare global {
      interface Window {
        ethereum?: Eip1193Provider;
      }
    }

    // Check if wallet is installed
    if (!window.ethereum) {
      throw new Error("No wallet provider found");
    }

    const adapter = await createEthersAdapterFromProvider({
      provider: window.ethereum,
    });
    ```
  </Tab>

  <Tab title="Solana">
    ## Standard setup

    The standard setup is the fastest way to start. Create one adapter from your
    wallet private key that works across multiple blockchains. This setup uses
    built-in public RPC endpoints and factory functions.

    <Note>
      Default RPC URLs are shared and may be rate-limited or unreliable. For a more
      stable connection, configure a [custom RPC](#custom-rpc).
    </Note>

    ```typescript TypeScript theme={null}
    import { createSolanaKitAdapterFromPrivateKey } from "@circle-fin/adapter-solana-kit";

    // Solana accepts Base58, Base64, or JSON array format private keys
    const adapter = createSolanaKitAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });
    ```

    ## Custom RPC

    Use your own connection to override the default RPC URLs from
    [standard setup](#standard-setup), which may be rate-limited and unreliable.
    [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/),
    and [chainlist.org](https://chainlist.org/) are common places to source
    endpoints. This example uses Alchemy:

    ```typescript TypeScript theme={null}
    import { createSolanaKitAdapterFromPrivateKey } from "@circle-fin/adapter-solana-kit";
    import { createSolanaRpc } from "@solana/kit";

    // Create an adapter
    const adapter = createSolanaKitAdapterFromPrivateKey({
      privateKey: process.env.SOLANA_PRIVATE_KEY as string,
      // Replace the default connection
      getRpc: () =>
        // Use an Alchemy connection
        createSolanaRpc(
          `https://solana-devnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        ),
    });
    ```

    ## Browser wallet

    This setup expects a wallet extension in the browser (for example
    `window.ethereum` or `window.solana`), not a Node.js server. You can use wallets
    like [MetaMask](https://metamask.io/) or [Phantom](https://phantom.com/):

    ```typescript TypeScript theme={null}
    import {
      createSolanaKitAdapterFromProvider,
      SolanaKitWalletProvider,
    } from "@circle-fin/adapter-solana-kit";

    declare global {
      interface Window {
        solana?: SolanaKitWalletProvider;
      }
    }

    if (window.solana) {
      const adapter = await createSolanaKitAdapterFromProvider({
        provider: window.solana,
      });
    }
    ```
  </Tab>

  <Tab title="Circle Wallets">
    <Badge color="blue">server-side only</Badge>

    You can use the Circle Wallets adapter if you already
    [manage wallets through Circle](https://developers.circle.com/wallets). Suited
    for enterprise and backend applications, it uses developer-controlled wallets
    and Circle Contracts so you can use App Kit on
    [supported blockchains](/app-kit/references/supported-blockchains#adapters)
    without managing private keys yourself.

    The Circle Wallets adapter requires these credentials from the
    [Circle Console](https://console.circle.com):

    * **[API Key](https://developers.circle.com/w3s/circle-developer-account#creating-an-api-key-for-developer-services):**
      Environment-prefixed (examples: `TEST_API_KEY:abc123:def456`,
      `LIVE_API_KEY:xyz:uvw`) or Base64-encoded
    * **[Entity Secret](https://developers.circle.com/wallets/dev-controlled/register-entity-secret):**
      64 lowercase alphanumeric characters

    This code block initializes the Circle Wallets adapter:

    ```typescript Typescript theme={null}
    import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

    // Initialize adapter with Circle credentials (server-side only)
    const adapter = createCircleWalletsAdapter({
      apiKey: process.env.CIRCLE_API_KEY!, // Format: TEST_API_KEY:abc:def or Base64
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!, // Format: 64 lowercase alphanumeric chars
    });
    ```

    <Warning>
      The Circle Wallets adapter does not support
      [gas sponsorship](https://developers.circle.com/wallets/gas-station) for
      crosschain transfers that originate on Solana. For those transactions, the
      user's Solana wallet must hold sufficient SOL to pay network fees.
    </Warning>
  </Tab>
</Tabs>
