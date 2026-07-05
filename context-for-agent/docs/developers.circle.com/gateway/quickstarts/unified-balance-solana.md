> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Create and Transfer a Unified USDC Balance on Solana

> Create and transfer a unified USDC balance on Solana using Circle Gateway.

This guide walks you through the process of creating Unified Crosschain USDC
Balances on Solana using Circle Gateway, and performing transfers from EVM to
Solana and from Solana to Solana.

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
    * Created a Solana Devnet
      [Developer-Controlled Wallet](/wallets/dev-controlled/create-your-first-wallet)
    * Funded your wallet with testnet tokens:
      * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/).
      * Get test native tokens from the
        [Console Faucet](https://console.circle.com/faucet).

    If you want to try the EVM to Solana transfer, ensure that you've:

    * Created EVM Developer-Controlled Wallets on the source chains you want to test
    * Created a Solana Devnet Developer-Controlled Wallet to receive the minted USDC
    * Completed the
      [deposit flow](/gateway/quickstarts/unified-balance-evm#step-3-deposit-into-a-unified-crosschain-balance-circle-wallets)
      from the
      [EVM quickstart](/gateway/quickstarts/unified-balance-evm#circle-wallets)
      first

    ### Add testnet funds to your wallet

    To interact with Gateway, you need test USDC and native tokens in your wallet on
    each chain you deposit from. You also need SOL on the destination wallet to
    create the recipient Associated Token Account and call the Gateway Minter
    program.

    <Tip>
      You can skip the SOL requirement on the destination wallet by using the
      [Forwarding Service](/gateway/howtos/forwarding-service), which handles ATA
      creation and minting automatically.
    </Tip>

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
    mkdir unified-gateway-balance-solana-circle-wallets
    cd unified-gateway-balance-solana-circle-wallets
    npm init -y

    # Set up module type and run scripts
    npm pkg set type=module
    npm pkg set scripts.deposit="tsx --env-file=.env deposit.ts"
    npm pkg set scripts.balances="tsx --env-file=.env balances.ts"
    npm pkg set scripts.transfer-from-sol="tsx --env-file=.env transfer-from-sol.ts"
    npm pkg set scripts.transfer-from-evm="tsx --env-file=.env transfer-from-evm.ts --"

    # Pin bigint-buffer to a patched version
    npm pkg set overrides.bigint-buffer=npm:@trufflesuite/bigint-buffer@1.1.10

    # Install runtime dependencies
    npm install @circle-fin/developer-controlled-wallets @coral-xyz/anchor @solana/buffer-layout @solana/spl-token @solana/web3.js bs58 bn.js tsx typescript

    # Install dev dependencies
    npm install --save-dev @types/node @types/bn.js
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
    * `RECIPIENT_ADDRESS` is the destination wallet that receives the minted USDC.

    For `transfer-from-sol.ts`, both values are Solana addresses.

    For `transfer-from-evm.ts`, `DEPOSITOR_ADDRESS` is an EVM address and
    `RECIPIENT_ADDRESS` is a Solana address.

    <Tip>
      Open `.env` in your editor rather than writing values with shell commands, and
      add `.env` to your `.gitignore`. This prevents credentials from leaking into
      your shell history or version control.
    </Tip>

    ## Step 2. Set up the configuration file

    The shared Solana configuration and helpers are used by the deposit and transfer
    scripts.

    ### 2.1. Create the configuration file

    ```shell theme={null}
    touch config.ts
    ```

    ### 2.2. Configure Solana settings and Gateway helpers

    Add the shared Solana RPC configuration, Gateway addresses, IDLs, attestation
    decoding helpers, and Circle Wallets signing helpers to `config.ts`.

    The local IDL fragments in this example are only the subset needed by the sample
    code. For canonical static instruction and account definitions, use the onchain
    IDLs linked from
    [Solana Programs and Interfaces](/gateway/references/solana-programs#account-structures).

    ```ts config.ts expandable theme={null}
    import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
    import { Connection, PublicKey, Transaction } from "@solana/web3.js";
    import {
      u32be,
      nu64be,
      struct,
      seq,
      blob,
      offset,
      Layout,
    } from "@solana/buffer-layout";
    import bs58 from "bs58";

    export const RPC_ENDPOINT = "https://api.devnet.solana.com";
    export const SOLANA_DOMAIN = 5;
    export const SOLANA_ZERO_ADDRESS = "11111111111111111111111111111111";

    export const GATEWAY_WALLET_ADDRESS =
      "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
    export const GATEWAY_MINTER_ADDRESS =
      "GATEmKK2ECL1brEngQZWCgMWPbvrEYqsV6u29dAaHavr";
    export const USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

    const API_KEY = process.env.CIRCLE_API_KEY!;
    const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET!;

    if (!API_KEY || !ENTITY_SECRET) {
      console.error(
        "Missing required env vars: CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET",
      );
      process.exit(1);
    }

    export const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    export class PublicKeyLayout extends Layout<PublicKey> {
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

    export const publicKey = (property: string) => new PublicKeyLayout(property);

    const MintAttestationElementLayout = struct([
      publicKey("destinationToken"),
      publicKey("destinationRecipient"),
      nu64be("value"),
      blob(32, "transferSpecHash"),
      u32be("hookDataLength"),
      blob(offset(u32be(), -4), "hookData"),
    ] as any);

    const MintAttestationSetLayout = struct([
      u32be("magic"),
      u32be("version"),
      u32be("destinationDomain"),
      publicKey("destinationContract"),
      publicKey("destinationCaller"),
      nu64be("maxBlockHeight"),
      u32be("numAttestations"),
      seq(MintAttestationElementLayout, offset(u32be(), -4), "attestations"),
    ] as any);

    // Sample-local IDL subset for this example.
    export const gatewayWalletIdl = {
      address: GATEWAY_WALLET_ADDRESS,
      metadata: {
        name: "gatewayWallet",
        version: "0.1.0",
        spec: "0.1.0",
      },
      instructions: [
        {
          name: "deposit",
          discriminator: [22, 0],
          accounts: [
            { name: "payer", writable: true, signer: true },
            { name: "owner", signer: true },
            { name: "gatewayWallet" },
            { name: "ownerTokenAccount", writable: true },
            { name: "custodyTokenAccount", writable: true },
            { name: "deposit", writable: true },
            { name: "depositorDenylist" },
            { name: "tokenProgram" },
            { name: "systemProgram" },
            { name: "eventAuthority" },
            { name: "program" },
          ],
          args: [{ name: "amount", type: "u64" }],
        },
      ],
    };

    // Sample-local IDL subset for this example.
    export const gatewayMinterIdl = {
      address: GATEWAY_MINTER_ADDRESS,
      metadata: { name: "gatewayMinter", version: "0.1.0", spec: "0.1.0" },
      instructions: [
        {
          name: "gatewayMint",
          discriminator: [12, 0],
          accounts: [
            { name: "payer", writable: true, signer: true },
            { name: "destinationCaller", signer: true },
            { name: "gatewayMinter" },
            { name: "systemProgram" },
            { name: "tokenProgram" },
            { name: "eventAuthority" },
            { name: "program" },
          ],
          args: [
            {
              name: "params",
              type: { defined: { name: "gatewayMintParams" } },
            },
          ],
        },
      ],
      types: [
        {
          name: "gatewayMintParams",
          type: {
            kind: "struct",
            fields: [
              { name: "attestation", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
          },
        },
      ],
    };

    export function findDepositPDAs(
      programId: PublicKey,
      usdcMint: PublicKey,
      owner: PublicKey,
    ) {
      return {
        wallet: PublicKey.findProgramAddressSync(
          [Buffer.from("gateway_wallet")],
          programId,
        )[0],
        custody: PublicKey.findProgramAddressSync(
          [Buffer.from("gateway_wallet_custody"), usdcMint.toBuffer()],
          programId,
        )[0],
        deposit: PublicKey.findProgramAddressSync(
          [Buffer.from("gateway_deposit"), usdcMint.toBuffer(), owner.toBuffer()],
          programId,
        )[0],
        denylist: PublicKey.findProgramAddressSync(
          [Buffer.from("denylist"), owner.toBuffer()],
          programId,
        )[0],
      };
    }

    export function findCustodyPda(
      mint: PublicKey,
      minterProgramId: PublicKey,
    ): PublicKey {
      return PublicKey.findProgramAddressSync(
        [Buffer.from("gateway_minter_custody"), mint.toBuffer()],
        minterProgramId,
      )[0];
    }

    export function findTransferSpecHashPda(
      transferSpecHash: Uint8Array | Buffer,
      minterProgramId: PublicKey,
    ): PublicKey {
      return PublicKey.findProgramAddressSync(
        [Buffer.from("used_transfer_spec_hash"), Buffer.from(transferSpecHash)],
        minterProgramId,
      )[0];
    }

    export function decodeAttestationSet(attestation: string) {
      const buffer = Buffer.from(attestation.slice(2), "hex");
      return MintAttestationSetLayout.decode(buffer) as {
        attestations: Array<{
          destinationToken: PublicKey;
          destinationRecipient: PublicKey;
          transferSpecHash: Uint8Array;
        }>;
      };
    }

    export function solanaAddressToBytes32(address: string): string {
      const decoded = Buffer.from(bs58.decode(address));
      return `0x${decoded.toString("hex")}`;
    }

    export function hexToPublicKey(hex: string): PublicKey {
      return new PublicKey(Buffer.from(hex.slice(2), "hex"));
    }

    export async function signAndBroadcast(
      circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient>,
      connection: Connection,
      transaction: Transaction,
      walletAddress: string,
      label: string,
    ): Promise<string> {
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log(`Signing ${label} via Circle Wallets...`);
      const signResult = await circleClient.signTransaction({
        walletAddress,
        blockchain: "SOL-DEVNET",
        rawTransaction: serialized.toString("base64"),
      });

      const signedTxBase64 = signResult.data?.signedTransaction;
      if (!signedTxBase64) throw new Error(`Failed to sign ${label}`);

      console.log(`Broadcasting ${label}...`);
      const signedTxBytes = Buffer.from(signedTxBase64, "base64");
      return connection.sendRawTransaction(signedTxBytes);
    }

    export function stringifyTypedData<T>(obj: T) {
      return JSON.stringify(obj, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      );
    }
    ```

    ## Step 3. Deposit into a unified crosschain balance (Circle Wallets)

    The deposit script submits a Gateway deposit on Solana Devnet. You can skip to
    the [full deposit script](#3-5-full-deposit-script-circle-wallets) if you
    prefer.

    <Warning>
      Do not send USDC directly to the Gateway Wallet address or custody account.
      You must use a Gateway deposit instruction for the funds to be credited to
      your unified balance.
    </Warning>

    ### 3.1. Create the deposit script

    ```shell theme={null}
    touch deposit.ts
    ```

    ### 3.2. Define constants and helpers

    Set the deposit amount near the top of the file, then derive the owner ATA and
    load the account so the script can validate balance before it builds the Gateway
    instruction.

    ```ts theme={null}
    const DEPOSIT_AMOUNT = new BN(1_000_000);
    ```

    ### 3.3. Initialize connection, Anchor client, and validate balance

    The Solana version follows the same teaching order as the standard quickstart:
    initialize the connection, check the source wallet balance, then set up the
    Anchor client and derive the Gateway PDAs.

    ```ts theme={null}
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const usdcMint = new PublicKey(USDC_ADDRESS);
    const programId = new PublicKey(GATEWAY_WALLET_ADDRESS);
    const owner = new PublicKey(DEPOSITOR_ADDRESS);

    const userTokenAccount = getAssociatedTokenAddressSync(usdcMint, owner);
    const tokenAccountInfo = await getAccount(connection, userTokenAccount);

    const dummyWallet = new Wallet(Keypair.generate());
    const provider = new AnchorProvider(
      connection,
      dummyWallet,
      AnchorProvider.defaultOptions(),
    );
    ```

    ### 3.4. Execute the deposit

    After the balance check and PDA derivation, build the Gateway deposit
    instruction, sign it with Circle Wallets, broadcast it, and wait for Solana
    confirmation.

    ```ts theme={null}
    const depositIx = await program.methods
      .deposit(DEPOSIT_AMOUNT)
      .accountsPartial({
        payer: owner,
        owner: owner,
        gatewayWallet: pdas.wallet,
        ownerTokenAccount: userTokenAccount,
        custodyTokenAccount: pdas.custody,
        deposit: pdas.deposit,
        depositorDenylist: pdas.denylist,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const txSignature = await signAndBroadcast(
      client,
      connection,
      transaction,
      DEPOSITOR_ADDRESS,
      "deposit",
    );
    ```

    ### 3.5. Full deposit script (Circle Wallets)

    The script validates the source balance, builds the Gateway deposit instruction,
    and confirms the deposit on Solana Devnet. Inline comments explain each stage.

    ```ts deposit.ts expandable theme={null}
    import {
      Wallet,
      AnchorProvider,
      setProvider,
      Program,
    } from "@coral-xyz/anchor";
    import {
      Connection,
      Keypair,
      PublicKey,
      SystemProgram,
      Transaction,
    } from "@solana/web3.js";
    import {
      getAssociatedTokenAddressSync,
      getAccount,
      TOKEN_PROGRAM_ID,
    } from "@solana/spl-token";
    import BN from "bn.js";
    import {
      RPC_ENDPOINT,
      GATEWAY_WALLET_ADDRESS,
      USDC_ADDRESS,
      client,
      gatewayWalletIdl,
      findDepositPDAs,
      signAndBroadcast,
    } from "./config.js";

    const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;

    if (!DEPOSITOR_ADDRESS) {
      console.error("Missing required env var: DEPOSITOR_ADDRESS");
      process.exit(1);
    }

    const DEPOSIT_AMOUNT = new BN(1_000_000);

    async function main() {
      // Set up the Solana connection and core account addresses.
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const usdcMint = new PublicKey(USDC_ADDRESS);
      const programId = new PublicKey(GATEWAY_WALLET_ADDRESS);
      const owner = new PublicKey(DEPOSITOR_ADDRESS);

      console.log(`Using account: ${owner.toBase58()}`);
      console.log(`\n=== Processing Solana Devnet ===`);

      // [1] Check the depositor's current USDC balance.
      const userTokenAccount = getAssociatedTokenAddressSync(usdcMint, owner);
      const tokenAccountInfo = await getAccount(connection, userTokenAccount);
      const currentBalance = Number(tokenAccountInfo.amount) / 1_000_000;
      console.log(`Current balance: ${currentBalance} USDC`);

      if (tokenAccountInfo.amount < BigInt(DEPOSIT_AMOUNT.toString())) {
        throw new Error(
          "Insufficient USDC balance. Please top up at https://faucet.circle.com",
        );
      }

      // [2] Set up the Anchor client and derive the Gateway deposit PDAs.
      const dummyWallet = new Wallet(Keypair.generate());
      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        AnchorProvider.defaultOptions(),
      );
      setProvider(provider);
      const program = new Program(gatewayWalletIdl, provider);
      const pdas = findDepositPDAs(programId, usdcMint, owner);

      // [3] Build, sign, and confirm the Gateway deposit transaction.
      const depositIx = await program.methods
        .deposit(DEPOSIT_AMOUNT)
        .accountsPartial({
          payer: owner,
          owner: owner,
          gatewayWallet: pdas.wallet,
          ownerTokenAccount: userTokenAccount,
          custodyTokenAccount: pdas.custody,
          deposit: pdas.deposit,
          depositorDenylist: pdas.denylist,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.add(depositIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

      const txSignature = await signAndBroadcast(
        client,
        connection,
        transaction,
        DEPOSITOR_ADDRESS,
        "deposit",
      );

      await connection.confirmTransaction(
        { signature: txSignature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      console.log(`Done on Solana Devnet. Deposit tx: ${txSignature}`);
    }

    /* Main invocation */
    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    ### 3.6. Run the deposit script

    ```shell theme={null}
    npm run deposit
    ```

    Wait for the required number of block confirmations. Once the deposit
    transaction is final, your Gateway balance on Solana Devnet will be updated.
    Solana Devnet transactions typically reach finality in seconds.

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

    You can run it to verify your balance on Gateway.

    ```shell theme={null}
    npm run balances
    ```

    <Tabs>
      <Tab title="Transfer from Solana">
        ## Step 4. Transfer USDC from Solana to Solana

        The transfer script burns USDC on your Solana Devnet Gateway balance and mints
        to a recipient on Solana Devnet via Gateway. You can skip to the
        [full transfer script](#4-9-full-solana-transfer-script-circle-wallets) if you
        prefer.

        ### 4.1. Create the Solana transfer script

        ```shell theme={null}
        touch transfer-from-sol.ts
        ```

        ### 4.2. Define constants and types

        This flow uses the same Solana burn intent layout as the standard Gateway
        quickstart, but swaps in Circle Wallet signing for both the burn intent and the
        mint transaction.

        ```ts theme={null}
        const TRANSFER_AMOUNT = 0.1;
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;
        ```

        ### 4.3. Add helper functions

        The helper layer encodes the Solana burn intent, creates a lightweight Anchor
        provider, and exposes the address conversion utilities required for Gateway
        minting.

        ```ts theme={null}
        function createProvider(connection: Connection) {
          const dummyWallet = new Wallet(Keypair.generate());
          const provider = new AnchorProvider(
            connection,
            dummyWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          return provider;
        }
        ```

        ### 4.4. Initialize connection and create recipient ATA

        Before minting to the destination wallet, derive the recipient Associated Token
        Account and create it `idempotently` with the destination Developer-Controlled
        Account and create it idempotently with the destination Developer-Controlled

        <Info>
          For transfers to Solana, the `destinationRecipient` must be an initialized
          USDC Token Account. If the intended recipient is a standard wallet address,
          consider setting the `destinationRecipient` to its Associated Token Account
          (ATA) not the recipient wallet address. See the [Solana Technical
          Guide](/gateway/references/solana#reducedmintattestation) and [Solana Programs
          and Interfaces](/gateway/references/solana-programs#gatewaymint) for
          high-level Solana guidance and `gatewayMint` account requirements. Use the
          onchain IDLs linked from [Solana Programs and
          Interfaces](/gateway/references/solana-programs#account-structures) as the
          canonical static instruction and account definitions.
        </Info>

        ```ts theme={null}
        const provider = createProvider(connection);

        const recipientAta = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);
        const ataTx = new Transaction();
        ataTx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            owner,
            recipientAta,
            recipientPubkey,
            usdcMint,
          ),
        );
        ```

        ### 4.5. Create and sign burn intent

        Encode the Solana burn intent, prefix the payload, and sign it with the source
        Developer-Controlled Wallet.

        ```ts theme={null}
        const burnIntent = createBurnIntent({
          sourceDepositor: owner.toBase58(),
          destinationRecipient: recipientAta.toBase58(),
          sourceSigner: owner.toBase58(),
        });

        const sigResult = await client.signMessage({
          walletAddress: DEPOSITOR_ADDRESS,
          blockchain: "SOL-DEVNET",
          encodedByHex: true,
          message: "0x" + prefixed.toString("hex"),
        });
        ```

        ### 4.6. Request attestation from Gateway API

        Submit the signed burn intent to the Gateway API and decode the attestation set
        that comes back from the response.

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

        ### 4.7. Set up minter client

        Once the API returns the attestation, initialize the Gateway Minter program and
        derive the PDA accounts needed for the Solana mint.

        The local IDL fragments in this example are only the subset needed by the sample
        code. For canonical static instruction and account definitions, use the onchain
        IDLs linked from
        [Solana Programs and Interfaces](/gateway/references/solana-programs#account-structures).

        ```ts theme={null}
        const minterProgram = new Program(gatewayMinterIdl, provider);
        const [minterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
          minterProgramId,
        );
        ```

        ### 4.8. Mint on Solana

        Create the mint instruction, sign the transaction with the destination
        Developer-Controlled Wallet, and confirm it on Solana Devnet.

        The direct-mint flow uses the destination wallet as both `payer` and
        `destinationCaller`. If an attestation specifies a non-zero `destinationCaller`,
        the transaction signer must match it.

        In this quickstart's client shape, the instruction accounts are assembled as the
        fixed `gatewayMint` accounts first, followed by one ordered triplet per
        attestation: `custody_token_account`, `destination_recipient`, and
        `transfer_spec_hash_account`.

        ```ts theme={null}
        const mintIx = await minterProgram.methods
          .gatewayMint({
            attestation: attestationBytes,
            signature: signatureBytes,
          })
          .accountsPartial({
            gatewayMinter: minterPda,
            destinationCaller: owner,
            payer: owner,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();
        ```

        ### 4.9. Full Solana transfer script (Circle Wallets)

        The script creates the recipient ATA, signs a Solana burn intent, requests a
        Gateway attestation, and mints on Solana Devnet. Inline comments explain each
        stage.

        ```ts transfer-from-sol.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import {
          Wallet,
          AnchorProvider,
          setProvider,
          Program,
          utils,
        } from "@coral-xyz/anchor";
        import {
          Connection,
          Keypair,
          PublicKey,
          SystemProgram,
          Transaction,
        } from "@solana/web3.js";
        import {
          TOKEN_PROGRAM_ID,
          getAssociatedTokenAddressSync,
          createAssociatedTokenAccountIdempotentInstruction,
        } from "@solana/spl-token";
        import { u32be, struct, blob, offset, Layout } from "@solana/buffer-layout";
        import {
          RPC_ENDPOINT,
          GATEWAY_WALLET_ADDRESS,
          GATEWAY_MINTER_ADDRESS,
          USDC_ADDRESS,
          SOLANA_DOMAIN,
          SOLANA_ZERO_ADDRESS,
          client,
          gatewayMinterIdl,
          publicKey,
          hexToPublicKey,
          solanaAddressToBytes32,
          decodeAttestationSet,
          findCustodyPda,
          findTransferSpecHashPda,
          signAndBroadcast,
          stringifyTypedData,
        } from "./config.js";

        const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;
        const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS!;

        if (!DEPOSITOR_ADDRESS || !RECIPIENT_ADDRESS) {
          console.error(
            "Missing required env vars: DEPOSITOR_ADDRESS, RECIPIENT_ADDRESS",
          );
          process.exit(1);
        }

        const TRANSFER_AMOUNT = 0.1;
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

        const TRANSFER_SPEC_MAGIC = 0xca85def7;
        const BURN_INTENT_MAGIC = 0x070afbc2;

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
          sourceSigner: string;
        }) {
          const { sourceDepositor, destinationRecipient, sourceSigner } = params;

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: solanaAddressToBytes32(GATEWAY_WALLET_ADDRESS),
              destinationContract: solanaAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: solanaAddressToBytes32(USDC_ADDRESS),
              destinationToken: solanaAddressToBytes32(USDC_ADDRESS),
              sourceDepositor: solanaAddressToBytes32(sourceDepositor),
              destinationRecipient: solanaAddressToBytes32(destinationRecipient),
              sourceSigner: solanaAddressToBytes32(sourceSigner),
              destinationCaller: solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
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

        // Create a lightweight Anchor provider for PDA derivation and instruction building.
        function createProvider(connection: Connection) {
          const dummyWallet = new Wallet(Keypair.generate());
          const provider = new AnchorProvider(
            connection,
            dummyWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          return provider;
        }

        async function main() {
          // Set up the Solana connection and destination accounts.
          const connection = new Connection(RPC_ENDPOINT, "confirmed");
          const usdcMint = new PublicKey(USDC_ADDRESS);
          const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
          const owner = new PublicKey(DEPOSITOR_ADDRESS);
          const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

          console.log(`Using account: ${owner.toBase58()}`);
          console.log(`Transferring from: Solana Devnet -> Solana Devnet`);

          const provider = createProvider(connection);

          // [1] Create the recipient ATA if it does not already exist.
          const recipientAta = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);
          const { blockhash: ataBlockhash, lastValidBlockHeight: ataBlockHeight } =
            await connection.getLatestBlockhash();
          const ataTx = new Transaction();
          ataTx.add(
            createAssociatedTokenAccountIdempotentInstruction(
              owner,
              recipientAta,
              recipientPubkey,
              usdcMint,
            ),
          );
          ataTx.recentBlockhash = ataBlockhash;
          ataTx.feePayer = owner;

          const ataSig = await signAndBroadcast(
            client,
            connection,
            ataTx,
            DEPOSITOR_ADDRESS,
            "ATA creation",
          );
          await connection.confirmTransaction(
            {
              signature: ataSig,
              blockhash: ataBlockhash,
              lastValidBlockHeight: ataBlockHeight,
            },
            "confirmed",
          );

          // [2] Create and sign the Solana burn intent.
          const burnIntent = createBurnIntent({
            sourceDepositor: owner.toBase58(),
            destinationRecipient: recipientAta.toBase58(),
            sourceSigner: owner.toBase58(),
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

          // [3] Request the attestation set from Gateway API.
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: stringifyTypedData(request),
            },
          );

          const json = (await response.json()) as {
            attestation: string;
            signature: string;
            success?: boolean;
            message?: string;
          };
          if (json.success === false) {
            throw new Error(`Gateway API error: ${json.message}`);
          }
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const { attestation, signature: mintSignature } = json;
          const decoded = decodeAttestationSet(attestation);

          // [4] Set up the Gateway Minter client and remaining accounts.
          const minterProgram = new Program(gatewayMinterIdl, provider);
          const [minterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
            minterProgramId,
          );

          const remainingAccounts = decoded.attestations.flatMap((e) => [
            {
              pubkey: findCustodyPda(e.destinationToken, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
            { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
            {
              pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
          ]);

          const attestationBytes = Buffer.from(attestation.slice(2), "hex");
          const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

          // [5] Mint on Solana with the returned attestation.
          console.log("Minting funds on Solana Devnet...");
          const mintIx = await minterProgram.methods
            .gatewayMint({
              attestation: attestationBytes,
              signature: signatureBytes,
            })
            .accountsPartial({
              gatewayMinter: minterPda,
              destinationCaller: owner,
              payer: owner,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .remainingAccounts(remainingAccounts)
            .instruction();

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
          const mintTx = new Transaction();
          mintTx.add(mintIx);
          mintTx.recentBlockhash = blockhash;
          mintTx.feePayer = owner;

          const mintSig = await signAndBroadcast(
            client,
            connection,
            mintTx,
            DEPOSITOR_ADDRESS,
            "mint",
          );

          await connection.confirmTransaction(
            { signature: mintSig, blockhash, lastValidBlockHeight },
            "confirmed",
          );

          console.log(`Minted ${Number(TRANSFER_VALUE) / 1_000_000} USDC`);
          console.log(`Mint transaction hash (Solana Devnet):`, mintSig);
        }

        /* Main invocation */
        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.10. Run the Solana to Solana transfer script

        ```shell theme={null}
        npm run transfer-from-sol
        ```
      </Tab>

      <Tab title="Transfer from EVM">
        ## Step 4. Transfer USDC from EVM to Solana

        The transfer script burns USDC on selected EVM source chains and mints on Solana
        Devnet via Gateway. Pass source chain names as command-line arguments (for
        example, `arc`, `base`, or `all`). You can skip to the
        [full transfer script](#4-9-full-evm-transfer-script-circle-wallets) if you
        prefer.

        ### 4.1. Create the EVM to Solana transfer script

        ```shell theme={null}
        touch transfer-from-evm.ts
        ```

        ### 4.2. Define constants and types

        This flow matches the standard EVM to Solana quickstart, but uses Circle Wallets
        for signing on both sides. Keep the typed EIP-712 burn intent structures at the
        top of the file so the source and destination formats are easy to compare.

        ```ts theme={null}
        const EVM_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

        const TRANSFER_AMOUNT = 0.1;
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;
        ```

        ### 4.3. Add helper functions

        The helper layer parses selected EVM source chains, converts EVM addresses to
        `bytes32`, and creates a lightweight Anchor provider for the destination Solana
        mint.

        ```ts theme={null}
        const args = process.argv
          .slice(2)
          .filter((arg) => arg !== "--")
          .map((chain) => chain.toLowerCase());

        function createProvider(connection: Connection) {
          const dummyWallet = new Wallet(Keypair.generate());
          const provider = new AnchorProvider(
            connection,
            dummyWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          return provider;
        }
        ```

        ### 4.4. Initialize connection and create recipient ATA

        Set up the destination Solana connection first, derive the recipient ATA, and
        create it `idempotently` before you request any Gateway attestations. create it
        idempotently before you request any Gateway attestations.

        <Info>
          For transfers to Solana, the `destinationRecipient` must be an initialized
          USDC Token Account. If the intended recipient is a standard wallet address,
          consider setting the `destinationRecipient` to its Associated Token Account
          (ATA) not the recipient wallet address. See the [Solana Technical
          Guide](/gateway/references/solana#reducedmintattestation) and [Solana Programs
          and Interfaces](/gateway/references/solana-programs#gatewaymint) for
          high-level Solana guidance and `gatewayMint` account requirements. Use the
          onchain IDLs linked from [Solana Programs and
          Interfaces](/gateway/references/solana-programs#account-structures) as the
          canonical static instruction and account definitions.
        </Info>

        ```ts theme={null}
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

        const recipientAta = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);
        const ataTx = new Transaction();
        ataTx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            recipientPubkey,
            recipientAta,
            recipientPubkey,
            usdcMint,
          ),
        );
        ```

        ### 4.5. Create and sign burn intents

        For each selected EVM source chain, create a burn intent and sign the typed data
        with the source Developer-Controlled Wallet.

        ```ts theme={null}
        const burnIntent = createBurnIntent({
          sourceChain: chainName,
          depositorAddress: DEPOSITOR_ADDRESS,
          recipientAta: recipientAta.toBase58(),
        });

        const sigResp = await client.signTypedData({
          walletAddress: DEPOSITOR_ADDRESS,
          blockchain: evmChainConfigs[chainName].walletChain,
          data: stringifyTypedData(typedData),
        });
        ```

        ### 4.6. Request attestation from Gateway API

        Submit all signed burn intents to the Gateway API and validate that the response
        contains both the attestation and operator signature needed for the Solana mint.

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

        ### 4.7. Set up minter client

        After decoding the attestation set, initialize the Gateway Minter program and
        build the remaining account list expected by the Solana mint instruction.

        <Info>
          The ordered remaining-account list and PDA derivations are documented in
          [Solana Programs and
          Interfaces](/gateway/references/solana-programs#gatewaymint). For static
          instruction definitions, use the onchain IDLs linked from that page.
        </Info>

        ```ts theme={null}
        const decoded = decodeAttestationSet(attestation);
        const minterProgram = new Program(gatewayMinterIdl, provider);

        const remainingAccounts = decoded.attestations.flatMap((e) => [
          {
            pubkey: findCustodyPda(e.destinationToken, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
          { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
          {
            pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
        ]);
        ```

        ### 4.8. Mint on Solana

        Create the Solana mint instruction, sign it with the destination
        Developer-Controlled Wallet, then confirm the transaction on Solana Devnet.

        In the common direct-mint flow, the destination wallet acts as both `payer` and
        `destinationCaller`. If the attestation specifies a non-zero
        `destinationCaller`, the transaction signer must match it.

        In this quickstart's client shape, the instruction accounts are assembled as the
        fixed `gatewayMint` accounts first, followed by one ordered triplet per
        attestation: `custody_token_account`, `destination_recipient`, and
        `transfer_spec_hash_account`.

        ```ts theme={null}
        const mintIx = await minterProgram.methods
          .gatewayMint({
            attestation: attestationBytes,
            signature: signatureBytes,
          })
          .accountsPartial({
            gatewayMinter: minterPda,
            destinationCaller: recipientPubkey,
            payer: recipientPubkey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();
        ```

        ### 4.9. Full EVM transfer script (Circle Wallets)

        The script creates the recipient ATA, signs EVM burn intents, requests a Gateway
        attestation, and mints on Solana Devnet. Inline comments explain each stage.

        ```ts transfer-from-evm.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import {
          Wallet,
          AnchorProvider,
          setProvider,
          Program,
          utils,
        } from "@coral-xyz/anchor";
        import {
          Connection,
          Keypair,
          PublicKey,
          SystemProgram,
          Transaction,
        } from "@solana/web3.js";
        import {
          TOKEN_PROGRAM_ID,
          getAssociatedTokenAddressSync,
          createAssociatedTokenAccountIdempotentInstruction,
        } from "@solana/spl-token";
        import {
          RPC_ENDPOINT,
          GATEWAY_MINTER_ADDRESS,
          USDC_ADDRESS,
          SOLANA_DOMAIN,
          SOLANA_ZERO_ADDRESS,
          client,
          gatewayMinterIdl,
          solanaAddressToBytes32,
          decodeAttestationSet,
          findCustodyPda,
          findTransferSpecHashPda,
          signAndBroadcast,
          stringifyTypedData,
        } from "./config.js";

        const DEPOSITOR_ADDRESS = process.env.DEPOSITOR_ADDRESS!;
        const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS!;

        if (!DEPOSITOR_ADDRESS || !RECIPIENT_ADDRESS) {
          console.error(
            "Missing required env vars: DEPOSITOR_ADDRESS, RECIPIENT_ADDRESS",
          );
          process.exit(1);
        }

        export type WalletChain =
          | "ETH-SEPOLIA"
          | "BASE-SEPOLIA"
          | "AVAX-FUJI"
          | "ARC-TESTNET"
          | "ARB-SEPOLIA"
          | "OP-SEPOLIA"
          | "MATIC-AMOY"
          | "UNI-SEPOLIA";

        export type EvmChain =
          | "ethereum"
          | "base"
          | "avalanche"
          | "arc"
          | "arbitrum"
          | "optimism"
          | "polygon"
          | "unichain";

        type EvmChainConfig = {
          chainName: string;
          usdc: string;
          domain: number;
          walletChain: WalletChain;
        };

        const evmChainConfigs: Record<EvmChain, EvmChainConfig> = {
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

        const EVM_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

        const TRANSFER_AMOUNT = 0.1;
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;
        const MAX_UINT64_DEC = MAX_UINT64.toString();

        const eip712Domain = { name: "GatewayWallet", version: "1" };

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

        // Parse the selected EVM source chains from the command-line arguments.
        function parseSelectedChains(): EvmChain[] {
          const args = process.argv
            .slice(2)
            .filter((arg) => arg !== "--")
            .map((chain) => chain.toLowerCase());
          const validChains = Object.keys(evmChainConfigs);

          if (args.length === 0) {
            throw new Error(
              "No chains specified. Usage: npx tsx transfer-from-evm.ts <chain1> [chain2...] or 'all'",
            );
          }

          if (args.length === 1 && args[0] === "all") {
            return Object.keys(evmChainConfigs) as EvmChain[];
          }

          const invalid = args.filter((arg) => !(arg in evmChainConfigs));
          if (invalid.length > 0) {
            console.error(
              `Unsupported chain: ${invalid.join(", ")}\n` +
                `Valid chains: ${validChains.join(", ")}, all\n` +
                `Example: npx tsx transfer-from-evm.ts ethereum base`,
            );
            process.exit(1);
          }

          return [...new Set(args)] as EvmChain[];
        }

        // Build a burn intent for an EVM source chain and Solana recipient ATA.
        function createBurnIntent(params: {
          sourceChain: EvmChain;
          depositorAddress: string;
          recipientAta: string;
        }) {
          const { sourceChain, depositorAddress, recipientAta } = params;
          const sourceConfig = evmChainConfigs[sourceChain];

          return {
            maxBlockHeight: MAX_UINT64_DEC,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: sourceConfig.domain,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: EVM_GATEWAY_WALLET,
              destinationContract: solanaAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: sourceConfig.usdc,
              destinationToken: solanaAddressToBytes32(USDC_ADDRESS),
              sourceDepositor: depositorAddress,
              destinationRecipient: solanaAddressToBytes32(recipientAta),
              sourceSigner: depositorAddress,
              destinationCaller: solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Format the burn intent as EIP-712 typed data for Circle Wallet signing.
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain: eip712Domain,
            primaryType: "BurnIntent",
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: evmAddressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: burnIntent.spec.destinationContract,
                sourceToken: evmAddressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: burnIntent.spec.destinationToken,
                sourceDepositor: evmAddressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: burnIntent.spec.destinationRecipient,
                sourceSigner: evmAddressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: burnIntent.spec.destinationCaller,
              },
            },
          };
        }

        // Convert an EVM address to a 32-byte hex string.
        function evmAddressToBytes32(address: string): string {
          return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        }

        // Create a lightweight Anchor provider for PDA derivation and instruction building.
        function createProvider(connection: Connection) {
          const dummyWallet = new Wallet(Keypair.generate());
          const provider = new AnchorProvider(
            connection,
            dummyWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          return provider;
        }

        async function main() {
          // Parse the selected source chains and set up Solana destination accounts.
          const selectedChains = parseSelectedChains();
          console.log(`Sender (EVM): ${DEPOSITOR_ADDRESS}`);
          console.log(`Recipient (Solana): ${RECIPIENT_ADDRESS}`);
          console.log(
            `Transferring balances from: ${selectedChains.map((c) => evmChainConfigs[c].chainName).join(", ")}`,
          );

          const connection = new Connection(RPC_ENDPOINT, "confirmed");
          const usdcMint = new PublicKey(USDC_ADDRESS);
          const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
          const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

          const provider = createProvider(connection);

          // [1] Create the recipient ATA if it does not already exist.
          const recipientAta = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);
          console.log(`Recipient ATA: ${recipientAta.toBase58()}`);

          const { blockhash: ataBlockhash, lastValidBlockHeight: ataBlockHeight } =
            await connection.getLatestBlockhash();
          const ataTx = new Transaction();
          ataTx.add(
            createAssociatedTokenAccountIdempotentInstruction(
              recipientPubkey,
              recipientAta,
              recipientPubkey,
              usdcMint,
            ),
          );
          ataTx.recentBlockhash = ataBlockhash;
          ataTx.feePayer = recipientPubkey;

          const ataSig = await signAndBroadcast(
            client,
            connection,
            ataTx,
            RECIPIENT_ADDRESS,
            "ATA creation",
          );
          await connection.confirmTransaction(
            {
              signature: ataSig,
              blockhash: ataBlockhash,
              lastValidBlockHeight: ataBlockHeight,
            },
            "confirmed",
          );

          // [2] Create and sign burn intents for each selected EVM source chain.
          const requests = [];

          for (const chainName of selectedChains) {
            console.log(
              `Creating burn intent from ${evmChainConfigs[chainName].chainName} → Solana Devnet...`,
            );

            const burnIntent = createBurnIntent({
              sourceChain: chainName,
              depositorAddress: DEPOSITOR_ADDRESS,
              recipientAta: recipientAta.toBase58(),
            });

            const typedData = burnIntentTypedData(burnIntent);

            const sigResp = await client.signTypedData({
              walletAddress: DEPOSITOR_ADDRESS,
              blockchain: evmChainConfigs[chainName].walletChain,
              data: stringifyTypedData(typedData),
            });

            const burnIntentSignature = sigResp.data?.signature;
            if (!burnIntentSignature) {
              throw new Error(`Failed to sign burn intent for ${chainName}`);
            }

            requests.push({
              burnIntent: typedData.message,
              signature: burnIntentSignature,
            });
          }
          console.log("Signed burn intents.");

          // [3] Request the attestation set from Gateway API.
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

          const { attestation, signature: mintSignature } = json;
          if (!attestation || !mintSignature) {
            throw new Error("Missing attestation or signature in Gateway API response");
          }

          // [4] Set up the Gateway Minter client and remaining accounts.
          const decoded = decodeAttestationSet(attestation);
          const minterProgram = new Program(gatewayMinterIdl, provider);
          const [minterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
            minterProgramId,
          );

          const remainingAccounts = decoded.attestations.flatMap((e) => [
            {
              pubkey: findCustodyPda(e.destinationToken, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
            { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
            {
              pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
          ]);

          const attestationBytes = Buffer.from(attestation.slice(2), "hex");
          const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

          // [5] Mint on Solana with the returned attestation.
          console.log("Minting funds on Solana Devnet...");
          const mintIx = await minterProgram.methods
            .gatewayMint({
              attestation: attestationBytes,
              signature: signatureBytes,
            })
            .accountsPartial({
              gatewayMinter: minterPda,
              destinationCaller: recipientPubkey,
              payer: recipientPubkey,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .remainingAccounts(remainingAccounts)
            .instruction();

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
          const mintTx = new Transaction();
          mintTx.add(mintIx);
          mintTx.recentBlockhash = blockhash;
          mintTx.feePayer = recipientPubkey;

          const mintSig = await signAndBroadcast(
            client,
            connection,
            mintTx,
            RECIPIENT_ADDRESS,
            "mint",
          );

          await connection.confirmTransaction(
            { signature: mintSig, blockhash, lastValidBlockHeight },
            "confirmed",
          );

          const totalMinted = BigInt(requests.length) * TRANSFER_VALUE;
          console.log(`Minted ${Number(totalMinted) / 1_000_000} USDC`);
          console.log(`Mint transaction hash (Solana Devnet):`, mintSig);
        }

        /* Main invocation */
        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.10. Run the EVM to Solana transfer script

        Before you run this script, update `.env` so:

        * `DEPOSITOR_ADDRESS` is the source EVM wallet
        * `RECIPIENT_ADDRESS` is the destination Solana wallet

        Then run:

        ```shell theme={null}
        npm run transfer-from-evm -- arc
        ```

        ```shell theme={null}
        npm run transfer-from-evm -- arbitrum base
        ```

        ```shell theme={null}
        npm run transfer-from-evm -- all
        ```
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Self-managed">
    ## Prerequisites

    Before you begin, ensure that you've:

    * Installed [Node.js v22+](https://nodejs.org/)
    * Prepared Solana Devnet wallets (sender and recipient) and have the private key
      pairs exported as JSON arrays

    If you want to try the EVM to Solana transfer, ensure that you've:

    * Prepared an EVM testnet wallet with the private key available
      * Added the
        [supported Testnets](/gateway/references/supported-blockchains#testnet) of
        your choice to your wallet
    * Completed
      [Step 3: Deposit into a unified crosschain balance](/gateway/quickstarts/unified-balance-evm#step-3-deposit-into-a-unified-crosschain-balance-self-managed)
      from the
      [EVM quickstart](/gateway/quickstarts/unified-balance-evm#self-managed)

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
    mkdir unified-gateway-balance-sol
    cd unified-gateway-balance-sol
    npm init -y

    # Set up module type and run scripts
    npm pkg set type=module
    npm pkg set scripts.deposit="tsx --env-file=.env deposit.ts"
    npm pkg set scripts.transfer-from-sol="tsx --env-file=.env transfer-from-sol.ts"
    npm pkg set scripts.balances="tsx --env-file=.env balances.ts"

    # Install dependencies
    npm pkg set overrides.bigint-buffer=npm:@trufflesuite/bigint-buffer@1.1.10
    npm install @coral-xyz/anchor @solana/buffer-layout @solana/spl-token @solana/web3.js bs58 tsx typescript
    npm install --save-dev @types/node
    ```

    If you want to try the EVM to Solana transfer, add the run script and install
    [Viem](https://viem.sh/) :

    ```shell theme={null}
    npm pkg set scripts.transfer-from-evm="tsx --env-file=.env transfer-from-evm.ts"
    npm install viem
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
    SOLANA_PRIVATE_KEYPAIR=YOUR_SOLANA_KEYPAIR_ARRAY
    RECIPIENT_KEYPAIR=YOUR_RECIPIENT_KEYPAIR_ARRAY
    ```

    * `SOLANA_PRIVATE_KEYPAIR` is the Solana wallet keypair as a JSON array for the
      sender wallet.
    * `RECIPIENT_KEYPAIR` is the Solana wallet keypair as a JSON array for the
      recipient wallet.

    <Note>
      If your wallet exports a private key hash instead, you can use `bs58` to convert it:

      ```ts TypeScript theme={null}
      const bytes = bs58.decode({ YOUR_PRIVATE_KEY_HASH });
      console.log(JSON.stringify(Array.from(bytes)));
      ```
    </Note>

    If you want to try the EVM to Solana transfer, also add:

    ```text theme={null}
    EVM_PRIVATE_KEY=YOUR_EVM_PRIVATE_KEY
    ```

    * `EVM_PRIVATE_KEY` is the private key for the EVM wallet you use for the EVM
      side of the transfer.

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

    ### 2.2. Configure Solana settings and Gateway addresses

    Add the Solana-specific configuration, Gateway contract addresses, and account
    setup helper to your `config.ts` file. This includes the RPC endpoint, USDC
    address, domain ID, and the IDL definitions for interacting with Gateway Wallet
    and Gateway Minter programs on Solana Devnet.

    The local IDL fragments in this example are only the subset needed by the sample
    code. For canonical static instruction and account definitions, use the onchain
    IDLs linked from
    [Solana Programs and Interfaces](/gateway/references/solana-programs#account-structures).

    ```ts config.ts expandable theme={null}
    import { Keypair } from "@solana/web3.js";

    /* Solana Configuration */
    export const RPC_ENDPOINT = "https://api.devnet.solana.com";
    export const SOLANA_DOMAIN = 5;
    export const SOLANA_ZERO_ADDRESS = "11111111111111111111111111111111";

    /* Gateway Contract Addresses */
    export const GATEWAY_WALLET_ADDRESS =
      "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
    export const GATEWAY_MINTER_ADDRESS =
      "GATEmKK2ECL1brEngQZWCgMWPbvrEYqsV6u29dAaHavr";
    export const USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

    /* Account Setup Helper */
    export function createKeypairFromEnv(privateKey: string): Keypair {
      const secretKey = JSON.parse(privateKey);
      return Keypair.fromSecretKey(Uint8Array.from(secretKey));
    }

    /* Sample-local Gateway Wallet IDL subset used by this runnable example. */
    export const gatewayWalletIdl = {
      address: GATEWAY_WALLET_ADDRESS,
      metadata: {
        name: "gatewayWallet",
        version: "0.1.0",
        spec: "0.1.0",
      },
      instructions: [
        {
          name: "deposit",
          discriminator: [22, 0],
          accounts: [
            { name: "payer", writable: true, signer: true },
            { name: "owner", signer: true },
            { name: "gatewayWallet" },
            { name: "ownerTokenAccount", writable: true },
            { name: "custodyTokenAccount", writable: true },
            { name: "deposit", writable: true },
            { name: "depositorDenylist" },
            { name: "tokenProgram" },
            { name: "systemProgram" },
            { name: "eventAuthority" },
            { name: "program" },
          ],
          args: [{ name: "amount", type: "u64" }],
        },
      ],
    };

    /* Sample-local Gateway Minter IDL subset used by this runnable example. */
    export const gatewayMinterIdl = {
      address: GATEWAY_MINTER_ADDRESS,
      metadata: { name: "gatewayMinter", version: "0.1.0", spec: "0.1.0" },
      instructions: [
        {
          name: "gatewayMint",
          discriminator: [12, 0],
          accounts: [
            { name: "payer", writable: true, signer: true },
            { name: "destinationCaller", signer: true },
            { name: "gatewayMinter" },
            { name: "systemProgram" },
            { name: "tokenProgram" },
            { name: "eventAuthority" },
            { name: "program" },
          ],
          args: [
            { name: "params", type: { defined: { name: "gatewayMintParams" } } },
          ],
        },
      ],
      types: [
        {
          name: "gatewayMintParams",
          type: {
            kind: "struct",
            fields: [
              { name: "attestation", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
          },
        },
      ],
    };
    ```

    ## Step 3: Deposit into a unified crosschain balance (Self-managed)

    This section explains parts of the deposit script that allows you to deposit
    USDC into the Gateway Wallet contract on Solana Devnet. You can skip to the
    [full deposit script](#3-5-full-deposit-script-self-managed) if you prefer.

    ### 3.1. Create the script file

    ```shell theme={null}
    touch deposit.ts
    ```

    ### 3.2. Define constants and helpers

    You can adjust the `DEPOSIT_AMOUNT` to a different value. For now, it is set to
    10 USDC.

    ```ts deposit.ts theme={null}
    const DEPOSIT_AMOUNT = new BN(10000000); // 10 USDC (6 decimals)

    /* Helpers */
    function findPDAs(programId: PublicKey, usdcMint: PublicKey, owner: PublicKey) {
      return {
        wallet: PublicKey.findProgramAddressSync(
          [Buffer.from(utils.bytes.utf8.encode("gateway_wallet"))],
          programId,
        )[0],
        custody: PublicKey.findProgramAddressSync(
          [
            Buffer.from(utils.bytes.utf8.encode("gateway_wallet_custody")),
            usdcMint.toBuffer(),
          ],
          programId,
        )[0],
        deposit: PublicKey.findProgramAddressSync(
          [Buffer.from("gateway_deposit"), usdcMint.toBuffer(), owner.toBuffer()],
          programId,
        )[0],
        denylist: PublicKey.findProgramAddressSync(
          [Buffer.from("denylist"), owner.toBuffer()],
          programId,
        )[0],
      };
    }
    ```

    ### 3.3. Initialize connection, Anchor client, and validate balance

    Initialize the Solana connection and keypair, set up the Anchor client with
    Program Derived Addresses (PDAs) for interacting with the Gateway Wallet
    contract, then verify sufficient USDC balance before depositing.

    ```ts deposit.ts theme={null}
    const keypair = createKeypairFromEnv(process.env.SOLANA_PRIVATE_KEYPAIR);
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const programId = new PublicKey(GATEWAY_WALLET_ADDRESS);
    const usdcMint = new PublicKey(USDC_ADDRESS);

    console.log(`Using account: ${keypair.publicKey.toBase58()}`);

    // Check USDC balance
    const userAta = await getAssociatedTokenAddress(usdcMint, keypair.publicKey);
    const ataInfo = await getAccount(connection, userAta);
    const currentBalance = ataInfo.amount;

    console.log(
      `Current balance: ${Number(currentBalance.toString()) / 1_000_000} USDC`,
    );

    if (currentBalance < BigInt(DEPOSIT_AMOUNT.toString())) {
      throw new Error(
        `Insufficient USDC balance! Please top up at https://faucet.circle.com`,
      );
    }

    const pdas = findPDAs(programId, usdcMint, keypair.publicKey);

    const anchorWallet = new Wallet(keypair);
    const provider = new AnchorProvider(
      connection,
      anchorWallet,
      AnchorProvider.defaultOptions(),
    );
    setProvider(provider);
    const program = new Program(gatewayWalletIdl, provider);
    ```

    ### 3.4. Execute the deposit

    ```ts deposit.ts theme={null}
    const txHash = await program.methods
      .deposit(DEPOSIT_AMOUNT)
      .accountsPartial({
        payer: keypair.publicKey,
        owner: keypair.publicKey,
        gatewayWallet: pdas.wallet,
        ownerTokenAccount: userAta,
        custodyTokenAccount: pdas.custody,
        deposit: pdas.deposit,
        depositorDenylist: pdas.denylist,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`Done on Solana Devnet. Deposit tx: ${txHash}`);
    ```

    ### 3.5. Full deposit script (Self-managed)

    The complete deposit script initializes the Solana connection and Anchor client,
    validates the USDC balance, and deposits funds into the Gateway Wallet contract
    on Solana Devnet. The script includes inline comments to explain what each
    function does, making it easier to follow and modify if needed.

    ```ts deposit.ts expandable theme={null}
    import {
      Wallet,
      AnchorProvider,
      setProvider,
      Program,
      utils,
    } from "@coral-xyz/anchor";
    import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
    import {
      getAssociatedTokenAddress,
      getAccount,
      TOKEN_PROGRAM_ID,
    } from "@solana/spl-token";
    import BN from "bn.js";
    import {
      RPC_ENDPOINT,
      GATEWAY_WALLET_ADDRESS,
      USDC_ADDRESS,
      createKeypairFromEnv,
      gatewayWalletIdl,
    } from "./config.js";

    const DEPOSIT_AMOUNT = new BN(10000000); // 10 USDC (6 decimals)

    /* Helpers */
    function findPDAs(programId: PublicKey, usdcMint: PublicKey, owner: PublicKey) {
      return {
        wallet: PublicKey.findProgramAddressSync(
          [Buffer.from(utils.bytes.utf8.encode("gateway_wallet"))],
          programId,
        )[0],
        custody: PublicKey.findProgramAddressSync(
          [
            Buffer.from(utils.bytes.utf8.encode("gateway_wallet_custody")),
            usdcMint.toBuffer(),
          ],
          programId,
        )[0],
        deposit: PublicKey.findProgramAddressSync(
          [Buffer.from("gateway_deposit"), usdcMint.toBuffer(), owner.toBuffer()],
          programId,
        )[0],
        denylist: PublicKey.findProgramAddressSync(
          [Buffer.from("denylist"), owner.toBuffer()],
          programId,
        )[0],
      };
    }

    /* Main logic */
    async function main() {
      if (!process.env.SOLANA_PRIVATE_KEYPAIR) {
        throw new Error("SOLANA_PRIVATE_KEYPAIR not set in environment");
      }

      const keypair = createKeypairFromEnv(process.env.SOLANA_PRIVATE_KEYPAIR);
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const programId = new PublicKey(GATEWAY_WALLET_ADDRESS);
      const usdcMint = new PublicKey(USDC_ADDRESS);

      console.log(`Using account: ${keypair.publicKey.toBase58()}`);

      console.log(`\n=== Processing Solana Devnet ===`);

      // Check USDC balance
      const userAta = await getAssociatedTokenAddress(usdcMint, keypair.publicKey);
      const ataInfo = await getAccount(connection, userAta);
      const currentBalance = ataInfo.amount;

      console.log(
        `Current balance: ${Number(currentBalance.toString()) / 1_000_000} USDC`,
      );

      if (currentBalance < BigInt(DEPOSIT_AMOUNT.toString())) {
        throw new Error(
          `Insufficient USDC balance! Please top up at https://faucet.circle.com`,
        );
      }

      console.log(
        `Depositing ${Number(DEPOSIT_AMOUNT.toString()) / 1_000_000} USDC to Gateway Wallet`,
      );

      // Set up Anchor client
      const pdas = findPDAs(programId, usdcMint, keypair.publicKey);

      const anchorWallet = new Wallet(keypair);
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        AnchorProvider.defaultOptions(),
      );
      setProvider(provider);
      const program = new Program(gatewayWalletIdl, provider);

      // Execute deposit
      const txHash = await program.methods
        .deposit(DEPOSIT_AMOUNT)
        .accountsPartial({
          payer: keypair.publicKey,
          owner: keypair.publicKey,
          gatewayWallet: pdas.wallet,
          ownerTokenAccount: userAta,
          custodyTokenAccount: pdas.custody,
          deposit: pdas.deposit,
          depositorDenylist: pdas.denylist,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([keypair])
        .rpc();

      console.log(`Done on Solana Devnet. Deposit tx: ${txHash}`);
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    ### 3.6. Run the script to create a crosschain balance

    Run the deposit script to deposit USDC into your Gateway balance on Solana
    Devnet.

    ```shell theme={null}
    npm run deposit
    ```

    Wait for the required number of block confirmations. Once the deposit
    transaction is final, your Gateway balance on Solana Devnet will be updated.
    Solana Devnet transactions typically reach finality in seconds.

    ### 3.7. Check the balances on the Gateway Wallet

    Create a new file called `balances.ts`, and add the following code. This script
    retrieves the USDC balances available from your Gateway Wallet on Solana Devnet.

    ```ts balances.ts expandable theme={null}
    import { Keypair } from "@solana/web3.js";

    /* Constants */
    const SOLANA_DOMAIN = 5;

    /* Helpers */
    function createKeypairFromEnv(privateKey: string): Keypair {
      const secretKey = JSON.parse(privateKey);
      return Keypair.fromSecretKey(Uint8Array.from(secretKey));
    }

    async function main() {
      if (!process.env.SOLANA_PRIVATE_KEYPAIR) {
        throw new Error("SOLANA_PRIVATE_KEYPAIR not set in environment");
      }

      const keypair = createKeypairFromEnv(process.env.SOLANA_PRIVATE_KEYPAIR);
      const depositor = keypair.publicKey.toBase58();

      console.log(`Depositor address: ${depositor}\n`);

      const body = {
        token: "USDC",
        sources: [{ domain: SOLANA_DOMAIN, depositor }],
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

      for (const balance of result.balances) {
        const amount = parseFloat(balance.balance);
        console.log(`solanaDevnet: ${amount.toFixed(6)} USDC`);
      }
    }

    main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    You can run it to verify your balance on Gateway.

    ```shell theme={null}
    npm run balances
    ```

    <Tabs>
      <Tab title="Transfer from Solana">
        ## Step 4: Transfer USDC from the crosschain balance

        This section explains parts of the transfer script that burns USDC from your
        Solana Devnet Gateway balance to a recipient on Solana Devnet via Gateway. You
        can skip to the
        [full transfer script](#4-9-full-solana-transfer-script-self-managed) if you
        prefer.

        ### 4.1. Create the script file

        ```shell theme={null}
        touch transfer-from-sol.ts
        ```

        ### 4.2. Define constants and types

        You can set the amount to be transferred from your Gateway balance by changing
        the `TRANSFER_AMOUNT`. For now, it is set to 1 USDC.

        ```ts transfer-from-sol.ts expandable theme={null}
        const TRANSFER_AMOUNT = 1; // 1 USDC
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

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

        const MintAttestationElementLayout = struct([
          publicKey("destinationToken"),
          publicKey("destinationRecipient"),
          nu64be("value"),
          blob(32, "transferSpecHash"),
          u32be("hookDataLength"),
          blob(offset(u32be(), -4), "hookData"),
        ] as any);

        const MintAttestationSetLayout = struct([
          u32be("magic"),
          u32be("version"),
          u32be("destinationDomain"),
          publicKey("destinationContract"),
          publicKey("destinationCaller"),
          nu64be("maxBlockHeight"),
          u32be("numAttestations"),
          seq(MintAttestationElementLayout, offset(u32be(), -4), "attestations"),
        ] as any);
        ```

        ### 4.3. Add helper functions

        ```ts transfer-from-sol.ts expandable theme={null}
        // Construct burn intent for a given source
        function createBurnIntent(params: {
          sourceDepositor: string;
          destinationRecipient: string;
          sourceSigner: string;
        }) {
          const { sourceDepositor, destinationRecipient, sourceSigner } = params;

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
              destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: addressToBytes32(USDC_ADDRESS),
              destinationToken: addressToBytes32(USDC_ADDRESS),
              sourceDepositor: addressToBytes32(sourceDepositor),
              destinationRecipient: addressToBytes32(destinationRecipient),
              sourceSigner: addressToBytes32(sourceSigner),
              destinationCaller: addressToBytes32(SOLANA_ZERO_ADDRESS),
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

        // Convert Solana address to 32-byte hex string
        function addressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Convert hex string to Solana PublicKey
        function hexToPublicKey(hex: string): PublicKey {
          return new PublicKey(Buffer.from(hex.slice(2), "hex"));
        }

        // Decode attestation set from Gateway API response
        function decodeAttestationSet(attestation: string) {
          const buffer = Buffer.from(attestation.slice(2), "hex");
          return MintAttestationSetLayout.decode(buffer) as {
            attestations: Array<{
              destinationToken: PublicKey;
              destinationRecipient: PublicKey;
              transferSpecHash: Uint8Array;
            }>;
          };
        }

        // Find PDA for token custody account
        function findCustodyPda(
          mint: PublicKey,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("gateway_minter_custody"), mint.toBuffer()],
            minterProgramId,
          )[0];
        }

        // Find PDA for transfer spec hash tracking
        function findTransferSpecHashPda(
          transferSpecHash: Uint8Array | Buffer,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("used_transfer_spec_hash"), Buffer.from(transferSpecHash)],
            minterProgramId,
          )[0];
        }
        ```

        ### 4.4. Initialize connection and create recipient ATA

        Initialize the Solana connection and keypairs, then create the recipient's
        Associated Token Account (ATA) for receiving USDC on the destination chain.

        <Info>
          For transfers to Solana, the `destinationRecipient` must be an initialized
          USDC Token Account. If the intended recipient is a standard wallet address,
          consider setting the `destinationRecipient` to its Associated Token Account
          (ATA) not the recipient wallet address. See the [Solana Technical
          Guide](/gateway/references/solana#reducedmintattestation) and [Solana Programs
          and Interfaces](/gateway/references/solana-programs#gatewaymint) for
          high-level Solana guidance and `gatewayMint` account requirements. Use the
          onchain IDLs linked from [Solana Programs and
          Interfaces](/gateway/references/solana-programs#account-structures) as the
          canonical static instruction and account definitions.
        </Info>

        ```ts transfer-from-sol.ts theme={null}
        const senderKeypair = createKeypairFromEnv(process.env.SOLANA_PRIVATE_KEYPAIR);
        const recipientKeypair = createKeypairFromEnv(process.env.RECIPIENT_KEYPAIR);
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const usdcMint = new PublicKey(USDC_ADDRESS);

        console.log(`Using account: ${senderKeypair.publicKey.toBase58()}`);
        console.log(`Transferring balances from: Solana Devnet`);

        // Create recipient's Associated Token Account
        const recipientAta = getAssociatedTokenAddressSync(
          usdcMint,
          recipientKeypair.publicKey,
        );

        const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
          senderKeypair.publicKey,
          recipientAta,
          recipientKeypair.publicKey,
          usdcMint,
        );
        const tx = new Transaction().add(createAtaIx);
        await sendAndConfirmTransaction(connection, tx, [senderKeypair]);
        ```

        ### 4.5. Create and sign burn intent

        ```ts transfer-from-sol.ts theme={null}
        const burnIntent = createBurnIntent({
          sourceDepositor: senderKeypair.publicKey.toBase58(),
          destinationRecipient: recipientAta.toBase58(),
          sourceSigner: senderKeypair.publicKey.toBase58(),
        });

        const burnIntentSignature = signBurnIntent(senderKeypair, burnIntent);
        const request = [{ burnIntent, signature: burnIntentSignature }];
        console.log("Signed burn intent.");
        ```

        ### 4.6. Request attestation from Gateway API

        ```ts transfer-from-sol.ts theme={null}
        const response = await fetch(
          "https://gateway-api-testnet.circle.com/v1/transfer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request, (_key, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          },
        );

        const json = await response.json();
        if (json.success === false) {
          throw new Error(`Gateway API error: ${json.message}`);
        }
        console.log("Gateway API response:", JSON.stringify(json, null, 2));

        const { attestation, signature: mintSignature } = json;
        const decoded = decodeAttestationSet(attestation);
        ```

        ### 4.7. Set up minter client

        ```ts transfer-from-sol.ts theme={null}
        const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
        const anchorWallet = new Wallet(senderKeypair);
        const provider = new AnchorProvider(
          connection,
          anchorWallet,
          AnchorProvider.defaultOptions(),
        );
        setProvider(provider);
        const minterProgram = new Program(gatewayMinterIdl, provider);

        const [minterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
          minterProgramId,
        );
        ```

        <Info>
          The ordered remaining-account list and PDA derivations are documented in
          [Solana Programs and
          Interfaces](/gateway/references/solana-programs#gatewaymint). For static
          instruction definitions, use the onchain IDLs linked from that page.
        </Info>

        ### 4.8. Mint on Solana

        ```ts transfer-from-sol.ts expandable theme={null}
        const remainingAccounts = decoded.attestations.flatMap((e) => [
          {
            pubkey: findCustodyPda(e.destinationToken, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
          { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
          {
            pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
        ]);

        const attestationBytes = Buffer.from(attestation.slice(2), "hex");
        const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

        console.log("Minting funds on Solana Devnet...");
        const mintTx = await minterProgram.methods
          .gatewayMint({ attestation: attestationBytes, signature: signatureBytes })
          .accountsPartial({
            gatewayMinter: minterPda,
            destinationCaller: senderKeypair.publicKey,
            payer: senderKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .signers([senderKeypair])
          .rpc();

        // [6] Wait for confirmation
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature: mintTx,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed",
        );

        console.log(`Minted ${Number(TRANSFER_VALUE) / 1_000_000} USDC`);
        console.log(`Mint transaction hash (solanaDevnet):`, mintTx);
        ```

        ### 4.9. Full Solana transfer script (Self-managed)

        The complete transfer script creates and signs a burn intent on Solana Devnet,
        submits it to the Gateway API for attestation, and mints USDC on Solana Devnet
        for the recipient. The script includes inline comments to explain what each
        function does, making it easier to follow and modify if needed.

        ```ts transfer-from-sol.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import * as crypto from "crypto";
        import {
          Wallet,
          AnchorProvider,
          setProvider,
          Program,
          utils,
        } from "@coral-xyz/anchor";
        import {
          Connection,
          Keypair,
          PublicKey,
          SystemProgram,
          Transaction,
          sendAndConfirmTransaction,
        } from "@solana/web3.js";
        import {
          TOKEN_PROGRAM_ID,
          getAssociatedTokenAddressSync,
          createAssociatedTokenAccountIdempotentInstruction,
        } from "@solana/spl-token";
        import {
          u32be,
          nu64be,
          struct,
          seq,
          blob,
          offset,
          Layout,
        } from "@solana/buffer-layout";
        import bs58 from "bs58";
        import {
          RPC_ENDPOINT,
          GATEWAY_WALLET_ADDRESS,
          GATEWAY_MINTER_ADDRESS,
          USDC_ADDRESS,
          SOLANA_DOMAIN,
          SOLANA_ZERO_ADDRESS,
          createKeypairFromEnv,
          gatewayMinterIdl,
        } from "./config.js";

        const TRANSFER_AMOUNT = 1; // 1 USDC
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

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

        const MintAttestationElementLayout = struct([
          publicKey("destinationToken"),
          publicKey("destinationRecipient"),
          nu64be("value"),
          blob(32, "transferSpecHash"),
          u32be("hookDataLength"),
          blob(offset(u32be(), -4), "hookData"),
        ] as any);

        const MintAttestationSetLayout = struct([
          u32be("magic"),
          u32be("version"),
          u32be("destinationDomain"),
          publicKey("destinationContract"),
          publicKey("destinationCaller"),
          nu64be("maxBlockHeight"),
          u32be("numAttestations"),
          seq(MintAttestationElementLayout, offset(u32be(), -4), "attestations"),
        ] as any);

        /* Helpers */
        // Construct burn intent for a given source
        function createBurnIntent(params: {
          sourceDepositor: string;
          destinationRecipient: string;
          sourceSigner: string;
        }) {
          const { sourceDepositor, destinationRecipient, sourceSigner } = params;

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: SOLANA_DOMAIN,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
              destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: addressToBytes32(USDC_ADDRESS),
              destinationToken: addressToBytes32(USDC_ADDRESS),
              sourceDepositor: addressToBytes32(sourceDepositor),
              destinationRecipient: addressToBytes32(destinationRecipient),
              sourceSigner: addressToBytes32(sourceSigner),
              destinationCaller: addressToBytes32(SOLANA_ZERO_ADDRESS),
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

        // Convert Solana address to 32-byte hex string
        function addressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Convert hex string to Solana PublicKey
        function hexToPublicKey(hex: string): PublicKey {
          return new PublicKey(Buffer.from(hex.slice(2), "hex"));
        }

        // Decode attestation set from Gateway API response
        function decodeAttestationSet(attestation: string) {
          const buffer = Buffer.from(attestation.slice(2), "hex");
          return MintAttestationSetLayout.decode(buffer) as {
            attestations: Array<{
              destinationToken: PublicKey;
              destinationRecipient: PublicKey;
              transferSpecHash: Uint8Array;
            }>;
          };
        }

        // Find PDA for token custody account
        function findCustodyPda(
          mint: PublicKey,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("gateway_minter_custody"), mint.toBuffer()],
            minterProgramId,
          )[0];
        }

        // Find PDA for transfer spec hash tracking
        function findTransferSpecHashPda(
          transferSpecHash: Uint8Array | Buffer,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("used_transfer_spec_hash"), Buffer.from(transferSpecHash)],
            minterProgramId,
          )[0];
        }

        /* Main logic */
        async function main() {
          if (!process.env.SOLANA_PRIVATE_KEYPAIR || !process.env.RECIPIENT_KEYPAIR) {
            throw new Error("SOLANA_PRIVATE_KEYPAIR and RECIPIENT_KEYPAIR must be set");
          }

          const senderKeypair = createKeypairFromEnv(
            process.env.SOLANA_PRIVATE_KEYPAIR,
          );
          const recipientKeypair = createKeypairFromEnv(process.env.RECIPIENT_KEYPAIR);
          const connection = new Connection(RPC_ENDPOINT, "confirmed");
          const usdcMint = new PublicKey(USDC_ADDRESS);

          console.log(`Using account: ${senderKeypair.publicKey.toBase58()}`);
          console.log(`Transferring balances from: Solana Devnet`);

          // [1] Create recipient's Associated Token Account
          const recipientAta = getAssociatedTokenAddressSync(
            usdcMint,
            recipientKeypair.publicKey,
          );

          const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
            senderKeypair.publicKey,
            recipientAta,
            recipientKeypair.publicKey,
            usdcMint,
          );
          const tx = new Transaction().add(createAtaIx);
          await sendAndConfirmTransaction(connection, tx, [senderKeypair]);

          // [2] Create and sign burn intent
          console.log(`Creating burn intent from Solana Devnet → Solana Devnet...`);
          const burnIntent = createBurnIntent({
            sourceDepositor: senderKeypair.publicKey.toBase58(),
            destinationRecipient: recipientAta.toBase58(),
            sourceSigner: senderKeypair.publicKey.toBase58(),
          });

          const burnIntentSignature = signBurnIntent(senderKeypair, burnIntent);
          const request = [{ burnIntent, signature: burnIntentSignature }];
          console.log("Signed burn intent.");

          // [3] Request attestation from Gateway API
          const response = await fetch(
            "https://gateway-api-testnet.circle.com/v1/transfer",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value,
              ),
            },
          );

          const json = await response.json();
          if (json.success === false) {
            throw new Error(`Gateway API error: ${json.message}`);
          }
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const { attestation, signature: mintSignature } = json;
          const decoded = decodeAttestationSet(attestation);

          // [4] Set up the minter client
          const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
          const anchorWallet = new Wallet(senderKeypair);
          const provider = new AnchorProvider(
            connection,
            anchorWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          const minterProgram = new Program(gatewayMinterIdl, provider);

          const [minterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
            minterProgramId,
          );

          // [5] Mint on Solana
          const remainingAccounts = decoded.attestations.flatMap((e) => [
            {
              pubkey: findCustodyPda(e.destinationToken, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
            { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
            {
              pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
          ]);

          const attestationBytes = Buffer.from(attestation.slice(2), "hex");
          const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

          console.log("Minting funds on Solana Devnet...");
          const mintTx = await minterProgram.methods
            .gatewayMint({ attestation: attestationBytes, signature: signatureBytes })
            .accountsPartial({
              gatewayMinter: minterPda,
              destinationCaller: senderKeypair.publicKey,
              payer: senderKeypair.publicKey,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .remainingAccounts(remainingAccounts)
            .signers([senderKeypair])
            .rpc();

          // [6] Wait for confirmation
          const latest = await connection.getLatestBlockhash();
          await connection.confirmTransaction(
            {
              signature: mintTx,
              blockhash: latest.blockhash,
              lastValidBlockHeight: latest.lastValidBlockHeight,
            },
            "confirmed",
          );

          console.log(`Minted ${Number(TRANSFER_VALUE) / 1_000_000} USDC`);
          console.log(`Mint transaction hash (solanaDevnet):`, mintTx);
        }

        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.10. Run the script to transfer USDC to Solana Devnet

        Run the transfer script to transfer 1 USDC from your Solana Devnet Gateway
        balance to the recipient ATA on Solana Devnet.

        <Note>
          [Gateway gas fees](https://developers.circle.com/gateway/references/fees) are
          charged per burn intent. To reduce overall gas costs, consider keeping most
          Gateway funds on low-cost chains, where Circle’s base fee for burns is cheaper.
        </Note>

        ```shell theme={null}
        npm run transfer-from-sol
        ```
      </Tab>

      <Tab title="Transfer from EVM">
        ## Step 4: Transfer USDC from the crosschain balance

        This section explains parts of the transfer script that burns USDC from source
        chains and mints on a destination chain via Gateway. The script accepts chain
        names as CLI arguments. Specify one or more source chains (for example,
        `seiTestnet` `arcTestnet`) or use all for all supported testnets. You can skip
        to the [full transfer script](#4-9-full-evm-transfer-script-self-managed) if you
        prefer.

        ### 4.1. Create the script file

        ```shell theme={null}
        touch transfer-from-evm.ts
        ```

        ### 4.2. Define constants and types

        You can set the amount to be transferred from your Gateway balance by changing
        the `TRANSFER_AMOUNT`. For now, it is set to 1 USDC.

        ```ts transfer-from-evm.ts expandable theme={null}
        type ChainKey = keyof typeof chainConfigs;

        const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

        const TRANSFER_AMOUNT = 1; // 1 USDC
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

        const chainConfigs = {
          sepolia: {
            chain: sepolia,
            usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            domainId: 0,
          },
          baseSepolia: {
            chain: baseSepolia,
            usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            domainId: 6,
          },
          avalancheFuji: {
            chain: avalancheFuji,
            usdcAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
            domainId: 1,
          },
          arcTestnet: {
            chain: arcTestnet,
            usdcAddress: "0x3600000000000000000000000000000000000000",
            domainId: 26,
          },
          hyperliquidEvmTestnet: {
            chain: hyperliquidEvmTestnet,
            usdcAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
            domainId: 19,
          },
          seiTestnet: {
            chain: seiTestnet,
            usdcAddress: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED",
            domainId: 16,
          },
          sonicTestnet: {
            chain: sonicTestnet,
            usdcAddress: "0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51",
            domainId: 13,
          },
          worldchainSepolia: {
            chain: worldchainSepolia,
            usdcAddress: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
            domainId: 14,
          },
        } as const;

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

        const MintAttestationElementLayout = struct([
          publicKey("destinationToken"),
          publicKey("destinationRecipient"),
          nu64be("value"),
          blob(32, "transferSpecHash"),
          u32be("hookDataLength"),
          blob(offset(u32be(), -4), "hookData"),
        ] as any);

        const MintAttestationSetLayout = struct([
          u32be("magic"),
          u32be("version"),
          u32be("destinationDomain"),
          publicKey("destinationContract"),
          publicKey("destinationCaller"),
          nu64be("maxBlockHeight"),
          u32be("numAttestations"),
          seq(MintAttestationElementLayout, offset(u32be(), -4), "attestations"),
        ] as any);
        ```

        ### 4.3. Add helper functions

        ```ts transfer-from-evm.ts expandable theme={null}
        // Construct burn intent for EVM to Solana transfer
        function createBurnIntent(params: {
          sourceChain: ChainKey;
          depositorAddress: string;
          recipientAddress: string;
        }) {
          const { sourceChain, depositorAddress, recipientAddress } = params;
          const sourceConfig = chainConfigs[sourceChain];

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: sourceConfig.domainId,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: GATEWAY_WALLET_ADDRESS,
              destinationContract: solanaAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: sourceConfig.usdcAddress,
              destinationToken: solanaAddressToBytes32(USDC_ADDRESS),
              sourceDepositor: depositorAddress,
              destinationRecipient: solanaAddressToBytes32(recipientAddress),
              sourceSigner: depositorAddress,
              destinationCaller: solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Format burn intent as EIP-712 typed data for signing
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain,
            primaryType: "BurnIntent",
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: evmAddressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: burnIntent.spec.destinationContract,
                sourceToken: evmAddressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: burnIntent.spec.destinationToken,
                sourceDepositor: evmAddressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: burnIntent.spec.destinationRecipient,
                sourceSigner: evmAddressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: burnIntent.spec.destinationCaller,
              },
            },
          };
        }

        // Get EVM keypair from environment variable
        function createKeypairFromEnv(privateKey: string) {
          const key = privateKey.startsWith("0x")
            ? (privateKey as `0x${string}`)
            : (`0x${privateKey}` as `0x${string}`);
          return privateKeyToAccount(key);
        }

        // Get Solana keypair from environment variable
        function createSolanaKeypairFromEnv(privateKey: string): Keypair {
          const secretKey = JSON.parse(privateKey);
          return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }

        // Parse chains from CLI arguments
        function parseSelectedChains(): ChainKey[] {
          const args = process.argv.slice(2);
          const validChains = Object.keys(chainConfigs) as ChainKey[];

          if (args.length === 0) {
            throw new Error(
              "No chains specified. Usage: npm run transfer -- <chain1> [chain2...] or 'all'",
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

        // Pad EVM address to 32 bytes
        function evmAddressToBytes32(address: string) {
          return pad(address.toLowerCase() as `0x${string}`, { size: 32 });
        }

        // Convert Solana address to 32-byte hex string
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Serialize typed data (convert bigints to strings)
        function stringifyTypedData(obj: unknown) {
          return JSON.stringify(obj, (_key: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }

        // Decode attestation set from Gateway API response
        function decodeAttestationSet(attestation: string) {
          const buffer = Buffer.from(attestation.slice(2), "hex");
          return MintAttestationSetLayout.decode(buffer) as {
            attestations: Array<{
              destinationToken: PublicKey;
              destinationRecipient: PublicKey;
              transferSpecHash: Uint8Array;
            }>;
          };
        }

        // Find PDA for token custody account
        function findCustodyPda(
          mint: PublicKey,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("gateway_minter_custody"), mint.toBuffer()],
            minterProgramId,
          )[0];
        }

        // Find PDA for transfer spec hash tracking
        function findTransferSpecHashPda(
          transferSpecHash: Uint8Array | Buffer,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("used_transfer_spec_hash"), Buffer.from(transferSpecHash)],
            minterProgramId,
          )[0];
        }
        ```

        ### 4.4. Initialize connection and create recipient ATA

        Initialize the Solana connection and keypairs, then create the recipient’s
        Associated Token Account (ATA) for receiving USDC on the destination chain.

        <Info>
          For transfers to Solana, the `destinationRecipient` must be an initialized
          USDC Token Account. If the intended recipient is a standard wallet address,
          consider setting the `destinationRecipient` to its Associated Token Account
          (ATA) not the recipient wallet address. See the [Solana Technical
          Guide](/gateway/references/solana#reducedmintattestation) and [Solana Programs
          and Interfaces](/gateway/references/solana-programs#gatewaymint) for
          high-level Solana guidance and `gatewayMint` account requirements. Use the
          onchain IDLs linked from [Solana Programs and
          Interfaces](/gateway/references/solana-programs#account-structures) as the
          canonical static instruction and account definitions.
        </Info>

        ```ts transfer-from-evm.ts theme={null}
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const usdcMint = new PublicKey(USDC_ADDRESS);
        const recipientAta = getAssociatedTokenAddressSync(
          usdcMint,
          solanaKeypair.publicKey,
        );

        const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
          solanaKeypair.publicKey,
          recipientAta,
          solanaKeypair.publicKey,
          usdcMint,
        );
        const tx = new Transaction().add(createAtaIx);
        await sendAndConfirmTransaction(connection, tx, [solanaKeypair]);
        ```

        ### 4.5. Create and sign burn intents

        ```ts transfer-from-evm.ts theme={null}
        const requests = [];

        for (const chainName of selectedChains) {
          console.log(`Creating burn intent from ${chainName} → Solana Devnet...`);

          const burnIntent = createBurnIntent({
            sourceChain: chainName,
            depositorAddress: evmAccount.address,
            recipientAddress: recipientAta.toBase58(),
          });

          const typedData = burnIntentTypedData(burnIntent);
          const signature = await evmAccount.signTypedData(
            typedData as Parameters<typeof evmAccount.signTypedData>[0],
          );

          requests.push({ burnIntent: typedData.message, signature });
        }
        console.log("Signed burn intents.");
        ```

        ### 4.6. Request attestation from Gateway API

        ```ts transfer-from-evm.ts theme={null}
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

        const json = await response.json();
        console.log("Gateway API response:", JSON.stringify(json, null, 2));

        const { attestation, signature: mintSignature } = json;
        const decoded = decodeAttestationSet(attestation);
        ```

        ### 4.7. Set up minter client

        ```ts transfer-from-evm.ts theme={null}
        const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
        const anchorWallet = new Wallet(solanaKeypair);
        const provider = new AnchorProvider(
          connection,
          anchorWallet,
          AnchorProvider.defaultOptions(),
        );
        setProvider(provider);
        const minterProgram = new Program(gatewayMinterIdl, provider);

        const [minterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
          minterProgramId,
        );
        ```

        <Info>
          The ordered remaining-account list and PDA derivations are documented in
          [Solana Programs and
          Interfaces](/gateway/references/solana-programs#gatewaymint). For static
          instruction definitions, use the onchain IDLs linked from that page.
        </Info>

        ### 4.8. Mint on Solana

        ```ts transfer-from-evm.ts expandable theme={null}
        const remainingAccounts = decoded.attestations.flatMap((e) => [
          {
            pubkey: findCustodyPda(e.destinationToken, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
          { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
          {
            pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
            isWritable: true,
            isSigner: false,
          },
        ]);

        const attestationBytes = Buffer.from(attestation.slice(2), "hex");
        const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

        const mintTx = await minterProgram.methods
          .gatewayMint({ attestation: attestationBytes, signature: signatureBytes })
          .accountsPartial({
            gatewayMinter: minterPda,
            destinationCaller: solanaKeypair.publicKey,
            payer: solanaKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts)
          .signers([solanaKeypair])
          .rpc();

        // [6] Wait for confirmation
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature: mintTx,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed",
        );

        const totalMinted = BigInt(requests.length) * TRANSFER_VALUE;
        console.log(`Minted ${Number(totalMinted) / 1_000_000} USDC`);
        console.log(`Mint transaction hash (Solana Devnet):`, mintTx);
        ```

        ### 4.9. Full EVM transfer script (Self-managed)

        The complete transfer script loops through selected EVM source chains, creates
        and signs burn intents for each chain, submits them to the Gateway API for
        attestation, and mints USDC on Solana Devnet. The script includes inline
        comments to explain what each function does, making it easier to follow and
        modify if needed.

        ```ts transfer-from-evm.ts expandable theme={null}
        import { randomBytes } from "node:crypto";
        import { pad } from "viem";
        import { privateKeyToAccount } from "viem/accounts";
        import {
          Wallet,
          AnchorProvider,
          setProvider,
          Program,
          utils,
        } from "@coral-xyz/anchor";
        import {
          Connection,
          Keypair,
          PublicKey,
          SystemProgram,
          Transaction,
          sendAndConfirmTransaction,
        } from "@solana/web3.js";
        import {
          TOKEN_PROGRAM_ID,
          getAssociatedTokenAddressSync,
          createAssociatedTokenAccountIdempotentInstruction,
        } from "@solana/spl-token";
        import {
          u32be,
          nu64be,
          struct,
          seq,
          blob,
          offset,
          Layout,
        } from "@solana/buffer-layout";
        import bs58 from "bs58";
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
        import {
          RPC_ENDPOINT,
          GATEWAY_MINTER_ADDRESS,
          USDC_ADDRESS,
          SOLANA_DOMAIN,
          SOLANA_ZERO_ADDRESS,
          gatewayMinterIdl,
        } from "./config.js";

        type ChainKey = keyof typeof chainConfigs;

        const chainConfigs = {
          sepolia: {
            chain: sepolia,
            usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            domainId: 0,
          },
          baseSepolia: {
            chain: baseSepolia,
            usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            domainId: 6,
          },
          avalancheFuji: {
            chain: avalancheFuji,
            usdcAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
            domainId: 1,
          },
          arcTestnet: {
            chain: arcTestnet,
            usdcAddress: "0x3600000000000000000000000000000000000000",
            domainId: 26,
          },
          hyperliquidEvmTestnet: {
            chain: hyperliquidEvmTestnet,
            usdcAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
            domainId: 19,
          },
          seiTestnet: {
            chain: seiTestnet,
            usdcAddress: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED",
            domainId: 16,
          },
          sonicTestnet: {
            chain: sonicTestnet,
            usdcAddress: "0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51",
            domainId: 13,
          },
          worldchainSepolia: {
            chain: worldchainSepolia,
            usdcAddress: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
            domainId: 14,
          },
        } as const;

        const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

        const TRANSFER_AMOUNT = 1; // 1 USDC
        const TRANSFER_VALUE = BigInt(Math.floor(TRANSFER_AMOUNT * 1e6));
        const MAX_FEE = 2_010000n;
        const MAX_UINT64 = 2n ** 64n - 1n;

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

        const MintAttestationElementLayout = struct([
          publicKey("destinationToken"),
          publicKey("destinationRecipient"),
          nu64be("value"),
          blob(32, "transferSpecHash"),
          u32be("hookDataLength"),
          blob(offset(u32be(), -4), "hookData"),
        ] as any);

        const MintAttestationSetLayout = struct([
          u32be("magic"),
          u32be("version"),
          u32be("destinationDomain"),
          publicKey("destinationContract"),
          publicKey("destinationCaller"),
          nu64be("maxBlockHeight"),
          u32be("numAttestations"),
          seq(MintAttestationElementLayout, offset(u32be(), -4), "attestations"),
        ] as any);

        /* Helpers */
        // Construct burn intent for EVM to Solana transfer
        function createBurnIntent(params: {
          sourceChain: ChainKey;
          depositorAddress: string;
          recipientAddress: string;
        }) {
          const { sourceChain, depositorAddress, recipientAddress } = params;
          const sourceConfig = chainConfigs[sourceChain];

          return {
            maxBlockHeight: MAX_UINT64,
            maxFee: MAX_FEE,
            spec: {
              version: 1,
              sourceDomain: sourceConfig.domainId,
              destinationDomain: SOLANA_DOMAIN,
              sourceContract: GATEWAY_WALLET_ADDRESS,
              destinationContract: solanaAddressToBytes32(GATEWAY_MINTER_ADDRESS),
              sourceToken: sourceConfig.usdcAddress,
              destinationToken: solanaAddressToBytes32(USDC_ADDRESS),
              sourceDepositor: depositorAddress,
              destinationRecipient: solanaAddressToBytes32(recipientAddress),
              sourceSigner: depositorAddress,
              destinationCaller: solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
              value: TRANSFER_VALUE,
              salt: "0x" + randomBytes(32).toString("hex"),
              hookData: "0x",
            },
          };
        }

        // Format burn intent as EIP-712 typed data for signing
        function burnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
          return {
            types: { EIP712Domain, TransferSpec, BurnIntent },
            domain,
            primaryType: "BurnIntent",
            message: {
              ...burnIntent,
              spec: {
                ...burnIntent.spec,
                sourceContract: evmAddressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: burnIntent.spec.destinationContract,
                sourceToken: evmAddressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: burnIntent.spec.destinationToken,
                sourceDepositor: evmAddressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: burnIntent.spec.destinationRecipient,
                sourceSigner: evmAddressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: burnIntent.spec.destinationCaller,
              },
            },
          };
        }

        // Get EVM keypair from environment variable
        function createKeypairFromEnv(privateKey: string) {
          const key = privateKey.startsWith("0x")
            ? (privateKey as `0x${string}`)
            : (`0x${privateKey}` as `0x${string}`);
          return privateKeyToAccount(key);
        }

        // Get Solana keypair from environment variable
        function createSolanaKeypairFromEnv(privateKey: string): Keypair {
          const secretKey = JSON.parse(privateKey);
          return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }

        // Parse chains from CLI arguments
        function parseSelectedChains(): ChainKey[] {
          const args = process.argv.slice(2);
          const validChains = Object.keys(chainConfigs) as ChainKey[];

          if (args.length === 0) {
            throw new Error(
              "No chains specified. Usage: npm run transfer -- <chain1> [chain2...] or 'all'",
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

        // Pad EVM address to 32 bytes
        function evmAddressToBytes32(address: string) {
          return pad(address.toLowerCase() as `0x${string}`, { size: 32 });
        }

        // Convert Solana address to 32-byte hex string
        function solanaAddressToBytes32(address: string): string {
          const decoded = Buffer.from(bs58.decode(address));
          return `0x${decoded.toString("hex")}`;
        }

        // Serialize typed data (convert bigints to strings)
        function stringifyTypedData(obj: unknown) {
          return JSON.stringify(obj, (_key: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
          );
        }

        // Decode attestation set from Gateway API response
        function decodeAttestationSet(attestation: string) {
          const buffer = Buffer.from(attestation.slice(2), "hex");
          return MintAttestationSetLayout.decode(buffer) as {
            attestations: Array<{
              destinationToken: PublicKey;
              destinationRecipient: PublicKey;
              transferSpecHash: Uint8Array;
            }>;
          };
        }

        // Find PDA for token custody account
        function findCustodyPda(
          mint: PublicKey,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("gateway_minter_custody"), mint.toBuffer()],
            minterProgramId,
          )[0];
        }

        // Find PDA for transfer spec hash tracking
        function findTransferSpecHashPda(
          transferSpecHash: Uint8Array | Buffer,
          minterProgramId: PublicKey,
        ): PublicKey {
          return PublicKey.findProgramAddressSync(
            [Buffer.from("used_transfer_spec_hash"), Buffer.from(transferSpecHash)],
            minterProgramId,
          )[0];
        }

        /* Main logic */
        async function main() {
          if (!process.env.EVM_PRIVATE_KEY || !process.env.SOLANA_PRIVATE_KEYPAIR) {
            throw new Error("EVM_PRIVATE_KEY and SOLANA_PRIVATE_KEYPAIR must be set");
          }

          const evmAccount = createKeypairFromEnv(process.env.EVM_PRIVATE_KEY);
          const solanaKeypair = createSolanaKeypairFromEnv(
            process.env.SOLANA_PRIVATE_KEYPAIR,
          );

          console.log(`Sender (EVM): ${evmAccount.address}`);
          console.log(
            `Recipient (Solana Devnet): ${solanaKeypair.publicKey.toBase58()}`,
          );

          // Validate chain selection
          const selectedChains = parseSelectedChains();
          console.log(`Transferring balances from: ${selectedChains.join(", ")}`);

          // [1] Create recipient's Associated Token Account
          const connection = new Connection(RPC_ENDPOINT, "confirmed");
          const usdcMint = new PublicKey(USDC_ADDRESS);
          const recipientAta = getAssociatedTokenAddressSync(
            usdcMint,
            solanaKeypair.publicKey,
          );

          const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
            solanaKeypair.publicKey,
            recipientAta,
            solanaKeypair.publicKey,
            usdcMint,
          );
          const tx = new Transaction().add(createAtaIx);
          await sendAndConfirmTransaction(connection, tx, [solanaKeypair]);

          // [2] Create and sign burn intents for each source chain
          const requests = [];

          for (const chainName of selectedChains) {
            console.log(`Creating burn intent from ${chainName} → Solana Devnet...`);

            const burnIntent = createBurnIntent({
              sourceChain: chainName,
              depositorAddress: evmAccount.address,
              recipientAddress: recipientAta.toBase58(),
            });

            const typedData = burnIntentTypedData(burnIntent);
            const signature = await evmAccount.signTypedData(
              typedData as Parameters<typeof evmAccount.signTypedData>[0],
            );

            requests.push({ burnIntent: typedData.message, signature });
          }
          console.log("Signed burn intents.");

          // [3] Request attestation from Gateway API
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

          const json = await response.json();
          console.log("Gateway API response:", JSON.stringify(json, null, 2));

          const { attestation, signature: mintSignature } = json;
          const decoded = decodeAttestationSet(attestation);

          // [4] Set up the minter client
          const minterProgramId = new PublicKey(GATEWAY_MINTER_ADDRESS);
          const anchorWallet = new Wallet(solanaKeypair);
          const provider = new AnchorProvider(
            connection,
            anchorWallet,
            AnchorProvider.defaultOptions(),
          );
          setProvider(provider);
          const minterProgram = new Program(gatewayMinterIdl, provider);

          const [minterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(utils.bytes.utf8.encode("gateway_minter"))],
            minterProgramId,
          );

          // [5] Mint on Solana
          console.log("Minting funds on Solana Devnet...");

          const remainingAccounts = decoded.attestations.flatMap((e) => [
            {
              pubkey: findCustodyPda(e.destinationToken, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
            { pubkey: e.destinationRecipient, isWritable: true, isSigner: false },
            {
              pubkey: findTransferSpecHashPda(e.transferSpecHash, minterProgramId),
              isWritable: true,
              isSigner: false,
            },
          ]);

          const attestationBytes = Buffer.from(attestation.slice(2), "hex");
          const signatureBytes = Buffer.from(mintSignature.slice(2), "hex");

          const mintTx = await minterProgram.methods
            .gatewayMint({ attestation: attestationBytes, signature: signatureBytes })
            .accountsPartial({
              gatewayMinter: minterPda,
              destinationCaller: solanaKeypair.publicKey,
              payer: solanaKeypair.publicKey,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .remainingAccounts(remainingAccounts)
            .signers([solanaKeypair])
            .rpc();

          // [6] Wait for confirmation
          const latest = await connection.getLatestBlockhash();
          await connection.confirmTransaction(
            {
              signature: mintTx,
              blockhash: latest.blockhash,
              lastValidBlockHeight: latest.lastValidBlockHeight,
            },
            "confirmed",
          );

          const totalMinted = BigInt(requests.length) * TRANSFER_VALUE;
          console.log(`Minted ${Number(totalMinted) / 1_000_000} USDC`);
          console.log(`Mint transaction hash (Solana Devnet):`, mintTx);
        }

        /* Main invocation */
        main().catch((error) => {
          console.error("\nError:", error);
          process.exit(1);
        });
        ```

        ### 4.10. Run the script to transfer USDC to Solana Devnet

        Run the transfer script to transfer 1 USDC from each selected EVM Gateway
        balance to the recipient ATA on Solana Devnet.

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
    </Tabs>
  </Tab>
</Tabs>
