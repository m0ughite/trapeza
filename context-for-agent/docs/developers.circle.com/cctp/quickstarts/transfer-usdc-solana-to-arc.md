> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Transfer USDC from Solana to Arc

> Transfer USDC from Solana to an EVM blockchain using CCTP

export const sourceChain_0 = "Solana Devnet"

export const destinationChain_0 = "Arc Testnet"

This guide demonstrates how to transfer USDC from Solana Devnet to Arc Testnet
using CCTP. You use the [Solana Kit](https://github.com/anza-xyz/kit) library to
interact with [Solana CCTP programs](/cctp/references/solana-programs), and viem
to mint USDC on Arc Testnet.

<Tip>
  **Use [Bridge Kit](https://www.npmjs.com/package/@circle-fin/bridge-kit) to
  simplify crosschain transfers with CCTP.**

  This quickstart shows how to transfer USDC from {sourceChain_0} to
  {destinationChain_0} using a manual CCTP integration. The example is for learning
  or for developers who need a manual integration.

  To streamline this, use Bridge Kit to transfer USDC in just a few lines of code.
</Tip>

## Prerequisites

Before you begin, ensure that you've:

* Installed [Node.js v22+](https://nodejs.org/)
* Prepared a Solana wallet and have the private key array available
* Funded your Solana wallet with the following testnet tokens:
  * Solana Devnet SOL (native token) from a
    [public faucet](https://faucet.solana.com/)
  * Solana Devnet USDC from the [Circle Faucet](https://faucet.circle.com)
* Prepared an EVM testnet wallet with the private key available
  * Added Arc testnet network to your wallet
    ([network details](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup))
* Funded your EVM wallet with Arc Testnet USDC from the
  [Circle Faucet](https://faucet.circle.com) if you choose the direct mint path
  below, because the destination wallet must pay gas to call `receiveMessage`

## Step 1. Set up the project

### 1.1. Create the project and install dependencies

```shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir cctp-solana-transfer
cd cctp-solana-transfer
npm init -y

# Set up module type and start command
npm pkg set type=module
npm pkg set scripts.start="tsx --env-file=.env index.ts"

# Install runtime dependencies
npm install @solana/kit @solana-program/system @solana-program/token viem

# Install dev dependencies
npm install --save-dev @types/node tsx typescript
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

Open `.env` in your editor and add:

```text theme={null}
SOLANA_PRIVATE_KEY=YOUR_SOLANA_PRIVATE_KEY_ARRAY
EVM_PRIVATE_KEY=YOUR_ARC_PRIVATE_KEY
```

* `SOLANA_PRIVATE_KEY` is the private key array for the Solana Devnet wallet
  that signs the source-chain burn transaction.
* `EVM_PRIVATE_KEY` is used to derive the Arc recipient address. The direct-mint
  path also uses this key to submit the destination mint on Arc.

<Tip>
  Open `.env` in your editor rather than writing values with shell commands, and
  add `.env` to your `.gitignore`. This prevents credentials from leaking into
  your shell history or version control.
</Tip>

The `npm run start` command loads variables from `.env` using Node.js native
env-file support.

<Warning>
  This example uses one or more private keys for local testing. In production,
  use a secure key management solution and never expose or share private keys.
</Warning>

## Step 2: Configure the script

Define the configuration constants for interacting with Solana and Arc Testnet.

### 2.1. Setup chains and wallets

The script predefines the program addresses, transfer amount, and other
parameters:

```ts TypeScript expandable theme={null}
// Solana Configuration
const SOLANA_RPC = "https://api.devnet.solana.com";
const SOLANA_WS = "wss://api.devnet.solana.com";
const rpc = createSolanaRpc(SOLANA_RPC);
const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WS);
const solanaPrivateKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY!);
const solanaKeypair = await createKeyPairSignerFromBytes(
  Uint8Array.from(solanaPrivateKey),
);

// Solana CCTP Program Addresses (Devnet)
const TOKEN_MESSENGER_MINTER_PROGRAM = address(
  "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
);
const MESSAGE_TRANSMITTER_PROGRAM = address(
  "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
);
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const ASSOCIATED_TOKEN_PROGRAM = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

// Arc Testnet Configuration
const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY!;
const ethAccount = privateKeyToAccount(EVM_PRIVATE_KEY as `0x${string}`);
const ARC_MESSAGE_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
const arcClient = createWalletClient({
  chain: arcTestnet,
  transport: http(),
  account: ethAccount,
});

// Transfer Parameters
const AMOUNT = 1_000_000n;
const DESTINATION_DOMAIN = 26;
const ARC_DESTINATION_ADDRESS = ethAccount.address;
const MAX_FEE = 500n;
```

## Step 3: Implement the transfer logic

The following sections outline the core transfer logic from Solana to Arc.

For simplicity, this quickstart uses the same Arc wallet as the recipient and,
in the direct-mint path, the wallet that submits `receiveMessage`. In
production, these can be different addresses.

In the two examples provided, the path diverges at the Solana burn instruction:

* **Direct mint** uses `deposit_for_burn`, then retrieves an attestation and
  calls `receiveMessage` on Arc.
* **Forwarding Service** uses `deposit_for_burn_with_hook`, then lets Circle
  handle the destination-side mint on Arc.

<Tabs>
  <Tab title="Forwarding Service">
    ### 3.1. Get forwarding fees and calculate the burn amount

    Before you burn USDC with the
    [Forwarding Service](/cctp/concepts/forwarding-service), query the CCTP fee
    endpoint with `forward=true`. The forwarding fee is dynamic, so fetch it
    immediately before the transfer. The returned `maxFee` must cover both the CCTP
    protocol fee and the forwarding fee.

    ```ts TypeScript theme={null}
    const FORWARDING_SERVICE_HOOK_DATA = Buffer.from(
      "636374702d666f72776172640000000000000000000000000000000000000000",
      "hex",
    );

    async function getForwardingFees() {
      const response = await fetch(
        "https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/5/26?forward=true",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fees: ${await response.text()}`);
      }

      return response.json();
    }

    async function calculateForwardingAmounts() {
      const fees = await getForwardingFees();
      const feeData = fees.find(
        (fee: { finalityThreshold: number }) => fee.finalityThreshold === 1000,
      );

      if (!feeData) {
        throw new Error("Fast-transfer forwarding fees not available");
      }

      const forwardFee = BigInt(feeData.forwardFee.med);
      const protocolFee =
        (AMOUNT * BigInt(Math.round(feeData.minimumFee * 100))) / 1_000_000n;
      const maxFee = forwardFee + protocolFee;
      const totalAmount = AMOUNT + maxFee;

      return { maxFee, totalAmount };
    }
    ```

    ### 3.2. Burn USDC with the Forwarding Service hook

    Use `deposit_for_burn_with_hook` on Solana. The forwarding hook data tells
    Circle to handle the destination-side `receiveMessage` call on Arc.

    ```ts TypeScript expandable theme={null}
    type BurnContext = {
      senderUsdcAccount: ReturnType<typeof address>;
      senderAuthorityPda: ReturnType<typeof address>;
      denylistPda: ReturnType<typeof address>;
      messageTransmitter: ReturnType<typeof address>;
      tokenMessenger: ReturnType<typeof address>;
      remoteTokenMessenger: ReturnType<typeof address>;
      tokenMinter: ReturnType<typeof address>;
      localToken: ReturnType<typeof address>;
      eventAuthority: ReturnType<typeof address>;
      messageTransmitterEventAuthority: ReturnType<typeof address>;
      messageSentEventAccount: Awaited<ReturnType<typeof generateKeyPairSigner>>;
      destAddressBytes32: Buffer;
    };

    async function getBurnContext(): Promise<BurnContext> {
      const addressEncoder = getAddressEncoder();
      const [senderUsdcAccount] = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM,
        seeds: [
          addressEncoder.encode(solanaKeypair.address),
          addressEncoder.encode(TOKEN_PROGRAM_ADDRESS),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      const destAddressBytes32 = Buffer.concat([
        Buffer.alloc(12),
        Buffer.from(ARC_DESTINATION_ADDRESS.slice(2), "hex"),
      ]);

      const [senderAuthorityPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("sender_authority")],
      });
      const [denylistPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("denylist_account"),
          addressEncoder.encode(solanaKeypair.address),
        ],
      });
      const [messageTransmitter] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("message_transmitter")],
      });
      const [tokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_messenger")],
      });
      const [remoteTokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("remote_token_messenger"),
          new TextEncoder().encode(DESTINATION_DOMAIN.toString()),
        ],
      });
      const [tokenMinter] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_minter")],
      });
      const [localToken] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("local_token"),
          addressEncoder.encode(USDC_MINT),
        ],
      });
      const [eventAuthority] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });
      const [messageTransmitterEventAuthority] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });
      const messageSentEventAccount = await generateKeyPairSigner();

      return {
        senderUsdcAccount,
        senderAuthorityPda,
        denylistPda,
        messageTransmitter,
        tokenMessenger,
        remoteTokenMessenger,
        tokenMinter,
        localToken,
        eventAuthority,
        messageTransmitterEventAuthority,
        messageSentEventAccount,
        destAddressBytes32,
      };
    }

    async function burnUSDCWithForwarding() {
      console.log("Burning USDC on Solana with Forwarding Service...");

      const { maxFee, totalAmount } = await calculateForwardingAmounts();
      const burnContext = await getBurnContext();

      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(totalAmount);
      const domainBuffer = Buffer.alloc(4);
      domainBuffer.writeUInt32LE(DESTINATION_DOMAIN);
      const maxFeeBuffer = Buffer.alloc(8);
      maxFeeBuffer.writeBigUInt64LE(maxFee);
      const finalityBuffer = Buffer.alloc(4);
      finalityBuffer.writeUInt32LE(1000);
      const hookLengthBuffer = Buffer.alloc(4);
      hookLengthBuffer.writeUInt32LE(FORWARDING_SERVICE_HOOK_DATA.length);

      const instructionData = new Uint8Array(
        Buffer.concat([
          Buffer.from([111, 245, 62, 131, 204, 108, 223, 155]),
          amountBuffer,
          domainBuffer,
          burnContext.destAddressBytes32,
          Buffer.alloc(32),
          maxFeeBuffer,
          finalityBuffer,
          hookLengthBuffer,
          FORWARDING_SERVICE_HOOK_DATA,
        ]),
      );

      const depositForBurnIx = {
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        accounts: [
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: burnContext.senderAuthorityPda, role: 0 },
          { address: burnContext.senderUsdcAccount, role: 1 },
          { address: burnContext.denylistPda, role: 0 },
          { address: burnContext.messageTransmitter, role: 1 },
          { address: burnContext.tokenMessenger, role: 0 },
          { address: burnContext.remoteTokenMessenger, role: 0 },
          { address: burnContext.tokenMinter, role: 0 },
          { address: burnContext.localToken, role: 1 },
          { address: USDC_MINT, role: 1 },
          {
            address: burnContext.messageSentEventAccount.address,
            role: 3,
            signer: burnContext.messageSentEventAccount,
          },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: TOKEN_PROGRAM_ADDRESS, role: 0 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
          { address: burnContext.eventAuthority, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: burnContext.messageTransmitterEventAuthority, role: 0 },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
        ],
        data: instructionData,
      };

      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(solanaKeypair, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(depositForBurnIx, tx),
      );
      const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      await sendAndConfirmTransaction(signedTransaction as any, {
        commitment: "confirmed",
      });

      const signature = getSignatureFromTransaction(signedTransaction);
      console.log(`Burn transaction signature: ${signature}`);
      return signature;
    }
    ```

    ### 3.3. Verify the forwarded mint

    After the burn is confirmed, poll the Iris API until it returns a
    `forwardTxHash`. That hash is the Arc destination mint transaction submitted by
    Circle. In the forwarding path, `forwardTxHash` is the completion signal for the
    destination-side mint. You do not need to retrieve an attestation and call
    `receiveMessage` yourself.

    ```ts TypeScript theme={null}
    async function waitForForwardedMint(transactionSignature: string) {
      console.log("Waiting for Forwarding Service to mint on Arc...");

      while (true) {
        const response = await fetch(
          `https://iris-api-sandbox.circle.com/v2/messages/5?transactionHash=${transactionSignature}`,
          { method: "GET" },
        );

        if (!response.ok) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const data = await response.json();
        const forwardTxHash = data?.messages?.[0]?.forwardTxHash;

        if (forwardTxHash) {
          console.log(`Forwarded Mint Tx: ${forwardTxHash}`);
          return forwardTxHash;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    ```
  </Tab>

  <Tab title="Direct mint">
    ### 3.1. Burn USDC on Solana

    Call the `depositForBurn` instruction from the `TokenMessengerMinterV2` program
    to burn USDC on Solana:

    ```ts TypeScript expandable theme={null}
    const DIRECT_MINT_DISCRIMINATOR = Buffer.from([
      215, 60, 61, 46, 114, 55, 128, 176,
    ]);

    async function burnUSDCOnSolana() {
      console.log("Burning USDC on Solana...");

      const addressEncoder = getAddressEncoder();

      // Get the sender's USDC token account (Associated Token Account PDA)
      const [senderUsdcAccount] = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM,
        seeds: [
          addressEncoder.encode(solanaKeypair.address),
          addressEncoder.encode(TOKEN_PROGRAM_ADDRESS),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      const destAddressBytes32 = Buffer.concat([
        Buffer.alloc(12),
        Buffer.from(ARC_DESTINATION_ADDRESS.slice(2), "hex"),
      ]);

      // Derive PDAs (Program Derived Addresses)
      const [senderAuthorityPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("sender_authority")],
      });

      const [denylistPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("denylist_account"),
          addressEncoder.encode(solanaKeypair.address),
        ],
      });

      const [messageTransmitter] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("message_transmitter")],
      });

      const [tokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_messenger")],
      });

      // NOTE: Domain is converted to string for PDA derivation in V2
      const [remoteTokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("remote_token_messenger"),
          new TextEncoder().encode(DESTINATION_DOMAIN.toString()),
        ],
      });

      const [tokenMinter] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_minter")],
      });

      const [localToken] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("local_token"),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      // Derive event authority PDAs for Anchor CPI events
      const [eventAuthority] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });

      const [messageTransmitterEventAuthority] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });

      const messageSentEventAccount = await generateKeyPairSigner();

      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(AMOUNT);

      const domainBuffer = Buffer.alloc(4);
      domainBuffer.writeUInt32LE(DESTINATION_DOMAIN);

      const maxFeeBuffer = Buffer.alloc(8);
      maxFeeBuffer.writeBigUInt64LE(MAX_FEE);

      const finalityBuffer = Buffer.alloc(4);
      finalityBuffer.writeUInt32LE(1000);

      const instructionData = new Uint8Array(
        Buffer.concat([
          DIRECT_MINT_DISCRIMINATOR,
          amountBuffer,
          domainBuffer,
          destAddressBytes32,
          Buffer.alloc(32),
          maxFeeBuffer,
          finalityBuffer,
        ]),
      );

      const depositForBurnIx = {
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        accounts: [
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: senderAuthorityPda, role: 0 },
          { address: senderUsdcAccount, role: 1 },
          { address: denylistPda, role: 0 },
          { address: messageTransmitter, role: 1 },
          { address: tokenMessenger, role: 0 },
          { address: remoteTokenMessenger, role: 0 },
          { address: tokenMinter, role: 0 },
          { address: localToken, role: 1 },
          { address: USDC_MINT, role: 1 },
          {
            address: messageSentEventAccount.address,
            role: 3,
            signer: messageSentEventAccount,
          },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: TOKEN_PROGRAM_ADDRESS, role: 0 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
          { address: eventAuthority, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: messageTransmitterEventAuthority, role: 0 },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
        ],
        data: instructionData,
      };

      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(solanaKeypair, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(depositForBurnIx, tx),
      );

      const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      await sendAndConfirmTransaction(signedTransaction as any, {
        commitment: "confirmed",
      });

      const signature = getSignatureFromTransaction(signedTransaction);
      console.log(`Burn transaction signature: ${signature}`);

      return signature;
    }
    ```

    ### 3.2. Retrieve attestation

    Retrieve the attestation required to complete the CCTP transfer by calling
    Circle's attestation API:

    ```ts TypeScript theme={null}
    async function retrieveAttestation(transactionSignature: string) {
      console.log("Retrieving attestation...");
      const url = `https://iris-api-sandbox.circle.com/v2/messages/5?transactionHash=${transactionSignature}`;

      while (true) {
        try {
          const response = await fetch(url, { method: "GET" });

          if (!response.ok) {
            if (response.status !== 404) {
              const text = await response.text().catch(() => "");
              console.error(
                "Error fetching attestation:",
                `${response.status} ${response.statusText}${
                  text ? ` - ${text}` : ""
                }`,
              );
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }

          const data = (await response.json()) as AttestationResponse;

          if (data?.messages?.[0]?.status === "complete") {
            console.log("Attestation retrieved successfully!");
            return data.messages[0];
          }

          console.log("Waiting for attestation...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("Error fetching attestation:", message);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
    ```

    ### 3.3. Mint USDC on Arc Testnet

    Call the `receiveMessage` function from the `MessageTransmitterV2` contract on
    Arc Testnet to mint USDC:

    ```ts TypeScript theme={null}
    async function mintUSDCOnArc(attestation: AttestationMessage) {
      console.log("Minting USDC on Arc testnet...");

      const mintTx = await arcClient.sendTransaction({
        to: ARC_MESSAGE_TRANSMITTER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "receiveMessage",
              stateMutability: "nonpayable",
              inputs: [
                { name: "message", type: "bytes" },
                { name: "attestation", type: "bytes" },
              ],
              outputs: [],
            },
          ],
          functionName: "receiveMessage",
          args: [
            attestation.message as `0x${string}`,
            attestation.attestation as `0x${string}`,
          ],
        }),
      });

      console.log(`Mint transaction hash: ${mintTx}`);
    }
    ```
  </Tab>
</Tabs>

## Step 4: Complete script

Create a `index.ts` file in your project directory and populate it with the
complete code below for the path you want to test.

<Tabs>
  <Tab title="Forwarding Service">
    ```ts index.ts expandable theme={null}
    import {
      address,
      createKeyPairSignerFromBytes,
      createSolanaRpc,
      createSolanaRpcSubscriptions,
      createTransactionMessage,
      generateKeyPairSigner,
      getAddressEncoder,
      getProgramDerivedAddress,
      getSignatureFromTransaction,
      pipe,
      sendAndConfirmTransactionFactory,
      setTransactionMessageFeePayerSigner,
      setTransactionMessageLifetimeUsingBlockhash,
      appendTransactionMessageInstruction,
      signTransactionMessageWithSigners,
    } from "@solana/kit";
    import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
    import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
    import { privateKeyToAccount } from "viem/accounts";

    type FeeQuote = {
      finalityThreshold: number;
      minimumFee: number;
      forwardFee: { med: number };
    };

    type BurnContext = {
      senderUsdcAccount: ReturnType<typeof address>;
      senderAuthorityPda: ReturnType<typeof address>;
      denylistPda: ReturnType<typeof address>;
      messageTransmitter: ReturnType<typeof address>;
      tokenMessenger: ReturnType<typeof address>;
      remoteTokenMessenger: ReturnType<typeof address>;
      tokenMinter: ReturnType<typeof address>;
      localToken: ReturnType<typeof address>;
      eventAuthority: ReturnType<typeof address>;
      messageTransmitterEventAuthority: ReturnType<typeof address>;
      messageSentEventAccount: Awaited<ReturnType<typeof generateKeyPairSigner>>;
      destAddressBytes32: Buffer;
    };

    const SOLANA_RPC = "https://api.devnet.solana.com";
    const SOLANA_WS = "wss://api.devnet.solana.com";
    const rpc = createSolanaRpc(SOLANA_RPC);
    const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WS);
    const solanaPrivateKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY!);
    const solanaKeypair = await createKeyPairSignerFromBytes(
      Uint8Array.from(solanaPrivateKey),
    );

    const TOKEN_MESSENGER_MINTER_PROGRAM = address(
      "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    );
    const MESSAGE_TRANSMITTER_PROGRAM = address(
      "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    );
    const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const ASSOCIATED_TOKEN_PROGRAM = address(
      "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    );

    const ethAccount = privateKeyToAccount(
      process.env.EVM_PRIVATE_KEY! as `0x${string}`,
    );
    const AMOUNT = 1_000_000n;
    const DESTINATION_DOMAIN = 26;
    const ARC_DESTINATION_ADDRESS = ethAccount.address;
    const FORWARDING_SERVICE_HOOK_DATA = Buffer.from(
      "636374702d666f72776172640000000000000000000000000000000000000000",
      "hex",
    );
    const FORWARDING_DISCRIMINATOR = Buffer.from([
      111, 245, 62, 131, 204, 108, 223, 155,
    ]);

    async function getForwardingFeeQuote() {
      const response = await fetch(
        "https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/5/26?forward=true",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fees: ${await response.text()}`);
      }

      const fees = (await response.json()) as FeeQuote[];
      const feeData = fees.find((fee) => fee.finalityThreshold === 1000);

      if (!feeData) {
        throw new Error("Fast-transfer forwarding fees not available");
      }

      return feeData;
    }

    async function calculateForwardingAmounts() {
      const feeData = await getForwardingFeeQuote();
      const forwardFee = BigInt(feeData.forwardFee.med);
      const protocolFee =
        (AMOUNT * BigInt(Math.round(feeData.minimumFee * 100))) / 1_000_000n;
      const maxFee = forwardFee + protocolFee;
      const totalAmount = AMOUNT + maxFee;

      console.log("Forward fee:", Number(forwardFee) / 1_000_000, "USDC");
      console.log("Protocol fee:", Number(protocolFee) / 1_000_000, "USDC");
      console.log("Max fee:", Number(maxFee) / 1_000_000, "USDC");
      console.log("Total to burn:", Number(totalAmount) / 1_000_000, "USDC");

      return { maxFee, totalAmount };
    }

    async function getBurnContext(): Promise<BurnContext> {
      const addressEncoder = getAddressEncoder();
      const [senderUsdcAccount] = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM,
        seeds: [
          addressEncoder.encode(solanaKeypair.address),
          addressEncoder.encode(TOKEN_PROGRAM_ADDRESS),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      const destAddressBytes32 = Buffer.concat([
        Buffer.alloc(12),
        Buffer.from(ARC_DESTINATION_ADDRESS.slice(2), "hex"),
      ]);

      const [senderAuthorityPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("sender_authority")],
      });
      const [denylistPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("denylist_account"),
          addressEncoder.encode(solanaKeypair.address),
        ],
      });
      const [messageTransmitter] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("message_transmitter")],
      });
      const [tokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_messenger")],
      });
      const [remoteTokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("remote_token_messenger"),
          new TextEncoder().encode(DESTINATION_DOMAIN.toString()),
        ],
      });
      const [tokenMinter] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_minter")],
      });
      const [localToken] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("local_token"),
          addressEncoder.encode(USDC_MINT),
        ],
      });
      const [eventAuthority] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });
      const [messageTransmitterEventAuthority] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });
      const messageSentEventAccount = await generateKeyPairSigner();

      return {
        senderUsdcAccount,
        senderAuthorityPda,
        denylistPda,
        messageTransmitter,
        tokenMessenger,
        remoteTokenMessenger,
        tokenMinter,
        localToken,
        eventAuthority,
        messageTransmitterEventAuthority,
        messageSentEventAccount,
        destAddressBytes32,
      };
    }

    async function burnUSDCWithForwarding(totalAmount: bigint, maxFee: bigint) {
      console.log("Burning USDC on Solana with Forwarding Service...");
      const burnContext = await getBurnContext();

      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(totalAmount);
      const domainBuffer = Buffer.alloc(4);
      domainBuffer.writeUInt32LE(DESTINATION_DOMAIN);
      const maxFeeBuffer = Buffer.alloc(8);
      maxFeeBuffer.writeBigUInt64LE(maxFee);
      const finalityBuffer = Buffer.alloc(4);
      finalityBuffer.writeUInt32LE(1000);
      const hookLengthBuffer = Buffer.alloc(4);
      hookLengthBuffer.writeUInt32LE(FORWARDING_SERVICE_HOOK_DATA.length);

      const instructionData = new Uint8Array(
        Buffer.concat([
          FORWARDING_DISCRIMINATOR,
          amountBuffer,
          domainBuffer,
          burnContext.destAddressBytes32,
          Buffer.alloc(32),
          maxFeeBuffer,
          finalityBuffer,
          hookLengthBuffer,
          FORWARDING_SERVICE_HOOK_DATA,
        ]),
      );

      const depositForBurnIx = {
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        accounts: [
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: burnContext.senderAuthorityPda, role: 0 },
          { address: burnContext.senderUsdcAccount, role: 1 },
          { address: burnContext.denylistPda, role: 0 },
          { address: burnContext.messageTransmitter, role: 1 },
          { address: burnContext.tokenMessenger, role: 0 },
          { address: burnContext.remoteTokenMessenger, role: 0 },
          { address: burnContext.tokenMinter, role: 0 },
          { address: burnContext.localToken, role: 1 },
          { address: USDC_MINT, role: 1 },
          {
            address: burnContext.messageSentEventAccount.address,
            role: 3,
            signer: burnContext.messageSentEventAccount,
          },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: TOKEN_PROGRAM_ADDRESS, role: 0 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
          { address: burnContext.eventAuthority, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: burnContext.messageTransmitterEventAuthority, role: 0 },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
        ],
        data: instructionData,
      };

      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(solanaKeypair, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(depositForBurnIx, tx),
      );
      const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      await sendAndConfirmTransaction(signedTransaction as any, {
        commitment: "confirmed",
      });

      const signature = getSignatureFromTransaction(signedTransaction);
      console.log(`Burn transaction signature: ${signature}`);
      return signature;
    }

    async function waitForForwardedMint(transactionSignature: string) {
      console.log("Waiting for Forwarding Service to mint on Arc...");

      while (true) {
        const response = await fetch(
          `https://iris-api-sandbox.circle.com/v2/messages/5?transactionHash=${transactionSignature}`,
          { method: "GET" },
        );

        if (!response.ok) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const data = await response.json();
        const forwardTxHash = data?.messages?.[0]?.forwardTxHash;

        if (forwardTxHash) {
          console.log(`Forwarded Mint Tx: ${forwardTxHash}`);
          return forwardTxHash;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    async function main() {
      console.log("Solana address:", solanaKeypair.address);
      console.log("Arc recipient:", ARC_DESTINATION_ADDRESS);

      // [1] Quote forwarding fees and derive the total source-chain burn amount.
      const { maxFee, totalAmount } = await calculateForwardingAmounts();

      // [2] Burn on Solana with the forwarding hook enabled.
      const burnSignature = await burnUSDCWithForwarding(totalAmount, maxFee);

      // [3] Poll until Iris returns the destination mint transaction hash.
      await waitForForwardedMint(burnSignature);
      console.log(
        "USDC transfer from Solana Devnet to Arc Testnet completed with Forwarding Service.",
      );
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Direct mint">
    ```ts index.ts expandable theme={null}
    import {
      address,
      createKeyPairSignerFromBytes,
      createSolanaRpc,
      createSolanaRpcSubscriptions,
      createTransactionMessage,
      generateKeyPairSigner,
      getAddressEncoder,
      getProgramDerivedAddress,
      getSignatureFromTransaction,
      pipe,
      sendAndConfirmTransactionFactory,
      setTransactionMessageFeePayerSigner,
      setTransactionMessageLifetimeUsingBlockhash,
      appendTransactionMessageInstruction,
      signTransactionMessageWithSigners,
    } from "@solana/kit";
    import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
    import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
    import { createWalletClient, http, encodeFunctionData } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { arcTestnet } from "viem/chains";

    interface AttestationMessage {
      message: string;
      attestation: string;
      status: string;
    }

    interface AttestationResponse {
      messages: AttestationMessage[];
    }

    const SOLANA_RPC = "https://api.devnet.solana.com";
    const SOLANA_WS = "wss://api.devnet.solana.com";
    const rpc = createSolanaRpc(SOLANA_RPC);
    const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WS);
    const solanaPrivateKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY!);
    const solanaKeypair = await createKeyPairSignerFromBytes(
      Uint8Array.from(solanaPrivateKey),
    );

    // Solana CCTP Program Addresses (Devnet)
    const TOKEN_MESSENGER_MINTER_PROGRAM = address(
      "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    );
    const MESSAGE_TRANSMITTER_PROGRAM = address(
      "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    );
    const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const ASSOCIATED_TOKEN_PROGRAM = address(
      "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    );

    const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY!;
    const ethAccount = privateKeyToAccount(EVM_PRIVATE_KEY as `0x${string}`);
    const ARC_MESSAGE_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
    const arcClient = createWalletClient({
      chain: arcTestnet,
      transport: http(),
      account: ethAccount,
    });

    const AMOUNT = 1_000_000n;
    const DESTINATION_DOMAIN = 26;
    const ARC_DESTINATION_ADDRESS = ethAccount.address;
    const MAX_FEE = 500n;
    const DIRECT_MINT_DISCRIMINATOR = Buffer.from([
      215, 60, 61, 46, 114, 55, 128, 176,
    ]);

    async function burnUSDCOnSolana() {
      console.log("Burning USDC on Solana...");

      const addressEncoder = getAddressEncoder();

      const [senderUsdcAccount] = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM,
        seeds: [
          addressEncoder.encode(solanaKeypair.address),
          addressEncoder.encode(TOKEN_PROGRAM_ADDRESS),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      const destAddressBytes32 = Buffer.concat([
        Buffer.alloc(12),
        Buffer.from(ARC_DESTINATION_ADDRESS.slice(2), "hex"),
      ]);

      const [senderAuthorityPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("sender_authority")],
      });

      const [denylistPda] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("denylist_account"),
          addressEncoder.encode(solanaKeypair.address),
        ],
      });

      const [messageTransmitter] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("message_transmitter")],
      });

      const [tokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_messenger")],
      });

      const [remoteTokenMessenger] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("remote_token_messenger"),
          new TextEncoder().encode(DESTINATION_DOMAIN.toString()),
        ],
      });

      const [tokenMinter] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("token_minter")],
      });

      const [localToken] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [
          new TextEncoder().encode("local_token"),
          addressEncoder.encode(USDC_MINT),
        ],
      });

      const [eventAuthority] = await getProgramDerivedAddress({
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });

      const [messageTransmitterEventAuthority] = await getProgramDerivedAddress({
        programAddress: MESSAGE_TRANSMITTER_PROGRAM,
        seeds: [new TextEncoder().encode("__event_authority")],
      });

      const messageSentEventAccount = await generateKeyPairSigner();

      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(AMOUNT);

      const domainBuffer = Buffer.alloc(4);
      domainBuffer.writeUInt32LE(DESTINATION_DOMAIN);

      const maxFeeBuffer = Buffer.alloc(8);
      maxFeeBuffer.writeBigUInt64LE(MAX_FEE);

      const finalityBuffer = Buffer.alloc(4);
      finalityBuffer.writeUInt32LE(1000);

      const instructionData = new Uint8Array(
        Buffer.concat([
          DIRECT_MINT_DISCRIMINATOR,
          amountBuffer,
          domainBuffer,
          destAddressBytes32,
          Buffer.alloc(32),
          maxFeeBuffer,
          finalityBuffer,
        ]),
      );

      const depositForBurnIx = {
        programAddress: TOKEN_MESSENGER_MINTER_PROGRAM,
        accounts: [
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: solanaKeypair.address, role: 3, signer: solanaKeypair },
          { address: senderAuthorityPda, role: 0 },
          { address: senderUsdcAccount, role: 1 },
          { address: denylistPda, role: 0 },
          { address: messageTransmitter, role: 1 },
          { address: tokenMessenger, role: 0 },
          { address: remoteTokenMessenger, role: 0 },
          { address: tokenMinter, role: 0 },
          { address: localToken, role: 1 },
          { address: USDC_MINT, role: 1 },
          {
            address: messageSentEventAccount.address,
            role: 3,
            signer: messageSentEventAccount,
          },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: TOKEN_PROGRAM_ADDRESS, role: 0 },
          { address: SYSTEM_PROGRAM_ADDRESS, role: 0 },
          { address: eventAuthority, role: 0 },
          { address: TOKEN_MESSENGER_MINTER_PROGRAM, role: 0 },
          { address: messageTransmitterEventAuthority, role: 0 },
          { address: MESSAGE_TRANSMITTER_PROGRAM, role: 0 },
        ],
        data: instructionData,
      };

      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(solanaKeypair, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(depositForBurnIx, tx),
      );

      const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      await sendAndConfirmTransaction(signedTransaction as any, {
        commitment: "confirmed",
      });

      const signature = getSignatureFromTransaction(signedTransaction);
      console.log(`Burn transaction signature: ${signature}`);

      return signature;
    }

    async function retrieveAttestation(transactionSignature: string) {
      console.log("Retrieving attestation...");
      const url = `https://iris-api-sandbox.circle.com/v2/messages/5?transactionHash=${transactionSignature}`;

      while (true) {
        try {
          const response = await fetch(url, { method: "GET" });

          if (!response.ok) {
            if (response.status !== 404) {
              const text = await response.text().catch(() => "");
              console.error(
                "Error fetching attestation:",
                `${response.status} ${response.statusText}${
                  text ? ` - ${text}` : ""
                }`,
              );
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }

          const data = (await response.json()) as AttestationResponse;

          if (data?.messages?.[0]?.status === "complete") {
            console.log("Attestation retrieved successfully!");
            return data.messages[0];
          }

          console.log("Waiting for attestation...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("Error fetching attestation:", message);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    async function mintUSDCOnArc(attestation: AttestationMessage) {
      console.log("Minting USDC on Arc testnet...");

      const mintTx = await arcClient.sendTransaction({
        to: ARC_MESSAGE_TRANSMITTER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "receiveMessage",
              stateMutability: "nonpayable",
              inputs: [
                { name: "message", type: "bytes" },
                { name: "attestation", type: "bytes" },
              ],
              outputs: [],
            },
          ],
          functionName: "receiveMessage",
          args: [
            attestation.message as `0x${string}`,
            attestation.attestation as `0x${string}`,
          ],
        }),
      });

      console.log(`Mint transaction hash: ${mintTx}`);
    }

    async function main() {
      // [1] Burn USDC on Solana Devnet.
      const burnSignature = await burnUSDCOnSolana();

      // [2] Poll until Iris returns a complete attestation.
      const attestation = await retrieveAttestation(burnSignature);

      // [3] Submit the destination-side mint on Arc Testnet.
      await mintUSDCOnArc(attestation);
      console.log("USDC transfer from Solana Devnet to Arc Testnet completed.");
    }

    main().catch(console.error);
    ```
  </Tab>
</Tabs>

## Step 5: Test the script

Run the following command to execute the script:

```shell Shell theme={null}
npm run start
```

Once the script runs and the transfer is finalized, a confirmation message is
logged in the console.

<Note>
  **Rate limit:** The attestation service rate limit is 35 requests per second. If
  you exceed this limit, the service blocks all API requests for the next 5
  minutes and returns an HTTP 429 (Too Many Requests) response.
</Note>
