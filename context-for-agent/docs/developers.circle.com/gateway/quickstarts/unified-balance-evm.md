> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Create and Transfer a Unified USDC Balance on EVM

> Create and transfer a unified USDC balance on EVM using Circle Gateway.

This guide walks you through the process of creating Unified Crosschain USDC
Balances on
[supported EVM chains](/gateway/references/supported-blockchains#testnet) using
Circle Gateway, and performing transfers from EVM to EVM and from Solana to EVM.

<Tip>
  **Use
  [Unified Balance Kit](https://www.npmjs.com/package/@circle-fin/unified-balance-kit)
  to simplify this integration.**

  This quickstart uses a manual Gateway integration. It is for learning or for
  developers who need direct control.

  To simplify, use Unified Balance Kit to deposit and spend USDC in just a few
  lines of code.
</Tip>

Select a tab below for the Circle Wallets or self-managed wallet path.

<Tabs>
  <Tab title="Circle Wallets">
    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/)
    * Obtained a
      [Circle API Key](/w3s/circle-developer-account#creating-an-api-key-for-developer-services)
      and [Entity Secret](/wallets/dev-controlled/register-entity-secret) from the
      [Circle Console](/w3s/circle-developer-account).
    * [Created Developer-Controlled Wallets](/wallets/dev-controlled/create-your-first-wallet)
      for the chains you want to test.
    * Funded your wallets with testnet tokens:
      * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
      * Get test native tokens from the
        [Console Faucet](https://console.circle.com/faucet).

    If you want to try the Solana to EVM transfer, ensure that you've:

    * Created a Solana Devnet Developer-Controlled Wallet to act as the source
      depositor
    * Created an EVM Developer-Controlled Wallet on the destination chain to submit
      the mint transaction
    * Completed the
      [deposit flow](/gateway/quickstarts/unified-balance-solana#step-3-deposit-into-a-unified-crosschain-balance-circle-wallets)
      from the
      [Solana quickstart](/gateway/quickstarts/unified-balance-solana#circle-wallets)
      first

    ### Add testnet funds to your wallet

    To interact with Gateway, you need test USDC and native tokens in your wallet on
    each chain you deposit from. You also need native gas tokens on the destination
    chain to call the Gateway Minter contract.

    Use the [Circle Faucet](https://faucet.circle.com/) to get test USDC. If you
    have a [Circle Developer Console](https://console.circle.com) account, you can
    use the [Console Faucet](https://console.circle.com/faucet) to get testnet
    native tokens. In addition, the following faucets can also be used to fund your
    wallet with testnet native tokens:

    <Tabs>
      <Tab title="Arc">
        **Faucet:** [Arc Testnet](https://faucet.circle.com) (USDC + native tokens)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `arcTestnet`                                 |
        | USDC address | `0x3600000000000000000000000000000000000000` |
        | Domain ID    | `26`                                         |
      </Tab>

      <Tab title="Avalanche">
        **Faucet:** [Avalanche Fuji](https://core.app/tools/testnet-faucet)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `avalancheFuji`                              |
        | USDC address | `0x5425890298aed601595a70ab815c96711a31bc65` |
        | Domain ID    | `1`                                          |
      </Tab>

      <Tab title="Base">
        **Faucet:** [Base Sepolia](https://www.alchemy.com/faucets/base-sepolia)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `baseSepolia`                                |
        | USDC address | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
        | Domain ID    | `6`                                          |
      </Tab>

      <Tab title="Ethereum">
        **Faucet:** [Ethereum Sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `sepolia`                                    |
        | USDC address | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
        | Domain ID    | `0`                                          |
      </Tab>

      <Tab title="Hyperliquid">
        **Faucet:** [Hyperliquid EVM Testnet](https://app.hyperliquid-testnet.xyz/drip)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `hyperliquidEvmTestnet`                      |
        | USDC address | `0x2B3370eE501B4a559b57D449569354196457D8Ab` |
        | Domain ID    | `19`                                         |
      </Tab>

      <Tab title="Sei">
        **Faucet:** [Sei Testnet](https://docs.sei.io/learn/faucet)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `seiTestnet`                                 |
        | USDC address | `0x4fCF1784B31630811181f670Aea7A7bEF803eaED` |
        | Domain ID    | `16`                                         |
      </Tab>

      <Tab title="Solana">
        **Faucet:** [Solana Devnet](https://faucet.solana.com/)

        | Property     | Value                                                   |
        | ------------ | ------------------------------------------------------- |
        | Chain name   | `solanaDevnet` (note that Solana is not EVM-compatible) |
        | USDC address | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`          |
        | Domain ID    | `5`                                                     |
      </Tab>

      <Tab title="Sonic">
        **Faucet:** [Sonic Testnet](https://testnet.soniclabs.com/account)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `sonicTestnet`                               |
        | USDC address | `0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51` |
        | Domain ID    | `13`                                         |
      </Tab>

      <Tab title="Worldchain">
        **Faucet:** [Worldchain Sepolia](https://www.l2faucet.com/world)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `worldchainSepolia`                          |
        | USDC address | `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88` |
        | Domain ID    | `14`                                         |
      </Tab>
    </Tabs>

    ## Step 1. Set up your project

    ### 1.1. Create the project and install dependencies

    ```shell theme={null}
    # Set up your directory and initialize a Node.js project
    mkdir unified-gateway-balance-evm-circle-wallets
    cd unified-gateway-balance-evm-circle-wallets
    npm init -y

    # Set up module type and run scripts
    npm pkg set type=module
    npm pkg set scripts.deposit="tsx --env-file=.env deposit.ts --"
    npm pkg set scripts.balances="tsx --env-file=.env balances.ts"
    npm pkg set scripts.transfer-from-evm="tsx --env-file=.env transfer-from-evm.ts --"
    npm pkg set scripts.transfer-from-sol="tsx --env-file=.env transfer-from-sol.ts"

    # Pin bigint-buffer to a patched version
    npm pkg set overrides.bigint-buffer=npm:@trufflesuite/bigint-buffer@1.1.10

    # Install runtime dependencies
    npm install @circle-fin/developer-controlled-wallets @coral-xyz/anchor @solana/buffer-layout @solana/web3.js bs58 tsx typescript

    # Install dev dependencies
    npm install --save-dev @types/node
    ```

    ### 1.2. Configure TypeScript (optional)

    <Tip>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Tip>

    Create a `tsconfig.json` file:

    ```shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```shell theme={null}
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

    ### 1.3. Set environment variables

    Create a `.env` file in the project directory:

    ```text .env theme={null}
    CIRCLE_API_KEY=YOUR_API_KEY
    CIRCLE_ENTITY_SECRET=YOUR_ENTITY_SECRET
    DEPOSITOR_ADDRESS=YOUR_SOURCE_WALLET_ADDRESS
    RECIPIENT_ADDRESS=YOUR_DESTINATION_WALLET_ADDRESS
    ```

    * `CIRCLE_API_KEY` is your Circle API key.
    * `CIRCLE_ENTITY_SECRET` is your Circle entity secret.
    * `DEPOSITOR_ADDRESS` is the source depositor wallet for the script you are
      running.
    * `RECIPIENT_ADDRESS` is the destination wallet. It is only required for
      transfer scripts.

    For `transfer-from-evm.ts`, both `DEPOSITOR_ADDRESS` and `RECIPIENT_ADDRESS` are
    EVM addresses.

    For `transfer-from-sol.ts`, `DEPOSITOR_ADDRESS` is a Solana address and
    `RECIPIENT_ADDRESS` is an EVM address.

    <Tip>
      Open `.env` in your editor rather than writing values with shell commands, and
      add `.env` to your `.gitignore`. This prevents credentials from leaking into
      your shell history or version control.
    </Tip>

    ## Step 2. Set up the configuration file

    The shared configuration file is used by the deposit and transfer scripts.

    ### 2.1. Create the configuration file

    ```shell theme={null}
    touch config.ts
    ```

    ### 2.2. Configure wallet account and chain settings

    Add the chain metadata, Gateway contract addresses, Circle Wallets client, and
    Command-line helpers to your `config.ts` file.

    ```ts config.ts expandable theme={null}
    import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

    /* Chain configuration */
    export type WalletChain =
      | "ETH-SEPOLIA"
      | "BASE-SEPOLIA"
      | "AVAX-FUJI"
      | "ARC-TESTNET"
      | "ARB-SEPOLIA"
      | "OP-SEPOLIA"
      | "MATIC-AMOY"
      | "UNI-SEPOLIA";

    export type Chain =
      | "ethereum"
      | "base"
      | "avalanche"
      | "arc"
      | "arbitrum"
      | "optimism"
      | "polygon"
      | "unichain";

    export type ChainConfig = {
      chainName: string;
      usdc: string;
      domain: number;
      walletChain: WalletChain;
    };

    export const chainConfig: Record<Chain, ChainConfig> = {
      ethereum: {
        chainName: "Ethereum Sepolia",
        usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        domain: 0,
        walletChain: "ETH-SEPOLIA",
      },
      base: {
        chainName: "Base Sepolia",
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        domain: 6,
        walletChain: "BASE-SEPOLIA",
      },
      avalanche: {
        chainName: "Avalanche Fuji",
        usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
        domain: 1,
        walletChain: "AVAX-FUJI",
      },
      arc: {
        chainName: "Arc Testnet",
        usdc: "0x3600000000000000000000000000000000000000",
        domain: 26,
        walletChain: "ARC-TESTNET",
      },
      arbitrum: {
        chainName: "Arbitrum Sepolia",
        usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        domain: 3,
        walletChain: "ARB-SEPOLIA",
      },
      optimism: {
        chainName: "OP Sepolia",
        usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        domain: 2,
        walletChain: "OP-SEPOLIA",
      },
      polygon: {
        chainName: "Polygon Amoy",
        usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
        domain: 7,
        walletChain: "MATIC-AMOY",
      },
      unichain: {
        chainName: "Unichain Sepolia",
        usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
        domain: 10,
        walletChain: "UNI-SEPOLIA",
      },
    };

    /* Gateway Contract Addresses */
    export const GATEWAY_WALLET_ADDRESS =
      "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
    export const GATEWAY_MINTER_ADDRESS =
      "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";

    /* API Credentials */
    export const API_KEY = process.env.CIRCLE_API_KEY!;
    export const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET!;
    export const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;

    if (!API_KEY || !ENTITY_SECRET || !DEPOSITOR_ADDRESS) {
      console.error(
        "Missing required env vars: CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, DEPOSITOR_ADDRESS",
      );
      process.exit(1);
    }

    /* Circle Wallets Client */
    export const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    /* Command-line argument parsing helper */
    export function parseSelectedChains(): Chain[] {
      const args = process.argv
        .slice(2)
        .filter((arg) => arg !== "--")
        .map((chain) => chain.toLowerCase());
      const validChains = Object.keys(chainConfig);

      if (args.length === 0) {
        throw new Error(
          "No chains specified. Usage: npm run <script> -- <chain1> [chain2...] or 'all'",
        );
      }

      if (args.length === 1 && args[0] === "all") {
        return Object.keys(chainConfig) as Chain[];
      }

      const invalid = args.filter((arg) => !(arg in chainConfig));
      if (invalid.length > 0) {
        console.error(
          `Unsupported chain: ${invalid.join(", ")}\n` +
            `Valid chains: ${validChains.join(", ")}, all\n` +
            `Example: npm run <script> -- ethereum base`,
        );
        process.exit(1);
      }

      return [...new Set(args)] as Chain[];
    }

    /* Transaction Polling Helper */
    export async function waitForTxCompletion(
      client: ReturnType<typeof initiateDeveloperControlledWalletsClient>,
      txId: string,
      label: string,
    ) {
      const terminalStates = new Set([
        "COMPLETE",
        "CONFIRMED",
        "FAILED",
        "DENIED",
        "CANCELLED",
      ]);

      process.stdout.write(`Waiting for ${label} (txId=${txId})\n`);

      while (true) {
        const { data } = await client.getTransaction({ id: txId });
        const state = data?.transaction?.state;

        process.stdout.write(".");

        if (state && terminalStates.has(state)) {
          process.stdout.write("\n");
          console.log(`${label} final state: ${state}`);

          if (state !== "COMPLETE" && state !== "CONFIRMED") {
            throw new Error(
              `${label} did not complete successfully (state=${state})`,
            );
          }
          return data.transaction;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    /* Balance Parsing Helper */
    export function parseBalance(
      value: string | number | null | undefined,
    ): bigint {
      const str = String(value ?? "0");
      const [whole, decimal = ""] = str.split(".");
      const decimal6 = (decimal + "000000").slice(0, 6);
      return BigInt((whole || "0") + decimal6);
    }
    ```

    ## Step 3. Deposit into a unified crosschain balance (Circle Wallets)

    The deposit script deposits USDC into the Gateway Wallet on selected EVM chains.
    Pass chain names as command-line arguments (for example, `arc`, `base`, or
    `all`). You can skip to the
    [full deposit script](#3-5-full-deposit-script-circle-wallets) if you prefer.

    <Warning>
      Do not transfer USDC directly to the Gateway Wallet contract with a standard
      ERC-20 transfer. You must call a Gateway deposit method or the USDC will not
      be credited to your unified balance.
    </Warning>

    ### 3.1. Create the deposit script

    ```shell theme={null}
    touch deposit.ts
    ```

    ### 3.2. Define constants and deposit amount

    Set the deposit amount once near the top of the script, then use
    `parseSelectedChains()` to let the reader choose one or more EVM source chains
    at runtime.

    ```ts theme={null}
    const DEPOSIT_AMOUNT_USDC = "2";
    ```

    ### 3.3. Approve USDC spending and submit the deposit

    For each selected source chain, the script first approves the Gateway Wallet
    contract to spend USDC, then calls the Gateway `deposit(address,uint256)`
    method.

    ```ts theme={null}
    const approveTx = await client.createContractExecutionTransaction({
      walletAddress: DEPOSITOR_ADDRESS,
      blockchain: chainConfig[chain].walletChain,
      contractAddress: chainConfig[chain].usdc,
      abiFunctionSignature: "approve(address,uint256)",
      abiParameters: [
        GATEWAY_WALLET_ADDRESS,
        parseBalance(DEPOSIT_AMOUNT_USDC).toString(),
      ],
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });

    const depositTx = await client.createContractExecutionTransaction({
      walletAddress: DEPOSITOR_ADDRESS,
      blockchain: chainConfig[chain].walletChain,
      contractAddress: GATEWAY_WALLET_ADDRESS,
      abiFunctionSignature: "deposit(address,uint256)",
      abiParameters: [
        chainConfig[chain].usdc,
        parseBalance(DEPOSIT_AMOUNT_USDC).toString(),
      ],
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });
    ```

    ### 3.4. Wait for Circle Wallet transaction to complete

    Circle Wallet contract execution is asynchronous. After each submit step, wait
    for transaction completion before proceeding to the next phase.

    ```ts theme={null}
    await waitForTxCompletion(client, approveTxId, "USDC approve");
    await waitForTxCompletion(client, depositTxId, "Gateway deposit");
    ```

    ### 3.5. Full deposit script (Circle Wallets)

    The script loops through selected chains, approves USDC spending, and deposits
    into the Gateway Wallet on each chain. Inline comments explain each stage.

    ```ts deposit.ts expandable theme={null}
    import {
      chainConfig,
      GATEWAY_WALLET_ADDRESS,
      DEPOSITOR_ADDRESS,
      client,
      parseSelectedChains,
      waitForTxCompletion,
      parseBalance,
    } from "./config.js";

    const DEPOSIT_AMOUNT_USDC = "2";

    async function main() {
      // Parse the selected source chains from the command-line arguments.
      const selectedChains = parseSelectedChains();
      console.log(`Using account: ${DEPOSITOR_ADDRESS}`);
      console.log(
        `Depositing on: ${selectedChains
          .map((chain) => chainConfig[chain].chainName)
          .join(", ")}`,
      );

      for (const chain of selectedChains) {
        try {
          console.log(`\n=== Processing ${chainConfig[chain].chainName} ===`);

          // [1] Approve the Gateway Wallet to spend USDC on the source chain.
          console.log(
            `Approving ${DEPOSIT_AMOUNT_USDC} USDC on ${chainConfig[chain].chainName}...`,
          );

          const approveTx = await client.createContractExecutionTransaction({
            walletAddress: DEPOSITOR_ADDRESS,
            blockchain: chainConfig[chain].walletChain,
            contractAddress: chainConfig[chain].usdc,
            abiFunctionSignature: "approve(address,uint256)",
            abiParameters: [
              GATEWAY_WALLET_ADDRESS,
              parseBalance(DEPOSIT_AMOUNT_USDC).toString(),
            ],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          const approveTxId = approveTx.data?.id;
          if (!approveTxId) throw new Error("Failed to create approve transaction");

          await waitForTxCompletion(client, approveTxId, "USDC approve");

          // [2] Call the Gateway deposit function for the current source chain.
          console.log(`Depositing ${DEPOSIT_AMOUNT_USDC} USDC to Gateway Wallet`);

          const depositTx = await client.createContractExecutionTransaction({
            walletAddress: DEPOSITOR_ADDRESS,
            blockchain: chainConfig[chain].walletChain,
            contractAddress: GATEWAY_WALLET_ADDRESS,
            abiFunctionSignature: "deposit(address,uint256)",
            abiParameters: [
              chainConfig[chain].usdc,
              parseBalance(DEPOSIT_AMOUNT_USDC).toString(),
            ],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          const depositTxId = depositTx.data?.id;
          if (!depositTxId) throw new Error("Failed to create deposit transaction");

          await waitForTxCompletion(client, depositTxId, "Gateway deposit");
        } catch (err) {
          console.error(`Error on ${chainConfig[chain].chainName}:`, err);
        }
      }

      console.log(
        "\n==| Block confirmation may take up to 19 minutes for some chains |==",
      );
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    ### 3.6. Run the deposit script

    Run the script with one or more supported chains:

    ```shell theme={null}
    npm run deposit -- ethereum
    ```

    ```shell theme={null}
    npm run deposit -- ethereum base arc
    ```

    ```shell theme={null}
    npm run deposit -- all
    ```

    Wait for the
    [required number of block confirmations](https://developers.circle.com/gateway/references/supported-blockchains#required-block-confirmations).
    Once the deposit transactions are final, the total balance is the sum of all the
    USDC from deposit transactions across all supported chains that have reached
    finality.

    ### 3.7. Check the balances on the Gateway Wallet

    Create a new file called `balances.ts`, and add the following code. This script
    retrieves the USDC balances available from your Gateway Wallet for the
    `DEPOSITOR_ADDRESS` currently set in `.env`.

    ```ts balances.ts expandable theme={null}
    interface GatewayBalancesResponse {
      balances: Array<{
        domain: number;
        balance: string;
      }>;
    }

    const EVM_DOMAINS = {
      ethereum: 0,
      avalanche: 1,
      optimism: 2,
      arbitrum: 3,
      base: 6,
      polygon: 7,
      unichain: 10,
      arc: 26,
    };

    const SOLANA_DOMAINS = {
      solana: 5,
    };

    const DOMAINS = { ...EVM_DOMAINS, ...SOLANA_DOMAINS };

    const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;

    if (!DEPOSITOR_ADDRESS) {
      console.error("Missing required env var: DEPOSITOR_ADDRESS");
      process.exit(1);
    }

    const isEvmAddress = DEPOSITOR_ADDRESS.startsWith("0x");

    async function main() {
      console.log(`Depositor address: ${DEPOSITOR_ADDRESS}`);
      console.log(`Address type: ${isEvmAddress ? "EVM" : "Solana"}\n`);

      const activeDomains = isEvmAddress ? EVM_DOMAINS : SOLANA_DOMAINS;
      const domainIds = Object.values(activeDomains);
      const body = {
        token: "USDC",
        sources: domainIds.map((domain) => ({
          domain,
          depositor: DEPOSITOR_ADDRESS,
        })),
      };

      const res = await fetch(
        "https://gateway-api-testnet.circle.com/v1/balances",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const result = (await res.json()) as GatewayBalancesResponse;

      let total = 0;
      for (const balance of result.balances) {
        const chain =
          Object.keys(DOMAINS).find(
            (k) => DOMAINS[k as keyof typeof DOMAINS] === balance.domain,
          ) || `Domain ${balance.domain}`;
        const amount = parseFloat(balance.balance);
        console.log(`${chain}: ${amount.toFixed(6)} USDC`);
        total += amount;
      }

      console.log(`\nTotal: ${total.toFixed(6)} USDC`);
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    You can run it to check whether finality has been reached for recent
    transactions.

    ```shell theme={null}
    npm run balances
    ```

    <Tabs>
      <Tab title="Transfer from EVM">
        ## Step 4. Transfer USDC from EVM to EVM

        The transfer script burns USDC on selected source chains and mints on a
        destination EVM chain via Gateway. Pass source chain names as command-line
        arguments (for example, `ethereum`, `arc`, or `all`). You can skip to the
        [full transfer script](#4-7-full-evm-transfer-script) if you prefer.

        ### 4.1. Create the EVM transfer script

        ```shell theme={null}
        touch transfer-from-evm.ts
        ```

        ### 4.2. Define constants and types

        The validated script uses Arc Testnet as the destination chain. Update
        `DESTINATION_CHAIN` if you want to mint on a different supported EVM testnet.

        The script keeps the same typed burn intent structure as the standard Gateway
        quickstart, but routes signing and mint execution through Circle Wallets.

        ```ts theme={null}
        const DESTINATION_CHAIN: WalletChain = "ARC-TESTNET";
        const TRANSFER_AMOUNT_USDC = 0.5;
        const MAX_FEE = 2_010000n;
        const MAX_UINT256_DEC = ((1n << 256n) - 1n).toString();
        ```

        ### 4.3. Add helper functions

        These helpers derive destination chain config, convert EVM addresses to
        `bytes32`, and serialize typed data for the Gateway API request.

        ```ts theme={null}
        function getConfigByWalletChain(walletChain: WalletChain) {
          const entry = Object.values(chainConfig).find(
            (item) => item.walletChain === walletChain,
          );
          if (!entry) {
            throw new Error(`No config found for destination chain ${walletChain}`);
          }
          return entry;
        }

        function addressToBytes32(address: string) {
          return ("0x" +
            address
              .toLowerCase()
              .replace(/^0x/, "")
              .padStart(64, "0")) as `0x${string}`;
        }
        ```

        ### 4.4. Create and sign burn intents

        For each selected source chain, create an EIP-712 burn intent and sign it with
        the source Developer-Controlled Wallet.

        ```ts theme={null}
        const burnIntent = createBurnIntent({
          sourceChain: chain,
          depositorAddress: DEPOSITOR_ADDRESS,
          recipientAddress: RECIPIENT_ADDRESS,
        });

        const typedData = burnIntentTypedData(burnIntent);

        const sigResp = await client.signTypedData({
          walletAddress: DEPOSITOR_ADDRESS,
          blockchain: chainConfig[chain].walletChain,
          data: stringifyTypedData(typedData),
        });
        ```

        ### 4.5. Request attestation from Gateway API

        Send the signed burn intents to the Gateway API and validate that the response
        includes both the attestation and the operator signature needed for minting.

        ```ts theme={null}
        const response = await fetch(
          "https://gateway-api-testnet.circle.com/v1/transfer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stringifyTypedData(requests),
          },
        );
        ```

        ### 4.6. Mint on destination chain

        Once the Gateway API returns the attestation set, call
        `gatewayMint(bytes,bytes)` on the destination EVM chain and wait for Circle
        Wallet transaction completion.

        ```ts theme={null}
        const tx = await client.createContractExecutionTransaction({
          walletAddress: DEPOSITOR_ADDRESS,
          blockchain: DESTINATION_CHAIN,
          contractAddress: GATEWAY_MINTER_ADDRESS,
          abiFunctionSignature: "gatewayMint(bytes,bytes)",
          abiParameters: [attestation, operatorSig],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });

        await waitForTxCompletion(client, txId, "USDC mint");
        ```

        ### 4.7. Full EVM transfer script (Circle Wallets)

        The script builds and signs burn intents for the selected EVM source chains,
        requests a Gateway attestation, and mints on the destination chain. Inline
        comments explain each stage.

        ```ts transfer-from-evm.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import {
          chainConfig,
          GATEWAY_WALLET_ADDRESS,
          GATEWAY_MINTER_ADDRESS,
          DEPOSITOR_ADDRESS,
          client,
          parseSelectedChains,
          waitForTxCompletion,
          parseBalance,
          type Chain,
          type WalletChain,
        } from "./config.js";

        const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS!;

        if (!RECIPIENT_ADDRESS) {
          console.error("Missing required env var: RECIPIENT_ADDRESS");
          process.exit(1);
        }

        const DESTINATION_CHAIN: WalletChain = "ARC-TESTNET";
        const TRANSFER_AMOUNT_USDC = 0.5;
        const MAX_FEE = 2_010000n;
        const MAX_UINT256_DEC = ((1n << 256n) - 1n).toString();

        const domain = { name: "GatewayWallet", version: "1" };

        const EIP712Domain = [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ];

        const TransferSpec = [
          { name: "version", type: "uint32" },
          { name: "sourceDomain", type: "uint32" },
          { name: "destinationDomain", type: "uint32" },
          { name: "sourceContract", type: "bytes32" },
          { name: "destinationContract", type: "bytes32" },
          { name: "sourceToken", type: "bytes32" },
          { name: "destinationToken", type: "bytes32" },
          { name: "sourceDepositor", type: "bytes32" },
          { name: "destinationRecipient", type: "bytes32" },
          { name: "sourceSigner", type: "bytes32" },
          { name: "destinationCaller", type: "bytes32" },
          { name: "value", type: "uint256" },
          { name: "salt", type: "bytes32" },
          { name: "hookData", type: "bytes" },
        ];

        const BurnIntent = [
          { name: "maxBlockHeight", type: "uint256" },
          { name: "maxFee", type: "uint256" },
          { name: "spec", type: "TransferSpec" },
        ];

        // Build a burn intent for an EVM source chain and destination EVM recipient.
        function createBurnIntent(params: {
          sourceChain: Chain;
          depositorAddress: string;
          recipientAddress?: string;
        }) {
          const {
            sourceChain,
            depositorAddress,
            recipientAddress = depositorAddress,
          } = params;
          const source = chainConfig[sourceChain];
          const destination = getConfigByWalletChain(DESTINATION_CHAIN);
          const value = parseBalance(String(TRANSFER_AMOUNT_USDC));

          return {
            maxBlockHeight: MAX_UINT256_DEC,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: source.domain,
              destinationDomain: destination.domain,
              sourceContract: GATEWAY_WALLET_ADDRESS,
              destinationContract: GATEWAY_MINTER_ADDRESS,
              sourceToken: source.usdc,
              destinationToken: destination.usdc,
              sourceDepositor: depositorAddress,
              destinationRecipient: recipientAddress,
              sourceSigner: depositorAddress,
              destinationCaller: "0x0000000000000000000000000000000000000000",
              value,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Format the burn intent as EIP-712 typed data for Circle Wallet signing.
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain,
            primaryType: "BurnIntent",
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: addressToBytes32(
                  burnIntent.spec.destinationContract,
                ),
                sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
                sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: addressToBytes32(
                  burnIntent.spec.destinationRecipient,
                ),
                sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: addressToBytes32(
                  burnIntent.spec.destinationCaller ??
                    "0x0000000000000000000000000000000000000000",
                ),
              },
            },
          };
        }

        // Resolve the destination chain config from the selected wallet chain.
        function getConfigByWalletChain(walletChain: WalletChain) {
          const entry = Object.values(chainConfig).find(
            (item) => item.walletChain === walletChain,
          );
          if (!entry) {
            throw new Error(`No config found for destination chain ${walletChain}`);
          }
          return entry;
        }

        // Convert an EVM address to a 32-byte hex string.
        function addressToBytes32(address: string) {
          return ("0x" +
            address
              .toLowerCase()
              .replace(/^0x/, "")
              .padStart(64, "0")) as `0x${string}`;
        }

        function formatUnits(value: bigint, decimals: number) {
          let display = value.toString();
          const negative = display.startsWith("-");
          if (negative) display = display.slice(1);
          display = display.padStart(decimals, "0");
          const integer = display.slice(0, display.length - decimals);
          let fraction = display.slice(display.length - decimals);
          fraction = fraction.replace(/(0+)$/, "");
          return `${negative ? "-" : ""}${integer || "0"}${
            fraction ? `.${fraction}` : ""
          }`;
        }

        // Serialize typed data while converting bigint values to strings.
        function stringifyTypedData<T>(obj: T) {
          return JSON.stringify(obj, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }

        async function main() {
          // Parse the selected source chains from the command-line arguments.
          const selectedChains = parseSelectedChains();
          console.log(`Sender (EVM): ${DEPOSITOR_ADDRESS}`);
          console.log(`Recipient (EVM): ${RECIPIENT_ADDRESS}`);
          console.log(
            `Transferring balances from: ${selectedChains
              .map((chain) => chainConfig[chain].chainName)
              .join(", ")}`,
          );

          const requests = [];

          // [1] Create and sign burn intents for each source chain.
          for (const chain of selectedChains) {
            console.log(
              `Creating burn intent from ${chain} -> ${DESTINATION_CHAIN}...`,
            );

            const burnIntent = createBurnIntent({
              sourceChain: chain,
              depositorAddress: DEPOSITOR_ADDRESS,
              recipientAddress: RECIPIENT_ADDRESS,
            });

            const typedData = burnIntentTypedData(burnIntent);

            const sigResp = await client.signTypedData({
              walletAddress: DEPOSITOR_ADDRESS,
              blockchain: chainConfig[chain].walletChain,
              data: stringifyTypedData(typedData),
            });

            requests.push({
              burnIntent: typedData.message,
              signature: sigResp.data?.signature,
            });
          }
          console.log("Signed burn intents.");

          // [2] Request the attestation set from Gateway API.
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: stringifyTypedData(requests),
            },
          );

          if (!response.ok) {
            console.error("Gateway API error status:", response.status);
            console.error(await response.text());
            throw new Error("Gateway API request failed");
          }

          const json = (await response.json()) as {
            attestation: string;
            signature: string;
          };
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const attestation = json?.attestation;
          const operatorSig = json?.signature;

          if (!attestation || !operatorSig) {
            console.error("Gateway /transfer error: missing attestation or signature");
            throw new Error("Invalid Gateway API response");
          }

          // [3] Mint on the destination EVM chain with the returned attestation.
          console.log(
            `Minting funds on ${getConfigByWalletChain(DESTINATION_CHAIN).chainName}...`,
          );

          const tx = await client.createContractExecutionTransaction({
            walletAddress: DEPOSITOR_ADDRESS,
            blockchain: DESTINATION_CHAIN,
            contractAddress: GATEWAY_MINTER_ADDRESS,
            abiFunctionSignature: "gatewayMint(bytes,bytes)",
            abiParameters: [attestation, operatorSig],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          console.log("Mint tx submitted:", tx.data?.id);

          const txId = tx.data?.id;
          if (!txId) throw new Error("Failed to submit mint transaction");
          await waitForTxCompletion(client, txId, "USDC mint");

          const totalMinted =
            BigInt(requests.length) * parseBalance(String(TRANSFER_AMOUNT_USDC));
          console.log(`Minted ${formatUnits(totalMinted, 6)} USDC`);
          console.log(`Mint transaction ID (${DESTINATION_CHAIN}):`, txId);
        }

        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.8. Run the EVM to EVM transfer script

        ```shell theme={null}
        npm run transfer-from-evm -- arc
        ```

        ```shell theme={null}
        npm run transfer-from-evm -- ethereum base
        ```

        ```shell theme={null}
        npm run transfer-from-evm -- all
        ```
      </Tab>

      <Tab title="Transfer from Solana">
        ## Step 4. Transfer USDC from Solana to EVM

        The transfer script burns USDC on Solana Devnet and mints on a destination EVM
        chain via Gateway. You can skip to the
        [full transfer script](#4-7-full-solana-transfer-script-circle-wallets) if you
        prefer.

        ### 4.1. Create the Solana to EVM transfer script

        ```shell theme={null}
        touch transfer-from-sol.ts
        ```

        ### 4.2. Define constants and types

        The validated script uses Arc Testnet as the destination chain. Update
        `DESTINATION_CHAIN` if you want to mint on a different supported EVM testnet.

        This flow mirrors the standard Solana to EVM Gateway quickstart, but swaps in
        Circle Wallet signing and transaction execution.

        ```ts theme={null}
        const DESTINATION_CHAIN: Chain = "arc";

        const SOLANA_GATEWAY_WALLET = "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
        const SOLANA_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
        const SOLANA_DOMAIN = 5;
        ```

        ### 4.3. Add helper functions

        The helper layer encodes the Solana burn intent into the binary layout expected
        by Gateway, then normalizes addresses and payloads for the API request.

        ```ts theme={null}
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        function evmAddressToBytes32(address: string): string {
          return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        }
        ```

        ### 4.4. Create and sign burn intent

        Build the Solana burn intent, prefix the encoded payload, and sign it with the
        source Solana Developer-Controlled Wallet.

        For Solana-origin transfers, the burn intent uses Solana-specific binary
        encoding and must be signed with the Solana signing-domain prefix. See the
        [Solana Technical Guide](/gateway/references/solana#signing) for the signing
        rules and message format details.

        ```ts theme={null}
        const burnIntent = createBurnIntent({
          sourceDepositor: DEPOSITOR_ADDRESS,
          destinationRecipient: RECIPIENT_ADDRESS,
        });

        const encoded = encodeBurnIntent(burnIntent);
        const prefixed = Buffer.concat([
          Buffer.from([0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          encoded,
        ]);

        const sigResult = await client.signMessage({
          walletAddress: DEPOSITOR_ADDRESS,
          blockchain: "SOL-DEVNET",
          encodedByHex: true,
          message: "0x" + prefixed.toString("hex"),
        });
        ```

        ### 4.5. Request attestation from Gateway API

        Submit the signed burn intent to the Gateway API and verify that it returns the
        attestation and operator signature required by the destination minter.

        ```ts theme={null}
        const response = await fetch(
          "https://gateway-api-testnet.circle.com/v1/transfer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stringifyTypedData(request),
          },
        );
        ```

        ### 4.6. Mint on destination chain

        Use the destination EVM Developer-Controlled Wallet to call
        `gatewayMint(bytes,bytes)` on the Gateway Minter contract, then wait for
        completion.

        ```ts theme={null}
        const tx = await client.createContractExecutionTransaction({
          walletAddress: RECIPIENT_ADDRESS,
          blockchain: destConfig.walletChain,
          contractAddress: GATEWAY_MINTER_ADDRESS,
          abiFunctionSignature: "gatewayMint(bytes,bytes)",
          abiParameters: [attestation, operatorSig],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });

        await waitForTxCompletion(client, txId, "USDC mint");
        ```

        ### 4.7. Full Solana transfer script (Circle Wallets)

        The script signs a Solana burn intent, requests a Gateway attestation, and mints
        on the destination EVM chain. Inline comments explain each stage.

        ```ts transfer-from-sol.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import { PublicKey } from "@solana/web3.js";
        import { u32be, struct, blob, offset, Layout } from "@solana/buffer-layout";
        import bs58 from "bs58";
        import {
          chainConfig,
          GATEWAY_MINTER_ADDRESS,
          client,
          waitForTxCompletion,
          type Chain,
        } from "./config.js";

        const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;
        const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS!;

        if (!DEPOSITOR_ADDRESS || !RECIPIENT_ADDRESS) {
          console.error(
            "Missing required env vars: DEPOSITOR_ADDRESS, RECIPIENT_ADDRESS",
          );
          process.exit(1);
        }

        const DESTINATION_CHAIN: Chain = "arc";

        const SOLANA_GATEWAY_WALLET = "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
        const SOLANA_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
        const SOLANA_DOMAIN = 5;

        const TRANSFER_AMOUNT = 0.1;
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

        const TRANSFER_SPEC_MAGIC = 0xca85def7;
        const BURN_INTENT_MAGIC = 0x070afbc2;

        // Custom layout for Solana PublicKey values in the burn intent payload.
        class PublicKeyLayout extends Layout<PublicKey> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0): PublicKey {
            return new PublicKey(b.subarray(offset, offset + 32));
          }
          encode(src: PublicKey, b: Buffer, offset = 0): number {
            const pubkeyBuffer = src.toBuffer();
            pubkeyBuffer.copy(b, offset);
            return 32;
          }
        }

        const publicKey = (property: string) => new PublicKeyLayout(property);

        // Custom layout for 256-bit unsigned integers.
        class UInt256BE extends Layout<bigint> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0) {
            const buffer = b.subarray(offset, offset + 32);
            return buffer.readBigUInt64BE(24);
          }
          encode(src: bigint, b: Buffer, offset = 0) {
            const buffer = Buffer.alloc(32);
            buffer.writeBigUInt64BE(BigInt(src), 24);
            buffer.copy(b, offset);
            return 32;
          }
        }

        const uint256be = (property: string) => new UInt256BE(property);

        const BurnIntentLayout = struct([
          u32be("magic"),
          uint256be("maxBlockHeight"),
          uint256be("maxFee"),
          u32be("transferSpecLength"),
          struct(
            [
              u32be("magic"),
              u32be("version"),
              u32be("sourceDomain"),
              u32be("destinationDomain"),
              publicKey("sourceContract"),
              publicKey("destinationContract"),
              publicKey("sourceToken"),
              publicKey("destinationToken"),
              publicKey("sourceDepositor"),
              publicKey("destinationRecipient"),
              publicKey("sourceSigner"),
              publicKey("destinationCaller"),
              uint256be("value"),
              blob(32, "salt"),
              u32be("hookDataLength"),
              blob(offset(u32be(), -4), "hookData"),
            ] as any,
            "spec",
          ),
        ] as any);

        function createBurnIntent(params: {
          sourceDepositor: string;
          destinationRecipient: string;
        }) {
          const { sourceDepositor, destinationRecipient } = params;
          const destConfig = chainConfig[DESTINATION_CHAIN];

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: destConfig.domain,
              sourceContract: solanaAddressToBytes32(SOLANA_GATEWAY_WALLET),
              destinationContract: evmAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: solanaAddressToBytes32(SOLANA_USDC),
              destinationToken: evmAddressToBytes32(destConfig.usdc),
              sourceDepositor: solanaAddressToBytes32(sourceDepositor),
              destinationRecipient: evmAddressToBytes32(destinationRecipient),
              sourceSigner: solanaAddressToBytes32(sourceDepositor),
              destinationCaller: evmAddressToBytes32(
                "0x0000000000000000000000000000000000000000",
              ),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Encode the burn intent into the binary layout expected by Gateway.
        function encodeBurnIntent(bi: ReturnType<typeof createBurnIntent>): Buffer {
          const hookData = Buffer.from((bi.spec.hookData || "0x").slice(2), "hex");
          const prepared = {
            magic: BURN_INTENT_MAGIC,
            maxBlockHeight: bi.maxBlockHeight,
            maxFee: bi.maxFee,
            transferSpecLength: 340 + hookData.length,
            spec: {
              magic: TRANSFER_SPEC_MAGIC,
              version: bi.spec.version,
              sourceDomain: bi.spec.sourceDomain,
              destinationDomain: bi.spec.destinationDomain,
              sourceContract: hexToPublicKey(bi.spec.sourceContract),
              destinationContract: hexToPublicKey(bi.spec.destinationContract),
              sourceToken: hexToPublicKey(bi.spec.sourceToken),
              destinationToken: hexToPublicKey(bi.spec.destinationToken),
              sourceDepositor: hexToPublicKey(bi.spec.sourceDepositor),
              destinationRecipient: hexToPublicKey(bi.spec.destinationRecipient),
              sourceSigner: hexToPublicKey(bi.spec.sourceSigner),
              destinationCaller: hexToPublicKey(bi.spec.destinationCaller),
              value: bi.spec.value,
              salt: Buffer.from(bi.spec.salt.slice(2), "hex"),
              hookDataLength: hookData.length,
              hookData,
            },
          };
          const buffer = Buffer.alloc(72 + 340 + hookData.length);
          const bytesWritten = BurnIntentLayout.encode(prepared, buffer);
          return buffer.subarray(0, bytesWritten);
        }

        // Convert a Solana address to a 32-byte hex string.
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Convert an EVM address to a 32-byte hex string.
        function evmAddressToBytes32(address: string): string {
          return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        }

        // Convert a 32-byte hex string into a Solana PublicKey.
        function hexToPublicKey(hex: string): PublicKey {
          return new PublicKey(Buffer.from(hex.slice(2), "hex"));
        }

        // Serialize typed data while converting bigint values to strings.
        function stringifyTypedData<T>(obj: T) {
          return JSON.stringify(obj, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }

        async function main() {
          const destConfig = chainConfig[DESTINATION_CHAIN];

          console.log(`Sender (Solana): ${DEPOSITOR_ADDRESS}`);
          console.log(`Recipient (EVM): ${RECIPIENT_ADDRESS}`);
          console.log(`Transferring from: Solana Devnet -> ${destConfig.chainName}`);

          console.log(
            `Creating burn intent from Solana Devnet -> ${destConfig.chainName}...`,
          );

          // [1] Create and sign the Solana burn intent.
          const burnIntent = createBurnIntent({
            sourceDepositor: DEPOSITOR_ADDRESS,
            destinationRecipient: RECIPIENT_ADDRESS,
          });

          const encoded = encodeBurnIntent(burnIntent);
          const prefixed = Buffer.concat([
            Buffer.from([0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            encoded,
          ]);

          const sigResult = await client.signMessage({
            walletAddress: DEPOSITOR_ADDRESS,
            blockchain: "SOL-DEVNET",
            encodedByHex: true,
            message: "0x" + prefixed.toString("hex"),
          });

          const burnIntentSignature = sigResult.data?.signature;
          if (!burnIntentSignature) throw new Error("Failed to sign burn intent");

          const formattedSignature = burnIntentSignature.startsWith("0x")
            ? burnIntentSignature
            : `0x${burnIntentSignature}`;

          const request = [{ burnIntent, signature: formattedSignature }];
          console.log("Signed burn intent.");

          // [2] Request the attestation set from Gateway API.
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: stringifyTypedData(request),
            },
          );

          if (!response.ok) {
            console.error("Gateway API error status:", response.status);
            console.error(await response.text());
            throw new Error("Gateway API request failed");
          }

          const json = (await response.json()) as {
            attestation: string;
            signature: string;
          };
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const attestation = json?.attestation;
          const operatorSig = json?.signature;

          if (!attestation || !operatorSig) {
            throw new Error("Missing attestation or signature in Gateway API response");
          }

          // [3] Mint on the destination EVM chain with the returned attestation.
          console.log(`Minting funds on ${destConfig.chainName}...`);

          const tx = await client.createContractExecutionTransaction({
            walletAddress: RECIPIENT_ADDRESS,
            blockchain: destConfig.walletChain,
            contractAddress: GATEWAY_MINTER_ADDRESS,
            abiFunctionSignature: "gatewayMint(bytes,bytes)",
            abiParameters: [attestation, operatorSig],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          const txId = tx.data?.id;
          if (!txId) throw new Error("Failed to submit mint transaction");
          console.log("Mint tx submitted:", txId);

          await waitForTxCompletion(client, txId, "USDC mint");

          console.log(`Minted ${Number(TRANSFER_VALUE) / 1_000_000} USDC`);
          console.log(`Mint transaction ID (${destConfig.walletChain}):`, txId);
        }

        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.8. Run the Solana to EVM transfer script

        Before you run this script, update `.env` so:

        * `DEPOSITOR_ADDRESS` is the Solana source wallet
        * `RECIPIENT_ADDRESS` is the destination EVM wallet

        Then run:

        ```shell theme={null}
        npm run transfer-from-sol
        ```
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Self-managed">
    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/)
    * Prepared an EVM testnet wallet with the private key available
      * Added the
        [supported Testnets](/gateway/references/supported-blockchains#testnet) of
        your choice to your wallet

    If you want to try the Solana to EVM transfer, ensure that you've:

    * Prepared a Solana Devnet wallet and exported its keypair as a JSON array
    * Completed
      [Step 3: Deposit into a unified crosschain balance](/gateway/quickstarts/unified-balance-solana#step-3-deposit-into-a-unified-crosschain-balance-self-managed)
      from the
      [Solana quickstart](/gateway/quickstarts/unified-balance-solana#self-managed)

    ### Add testnet funds to your wallet

    To interact with Gateway, you need test USDC and native tokens in your wallet on
    each chain you deposit from. You also need testnet native tokens on the
    destination chain to call the Gateway Minter contract.

    Use the [Circle Faucet](https://faucet.circle.com/) to get testnet USDC. If you
    have a [Circle Developer Console](https://console.circle.com) account, you can
    use the [Console Faucet](https://console.circle.com/faucet) to get testnet
    native tokens. In addition, the following faucets can also be used to fund your
    wallet with testnet native tokens:

    <Tabs>
      <Tab title="Arc">
        **Faucet:** [Arc Testnet](https://faucet.circle.com) (USDC + native tokens)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `arcTestnet`                                 |
        | USDC address | `0x3600000000000000000000000000000000000000` |
        | Domain ID    | `26`                                         |
      </Tab>

      <Tab title="Avalanche">
        **Faucet:** [Avalanche Fuji](https://core.app/tools/testnet-faucet)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `avalancheFuji`                              |
        | USDC address | `0x5425890298aed601595a70ab815c96711a31bc65` |
        | Domain ID    | `1`                                          |
      </Tab>

      <Tab title="Base">
        **Faucet:** [Base Sepolia](https://www.alchemy.com/faucets/base-sepolia)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `baseSepolia`                                |
        | USDC address | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
        | Domain ID    | `6`                                          |
      </Tab>

      <Tab title="Ethereum">
        **Faucet:** [Ethereum Sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `sepolia`                                    |
        | USDC address | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
        | Domain ID    | `0`                                          |
      </Tab>

      <Tab title="Hyperliquid">
        **Faucet:** [Hyperliquid EVM Testnet](https://app.hyperliquid-testnet.xyz/drip)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `hyperliquidEvmTestnet`                      |
        | USDC address | `0x2B3370eE501B4a559b57D449569354196457D8Ab` |
        | Domain ID    | `19`                                         |
      </Tab>

      <Tab title="Sei">
        **Faucet:** [Sei Testnet](https://docs.sei.io/learn/faucet)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `seiTestnet`                                 |
        | USDC address | `0x4fCF1784B31630811181f670Aea7A7bEF803eaED` |
        | Domain ID    | `16`                                         |
      </Tab>

      <Tab title="Solana">
        **Faucet:** [Solana Devnet](https://faucet.solana.com/)

        | Property     | Value                                                   |
        | ------------ | ------------------------------------------------------- |
        | Chain name   | `solanaDevnet` (note that Solana is not EVM-compatible) |
        | USDC address | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`          |
        | Domain ID    | `5`                                                     |
      </Tab>

      <Tab title="Sonic">
        **Faucet:** [Sonic Testnet](https://testnet.soniclabs.com/account)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `sonicTestnet`                               |
        | USDC address | `0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51` |
        | Domain ID    | `13`                                         |
      </Tab>

      <Tab title="Worldchain">
        **Faucet:** [Worldchain Sepolia](https://www.l2faucet.com/world)

        | Property     | Value                                        |
        | ------------ | -------------------------------------------- |
        | Chain name   | `worldchainSepolia`                          |
        | USDC address | `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88` |
        | Domain ID    | `14`                                         |
      </Tab>
    </Tabs>

    ## Step 1: Set up your project

    This step shows you how to prepare your project and environment.

    ### 1.1. Create a new project

    Create a new directory and install the required dependencies:

    ```shell theme={null}
    # Set up your directory and initialize a Node.js project
    mkdir unified-gateway-balance-evm
    cd unified-gateway-balance-evm
    npm init -y

    # Set up module type and run scripts
    npm pkg set type=module
    npm pkg set scripts.deposit="tsx --env-file=.env deposit.ts"
    npm pkg set scripts.transfer-from-evm="tsx --env-file=.env transfer-from-evm.ts"
    npm pkg set scripts.balances="tsx --env-file=.env balances.ts"

    # Install dependencies
    npm install viem tsx typescript
    npm install --save-dev @types/node
    ```

    If you want to try the Solana to EVM transfer, add the run script and install
    these additional dependencies:

    ```shell theme={null}
    npm pkg set scripts.transfer-from-sol="tsx --env-file=.env transfer-from-sol.ts"
    npm pkg set overrides.bigint-buffer=npm:@trufflesuite/bigint-buffer@1.1.10
    npm install @coral-xyz/anchor @solana/buffer-layout @solana/spl-token @solana/web3.js bs58
    ```

    ### 1.2. Initialize and configure the project

    <Tip>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Tip>

    Create a `tsconfig.json` file:

    ```shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```shell theme={null}
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

    ### 1.3 Configure environment variables

    Open `.env` in your editor and add:

    ```text theme={null}
    EVM_PRIVATE_KEY=YOUR_EVM_PRIVATE_KEY
    ```

    If you want to try the Solana to EVM transfer, also add:

    ```text theme={null}
    SOLANA_PRIVATE_KEYPAIR=YOUR_SOLANA_KEYPAIR_ARRAY
    ```

    * `EVM_PRIVATE_KEY` is the private key for the EVM wallet you use for the EVM
      side of the transfer.
    * `SOLANA_PRIVATE_KEYPAIR` is the Solana wallet keypair as a JSON array for the
      Solana side of the transfer.

    <Note>
      If your wallet exports a private key hash instead, you can use `bs58` to convert it:

      ```ts TypeScript theme={null}
      const bytes = bs58.decode({ YOUR_PRIVATE_KEY_HASH });
      console.log(JSON.stringify(Array.from(bytes)));
      ```
    </Note>

    <Tip>
      Open `.env` in your editor rather than writing values with shell commands, and
      add `.env` to your `.gitignore`. This prevents credentials from leaking into
      your shell history or version control.
    </Tip>

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up the configuration file

    This section covers the shared configuration file will be used by both the
    deposit and transfer scripts.

    ### 2.1. Create the configuration file

    ```shell theme={null}
    touch config.ts
    ```

    ### 2.2. Configure wallet account and chain settings

    Add the account setup, Gateway contract addresses, and chain-specific
    configuration to your `config.ts` file. This includes RPC endpoints, USDC
    addresses, and domain IDs for all supported testnet chains.

    ```ts config.ts expandable theme={null}
    import { type Address } from "viem";
    import {
      sepolia,
      baseSepolia,
      avalancheFuji,
      arcTestnet,
      hyperliquidEvmTestnet,
      seiTestnet,
      sonicTestnet,
      worldchainSepolia,
    } from "viem/chains";
    import { privateKeyToAccount } from "viem/accounts";

    /* Account Setup */
    if (!process.env.EVM_PRIVATE_KEY) {
      throw new Error("EVM_PRIVATE_KEY not set in environment");
    }
    export const account = privateKeyToAccount(
      process.env.EVM_PRIVATE_KEY as `0x${string}`,
    );

    /* Gateway Contract Addresses */
    export const GATEWAY_WALLET_ADDRESS: Address =
      "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
    export const GATEWAY_MINTER_ADDRESS: Address =
      "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";

    /* Chain Configuration */
    export const chainConfigs = {
      sepolia: {
        chain: sepolia,
        usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
        domainId: 0,
      },
      baseSepolia: {
        chain: baseSepolia,
        usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
        domainId: 6,
      },
      avalancheFuji: {
        chain: avalancheFuji,
        usdcAddress: "0x5425890298aed601595a70ab815c96711a31bc65" as Address,
        domainId: 1,
      },
      arcTestnet: {
        chain: arcTestnet,
        usdcAddress: "0x3600000000000000000000000000000000000000" as Address,
        domainId: 26,
      },
      hyperliquidEvmTestnet: {
        chain: hyperliquidEvmTestnet,
        usdcAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab" as Address,
        domainId: 19,
      },
      seiTestnet: {
        chain: seiTestnet,
        usdcAddress: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED" as Address,
        domainId: 16,
      },
      sonicTestnet: {
        chain: sonicTestnet,
        usdcAddress: "0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51" as Address,
        domainId: 13,
      },
      worldchainSepolia: {
        chain: worldchainSepolia,
        usdcAddress: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88" as Address,
        domainId: 14,
      },
    } as const;

    export type ChainKey = keyof typeof chainConfigs;

    /* CLI Argument Parsing Helper */
    export function parseSelectedChains(): ChainKey[] {
      const args = process.argv.slice(2);
      const validChains = Object.keys(chainConfigs) as ChainKey[];

      if (args.length === 0) {
        throw new Error(
          "No chains specified. Usage: npm run <script> <chain1> [chain2...] or 'all'",
        );
      }

      if (args.length === 1 && args[0] === "all") {
        return validChains;
      }

      const invalid = args.filter((c) => !validChains.includes(c as ChainKey));
      if (invalid.length > 0) {
        console.error(`Unsupported chain: ${invalid.join(", ")}`);
        console.error(`Valid chains: ${validChains.join(", ")}, all`);
        process.exit(1);
      }

      return [...new Set(args)] as ChainKey[];
    }
    ```

    ## Step 3: Deposit into a unified crosschain balance (Self-managed)

    This section explains parts of the deposit script that allows you to deposit
    USDC into the Gateway Wallet contracts. The script accepts chain names as CLI
    arguments. Specify one or more chains (for example, `arcTestnet` `baseSepolia`)
    or use `all` for all supported testnets. You can skip to the
    [full deposit script](#3-5-full-deposit-script-self-managed) if you prefer.

    ### 3.1. Create the script file

    ```shell theme={null}
    touch deposit.ts
    ```

    ### 3.2. Define constants and ABI

    ```ts deposit.ts theme={null}
    const DEPOSIT_AMOUNT = 2_000000n; // 2 USDC (6 decimals)

    // Gateway Wallet ABI (minimal - only deposit function)
    const gatewayWalletAbi = [
      {
        type: "function",
        name: "deposit",
        inputs: [
          { name: "token", type: "address" },
          { name: "value", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ] as const;
    ```

    ### 3.3. Setup clients and check balances

    Set up the client and contracts for the chain, then verify sufficient USDC
    balance before depositing.

    ```ts deposit.ts theme={null}
    const config = chainConfigs[chainName];

    // Create client for current chain
    const client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });

    // Get contract instances
    const usdcContract = getContract({
      address: config.usdcAddress,
      abi: erc20Abi,
      client,
    });

    const gatewayWallet = getContract({
      address: GATEWAY_WALLET_ADDRESS,
      abi: gatewayWalletAbi,
      client,
    });

    // Check USDC balance
    const balance = await usdcContract.read.balanceOf([account.address]);
    console.log(`Current balance: ${formatUnits(balance, 6)} USDC`);

    if (balance < DEPOSIT_AMOUNT) {
      throw new Error(
        "Insufficient USDC balance. Please top up at https://faucet.circle.com",
      );
    }
    ```

    ### 3.4. Approve and deposit USDC

    The main logic performs two key actions:

    * Approve USDC transfers: It calls the `approve` method on the USDC contract to
      allow the Gateway Wallet contract to transfer USDC from your wallet.
    * Deposit USDC into Gateway: After receiving the approval transaction hash, it
      calls the `deposit` method on the Gateway Wallet contract.

    ```ts deposit.ts theme={null}
    // [1] Approve Gateway Wallet to spend USDC
    console.log(
      `Approving ${formatUnits(DEPOSIT_AMOUNT, 6)} USDC on ${chainName}...`,
    );
    const approvalTx = await usdcContract.write.approve(
      [GATEWAY_WALLET_ADDRESS, DEPOSIT_AMOUNT],
      { account },
    );
    await client.waitForTransactionReceipt({ hash: approvalTx });
    console.log(`Approved on ${chainName}: ${approvalTx}`);

    // [2] Deposit USDC into Gateway Wallet
    console.log(
      `Depositing ${formatUnits(DEPOSIT_AMOUNT, 6)} USDC to Gateway Wallet`,
    );
    const depositTx = await gatewayWallet.write.deposit(
      [config.usdcAddress, DEPOSIT_AMOUNT],
      { account },
    );
    await client.waitForTransactionReceipt({ hash: depositTx });
    console.log(`Done on ${chainName}. Deposit tx: ${depositTx}`);
    ```

    ### 3.5. Full deposit script (Self-managed)

    The complete deposit script loops through selected chains, validates USDC
    balances, and deposits funds into the Gateway Wallet contract on each chain. The
    script includes inline comments to explain what each function does, making it
    easier to follow and modify if needed.

    ```ts deposit.ts expandable theme={null}
    import {
      createPublicClient,
      getContract,
      http,
      erc20Abi,
      formatUnits,
    } from "viem";
    import {
      account,
      chainConfigs,
      parseSelectedChains,
      GATEWAY_WALLET_ADDRESS,
    } from "./config.js";

    const DEPOSIT_AMOUNT = 2_000000n; // 2 USDC (6 decimals)

    // Gateway Wallet ABI (minimal - only deposit function)
    const gatewayWalletAbi = [
      {
        type: "function",
        name: "deposit",
        inputs: [
          { name: "token", type: "address" },
          { name: "value", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ] as const;

    async function main() {
      console.log(`Using account: ${account.address}\n`);

      const selectedChains = parseSelectedChains();
      console.log(`Depositing on: ${selectedChains.join(", ")}\n`);

      for (const chainName of selectedChains) {
        const config = chainConfigs[chainName];

        // Create client for current chain
        const client = createPublicClient({
          chain: config.chain,
          transport: http(),
        });

        // Get contract instances
        const usdcContract = getContract({
          address: config.usdcAddress,
          abi: erc20Abi,
          client,
        });

        const gatewayWallet = getContract({
          address: GATEWAY_WALLET_ADDRESS,
          abi: gatewayWalletAbi,
          client,
        });

        console.log(`\n=== Processing ${chainName} ===`);

        // Check USDC balance
        const balance = await usdcContract.read.balanceOf([account.address]);
        console.log(`Current balance: ${formatUnits(balance, 6)} USDC`);

        if (balance < DEPOSIT_AMOUNT) {
          throw new Error(
            "Insufficient USDC balance. Please top up at https://faucet.circle.com",
          );
        }

        try {
          // [1] Approve Gateway Wallet to spend USDC
          console.log(
            `Approving ${formatUnits(DEPOSIT_AMOUNT, 6)} USDC on ${chainName}...`,
          );
          const approvalTx = await usdcContract.write.approve(
            [GATEWAY_WALLET_ADDRESS, DEPOSIT_AMOUNT],
            { account },
          );
          await client.waitForTransactionReceipt({ hash: approvalTx });
          console.log(`Approved on ${chainName}: ${approvalTx}`);

          // [2] Deposit USDC into Gateway Wallet
          console.log(
            `Depositing ${formatUnits(DEPOSIT_AMOUNT, 6)} USDC to Gateway Wallet`,
          );
          const depositTx = await gatewayWallet.write.deposit(
            [config.usdcAddress, DEPOSIT_AMOUNT],
            { account },
          );
          await client.waitForTransactionReceipt({ hash: depositTx });
          console.log(`Done on ${chainName}. Deposit tx: ${depositTx}`);
        } catch (err) {
          console.error(`Error on ${chainName}:`, err);
        }
      }
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    ### 3.6. Run the script to create a crosschain balance

    Run the deposit script to make the deposits. You must specify at least one chain
    using command-line arguments.

    ```shell theme={null}
    # Deposit to all supported chains
    npm run deposit -- all

    # Deposit to a single chain
    npm run deposit -- sepolia

    # Deposit to multiple chains
    npm run deposit -- baseSepolia avalancheFuji
    ```

    Wait for the
    [required number of block confirmations](https://developers.circle.com/gateway/references/supported-blockchains#required-block-confirmations).
    Once the deposit transactions are final, the total balance is the sum of all the
    USDC from deposit transactions across all supported chains that have reached
    finality. Note that for certain chains, finality may take up to 20 minutes to be
    reached.

    ### 3.7. Check the balances on the Gateway Wallet

    Create a new file called `balances.ts`, and add the following code. This script
    retrieves the USDC balances available from your Gateway Wallet on each supported
    chain.

    ```ts balances.ts expandable theme={null}
    import { privateKeyToAccount } from "viem/accounts";

    if (!process.env.EVM_PRIVATE_KEY) {
      throw new Error("Missing EVM_PRIVATE_KEY in environment");
    }

    const DOMAINS = {
      sepolia: 0,
      avalancheFuji: 1,
      baseSepolia: 6,
      arcTestnet: 26,
      hyperliquidEvmTestnet: 19,
      seiTestnet: 16,
      sonicTestnet: 13,
      worldchainSepolia: 14,
    };

    async function main() {
      const account = privateKeyToAccount(
        process.env.EVM_PRIVATE_KEY as `0x${string}`,
      );
      const depositor = account.address;

      console.log(`Depositor address: ${depositor}\n`);

      const body = {
        token: "USDC",
        sources: Object.entries(DOMAINS).map(([_, domain]) => ({
          domain,
          depositor,
        })),
      };

      const res = await fetch(
        "https://gateway-api-testnet.circle.com/v1/balances",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const result = await res.json();

      let total = 0;
      for (const balance of result.balances) {
        const chain =
          Object.keys(DOMAINS).find(
            (key) => DOMAINS[key as keyof typeof DOMAINS] === balance.domain,
          ) || `Domain ${balance.domain}`;
        const amount = parseFloat(balance.balance);
        console.log(`${chain}: ${amount.toFixed(6)} USDC`);
        total += amount;
      }

      console.log(`\nTotal: ${total.toFixed(6)} USDC`);
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    You can run it to check whether finality has been reached for recent
    transactions.

    ```shell theme={null}
    npm run balances
    ```

    <Tabs>
      <Tab title="Transfer from EVM">
        ## Step 4: Transfer USDC from the crosschain balance

        This section explains parts of the transfer script that burns USDC from source
        chains and mints on a destination chain via Gateway. The script accepts chain
        names as CLI arguments. Specify one or more source chains (for example,
        `seiTestnet` or `arcTestnet`) or use `all` for all supported testnets. You can
        skip to the [full transfer script](#4-7-full-evm-transfer-script-self-managed)
        if you prefer.

        ### 4.1. Create the script file

        ```shell theme={null}
        touch transfer-from-evm.ts
        ```

        ### 4.2. Define constants and types

        You can set which chain to deposit to by modifying the `DESTINATION_CHAIN`
        value. This example sets it to `seiTestnet`. You can also set the amount to be
        transferred from each source chain by changing the `TRANSFER_VALUE`.

        ```ts transfer-from-evm.ts theme={null}
        const DESTINATION_CHAIN: ChainKey = "seiTestnet";
        const TRANSFER_VALUE = 1_000000n; // 1 USDC (6 decimals)
        const MAX_FEE = 2_010000n;

        // EIP-712 Domain and Types for Gateway burn intents
        const domain = { name: "GatewayWallet", version: "1" };

        const EIP712Domain = [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ] as const;

        const TransferSpec = [
          { name: "version", type: "uint32" },
          { name: "sourceDomain", type: "uint32" },
          { name: "destinationDomain", type: "uint32" },
          { name: "sourceContract", type: "bytes32" },
          { name: "destinationContract", type: "bytes32" },
          { name: "sourceToken", type: "bytes32" },
          { name: "destinationToken", type: "bytes32" },
          { name: "sourceDepositor", type: "bytes32" },
          { name: "destinationRecipient", type: "bytes32" },
          { name: "sourceSigner", type: "bytes32" },
          { name: "destinationCaller", type: "bytes32" },
          { name: "value", type: "uint256" },
          { name: "salt", type: "bytes32" },
          { name: "hookData", type: "bytes" },
        ] as const;

        const BurnIntent = [
          { name: "maxBlockHeight", type: "uint256" },
          { name: "maxFee", type: "uint256" },
          { name: "spec", type: "TransferSpec" },
        ] as const;

        const gatewayMinterAbi = [
          {
            type: "function",
            name: "gatewayMint",
            inputs: [
              { name: "attestationPayload", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ] as const;
        ```

        ### 4.3. Add helper functions

        ```ts transfer-from-evm.ts theme={null}
        // Create a burn intent for cross-chain transfer
        function createBurnIntent(params: {
          sourceChain: ChainKey;
          depositorAddress: string;
          recipientAddress?: string;
        }) {
          const {
            sourceChain,
            depositorAddress,
            recipientAddress = depositorAddress,
          } = params;
          const sourceConfig = chainConfigs[sourceChain];
          const destConfig = chainConfigs[DESTINATION_CHAIN];

          return {
            maxBlockHeight: maxUint256,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: sourceConfig.domainId,
              destinationDomain: destConfig.domainId,
              sourceContract: GATEWAY_WALLET_ADDRESS,
              destinationContract: GATEWAY_MINTER_ADDRESS,
              sourceToken: sourceConfig.usdcAddress,
              destinationToken: destConfig.usdcAddress,
              sourceDepositor: depositorAddress,
              destinationRecipient: recipientAddress,
              sourceSigner: depositorAddress,
              destinationCaller: zeroAddress,
              value: TRANSFER_VALUE,
              salt: ("0x" + randomBytes(32).toString("hex")) as Hex,
              hookData: "0x" as Hex,
            },
          };
        }

        // Create EIP-712 typed data for signing
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain,
            primaryType: "BurnIntent" as const,
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: addressToBytes32(
                  burnIntent.spec.destinationContract,
                ),
                sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
                sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: addressToBytes32(
                  burnIntent.spec.destinationRecipient,
                ),
                sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: addressToBytes32(burnIntent.spec.destinationCaller),
              },
            },
          };
        }

        // Convert address to bytes32
        function addressToBytes32(address: string): Hex {
          return pad(address.toLowerCase() as Hex, { size: 32 });
        }
        ```

        ### 4.4. Create and sign burn intents

        ```ts transfer-from-evm.ts theme={null}
        const requests = [];

        for (const chainName of selectedChains) {
          console.log(
            `Creating burn intent from ${chainName} → ${DESTINATION_CHAIN}...`,
          );

          const intent = createBurnIntent({
            sourceChain: chainName,
            depositorAddress: account.address,
          });

          const typedData = burnIntentTypedData(intent);
          const signature = await account.signTypedData(typedData);

          requests.push({ burnIntent: typedData.message, signature });
        }
        console.log("Signed burn intents.");
        ```

        ### 4.5. Request attestation from Gateway API

        ```ts transfer-from-evm.ts theme={null}
        const response = await fetch(
          "https://gateway-api-testnet.circle.com/v1/transfer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requests, (_key, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Gateway API error: ${response.status} ${text}`);
        }

        const json = await response.json();
        console.log("Gateway API response:", JSON.stringify(json, null, 2));

        const attestation = json?.attestation;
        const operatorSig = json?.signature;

        if (!attestation || !operatorSig) {
          throw new Error("Missing attestation or signature in response");
        }
        ```

        ### 4.6. Mint on destination chain

        ```ts transfer-from-evm.ts theme={null}
        const destConfig = chainConfigs[DESTINATION_CHAIN];

        const destClient = createPublicClient({
          chain: destConfig.chain,
          transport: http(),
        });

        const walletClient = createWalletClient({
          account,
          chain: destConfig.chain,
          transport: http(),
        });

        const destinationGatewayMinterContract = getContract({
          address: GATEWAY_MINTER_ADDRESS,
          abi: gatewayMinterAbi,
          client: { public: destClient, wallet: walletClient },
        });

        console.log(`Minting funds on ${destConfig.chain.name}...`);
        const mintTx = await destinationGatewayMinterContract.write.gatewayMint(
          [attestation, operatorSig],
          { account },
        );

        await destClient.waitForTransactionReceipt({ hash: mintTx });

        const totalMinted = BigInt(requests.length) * TRANSFER_VALUE;
        console.log(`Minted ${formatUnits(totalMinted, 6)} USDC`);
        console.log(`Mint transaction hash (${DESTINATION_CHAIN}):`, mintTx);
        ```

        ### 4.7. Full EVM transfer script (Self-managed)

        The complete transfer script loops through selected source chains, creates and
        signs burn intents for each chain, submits them to the Gateway API for
        attestation, and mints USDC on the destination chain. The script includes inline
        comments to explain what each function does, making it easier to follow and
        modify if needed.

        ```ts transfer-from-evm.ts expandable theme={null}
        import {
          createPublicClient,
          createWalletClient,
          getContract,
          http,
          pad,
          zeroAddress,
          maxUint256,
          formatUnits,
          type Hex,
        } from "viem";
        import { randomBytes } from "node:crypto";
        import {
          account,
          chainConfigs,
          parseSelectedChains,
          GATEWAY_WALLET_ADDRESS,
          GATEWAY_MINTER_ADDRESS,
          type ChainKey,
        } from "./config.js";

        const DESTINATION_CHAIN: ChainKey = "seiTestnet";
        const TRANSFER_VALUE = 1_000000n; // 1 USDC (6 decimals)
        const MAX_FEE = 2_010000n;

        // EIP-712 Domain and Types for Gateway burn intents
        const domain = { name: "GatewayWallet", version: "1" };

        const EIP712Domain = [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ] as const;

        const TransferSpec = [
          { name: "version", type: "uint32" },
          { name: "sourceDomain", type: "uint32" },
          { name: "destinationDomain", type: "uint32" },
          { name: "sourceContract", type: "bytes32" },
          { name: "destinationContract", type: "bytes32" },
          { name: "sourceToken", type: "bytes32" },
          { name: "destinationToken", type: "bytes32" },
          { name: "sourceDepositor", type: "bytes32" },
          { name: "destinationRecipient", type: "bytes32" },
          { name: "sourceSigner", type: "bytes32" },
          { name: "destinationCaller", type: "bytes32" },
          { name: "value", type: "uint256" },
          { name: "salt", type: "bytes32" },
          { name: "hookData", type: "bytes" },
        ] as const;

        const BurnIntent = [
          { name: "maxBlockHeight", type: "uint256" },
          { name: "maxFee", type: "uint256" },
          { name: "spec", type: "TransferSpec" },
        ] as const;

        const gatewayMinterAbi = [
          {
            type: "function",
            name: "gatewayMint",
            inputs: [
              { name: "attestationPayload", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ] as const;

        // Create a burn intent for cross-chain transfer
        function createBurnIntent(params: {
          sourceChain: ChainKey;
          depositorAddress: string;
          recipientAddress?: string;
        }) {
          const {
            sourceChain,
            depositorAddress,
            recipientAddress = depositorAddress,
          } = params;
          const sourceConfig = chainConfigs[sourceChain];
          const destConfig = chainConfigs[DESTINATION_CHAIN];

          return {
            maxBlockHeight: maxUint256,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: sourceConfig.domainId,
              destinationDomain: destConfig.domainId,
              sourceContract: GATEWAY_WALLET_ADDRESS,
              destinationContract: GATEWAY_MINTER_ADDRESS,
              sourceToken: sourceConfig.usdcAddress,
              destinationToken: destConfig.usdcAddress,
              sourceDepositor: depositorAddress,
              destinationRecipient: recipientAddress,
              sourceSigner: depositorAddress,
              destinationCaller: zeroAddress,
              value: TRANSFER_VALUE,
              salt: ("0x" + randomBytes(32).toString("hex")) as Hex,
              hookData: "0x" as Hex,
            },
          };
        }

        // Create EIP-712 typed data for signing
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain,
            primaryType: "BurnIntent" as const,
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: addressToBytes32(
                  burnIntent.spec.destinationContract,
                ),
                sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
                sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: addressToBytes32(
                  burnIntent.spec.destinationRecipient,
                ),
                sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: addressToBytes32(burnIntent.spec.destinationCaller),
              },
            },
          };
        }

        // Convert address to bytes32
        function addressToBytes32(address: string): Hex {
          return pad(address.toLowerCase() as Hex, { size: 32 });
        }

        async function main() {
          console.log(`Using account: ${account.address}`);

          const selectedChains = parseSelectedChains();
          console.log(`Transfering balances from: ${selectedChains.join(", ")}`);

          // [1] Create and sign burn intents for each source chain
          const requests = [];

          for (const chainName of selectedChains) {
            console.log(
              `Creating burn intent from ${chainName} → ${DESTINATION_CHAIN}...`,
            );

            const intent = createBurnIntent({
              sourceChain: chainName,
              depositorAddress: account.address,
            });

            const typedData = burnIntentTypedData(intent);
            const signature = await account.signTypedData(typedData);

            requests.push({ burnIntent: typedData.message, signature });
          }
          console.log("Signed burn intents.");

          // [2] Request attestation from Gateway API
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requests, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value,
              ),
            },
          );

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Gateway API error: ${response.status} ${text}`);
          }

          const json = await response.json();
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const attestation = json?.attestation;
          const operatorSig = json?.signature;

          if (!attestation || !operatorSig) {
            throw new Error("Missing attestation or signature in response");
          }

          // [3] Mint on destination chain
          const destConfig = chainConfigs[DESTINATION_CHAIN];

          const destClient = createPublicClient({
            chain: destConfig.chain,
            transport: http(),
          });

          const walletClient = createWalletClient({
            account,
            chain: destConfig.chain,
            transport: http(),
          });

          const destinationGatewayMinterContract = getContract({
            address: GATEWAY_MINTER_ADDRESS,
            abi: gatewayMinterAbi,
            client: { public: destClient, wallet: walletClient },
          });

          console.log(`Minting funds on ${destConfig.chain.name}...`);
          const mintTx = await destinationGatewayMinterContract.write.gatewayMint(
            [attestation, operatorSig],
            { account },
          );

          await destClient.waitForTransactionReceipt({ hash: mintTx });

          const totalMinted = BigInt(requests.length) * TRANSFER_VALUE;
          console.log(`Minted ${formatUnits(totalMinted, 6)} USDC`);
          console.log(`Mint transaction hash (${DESTINATION_CHAIN}):`, mintTx);
        }

        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.8. Run the script to transfer USDC to destination chain

        Run the transfer script to transfer 1 USDC from each selected Gateway balance to
        the destination chain.

        <Note>
          [Gateway gas fees](https://developers.circle.com/gateway/references/fees) are
          charged per burn intent. To reduce overall gas costs, consider keeping most
          Gateway funds on low-cost chains, where Circle’s base fee for burns is cheaper.
        </Note>

        ```shell theme={null}
        # Transfer from all chains
        npm run transfer-from-evm -- all

        # Transfer from a single chain
        npm run transfer-from-evm -- arcTestnet

        # Transfer from multiple chains
        npm run transfer-from-evm -- baseSepolia avalancheFuji
        ```
      </Tab>

      <Tab title="Transfer from Solana">
        ## Step 4: Transfer USDC from the crosschain balance

        This section explains parts of the transfer script that burns USDC from Solana
        Devnet and mints on an EVM chain via Gateway. You can skip to the
        [full transfer script](#4-7-full-solana-transfer-script-self-managed) if you
        prefer.

        ### 4.1. Create the script file

        ```shell theme={null}
        touch transfer-from-sol.ts
        ```

        ### 4.2. Define constants and types

        You can set which chain to deposit to by modifying the `DESTINATION_CHAIN`
        value. This example sets it to `seiTestnet`. You can also set the amount to be
        transferred from each source chain by changing the `TRANSFER_VALUE`.

        ```ts transfer-from-sol.ts expandable theme={null}
        /* Constants */
        const DESTINATION_CHAIN: ChainKey = "seiTestnet";
        const TRANSFER_VALUE = 1_000000n; // 1 USDC (6 decimals)
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

        const GATEWAY_WALLET_ADDRESS = "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
        const USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
        const SOLANA_DOMAIN = 5;

        const TRANSFER_SPEC_MAGIC = 0xca85def7;
        const BURN_INTENT_MAGIC = 0x070afbc2;

        /* Type definitions */
        // Custom layout for Solana PublicKey (32 bytes)
        class PublicKeyLayout extends Layout<PublicKey> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0): PublicKey {
            return new PublicKey(b.subarray(offset, offset + 32));
          }
          encode(src: PublicKey, b: Buffer, offset = 0): number {
            const pubkeyBuffer = src.toBuffer();
            pubkeyBuffer.copy(b, offset);
            return 32;
          }
        }

        const publicKey = (property: string) => new PublicKeyLayout(property);

        // Custom layout for 256-bit unsigned integers
        class UInt256BE extends Layout<bigint> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0) {
            const buffer = b.subarray(offset, offset + 32);
            return buffer.readBigUInt64BE(24);
          }
          encode(src: bigint, b: Buffer, offset = 0) {
            const buffer = Buffer.alloc(32);
            buffer.writeBigUInt64BE(BigInt(src), 24);
            buffer.copy(b, offset);
            return 32;
          }
        }

        const uint256be = (property: string) => new UInt256BE(property);

        // Type 'as any' used due to @solana/buffer-layout's incomplete TypeScript definitions (archived Jan 2025)
        const BurnIntentLayout = struct([
          u32be("magic"),
          uint256be("maxBlockHeight"),
          uint256be("maxFee"),
          u32be("transferSpecLength"),
          struct(
            [
              u32be("magic"),
              u32be("version"),
              u32be("sourceDomain"),
              u32be("destinationDomain"),
              publicKey("sourceContract"),
              publicKey("destinationContract"),
              publicKey("sourceToken"),
              publicKey("destinationToken"),
              publicKey("sourceDepositor"),
              publicKey("destinationRecipient"),
              publicKey("sourceSigner"),
              publicKey("destinationCaller"),
              uint256be("value"),
              blob(32, "salt"),
              u32be("hookDataLength"),
              blob(offset(u32be(), -4), "hookData"),
            ] as any,
            "spec",
          ),
        ] as any);

        const gatewayMinterAbi = [
          {
            type: "function",
            name: "gatewayMint",
            inputs: [
              { name: "attestationPayload", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ] as const;
        ```

        ### 4.3. Add helper functions

        ```ts transfer-from-sol.ts expandable theme={null}
        // Construct burn intent for Solana to EVM transfer
        function createBurnIntent(params: {
          sourceDepositor: string;
          destinationRecipient: string;
        }) {
          const { sourceDepositor, destinationRecipient } = params;
          const destConfig = chainConfigs[DESTINATION_CHAIN];

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: destConfig.domainId,
              sourceContract: solanaAddressToBytes32(GATEWAY_WALLET_ADDRESS),
              destinationContract: evmAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: solanaAddressToBytes32(USDC_ADDRESS),
              destinationToken: evmAddressToBytes32(destConfig.usdcAddress),
              sourceDepositor: solanaAddressToBytes32(sourceDepositor),
              destinationRecipient: evmAddressToBytes32(destinationRecipient),
              sourceSigner: solanaAddressToBytes32(sourceDepositor),
              destinationCaller: evmAddressToBytes32(
                "0x0000000000000000000000000000000000000000",
              ),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Encode burn intent as binary layout for signing
        function encodeBurnIntent(bi: any): Buffer {
          const hookData = Buffer.from((bi.spec.hookData || "0x").slice(2), "hex");
          const prepared = {
            magic: BURN_INTENT_MAGIC,
            maxBlockHeight: bi.maxBlockHeight,
            maxFee: bi.maxFee,
            transferSpecLength: 340 + hookData.length,
            spec: {
              magic: TRANSFER_SPEC_MAGIC,
              version: bi.spec.version,
              sourceDomain: bi.spec.sourceDomain,
              destinationDomain: bi.spec.destinationDomain,
              sourceContract: hexToPublicKey(bi.spec.sourceContract),
              destinationContract: hexToPublicKey(bi.spec.destinationContract),
              sourceToken: hexToPublicKey(bi.spec.sourceToken),
              destinationToken: hexToPublicKey(bi.spec.destinationToken),
              sourceDepositor: hexToPublicKey(bi.spec.sourceDepositor),
              destinationRecipient: hexToPublicKey(bi.spec.destinationRecipient),
              sourceSigner: hexToPublicKey(bi.spec.sourceSigner),
              destinationCaller: hexToPublicKey(bi.spec.destinationCaller),
              value: bi.spec.value,
              salt: Buffer.from(bi.spec.salt.slice(2), "hex"),
              hookDataLength: hookData.length,
              hookData,
            },
          };
          const buffer = Buffer.alloc(72 + 340 + hookData.length);
          const bytesWritten = BurnIntentLayout.encode(prepared, buffer);
          return buffer.subarray(0, bytesWritten);
        }

        // Sign burn intent with Ed25519 keypair
        function signBurnIntent(keypair: Keypair, payload: any): string {
          const encoded = encodeBurnIntent(payload);
          const prefixed = Buffer.concat([
            Buffer.from([0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            encoded,
          ]);
          const privateKey = crypto.createPrivateKey({
            key: Buffer.concat([
              Buffer.from("302e020100300506032b657004220420", "hex"),
              Buffer.from(keypair.secretKey.slice(0, 32)),
            ]),
            format: "der",
            type: "pkcs8",
          });
          return `0x${crypto.sign(null, prefixed, privateKey).toString("hex")}`;
        }

        // Get Solana keypair from environment variable
        function getSolanaKeypair(): Keypair {
          if (!process.env.SOLANA_PRIVATE_KEYPAIR) {
            throw new Error("SOLANA_PRIVATE_KEYPAIR not set");
          }
          const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEYPAIR);
          return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }

        // Convert Solana address to 32-byte hex string
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Pad EVM address to 32 bytes
        function evmAddressToBytes32(address: string): string {
          return pad(address.toLowerCase() as Hex, { size: 32 });
        }

        // Convert hex string to Solana PublicKey
        function hexToPublicKey(hexString: string): PublicKey {
          const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
          const buffer = Buffer.from(cleanHex, "hex");
          return new PublicKey(buffer);
        }

        // Serialize typed data (convert bigints to strings)
        function stringifyTypedData(obj: unknown) {
          return JSON.stringify(obj, (_key: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }
        ```

        ### 4.4. Create and sign burn intent

        ```ts transfer-from-sol.ts theme={null}
        const intent = createBurnIntent({
          sourceDepositor: solanaKeypair.publicKey.toBase58(),
          destinationRecipient: account.address,
        });

        const signature = signBurnIntent(solanaKeypair, intent);
        const request = [{ burnIntent: intent, signature }];
        console.log("Signed burn intents.");
        ```

        For Solana-origin transfers, the burn intent uses Solana-specific binary
        encoding and must be signed with the Solana signing-domain prefix. See the
        [Solana Technical Guide](/gateway/references/solana#signing) for the signing
        rules and message format details.

        ### 4.5. Request attestation from Gateway API

        ```ts transfer-from-sol.ts theme={null}
        const response = await fetch(
          "https://gateway-api-testnet.circle.com/v1/transfer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stringifyTypedData(request),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Gateway API error: ${response.status} ${text}`);
        }

        const json = await response.json();
        console.log("Gateway API response:", JSON.stringify(json, null, 2));

        const attestation = json?.attestation;
        const operatorSig = json?.signature;

        if (!attestation || !operatorSig) {
          throw new Error("Missing attestation or signature in response");
        }
        ```

        ### 4.6. Mint on destination chain

        ```ts transfer-from-sol.ts theme={null}
        const destConfig = chainConfigs[DESTINATION_CHAIN];
        console.log(`Minting funds on ${destConfig.chain.name}...`);

        const destClient = createPublicClient({
          chain: destConfig.chain,
          transport: http(),
        });

        const walletClient = createWalletClient({
          account,
          chain: destConfig.chain,
          transport: http(),
        });

        const destinationGatewayMinterContract = getContract({
          address: GATEWAY_MINTER_ADDRESS,
          abi: gatewayMinterAbi,
          client: { public: destClient, wallet: walletClient },
        });

        const mintTx = await destinationGatewayMinterContract.write.gatewayMint(
          [attestation, operatorSig],
          { account },
        );

        await destClient.waitForTransactionReceipt({ hash: mintTx });

        console.log(`Minted ${formatUnits(TRANSFER_VALUE, 6)} USDC`);
        console.log(`Mint transaction hash (${DESTINATION_CHAIN}):`, mintTx);
        ```

        ### 4.7. Full Solana transfer script (Self-managed)

        The complete transfer script creates and signs a burn intent on Solana Devnet,
        submits it to the Gateway API for attestation, and mints USDC on the destination
        EVM chain. The script includes inline comments to explain what each function
        does, making it easier to follow and modify if needed.

        ```ts transfer-from-sol.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import * as crypto from "crypto";
        import {
          createPublicClient,
          createWalletClient,
          getContract,
          http,
          pad,
          formatUnits,
          type Hex,
        } from "viem";
        import { Keypair, PublicKey } from "@solana/web3.js";
        import { u32be, struct, blob, offset, Layout } from "@solana/buffer-layout";
        import bs58 from "bs58";
        import {
          account,
          chainConfigs,
          GATEWAY_MINTER_ADDRESS,
          type ChainKey,
        } from "./config.js";

        /* Constants */
        const DESTINATION_CHAIN: ChainKey = "seiTestnet";
        const TRANSFER_VALUE = 1_000000n; // 1 USDC (6 decimals)
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

        const GATEWAY_WALLET_ADDRESS = "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
        const USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
        const SOLANA_DOMAIN = 5;

        const TRANSFER_SPEC_MAGIC = 0xca85def7;
        const BURN_INTENT_MAGIC = 0x070afbc2;

        /* Type definitions */
        // Custom layout for Solana PublicKey (32 bytes)
        class PublicKeyLayout extends Layout<PublicKey> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0): PublicKey {
            return new PublicKey(b.subarray(offset, offset + 32));
          }
          encode(src: PublicKey, b: Buffer, offset = 0): number {
            const pubkeyBuffer = src.toBuffer();
            pubkeyBuffer.copy(b, offset);
            return 32;
          }
        }

        const publicKey = (property: string) => new PublicKeyLayout(property);

        // Custom layout for 256-bit unsigned integers
        class UInt256BE extends Layout<bigint> {
          constructor(property: string) {
            super(32, property);
          }
          decode(b: Buffer, offset = 0) {
            const buffer = b.subarray(offset, offset + 32);
            return buffer.readBigUInt64BE(24);
          }
          encode(src: bigint, b: Buffer, offset = 0) {
            const buffer = Buffer.alloc(32);
            buffer.writeBigUInt64BE(BigInt(src), 24);
            buffer.copy(b, offset);
            return 32;
          }
        }

        const uint256be = (property: string) => new UInt256BE(property);

        // Type 'as any' used due to @solana/buffer-layout's incomplete TypeScript definitions (archived Jan 2025)
        const BurnIntentLayout = struct([
          u32be("magic"),
          uint256be("maxBlockHeight"),
          uint256be("maxFee"),
          u32be("transferSpecLength"),
          struct(
            [
              u32be("magic"),
              u32be("version"),
              u32be("sourceDomain"),
              u32be("destinationDomain"),
              publicKey("sourceContract"),
              publicKey("destinationContract"),
              publicKey("sourceToken"),
              publicKey("destinationToken"),
              publicKey("sourceDepositor"),
              publicKey("destinationRecipient"),
              publicKey("sourceSigner"),
              publicKey("destinationCaller"),
              uint256be("value"),
              blob(32, "salt"),
              u32be("hookDataLength"),
              blob(offset(u32be(), -4), "hookData"),
            ] as any,
            "spec",
          ),
        ] as any);

        const gatewayMinterAbi = [
          {
            type: "function",
            name: "gatewayMint",
            inputs: [
              { name: "attestationPayload", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ] as const;

        /* Helpers */
        // Construct burn intent for Solana to EVM transfer
        function createBurnIntent(params: {
          sourceDepositor: string;
          destinationRecipient: string;
        }) {
          const { sourceDepositor, destinationRecipient } = params;
          const destConfig = chainConfigs[DESTINATION_CHAIN];

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: destConfig.domainId,
              sourceContract: solanaAddressToBytes32(GATEWAY_WALLET_ADDRESS),
              destinationContract: evmAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: solanaAddressToBytes32(USDC_ADDRESS),
              destinationToken: evmAddressToBytes32(destConfig.usdcAddress),
              sourceDepositor: solanaAddressToBytes32(sourceDepositor),
              destinationRecipient: evmAddressToBytes32(destinationRecipient),
              sourceSigner: solanaAddressToBytes32(sourceDepositor),
              destinationCaller: evmAddressToBytes32(
                "0x0000000000000000000000000000000000000000",
              ),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Encode burn intent as binary layout for signing
        function encodeBurnIntent(bi: any): Buffer {
          const hookData = Buffer.from((bi.spec.hookData || "0x").slice(2), "hex");
          const prepared = {
            magic: BURN_INTENT_MAGIC,
            maxBlockHeight: bi.maxBlockHeight,
            maxFee: bi.maxFee,
            transferSpecLength: 340 + hookData.length,
            spec: {
              magic: TRANSFER_SPEC_MAGIC,
              version: bi.spec.version,
              sourceDomain: bi.spec.sourceDomain,
              destinationDomain: bi.spec.destinationDomain,
              sourceContract: hexToPublicKey(bi.spec.sourceContract),
              destinationContract: hexToPublicKey(bi.spec.destinationContract),
              sourceToken: hexToPublicKey(bi.spec.sourceToken),
              destinationToken: hexToPublicKey(bi.spec.destinationToken),
              sourceDepositor: hexToPublicKey(bi.spec.sourceDepositor),
              destinationRecipient: hexToPublicKey(bi.spec.destinationRecipient),
              sourceSigner: hexToPublicKey(bi.spec.sourceSigner),
              destinationCaller: hexToPublicKey(bi.spec.destinationCaller),
              value: bi.spec.value,
              salt: Buffer.from(bi.spec.salt.slice(2), "hex"),
              hookDataLength: hookData.length,
              hookData,
            },
          };
          const buffer = Buffer.alloc(72 + 340 + hookData.length);
          const bytesWritten = BurnIntentLayout.encode(prepared, buffer);
          return buffer.subarray(0, bytesWritten);
        }

        // Sign burn intent with Ed25519 keypair
        function signBurnIntent(keypair: Keypair, payload: any): string {
          const encoded = encodeBurnIntent(payload);
          const prefixed = Buffer.concat([
            Buffer.from([0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            encoded,
          ]);
          const privateKey = crypto.createPrivateKey({
            key: Buffer.concat([
              Buffer.from("302e020100300506032b657004220420", "hex"),
              Buffer.from(keypair.secretKey.slice(0, 32)),
            ]),
            format: "der",
            type: "pkcs8",
          });
          return `0x${crypto.sign(null, prefixed, privateKey).toString("hex")}`;
        }

        // Get Solana keypair from environment variable
        function getSolanaKeypair(): Keypair {
          if (!process.env.SOLANA_PRIVATE_KEYPAIR) {
            throw new Error("SOLANA_PRIVATE_KEYPAIR not set");
          }
          const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEYPAIR);
          return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }

        // Convert Solana address to 32-byte hex string
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Pad EVM address to 32 bytes
        function evmAddressToBytes32(address: string): string {
          return pad(address.toLowerCase() as Hex, { size: 32 });
        }

        // Convert hex string to Solana PublicKey
        function hexToPublicKey(hexString: string): PublicKey {
          const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
          const buffer = Buffer.from(cleanHex, "hex");
          return new PublicKey(buffer);
        }

        // Serialize typed data (convert bigints to strings)
        function stringifyTypedData(obj: unknown) {
          return JSON.stringify(obj, (_key: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }

        /* Main logic */
        async function main() {
          const solanaKeypair = getSolanaKeypair();
          console.log(`Sender (Solana): ${solanaKeypair.publicKey.toBase58()}`);
          console.log(`Recipient (EVM): ${account.address}`);
          console.log(`Transfering balances from: solanaDevnet`);

          // [1] Create and sign burn intent
          console.log(
            `Creating burn intent from solanaDevnet → ${DESTINATION_CHAIN}...`,
          );

          const intent = createBurnIntent({
            sourceDepositor: solanaKeypair.publicKey.toBase58(),
            destinationRecipient: account.address,
          });

          const signature = signBurnIntent(solanaKeypair, intent);
          const request = [{ burnIntent: intent, signature }];
          console.log("Signed burn intents.");

          // [2] Request attestation from Gateway API
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: stringifyTypedData(request),
            },
          );

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Gateway API error: ${response.status} ${text}`);
          }

          const json = await response.json();
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const attestation = json?.attestation;
          const operatorSig = json?.signature;

          if (!attestation || !operatorSig) {
            throw new Error("Missing attestation or signature in response");
          }

          // [3] Mint on destination chain
          const destConfig = chainConfigs[DESTINATION_CHAIN];
          console.log(`Minting funds on ${destConfig.chain.name}...`);

          const destClient = createPublicClient({
            chain: destConfig.chain,
            transport: http(),
          });

          const walletClient = createWalletClient({
            account,
            chain: destConfig.chain,
            transport: http(),
          });

          const destinationGatewayMinterContract = getContract({
            address: GATEWAY_MINTER_ADDRESS,
            abi: gatewayMinterAbi,
            client: { public: destClient, wallet: walletClient },
          });

          const mintTx = await destinationGatewayMinterContract.write.gatewayMint(
            [attestation, operatorSig],
            { account },
          );

          await destClient.waitForTransactionReceipt({ hash: mintTx });

          console.log(`Minted ${formatUnits(TRANSFER_VALUE, 6)} USDC`);
          console.log(`Mint transaction hash (${DESTINATION_CHAIN}):`, mintTx);
        }

        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.8. Run the script to transfer USDC to destination chain

        Run the transfer script to transfer 1 USDC from your Solana Devnet Gateway
        balance to the destination EVM chain.

        <Note>
          [Gateway gas fees](https://developers.circle.com/gateway/references/fees) are
          charged per burn intent. To reduce overall gas costs, consider keeping most
          Gateway funds on low-cost chains, where Circle’s base fee for burns is cheaper.
        </Note>

        ```shell theme={null}
        npm run transfer-from-sol
        ```
      </Tab>
    </Tabs>
  </Tab>
</Tabs>
