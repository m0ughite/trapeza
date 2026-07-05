> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Bridge tokens across blockchains

> Use App Kit to bridge tokens between blockchains using the Viem, Solana, or Circle Wallets adapter

Bridge USDC between blockchains using a server-side script. Choose the tab that
matches your wallet setup.

<Tabs>
  <Tab title="Viem">
    Bridge USDC between two EVM-compatible blockchains using the Viem adapter. The
    examples use Ethereum Sepolia and Arc Testnet, but you can use any
    [supported EVM chains](/app-kit/references/supported-blockchains) as the source
    or destination.

    ## Prerequisites

    Before you begin, ensure that you have:

    * Installed [Node.js v22+](https://nodejs.org/).
    * Created an EVM wallet using a wallet provider such as
      [MetaMask](https://metamask.io/) and added the
      [Ethereum Sepolia](https://chainlist.org/chain/11155111) and
      [Arc Testnet](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup)
      networks.
    * Funded your EVM wallet with testnet tokens:
      * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
      * Get native tokens for Ethereum Sepolia from a
        [public faucet](https://www.alchemy.com/faucets/ethereum-sepolia).
      * Get native tokens for Arc Testnet from the
        [Console Faucet](https://console.circle.com/faucet).

    ## Step 1. Set up the project

    ### 1.1. Set up your development environment

    Create a new directory and install App Kit and its dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize a Node.js project
    mkdir app-kit-quickstart-bridge-evm
    cd app-kit-quickstart-bridge-evm
    npm init -y

    # Install App Kit and tools
    npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem typescript tsx
    ```

    <Tip>
      Only need to bridge and want a lighter install than the full App Kit? Install
      the standalone bridge package instead: `@circle-fin/bridge-kit`
    </Tip>

    ### 1.2. Configure TypeScript (optional)

    <Info>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Info>

    Create a `tsconfig.json` file:

    ```bash Shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```bash Shell theme={null}
    cat <<'EOF' > tsconfig.json
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "types": ["node"]
      }
    }
    EOF
    ```

    ### 1.3. Configure environment variables

    Create an `.env` file in the project directory:

    ```bash Shell theme={null}
    touch .env
    ```

    Add your wallet private key. Replace `YOUR_PRIVATE_KEY` with the private key
    from your Ethereum Sepolia (or any EVM) wallet:

    ```text .env theme={null}
    PRIVATE_KEY=YOUR_PRIVATE_KEY
    ```

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    <Tip>
      Edit `.env` files in your IDE or editor so credentials are not leaked to your
      shell history.
    </Tip>

    ## Step 2. Bridge USDC

    ### 2.1. Create the script

    Create an `index.ts` file in the project directory and add the following code.
    This code sets up your script and bridges 1.00 USDC from Ethereum Sepolia to Arc
    Testnet:

    <Info>
      Using other EVM chains? Change the `chain` values in `kit.bridge()` and ensure
      your source wallet has USDC and both wallets have native tokens.
    </Info>

    ```typescript TypeScript theme={null}
    // Import App Kit and its dependencies
    import { AppKit } from "@circle-fin/app-kit";
    import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
    import { inspect } from "util";

    // Initialize the SDK
    const kit = new AppKit();

    const bridgeUSDC = async (): Promise<void> => {
      try {
        // Initialize the adapter which lets you bridge tokens from your wallet on any EVM-compatible chain
        const adapter = createViemAdapterFromPrivateKey({
          privateKey: process.env.PRIVATE_KEY as string,
        });

        console.log("---------------Starting Bridging---------------");

        // Use the same adapter for the source and destination blockchains
        const result = await kit.bridge({
          from: { adapter, chain: "Ethereum_Sepolia" },
          to: { adapter, chain: "Arc_Testnet" },
          amount: "1.00",
        });

        console.log("RESULT", inspect(result, false, null, true));
      } catch (err) {
        console.log("ERROR", inspect(err, false, null, true));
      }
    };

    void bridgeUSDC();
    ```

    <Tip>
      You can customize your bridges to
      [collect a fee](/app-kit/tutorials/bridge/collect-bridge-fee), use the
      [Forwarding Service](/app-kit/tutorials/bridge/use-forwarding-service), or
      [estimate gas and provider fees](/app-kit/tutorials/bridge/estimate-costs)
      before bridging. Proceed only if the cost works for you.
    </Tip>

    ### 2.2. Run the script

    Save the `index.ts` file and run the script in your terminal:

    ```bash Shell theme={null}
    npx tsx --env-file=.env index.ts
    ```

    ### 2.3. Verify the transaction

    After the script finishes, find the returned `steps` array in the terminal
    output. Each transaction step includes an `explorerUrl`. Use that link to verify
    that the token amount matches the amount you bridged.

    The following code is an example of how an `approve` step might look in the
    terminal output. The values are used in this example only and are not a real
    transaction:

    ```text Terminal output theme={null}
    steps: [
      {
        name: "approve",
        state: "success",
        txHash: "0xdeadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcd",
        data: {
          txHash:
            "0xdeadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcd",
          status: "success",
          cumulativeGasUsed: 17138643n,
          gasUsed: 38617n,
          blockNumber: 8778959n,
          blockHash:
            "0xbeadfacefeed1234567890abcdef1234567890abcdef1234567890abcdef12",
          transactionIndex: 173,
          effectiveGasPrice: 1037232n,
          explorerUrl:
            "https://testnet.arcscan.app/tx/0xdeadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcd",
        },
      },
    ];
    ```
  </Tab>

  <Tab title="Solana">
    Bridge USDC between Solana and an EVM-compatible blockchain using the Solana and
    Viem adapters. The examples use Solana Devnet and Arc Testnet, but you can use
    Solana and any [supported EVM chain](/app-kit/references/supported-blockchains)
    as the source or destination.

    ## Prerequisites

    Before you begin, ensure that you have:

    * Installed [Node.js v22+](https://nodejs.org/).
    * Created a Solana Devnet wallet and an
      [Arc Testnet](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup)
      wallet using a wallet provider such as [MetaMask](https://metamask.io/).
    * Funded your wallets with testnet tokens:
      * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
      * Get native tokens for Solana Devnet from the
        [Solana Faucet](https://faucet.solana.com/).
      * Get native tokens for Arc Testnet from the
        [Console Faucet](https://console.circle.com/faucet).

    ## Step 1. Set up the project

    ### 1.1. Set up your development environment

    Create a new directory and install App Kit and its dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir app-kit-quickstart-bridge-solana-evm
    cd app-kit-quickstart-bridge-solana-evm
    npm init -y

    # Install App Kit and tools (Solana + EVM adapters)
    npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js viem typescript tsx
    ```

    <Tip>
      Only need to bridge and want a lighter install than the full App Kit? Install
      the standalone bridge package instead: `@circle-fin/bridge-kit`
    </Tip>

    ### 1.2. Configure TypeScript (optional)

    <Info>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Info>

    Create a `tsconfig.json` file:

    ```bash Shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```bash Shell theme={null}
    cat <<'EOF' > tsconfig.json
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "types": ["node"]
      }
    }
    EOF
    ```

    ### 1.3. Configure environment variables

    Create an `.env` file in the project directory:

    ```bash Shell theme={null}
    touch .env
    ```

    Add your wallet private keys. Replace `YOUR_SOLANA_PRIVATE_KEY` with your Solana
    wallet private key and `YOUR_ARC_TESTNET_PRIVATE_KEY` with your Arc Testnet
    (EVM) wallet private key:

    ```text .env theme={null}
    SOLANA_PRIVATE_KEY=YOUR_SOLANA_PRIVATE_KEY
    EVM_PRIVATE_KEY=YOUR_ARC_TESTNET_PRIVATE_KEY
    ```

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    <Tip>
      Edit `.env` files in your IDE or editor so credentials are not leaked to your
      shell history.
    </Tip>

    ## Step 2. Bridge USDC

    ### 2.1. Create the script

    Create an `index.ts` file in the project directory and add the following code.
    This code sets up your script and bridges 1.00 USDC from Solana Devnet to Arc
    Testnet:

    <Info>
      Using a different EVM chain or Solana as the destination? Change the `chain`
      values in `kit.bridge()` and ensure your source wallet has USDC and both wallets
      have native tokens.
    </Info>

    ```typescript TypeScript theme={null}
    // Import App Kit and dependencies
    import { AppKit } from "@circle-fin/app-kit";
    import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
    import { createSolanaKitAdapterFromPrivateKey } from "@circle-fin/adapter-solana-kit";
    import { inspect } from "util";

    const kit = new AppKit();

    const bridgeUSDC = async (): Promise<void> => {
      try {
        const solanaAdapter = createSolanaKitAdapterFromPrivateKey({
          privateKey: process.env.SOLANA_PRIVATE_KEY as string,
        });
        const evmAdapter = createViemAdapterFromPrivateKey({
          privateKey: process.env.EVM_PRIVATE_KEY as string,
        });

        console.log("---------------Starting Bridging---------------");

        const result = await kit.bridge({
          from: { adapter: solanaAdapter, chain: "Solana_Devnet" },
          to: { adapter: evmAdapter, chain: "Arc_Testnet" },
          amount: "1.00",
        });

        console.log("RESULT", inspect(result, false, null, true));
      } catch (err) {
        console.log("ERROR", inspect(err, false, null, true));
      }
    };

    void bridgeUSDC();
    ```

    <Tip>
      You can customize your bridges to
      [collect a fee](/app-kit/tutorials/bridge/collect-bridge-fee), use the
      [Forwarding Service](/app-kit/tutorials/bridge/use-forwarding-service), or
      [estimate gas and provider fees](/app-kit/tutorials/bridge/estimate-costs)
      before bridging. Proceed only if the cost works for you.
    </Tip>

    ### 2.2. Run the script

    Save the `index.ts` file and run the script in your terminal:

    ```bash Shell theme={null}
    npx tsx --env-file=.env index.ts
    ```

    ### 2.3. Verify the transaction

    After the script finishes, find the returned `steps` array in the terminal
    output. Each transaction step includes an `explorerUrl`. Use that link to verify
    that the token amount matches the amount you bridged.

    The following code is an example of how a `burn` step might look in the terminal
    output. The values are used in this example only and are not a real transaction:

    ```text Terminal output theme={null}
    steps: [
      {
        name: "burn",
        state: "success",
        txHash: "5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm",
        data: {
          txHash:
            "5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm",
          status: "success",
          blockNumber: 312456789n,
          blockHash: "HxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNK",
          transactionIndex: 0,
          gasUsed: 25000n,
          cumulativeGasUsed: 0n,
          effectiveGasPrice: 5000n,
          explorerUrl:
            "https://solscan.io/tx/5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm?cluster=devnet",
        },
      },
    ];
    ```
  </Tab>

  <Tab title="Circle Wallets">
    Bridge USDC between blockchains using the Circle Wallets adapter. The examples
    use Solana Devnet and Arc Testnet, but you can use any blockchain the Circle
    Wallets adapter [supports](/app-kit/references/supported-blockchains) as the
    source or destination.

    ## Prerequisites

    Before you begin, ensure that you have:

    * Installed [Node.js v22+](https://nodejs.org/).
    * Obtained a
      [Circle API Key](https://developers.circle.com/w3s/circle-developer-account#creating-an-api-key-for-developer-services)
      and
      [Entity Secret](https://developers.circle.com/wallets/dev-controlled/register-entity-secret)
      from the
      [Circle Console](https://developers.circle.com/w3s/circle-developer-account).
    * Created developer-controlled wallets on Solana Devnet and Arc Testnet using
      the Circle Console.
    * Funded your wallets with testnet tokens:
      * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
      * Get test native tokens from the
        [Console Faucet](https://console.circle.com/faucet).

    ## Step 1. Set up the project

    ### 1.1. Set up your development environment

    Create a new directory and install App Kit with the Circle Wallets adapter and
    supporting tools:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir app-kit-quickstart-bridge-circle-wallets-adapter
    cd app-kit-quickstart-bridge-circle-wallets-adapter
    npm init -y

    # Install App Kit, Circle Wallets adapter, and tools
    npm install @circle-fin/app-kit @circle-fin/adapter-circle-wallets typescript tsx
    ```

    <Tip>
      Only need to bridge and want a lighter install than the full App Kit? Install
      the standalone bridge package instead: `@circle-fin/bridge-kit`
    </Tip>

    ### 1.2. Configure TypeScript (optional)

    <Info>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Info>

    Create a `tsconfig.json` file:

    ```bash Shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```bash Shell theme={null}
    cat <<'EOF' > tsconfig.json
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "types": ["node"]
      }
    }
    EOF
    ```

    ### 1.3. Configure environment variables

    Create an `.env` file in the project directory:

    ```bash Shell theme={null}
    touch .env
    ```

    Add your credentials. Replace `YOUR_API_KEY` with your Circle Developer API key,
    `YOUR_ENTITY_SECRET` with your entity secret (64 lowercase alphanumeric
    characters), and `YOUR_EVM_WALLET_ADDRESS` and `YOUR_SOLANA_WALLET_ADDRESS` with
    the wallet addresses you control through Circle Wallets. You can fetch the
    addresses from the
    [Circle Developer Console](https://developers.circle.com/w3s/circle-developer-account)
    or the
    [list wallets](https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/get-wallets)
    endpoint:

    ```text .env theme={null}
    CIRCLE_API_KEY=YOUR_API_KEY
    CIRCLE_ENTITY_SECRET=YOUR_ENTITY_SECRET
    EVM_WALLET_ADDRESS=YOUR_EVM_WALLET_ADDRESS
    SOLANA_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS
    ```

    <Tip>
      Edit `.env` files in your IDE or editor so credentials are not leaked to your
      shell history.
    </Tip>

    ## Step 2. Bridge USDC

    ### 2.1. Create the script

    Create an `index.ts` file in the project directory and add the following code.
    This code sets up your script and bridges 1.00 USDC from Solana Devnet to Arc
    Testnet.

    <Info>
      Using a different blockchain as the source or destination? Change the `chain`
      values in `kit.bridge()` and ensure your source wallet has USDC and both wallets
      have native tokens.
    </Info>

    ```typescript TypeScript theme={null}
    // Import App Kit and the Circle Wallets adapter
    import { AppKit } from "@circle-fin/app-kit";
    import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
    import { inspect } from "util";

    // Initialize the SDK
    const kit = new AppKit();

    const bridgeUSDC = async (): Promise<void> => {
      try {
        // Set up the Circle Wallets adapter instance, works for both ecosystems
        const adapter = createCircleWalletsAdapter({
          apiKey: process.env.CIRCLE_API_KEY!,
          entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
        });

        console.log("---------------Starting Bridging---------------");

        // Use the same adapter for the source and destination blockchains
        const result = await kit.bridge({
          from: {
            adapter,
            chain: "Solana_Devnet",
            address: process.env.SOLANA_WALLET_ADDRESS!, // Solana address (developer-controlled)
          },
          to: {
            adapter, // Use the same adapter instance
            chain: "Arc_Testnet",
            address: process.env.EVM_WALLET_ADDRESS!, // EVM address (developer-controlled)
          },
          amount: "1.00",
        });

        console.log("RESULT", inspect(result, false, null, true));
      } catch (err) {
        console.log("ERROR", inspect(err, false, null, true));
      }
    };

    void bridgeUSDC();
    ```

    <Tip>
      You can customize your bridges to
      [collect a fee](/app-kit/tutorials/bridge/collect-bridge-fee), use the
      [Forwarding Service](/app-kit/tutorials/bridge/use-forwarding-service), or
      [estimate gas and provider fees](/app-kit/tutorials/bridge/estimate-costs)
      before bridging. Proceed only if the cost works for you.
    </Tip>

    ### 2.2. Run the script

    Save the `index.ts` file and run the script in your terminal:

    ```bash Shell theme={null}
    npx tsx --env-file=.env index.ts
    ```

    ### 2.3. Verify the transaction

    After the script finishes, find the returned `steps` array in the terminal
    output. Each transaction step includes an `explorerUrl`. Use that link to verify
    that the token amount matches the amount you bridged.

    The following code is an example of how a `burn` step might look in the terminal
    output. The values are used in this example only and are not a real transaction:

    ```text Terminal output theme={null}
    steps: [
      {
        name: "burn",
        state: "success",
        txHash: "5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm",
        data: {
          txHash:
            "5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm",
          status: "success",
          blockNumber: 312456789n,
          blockHash: "HxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNK",
          transactionIndex: 0,
          gasUsed: 25000n,
          cumulativeGasUsed: 0n,
          effectiveGasPrice: 5000n,
          explorerUrl:
            "https://solscan.io/tx/5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKSNc7WLyFTmgL5RFGujWNqEbUBdNKRkHmx7ZRQR3FVhdEwxKHm?cluster=devnet",
        },
      },
    ];
    ```
  </Tab>
</Tabs>
