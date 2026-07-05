> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Deposit USDC into xReserve

> Learn how to deposit USDC into xReserve on Ethereum Sepolia.

This quickstart is for developers who want to integrate xReserve into their
apps. It helps you write a TypeScript script that deposits USDC into xReserve on
Ethereum Sepolia. Your recipient wallet will receive USDC-backed stablecoins on
the remote blockchain when that network supports automatic settlement.

<Tip>
  Need to transfer USDC from another chain first? Use Arc App Kit's
  [Bridge](https://docs.arc.network/app-kit/bridge) capability to move testnet
  funds to Ethereum Sepolia before making an xReserve deposit.
</Tip>

Select the tab below to view the steps for your blockchain.

<Tabs>
  <Tab title="Aleo">
    <Note>
      This quickstart covers the deposit into xReserve on Ethereum Sepolia. After
      the deposit confirms, Aleo requires you to mint USDCx before it appears in the
      recipient wallet. For details, see the official [Aleo
      documentation](https://developer.aleo.org/guides/introduction/getting_started/)
    </Note>

    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/).

    * Created an Ethereum Sepolia wallet and an Aleo Testnet wallet and funded them
      with testnet tokens.

          <Accordion title="Need a wallet or testnet tokens?">
            * Use a wallet provider such as [MetaMask](https://metamask.io/) for your Ethereum Sepolia wallet.
            * Use [Shield](https://aleo.org/shield/) for your Aleo Testnet wallet.
            * Get Testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
            * Get Testnet ETH from a public [Ethereum Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
          </Accordion>

    * Installed the required dependencies:
      * `viem` - A TypeScript library that interfaces with Ethereum.
      * `@provablehq/sdk` - Official Aleo SDK for address encoding.

    ## Step 1: Set up your project

    This step shows you how to set up a fresh Node.js workspace, install
    dependencies, configure your environment variables, and prepare your Ethereum
    Sepolia wallet.

    ### 1.1. Set up your development environment

    Create a new directory and install dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir xreserve-aleo-usdcx
    cd xreserve-aleo-usdcx
    npm init -y

    # Install tools and dependencies
    npm install viem dotenv @provablehq/sdk
    ```

    ### 1.2. Configure environment variables

    Create a `.env` file in the project directory and add your wallet private key
    and the recipient address on Aleo.

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    ```bash Shell theme={null}
    cat > .env << EOF
    PRIVATE_KEY=<your_ethereum_wallet_private_key>
    ALEO_RECIPIENT=<your_aleo_recipient_testnet_address>
    EOF
    ```

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up your script

    This step shows you how to build the script by importing its dependencies and
    defining the configuration constants and ABI fragments that the script uses.

    ### 2.1. Import dependencies

    Create a file called `index.ts` and add the following code to import the
    dependencies:

    ```typescript index.ts theme={null}
    import "dotenv/config";
    import {
      createWalletClient,
      createPublicClient,
      http,
      parseUnits,
      toHex,
      pad,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";
    import { Address } from "@provablehq/sdk";
    ```

    ### 2.2. Define configuration constants

    Add the following code snippet to your `index.ts` file. It specifies the RPC and
    wallet private key, contract addresses, and Aleo-specific parameters that the
    rest of the script relies on. The `ALEO_RECIPIENT` is loaded from your `.env`
    file.

    <Info>
      You can review the [xReserve EVM
      contracts](https://github.com/circlefin/evm-xreserve-contracts) on GitHub.
    </Info>

    ```typescript index.ts theme={null}
    // ============ Configuration constants ============
    const config = {
      // Public Ethereum Sepolia RPC and your private wallet key
      ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
      PRIVATE_KEY: process.env.PRIVATE_KEY as `0x${string}`,

      // Contract addresses on Ethereum Sepolia testnet
      X_RESERVE_CONTRACT:
        "0x008888878f94C0d87defdf0B07f46B93C1934442" as `0x${string}`,
      SEPOLIA_USDC_CONTRACT:
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,

      // Deposit parameters for Aleo
      ALEO_DOMAIN: 10002, // Aleo domain ID
      ALEO_RECIPIENT: process.env.ALEO_RECIPIENT || "", // Shield wallet address to receive USDCx on Aleo
      DEPOSIT_AMOUNT: "5.00",
      MAX_FEE: "0",
    };
    ```

    ### 2.3. Set up contract ABIs

    Add the following code snippet to your `index.ts` file. It adds xReserve and
    ERC-20 ABI fragments which tell `viem` how to format and send the contract calls
    when the script runs.

    <Info>
      For more background on contract ABIs, see QuickNode's guide, [What is an
      ABI?](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-an-abi).
    </Info>

    ```typescript index.ts theme={null}
    // ============ Contract ABIs ============
    const X_RESERVE_ABI = [
      {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "value", type: "uint256" },
          { name: "remoteDomain", type: "uint32" },
          { name: "remoteRecipient", type: "bytes32" },
          { name: "localToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "hookData", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const;

    const ERC20_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;
    ```

    ## Step 3: Execute the deposit

    This step shows you how to implement the `main()` function which performs the
    deposit of USDC from your Ethereum Sepolia wallet into the xReserve contract.
    The xReserve contract mints an equivalent amount of USDCx on Aleo Testnet and
    sends it to your recipient wallet.

    ### 3.1. Implement the main function

    Add the following code snippet to your `index.ts` file. It implements the
    `main()` function which uses viem to read balances, approve a USDC spend, call
    the xReserve deposit function, and console.log the transaction results.

    Aleo uses bech32m-encoded addresses and little-endian byte ordering for field
    elements. The script uses the Aleo SDK's `Address.toBytesLe()` method to
    properly convert the address to a 32-byte field element, then uses viem
    `toHex()` and `pad()` utilities to format it as a bytes32 hex string. The
    resulting field element is used for both `remoteRecipient` and `hookData`.

    ```typescript index.ts theme={null}
    // ============ Main function ============
    async function main() {
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY must be set in your .env file");
      }

      if (!config.ALEO_RECIPIENT) {
        throw new Error("ALEO_RECIPIENT must be set in your .env file");
      }

      // Set up wallet and wallet provider
      const account = privateKeyToAccount(config.PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      console.log(`Ethereum wallet address: ${account.address}`);

      // Check native ETH balance
      const nativeBalance = await publicClient.getBalance({
        address: account.address,
      });
      console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
          Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
      );
      if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

      // Prepare deposit params (USDC has 6 decimals)
      const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
      const maxFee = parseUnits(config.MAX_FEE, 6);

      // Convert Aleo address to bytes using the Aleo SDK
      const aleoAddress = Address.from_string(config.ALEO_RECIPIENT);
      const fieldElementBytes = aleoAddress.toBytesLe();

      if (fieldElementBytes.length !== 32) {
        throw new Error(
          `Invalid Aleo address: expected 32 bytes, got ${fieldElementBytes.length}`,
        );
      }

      // Use field element bytes (little-endian) for both remoteRecipient and hookData
      const remoteRecipientBytes32 = toHex(
        pad(fieldElementBytes, { size: 32 }),
      ) as `0x${string}`;
      const hookData = remoteRecipientBytes32;

      console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Aleo recipient: ${config.ALEO_RECIPIENT}`,
      );
      console.log(`Aleo field element (little-endian): ${remoteRecipientBytes32}`);

      // Check token balance
      const usdcBalance = await publicClient.readContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
          Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
      );
      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(
            6,
          )} USDC`,
        );
      }

      // Approve xReserve to spend USDC
      const approveTxHash = await client.writeContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.X_RESERVE_CONTRACT, value],
      });
      console.log("Approval tx hash:", approveTxHash);
      console.log("Waiting for approval confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      console.log("✅ Approval confirmed");

      // Deposit transaction
      const depositTxHash = await client.writeContract({
        address: config.X_RESERVE_CONTRACT,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          config.ALEO_DOMAIN,
          remoteRecipientBytes32,
          config.SEPOLIA_USDC_CONTRACT,
          maxFee,
          hookData,
        ],
      });

      console.log("Deposit tx hash:", depositTxHash);
      console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
      );
    }

    // ============ Call the main function ============
    main().catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
    ```

    This step finalizes the transfer, depositing USDC into xReserve on Ethereum
    Sepolia to make USDCx available on Aleo Testnet.

    ### 3.2. Run the script

    Execute the script in your terminal:

    ```bash Shell theme={null}
    npx tsx index.ts
    ```

    ### 3.3. Verify the deposit

    After the script finishes, find the `Deposit tx hash` in the terminal output and
    paste it into [Sepolia Etherscan](https://sepolia.etherscan.io) to confirm your
    deposit transaction was successful.

    After the deposit confirms, Aleo requires you to mint USDCx before it appears in
    the recipient wallet. For details, see the official
    [Aleo documentation](https://developer.aleo.org/guides/introduction/getting_started/).
  </Tab>

  <Tab title="Canton">
    <Note>
      Canton requires additional setup before USDCx can be minted to the recipient
      wallet. For details, see the official
      [Canton documentation](https://docs.digitalasset.com/usdc/xreserve/index.html).
    </Note>

    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/).

    * Created an Ethereum Sepolia wallet and a Canton TestNet wallet and funded them
      with testnet tokens.

          <Accordion title="Need a wallet or testnet tokens?">
            * Use a wallet provider such as [MetaMask](https://metamask.io/) for your Ethereum Sepolia wallet.
            * Use [Console Wallet](https://consolewallet.io/) or [Bron](https://www.canton.network/ecosystem/bron) for your Canton TestNet wallet.
            * Get Testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
            * Get Testnet ETH from a public [Ethereum Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
          </Accordion>

    * Installed the required dependencies:
      * `viem` - A TypeScript library that interfaces with Ethereum.

    ## Step 1: Set up your project

    This step shows you how to set up a fresh Node.js workspace, install
    dependencies, configure your environment variables, and prepare your Ethereum
    Sepolia wallet.

    ### 1.1. Set up your development environment

    Create a new directory and install dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir xreserve-canton-usdcx
    cd xreserve-canton-usdcx
    npm init -y

    # Install tools and dependencies
    npm install viem dotenv
    ```

    ### 1.2. Configure environment variables

    Create a `.env` file in the project directory and add your wallet private key
    and the recipient address on Canton.

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    ```bash Shell theme={null}
    cat > .env << EOF
    PRIVATE_KEY=<your_ethereum_wallet_private_key>
    CANTON_RECIPIENT=<your_canton_recipient_testnet_address>
    EOF
    ```

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up your script

    This step shows you how to build the script by importing its dependencies and
    defining the configuration constants and ABI fragments that the script uses.

    ### 2.1. Import dependencies

    Create a file called `index.ts` and add the following code to import the
    dependencies:

    ```typescript index.ts theme={null}
    import "dotenv/config";
    import {
      createWalletClient,
      createPublicClient,
      http,
      parseUnits,
      keccak256,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";
    ```

    ### 2.2. Define configuration constants

    Add the following code snippet to your `index.ts` file. It specifies the RPC and
    wallet private key, contract addresses, and Canton-specific parameters that the
    rest of the script relies on. The `CANTON_RECIPIENT` is loaded from your `.env`
    file.

    <Info>
      You can review the [xReserve EVM
      contracts](https://github.com/circlefin/evm-xreserve-contracts) on GitHub.
    </Info>

    ```typescript index.ts theme={null}
    // ============ Configuration constants ============
    const config = {
      // Public Ethereum Sepolia RPC and your private wallet key
      ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
      PRIVATE_KEY: process.env.PRIVATE_KEY as `0x${string}`,

      // Contract addresses on Ethereum Sepolia testnet
      X_RESERVE_CONTRACT:
        "0x008888878f94C0d87defdf0B07f46B93C1934442" as `0x${string}`,
      SEPOLIA_USDC_CONTRACT:
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,

      // Deposit parameters for Canton
      CANTON_DOMAIN: 10001, // Canton domain ID
      CANTON_RECIPIENT: process.env.CANTON_RECIPIENT || "", // Address to receive USDCx on Canton
      DEPOSIT_AMOUNT: "5.00",
      MAX_FEE: "0",
    };
    ```

    ### 2.3. Set up contract ABIs

    Add the following code snippet to your `index.ts` file. It adds xReserve and
    ERC-20 ABI fragments which tell `viem` how to format and send the contract calls
    when the script runs.

    <Info>
      For more background on contract ABIs, see QuickNode's guide, [What is an
      ABI?](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-an-abi).
    </Info>

    ```typescript index.ts theme={null}
    // ============ Contract ABIs ============
    const X_RESERVE_ABI = [
      {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "value", type: "uint256" },
          { name: "remoteDomain", type: "uint32" },
          { name: "remoteRecipient", type: "bytes32" },
          { name: "localToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "hookData", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const;

    const ERC20_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;
    ```

    ## Step 3: Execute the xReserve deposit

    This step shows you how to implement the main logic that checks balances,
    approves USDC, and calls xReserve on Ethereum Sepolia so Canton TestNet can mint
    the corresponding USDCx.

    ### 3.1. Add the main function

    Add the following code snippet to your `index.ts` file. This code flows through
    the following actions:

    * Verifies that `PRIVATE_KEY` is present before continuing.
    * Creates an Ethereum Sepolia wallet client and logs the originating address.
    * Checks native ETH balance to ensure there is enough gas for transactions.
    * Computes the deposit value, maximum fee, and recipient payload (USDC uses 6
      decimals).
    * Confirms that the wallet's USDC balance covers the configured deposit amount.
    * Approves the xReserve smart contract to spend USDC on the wallet's behalf.
    * Calls `depositToRemote` to submit the deposit and tell Canton to mint USDCx
      for the wallet specified as the `CANTON_RECIPIENT`.

    Canton uses a keccak256 hash of the recipient address for the `remoteRecipient`
    parameter. The original address is encoded as hex for `hookData`.

    ```typescript index.ts theme={null}
    // ============ Main function ============
    async function main() {
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY must be set in your .env file");
      }

      if (!config.CANTON_RECIPIENT) {
        throw new Error("CANTON_RECIPIENT must be set in your .env file");
      }

      // Set up wallet and wallet provider
      const account = privateKeyToAccount(config.PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      console.log(`Ethereum wallet address: ${account.address}`);

      // Check native ETH balance
      const nativeBalance = await publicClient.getBalance({
        address: account.address,
      });
      console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
          Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
      );
      if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

      // Prepare deposit params (USDC has 6 decimals)
      const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
      const maxFee = parseUnits(config.MAX_FEE, 6);
      const encoder = new TextEncoder();
      const recipientBytes = encoder.encode(config.CANTON_RECIPIENT);
      const remoteRecipientBytes32 = keccak256(recipientBytes);
      const hookData = ("0x" +
        Buffer.from(recipientBytes).toString("hex")) as `0x${string}`;

      console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Canton recipient: ${config.CANTON_RECIPIENT}`,
      );

      // Check token balance
      const usdcBalance = await publicClient.readContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
          Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
      );
      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(
            6,
          )} USDC`,
        );
      }

      // Approve xReserve to spend USDC
      const approveTxHash = await client.writeContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.X_RESERVE_CONTRACT, value],
      });
      console.log("Approval tx hash:", approveTxHash);
      console.log("Waiting for approval confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      console.log("✅ Approval confirmed");

      // Deposit transaction
      const depositTxHash = await client.writeContract({
        address: config.X_RESERVE_CONTRACT,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          config.CANTON_DOMAIN,
          remoteRecipientBytes32,
          config.SEPOLIA_USDC_CONTRACT,
          maxFee,
          hookData,
        ],
      });

      console.log("Deposit tx hash:", depositTxHash);
      console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
      );
    }

    // ============ Call the main function ============
    main().catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
    ```

    This step finalizes the transfer, depositing USDC into xReserve on Ethereum
    Sepolia to make USDCx available on Canton TestNet.

    ### 3.2. Run the script

    Execute the script in your terminal:

    ```bash Terminal theme={null}
    npx tsx index.ts
    ```

    ### 3.3. Verify the deposit

    After the script finishes, find the `Deposit tx hash` in the terminal output and
    paste it into [Sepolia Etherscan](https://sepolia.etherscan.io) to confirm your
    deposit transaction was successful.

    If you've completed the required Canton setup, the recipient wallet will receive
    the minted testnet USDCx . For details, see the official
    [Canton documentation](https://docs.digitalasset.com/usdc/xreserve/index.html).
  </Tab>

  <Tab title="Cardano">
    ## Prerequisites

    Before you begin, ensure you've:

    * Installed [Node.js v22+](https://nodejs.org/).

    * Created an Ethereum Sepolia wallet and a Cardano Preprod wallet and funded
      them with testnet tokens.

          <Accordion title="Need a wallet or testnet tokens?">
            * Use a wallet provider such as [MetaMask](https://metamask.io/) for your Ethereum Sepolia wallet.
            * Use [Eternl](https://eternl.io/) or [Lace](https://www.lace.io/) for your Cardano Preprod wallet.
            * Get Testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
            * Get Testnet ETH from a public [Ethereum Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
          </Accordion>

    * Installed the required dependencies:
      * `viem` - A TypeScript library that interfaces with Ethereum.
      * `@scure/base` - For bech32 decoding of Cardano addresses.

    ## Step 1: Set up your project

    This step shows you how to set up a fresh Node.js workspace, install
    dependencies, configure your environment variables, and prepare your Ethereum
    Sepolia wallet.

    ### 1.1. Set up your development environment

    Create a new directory and install dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir xreserve-cardano-usdcx
    cd xreserve-cardano-usdcx
    npm init -y

    # Install tools and dependencies
    npm install viem dotenv @scure/base
    ```

    ### 1.2. Configure environment variables

    Create a `.env` file in the project directory and add your wallet private key
    and the recipient address on Cardano Preprod. Use a valid Cardano bech32
    address.

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    ```bash Shell theme={null}
    cat > .env << EOF
    PRIVATE_KEY=<your_ethereum_wallet_private_key>
    CARDANO_RECIPIENT=<your_cardano_preprod_recipient_address>
    EOF
    ```

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up your script

    This step shows you how to build the script by importing its dependencies and
    defining the configuration constants and ABI fragments that the script uses.

    ### 2.1. Import dependencies

    Create a file called `index.ts` and add the following code to import the
    dependencies:

    ```typescript index.ts theme={null}
    import "dotenv/config";
    import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";
    import { bech32 } from "@scure/base";
    ```

    ### 2.2. Define configuration constants

    Add the following code snippet to your `index.ts` file. It specifies the RPC and
    wallet private key, contract addresses, and Cardano-specific parameters that the
    rest of the script relies on. The `CARDANO_RECIPIENT` is loaded from your `.env`
    file.

    <Info>
      You can review the [xReserve EVM
      contracts](https://github.com/circlefin/evm-xreserve-contracts) on GitHub.
    </Info>

    ```typescript index.ts theme={null}
    // ============ Configuration constants ============
    const config = {
      // Public Ethereum Sepolia RPC and your private wallet key
      ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
      PRIVATE_KEY: process.env.PRIVATE_KEY as `0x${string}`,

      // Contract addresses on Ethereum Sepolia testnet
      X_RESERVE_CONTRACT:
        "0x008888878f94C0d87defdf0B07f46B93C1934442" as `0x${string}`,
      SEPOLIA_USDC_CONTRACT:
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,

      // Deposit parameters for Cardano Preprod (works on testnet and mainnet)
      CARDANO_DOMAIN: 10004, // Cardano domain ID
      CARDANO_RECIPIENT: process.env.CARDANO_RECIPIENT || "", // Address to receive USDCx on Cardano Preprod
      DEPOSIT_AMOUNT: "20.00",
      MAX_FEE: "10.00",
    };
    ```

    ### 2.3. Set up contract ABIs

    Add the following code snippet to your `index.ts` file. It adds xReserve and
    ERC-20 ABI fragments which tell `viem` how to format and send the contract calls
    when the script runs.

    <Info>
      For more background on contract ABIs, see QuickNode's guide, [What is an
      ABI?](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-an-abi).
    </Info>

    ```typescript index.ts theme={null}
    // ============ Contract ABIs ============
    const X_RESERVE_ABI = [
      {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "value", type: "uint256" },
          { name: "remoteDomain", type: "uint32" },
          { name: "remoteRecipient", type: "bytes32" },
          { name: "localToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "hookData", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const;

    const ERC20_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;
    ```

    ## Step 3: Execute the xReserve deposit

    This step shows you how to implement the main logic that checks balances,
    approves USDC, and calls xReserve on Ethereum Sepolia so Cardano Preprod can
    mint the corresponding USDCx.

    ### 3.1. Add the main function

    Add the following code snippet to your `index.ts` file. This code:

    * Verifies that `PRIVATE_KEY` and `CARDANO_RECIPIENT` are set.
    * Creates an Ethereum Sepolia wallet client and logs the originating address.
    * Checks native ETH balance for gas.
    * Computes the deposit value, maximum fee, and recipient payload (USDC uses 6
      decimals).
    * Confirms the wallet's USDC balance covers the deposit amount.
    * Approves the xReserve contract to spend USDC.
    * Calls `depositToRemote` to submit the deposit so Cardano Preprod mints USDCx
      for the `CARDANO_RECIPIENT` address.

    The `parseCardanoAddress` helper validates the address type and builds
    `remoteRecipient` and `hookData` for `depositToRemote`. Base addresses use the
    staking credential in `hookData` so USDCx arrives at the exact wallet address.
    Enterprise addresses use empty `hookData`.

    ```typescript index.ts theme={null}
    // ============ Parse Cardano address (remoteRecipient + hookData) ============
    const CREDENTIAL_TAG = {
      KEY_HASH: "0x00000001",
      SCRIPT_HASH: "0x00000002",
    } as const;

    const SUPPORTED_ADDRESS_TYPES = {
      BASE: [0, 1, 2, 3], // Base addresses: payment + staking credentials
      ENTERPRISE: [6, 7], // Enterprise addresses: payment credential only
    };

    function parseCardanoAddress(cardanoAddress: string): {
      remoteRecipient: `0x${string}`;
      hookData: `0x${string}`;
    } {
      const decoded = bech32.decode(cardanoAddress, 1000);
      const bytes = bech32.fromWords(decoded.words);
      const headerByte = bytes[0];
      const addressType = headerByte >> 4;

      const allSupported = [
        ...SUPPORTED_ADDRESS_TYPES.BASE,
        ...SUPPORTED_ADDRESS_TYPES.ENTERPRISE,
      ];
      if (!allSupported.includes(addressType)) {
        throw new Error(
          `Unsupported Cardano address type ${addressType}. ` +
            `Use a Base (addr1q...) or Enterprise (addr1v...) address.`,
        );
      }

      // remoteRecipient: [4-byte tag][28-byte payment credential]
      const isScriptPayment = (addressType & 1) === 1;
      const tag = isScriptPayment
        ? CREDENTIAL_TAG.SCRIPT_HASH
        : CREDENTIAL_TAG.KEY_HASH;
      const paymentCredential = bytes.slice(1, 29);
      const credentialHex = Array.from(paymentCredential)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const remoteRecipient = `${tag}${credentialHex}` as `0x${string}`;

      // hookData: empty for Enterprise, 95 bytes for Base
      if (SUPPORTED_ADDRESS_TYPES.ENTERPRISE.includes(addressType)) {
        return { remoteRecipient, hookData: "0x" as `0x${string}` };
      }

      // Base address: extract staking credential
      if (bytes.length < 57) {
        throw new Error("Malformed Base address: expected 57 bytes");
      }

      const stakingCredential = bytes.slice(29, 57);
      const isStakingScript = (addressType & 2) === 2;
      const stakingTag = isStakingScript ? "02" : "01";

      // hookData layout (95 bytes):
      // txHash(32) + txIdx(1) + datumTag(1) + datum(32) + stakingTag(1) + stakingCred(28)
      const stakingHex = Array.from(stakingCredential)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const hookData =
        `0x${"00".repeat(66)}${stakingTag}${stakingHex}` as `0x${string}`;

      return { remoteRecipient, hookData };
    }

    // ============ Main function ============
    async function main() {
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY must be set in your .env file");
      }

      if (!config.CARDANO_RECIPIENT) {
        throw new Error("CARDANO_RECIPIENT must be set in your .env file");
      }

      const account = privateKeyToAccount(config.PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      console.log(`Ethereum wallet address: ${account.address}`);

      const nativeBalance = await publicClient.getBalance({
        address: account.address,
      });
      console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
          Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
      );
      if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

      const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
      const maxFee = parseUnits(config.MAX_FEE, 6);
      const { remoteRecipient, hookData } = parseCardanoAddress(
        config.CARDANO_RECIPIENT,
      );

      console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Cardano recipient: ${config.CARDANO_RECIPIENT}`,
      );

      const usdcBalance = await publicClient.readContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
          Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
      );
      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(
            6,
          )} USDC`,
        );
      }

      const approveTxHash = await client.writeContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.X_RESERVE_CONTRACT, value],
      });
      console.log("Approval tx hash:", approveTxHash);
      console.log("Waiting for approval confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      console.log("✅ Approval confirmed");

      const depositTxHash = await client.writeContract({
        address: config.X_RESERVE_CONTRACT,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          config.CARDANO_DOMAIN,
          remoteRecipient,
          config.SEPOLIA_USDC_CONTRACT,
          maxFee,
          hookData,
        ],
      });

      console.log("Deposit tx hash:", depositTxHash);
      console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
      );
    }

    main().catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
    ```

    ### 3.2. Run the script

    Execute the script in your terminal:

    ```bash Terminal theme={null}
    npx tsx index.ts
    ```

    ### 3.3. Verify the deposit

    After the script finishes, find the `Deposit tx hash` in the terminal output and
    paste it into [Sepolia Etherscan](https://sepolia.etherscan.io) to confirm your
    deposit transaction. The recipient wallet on Cardano Preprod will receive the
    minted USDCx. You can verify the token on
    [Preprod CardanoScan](https://preprod.cardanoscan.io/).
  </Tab>

  <Tab title="Movement">
    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/).

    * Created an Ethereum Sepolia wallet and a Movement Bardock wallet and funded
      them with testnet tokens.

          <Accordion title="Need a wallet or testnet tokens?">
            * Use a wallet provider such as [MetaMask](https://metamask.io/) for your Ethereum Sepolia wallet.
            * Use a wallet provider such as [Nightly](https://nightly.app/) for your Movement Bardock wallet.
            * Get Testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
            * Get Testnet ETH from a public [Ethereum Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
          </Accordion>

    * Installed the required dependencies:
      * `viem` - A TypeScript library that interfaces with Ethereum.

    ## Step 1: Set up your project

    This step shows you how to set up a fresh Node.js workspace, install
    dependencies, configure your environment variables, and prepare your Ethereum
    Sepolia wallet.

    ### 1.1. Set up your development environment

    Create a new directory and install dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir xreserve-movement-usdcx
    cd xreserve-movement-usdcx
    npm init -y

    # Install tools and dependencies
    npm install viem dotenv
    ```

    ### 1.2. Configure environment variables

    Create a `.env` file in the project directory and add your wallet private key
    and the recipient account address on Movement Bardock.

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    ```bash Shell theme={null}
    cat > .env << EOF
    PRIVATE_KEY=<your_ethereum_wallet_private_key>
    MOVEMENT_RECIPIENT=<your_movement_testnet_account_address>
    EOF
    ```

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up your script

    This step shows you how to build the script by importing its dependencies and
    defining the configuration constants and ABI fragments that the script uses.

    ### 2.1. Import dependencies

    Create a file called `index.ts` and add the following code to import the
    dependencies:

    ```typescript index.ts theme={null}
    import "dotenv/config";
    import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";
    ```

    ### 2.2. Define configuration constants

    Add the following code snippet to your `index.ts` file. It specifies the RPC and
    wallet private key, contract addresses, and Movement-specific values. The
    `MOVEMENT_RECIPIENT` is loaded from your `.env` file.

    <Info>
      You can review the [xReserve EVM
      contracts](https://github.com/circlefin/evm-xreserve-contracts) on GitHub.
    </Info>

    ```typescript index.ts theme={null}
    // ============ Configuration constants ============
    const config = {
      // Public Ethereum Sepolia RPC and your private wallet key
      ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
      PRIVATE_KEY: process.env.PRIVATE_KEY as `0x${string}`,

      // Contract addresses on Ethereum Sepolia testnet
      X_RESERVE_CONTRACT:
        "0x008888878f94C0d87defdf0B07f46B93C1934442" as `0x${string}`,
      SEPOLIA_USDC_CONTRACT:
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,

      // Deposit parameters for Movement
      MOVEMENT_DOMAIN: 10005, // Movement domain ID
      MOVEMENT_RECIPIENT: process.env.MOVEMENT_RECIPIENT || "", // Account to receive USDCx on Movement
      DEPOSIT_AMOUNT: "5.00",
      MAX_FEE: "0",
    };
    ```

    ### 2.3. Set up contract ABIs

    Add the following code snippet to your `index.ts` file. It adds xReserve and
    ERC-20 ABI fragments which tell `viem` how to format and send the contract calls
    when the script runs.

    <Info>
      For more background on contract ABIs, see QuickNode's guide, [What is an
      ABI?](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-an-abi).
    </Info>

    ```typescript index.ts theme={null}
    // ============ Contract ABIs ============
    const X_RESERVE_ABI = [
      {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "value", type: "uint256" },
          { name: "remoteDomain", type: "uint32" },
          { name: "remoteRecipient", type: "bytes32" },
          { name: "localToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "hookData", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const;

    const ERC20_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;
    ```

    ## Step 3: Execute the xReserve deposit

    This step shows you how to implement the main logic that checks balances,
    approves USDC, and calls xReserve on Ethereum Sepolia so Movement Bardock can
    mint the corresponding USDCx.

    ### 3.1. Add the main function

    Add the following code to your `index.ts` file. It defines the `main` function,
    which does the following:

    * Validates `PRIVATE_KEY` and `MOVEMENT_RECIPIENT`.
    * Verifies you have enough Sepolia ETH (gas) and USDC for the deposit.
    * Approves the xReserve contract, then calls `depositToRemote` with your
      Movement account.

    ```typescript index.ts theme={null}
    // ============ Main function ============
    async function main() {
      // Require Ethereum private key and Movement recipient (32-byte hex account)
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY must be set in your .env file");
      }

      if (!config.MOVEMENT_RECIPIENT) {
        throw new Error("MOVEMENT_RECIPIENT must be set in your .env file");
      }

      // Movement accounts are already bytes32-sized hex; only normalize optional 0x prefix
      const remoteRecipient = (
        config.MOVEMENT_RECIPIENT.startsWith("0x")
          ? config.MOVEMENT_RECIPIENT
          : `0x${config.MOVEMENT_RECIPIENT}`
      ) as `0x${string}`;
      // Pass empty bytes (hookData is not used for Movement)
      const hookData = "0x" as `0x${string}`;

      // Set up wallet and wallet provider
      const account = privateKeyToAccount(config.PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      console.log(`Ethereum wallet address: ${account.address}`);

      // Check native ETH balance
      const nativeBalance = await publicClient.getBalance({
        address: account.address,
      });
      console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
          Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
      );
      if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

      const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
      const maxFee = parseUnits(config.MAX_FEE, 6);

      console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Movement recipient: ${config.MOVEMENT_RECIPIENT}`,
      );

      const usdcBalance = await publicClient.readContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
          Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
      );
      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(
            6,
          )} USDC`,
        );
      }

      const approveTxHash = await client.writeContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.X_RESERVE_CONTRACT, value],
      });
      console.log("Approval tx hash:", approveTxHash);
      console.log("Waiting for approval confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      console.log("✅ Approval confirmed");

      const depositTxHash = await client.writeContract({
        address: config.X_RESERVE_CONTRACT,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          config.MOVEMENT_DOMAIN,
          remoteRecipient,
          config.SEPOLIA_USDC_CONTRACT,
          maxFee,
          hookData,
        ],
      });

      console.log("Deposit tx hash:", depositTxHash);
      console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
      );
    }

    // ============ Call the main function ============
    main().catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
    ```

    This step finalizes the transfer, depositing USDC into xReserve on Ethereum
    Sepolia to make USDCx available on Movement Bardock.

    ### 3.2. Run the script

    Execute the script in your terminal:

    ```bash Shell theme={null}
    npx tsx index.ts
    ```

    ### 3.3. Verify the deposit

    After the script finishes, find the `Deposit tx hash` in the terminal output and
    paste it into [Sepolia Etherscan](https://sepolia.etherscan.io) to confirm your
    deposit transaction was successful. On Movement Bardock, the recipient account
    will receive the minted testnet USDCx.
  </Tab>

  <Tab title="Stacks">
    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/).

    * Created an Ethereum Sepolia wallet and a Stacks Testnet wallet and funded them
      with testnet tokens.

          <Accordion title="Need a wallet or testnet tokens?">
            * Use a wallet provider such as [MetaMask](https://metamask.io/) for your Ethereum Sepolia wallet.
            * Use [Leather Wallet](https://leather.io/) or [Xverse](https://www.xverse.app/) for your Stacks Testnet wallet.
            * Get Testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
            * Get Testnet ETH from a public [Ethereum Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
          </Accordion>

    * Installed the required dependencies:
      * `viem` - A TypeScript library that interfaces with Ethereum.
      * `@stacks/transactions` - A JavaScript library for Stacks address creation
        and transaction handling.
      * `micro-packed` - A library for encoding Stacks addresses to bytes32 format.

    ## Step 1: Set up your project

    This step shows you how to set up a fresh Node.js workspace, install
    dependencies, configure your environment variables, and prepare your Ethereum
    Sepolia wallet.

    ### 1.1. Set up your development environment

    Create a new directory and install dependencies:

    ```bash Shell theme={null}
    # Set up your directory and initialize the project
    mkdir xreserve-stacks-usdcx
    cd xreserve-stacks-usdcx
    npm init -y

    # Install tools and dependencies
    npm install viem dotenv @stacks/transactions micro-packed @scure/base
    ```

    ### 1.2. Configure environment variables

    Create a `.env` file in the project directory and add your wallet private key
    and the recipient address on Stacks.

    <Info>
      If you use MetaMask, follow their guide for how to [find and export your
      private
      key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
    </Info>

    ```bash Shell theme={null}
    cat > .env << EOF
    PRIVATE_KEY=<your_ethereum_wallet_private_key>
    STACKS_RECIPIENT=<your_stacks_recipient_testnet_address>
    EOF
    ```

    <Warning>
      This example uses one or more private keys for local testing. In production,
      use a secure key management solution and never expose or share private keys.
    </Warning>

    ## Step 2: Set up your script

    This step shows you how to build the script by importing its dependencies and
    defining the configuration constants and ABI fragments that the script uses.

    ### 2.1. Create helpers

    Create a `helpers.ts` file and add the following code to it. This code encodes
    Stacks addresses into the bytes32 format required by xReserve:

    ```typescript helpers.ts theme={null}
    import * as P from "micro-packed";
    import {
      createAddress,
      addressToString,
      AddressVersion,
      StacksWireType,
    } from "@stacks/transactions";
    import { hex } from "@scure/base";
    import { type Hex, pad, toHex } from "viem";

    export const remoteRecipientCoder = P.wrap<string>({
      encodeStream(w, value: string) {
        const address = createAddress(value);
        // Left pad with 11 zero bytes
        P.bytes(11).encodeStream(w, new Uint8Array(11).fill(0));
        // 1 version byte
        P.U8.encodeStream(w, address.version);
        // 20 hash bytes
        P.bytes(20).encodeStream(w, hex.decode(address.hash160));
      },
      decodeStream(r) {
        // Left pad (11 bytes)
        P.bytes(11).decodeStream(r);
        // 1 version byte
        const version = P.U8.decodeStream(r);
        // 20 hash bytes
        const hash = P.bytes(20).decodeStream(r);
        return addressToString({
          hash160: hex.encode(hash),
          version: version as AddressVersion,
          type: StacksWireType.Address,
        });
      },
    });

    export function bytes32FromBytes(bytes: Uint8Array): Hex {
      return toHex(pad(bytes, { size: 32 }));
    }
    ```

    ### 2.2. Import dependencies

    Create a file called `index.ts` and add the following code to import the
    dependencies:

    ```typescript index.ts theme={null}
    import "dotenv/config";
    import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";
    import { bytes32FromBytes, remoteRecipientCoder } from "./helpers";
    ```

    ### 2.3. Define configuration constants

    Add the following code snippet to your `index.ts` file. It specifies the RPC and
    wallet private key, contract addresses, and Stacks-specific parameters that the
    rest of the script relies on. The `STACKS_RECIPIENT` is loaded from your `.env`
    file.

    <Info>
      You can review the [xReserve EVM
      contracts](https://github.com/circlefin/evm-xreserve-contracts) on GitHub.
    </Info>

    ```typescript index.ts theme={null}
    // ============ Configuration constants ============
    const config = {
      // Public Ethereum Sepolia RPC and your private wallet key
      ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
      PRIVATE_KEY: process.env.PRIVATE_KEY as `0x${string}`,

      // Contract addresses on Ethereum Sepolia testnet
      X_RESERVE_CONTRACT:
        "0x008888878f94C0d87defdf0B07f46B93C1934442" as `0x${string}`,
      SEPOLIA_USDC_CONTRACT:
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,

      // Deposit parameters for Stacks
      STACKS_DOMAIN: 10003, // Stacks domain ID
      STACKS_RECIPIENT: process.env.STACKS_RECIPIENT || "", // Address to receive USDCx on Stacks
      DEPOSIT_AMOUNT: "5.00",
      MAX_FEE: "0",
    };
    ```

    ### 2.4. Set up contract ABIs

    Add the following code snippet to your `index.ts` file. It adds xReserve and
    ERC-20 ABI fragments which tell `viem` how to format and send the contract calls
    when the script runs.

    <Info>
      For more background on contract ABIs, see QuickNode's guide, [What is an
      ABI?](https://www.quicknode.com/guides/ethereum-development/smart-contracts/what-is-an-abi).
    </Info>

    ```typescript index.ts theme={null}
    // ============ Contract ABIs ============
    const X_RESERVE_ABI = [
      {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "value", type: "uint256" },
          { name: "remoteDomain", type: "uint32" },
          { name: "remoteRecipient", type: "bytes32" },
          { name: "localToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "hookData", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const;

    const ERC20_ABI = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;
    ```

    ## Step 3: Execute the xReserve deposit

    This step shows you how to implement the main logic that checks balances,
    approves USDC, and calls xReserve on Ethereum Sepolia so Stacks can mint the
    corresponding USDCx.

    ### 3.1. Add the main function

    Add the following code snippet to your `index.ts` file. This code flows through
    the following actions:

    * Verifies that `PRIVATE_KEY` is present before continuing.
    * Creates an Ethereum Sepolia wallet client and logs the originating address.
    * Checks native ETH balance to ensure there is enough gas for transactions.
    * Computes the deposit value, maximum fee, and recipient payload (USDC uses 6
      decimals).
    * Confirms that the wallet's USDC balance covers the configured deposit amount.
    * Approves the xReserve smart contract to spend USDC on the wallet's behalf.
    * Calls `depositToRemote` to submit the deposit and tell Stacks to mint USDCx
      for the wallet specified as the `STACKS_RECIPIENT`.

    Stacks uses the micro-packed library to encode the Stacks address into bytes32
    format for the `remoteRecipient` parameter. The original address is encoded as
    hex for `hookData`.

    ```typescript index.ts theme={null}
    // ============ Main function ============
    async function main() {
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY must be set in your .env file");
      }

      if (!config.STACKS_RECIPIENT) {
        throw new Error("STACKS_RECIPIENT must be set in your .env file");
      }

      // Set up wallet and wallet provider
      const account = privateKeyToAccount(config.PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
      });

      console.log(`Ethereum wallet address: ${account.address}`);

      // Check native ETH balance
      const nativeBalance = await publicClient.getBalance({
        address: account.address,
      });
      console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
          Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
      );
      if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

      // Prepare deposit params (USDC has 6 decimals)
      const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
      const maxFee = parseUnits(config.MAX_FEE, 6);
      const encoder = new TextEncoder();
      const recipientBytes = encoder.encode(config.STACKS_RECIPIENT);
      const remoteRecipient = bytes32FromBytes(
        remoteRecipientCoder.encode(config.STACKS_RECIPIENT),
      );
      const hookData = ("0x" +
        Buffer.from(recipientBytes).toString("hex")) as `0x${string}`;

      console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Stacks recipient: ${config.STACKS_RECIPIENT}`,
      );

      // Check token balance
      const usdcBalance = await publicClient.readContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
          Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
      );
      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(
            6,
          )} USDC`,
        );
      }

      // Approve xReserve to spend USDC
      const approveTxHash = await client.writeContract({
        address: config.SEPOLIA_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.X_RESERVE_CONTRACT, value],
      });
      console.log("Approval tx hash:", approveTxHash);
      console.log("Waiting for approval confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      console.log("✅ Approval confirmed");

      // Deposit transaction
      const depositTxHash = await client.writeContract({
        address: config.X_RESERVE_CONTRACT,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          value,
          config.STACKS_DOMAIN,
          remoteRecipient,
          config.SEPOLIA_USDC_CONTRACT,
          maxFee,
          hookData,
        ],
      });

      console.log("Deposit tx hash:", depositTxHash);
      console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
      );
    }

    // ============ Call the main function ============
    main().catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
    ```

    This step finalizes the transfer, depositing USDC into xReserve on Ethereum
    Sepolia to make USDCx available on Stacks Testnet.

    ### 3.2. Run the script

    Execute the script in your terminal:

    ```bash Shell theme={null}
    npx tsx index.ts
    ```

    ### 3.3. Verify the deposit

    After the script finishes, find the `Deposit tx hash` in the terminal output and
    paste it into [Sepolia Etherscan](https://sepolia.etherscan.io) to confirm your
    deposit transaction was successful. On Stacks Testnet, the recipient wallet will
    receive the minted testnet USDCx.
  </Tab>
</Tabs>
