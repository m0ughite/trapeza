> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Transfer USDC from Ethereum to Arc

> Build a script to transfer USDC between EVM blockchains using CCTP

export const sourceChain_0 = "Ethereum Sepolia testnet"

export const destinationChain_0 = "Arc testnet"

This guide demonstrates how to transfer USDC from Ethereum Sepolia to Arc
testnet using CCTP. You use the [viem](https://viem.sh/) framework to interact
with [CCTP contracts](/cctp/references/contract-addresses) and the
[CCTP API](/api-reference/cctp/all/get-messages-v2) to retrieve attestations.

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
* Prepared an EVM testnet wallet with the private key available
  * Added Arc testnet network to your wallet
    ([network details](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup))
* Funded your wallet with the following testnet tokens:
  * Sepolia ETH (native token) from a
    [public faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
  * Sepolia USDC from the [Circle Faucet](https://faucet.circle.com)
  * Arc testnet USDC from the [Circle Faucet](https://faucet.circle.com) if you
    choose the direct mint path below, because the destination wallet must pay
    gas to call `receiveMessage`

## Step 1. Set up the project

### 1.1. Create the project and install dependencies

```shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir cctp-evm-transfer
cd cctp-evm-transfer
npm init -y

# Set up module type and start command
npm pkg set type=module
npm pkg set scripts.start="tsx --env-file=.env index.ts"

# Install runtime dependencies
npm install viem

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
PRIVATE_KEY=YOUR_ETHEREUM_SEPOLIA_PRIVATE_KEY
```

* `PRIVATE_KEY` is the private key for the Ethereum Sepolia EOA that signs the
  source-chain approval and burn transactions. The direct-mint path also uses
  the same key to submit the destination mint on Arc.

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

This section covers the necessary setup for the transfer script, including
defining keys and addresses, and configuring the wallet client for interacting
with the source and destination chains.

### 2.1. Define configuration constants

The script predefines the contract addresses, transfer amount, and maximum fee.
Update the `DESTINATION_ADDRESS` with your wallet address.

For simplicity, this quickstart uses the same EOA as the Ethereum Sepolia source
signer and the Arc recipient. In production, these can be different addresses.

```ts TypeScript theme={null}
// Authentication
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// Contract Addresses
const ETHEREUM_SEPOLIA_USDC = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
  "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
const ARC_TESTNET_MESSAGE_TRANSMITTER =
  "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

// Transfer Parameters
const DESTINATION_ADDRESS = account.address; // Address to receive minted tokens on destination chain
const AMOUNT = 1_000_000n; // 1 USDC (1 USDC = 1,000,000 subunits)
const maxFee = 500n; // 0.0005 USDC (500 subunits)

// Bytes32 Formatted Parameters
const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${DESTINATION_ADDRESS.slice(
  2,
)}`; // Destination address in bytes32 format
const DESTINATION_CALLER_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000"; // Empty bytes32 allows any address to call MessageTransmitterV2.receiveMessage()

// Chain-specific Parameters
const ETHEREUM_SEPOLIA_DOMAIN = 0; // Source domain ID for Ethereum Sepolia
const ARC_TESTNET_DOMAIN = 26; // Destination domain ID for Arc testnet
```

### 2.2. Set up wallet clients

The wallet client configures the appropriate network settings using `viem`. The
direct-mint path below uses clients for both Ethereum Sepolia and Arc testnet.
The [Forwarding Service](/cctp/concepts/forwarding-service) path only needs the
source-chain client on Ethereum Sepolia.

```ts TypeScript theme={null}
// Set up the wallet clients
const sepoliaClient = createWalletClient({
  chain: sepolia,
  transport: http(),
  account,
});

const arcClient = createWalletClient({
  chain: arcTestnet,
  transport: http(),
  account,
});
```

## Step 3: Implement the transfer logic

The following sections outline the core transfer logic.

The path diverges at the source-chain burn transaction:

* **Direct mint** uses `depositForBurn`, then retrieves an attestation and calls
  `receiveMessage` on Arc.
* **Forwarding Service** uses `depositForBurnWithHook`, then lets Circle handle
  the destination-side mint on Arc.

<Tabs>
  <Tab title="Forwarding Service">
    ### 3.1. Get forwarding fees and calculate the burn amount

    Before you burn USDC with the Forwarding Service, query the CCTP fee endpoint
    with `forward=true`. The forwarding fee is dynamic, so fetch it immediately
    before the transfer. The returned `maxFee` must cover both the CCTP protocol fee
    and the forwarding fee.

    ```ts TypeScript theme={null}
    const FORWARDING_SERVICE_HOOK_DATA =
      "0x636374702d666f72776172640000000000000000000000000000000000000000" as `0x${string}`;

    async function getForwardingFees() {
      const response = await fetch(
        `https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/${ETHEREUM_SEPOLIA_DOMAIN}/${ARC_TESTNET_DOMAIN}?forward=true`,
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

    ### 3.2. Approve the total burn amount

    Approve the total amount you will burn on the source chain. For the forwarding
    path, that is the transfer amount plus the forwarding and protocol fees.

    ```ts TypeScript theme={null}
    async function approveUSDC(amount: bigint) {
      console.log("Approving USDC transfer...");
      const approveTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_USDC,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, amount],
        }),
      });
      console.log(`USDC Approval Tx: ${approveTx}`);
    }
    ```

    ### 3.3. Burn USDC with the Forwarding Service hook

    Use `depositForBurnWithHook` on the source chain. The forwarding hook data tells
    Circle to handle the destination-side `receiveMessage` call on Arc.

    ```ts TypeScript theme={null}
    async function burnUSDCWithForwarding(totalAmount: bigint, maxFee: bigint) {
      console.log("Burning USDC on Ethereum Sepolia with Forwarding Service...");

      const burnTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "depositForBurnWithHook",
              stateMutability: "nonpayable",
              inputs: [
                { name: "amount", type: "uint256" },
                { name: "destinationDomain", type: "uint32" },
                { name: "mintRecipient", type: "bytes32" },
                { name: "burnToken", type: "address" },
                { name: "destinationCaller", type: "bytes32" },
                { name: "maxFee", type: "uint256" },
                { name: "minFinalityThreshold", type: "uint32" },
                { name: "hookData", type: "bytes" },
              ],
              outputs: [],
            },
          ],
          functionName: "depositForBurnWithHook",
          args: [
            totalAmount,
            ARC_TESTNET_DOMAIN,
            DESTINATION_ADDRESS_BYTES32,
            ETHEREUM_SEPOLIA_USDC,
            DESTINATION_CALLER_BYTES32,
            maxFee,
            1000,
            FORWARDING_SERVICE_HOOK_DATA,
          ],
        }),
      });

      console.log(`Burn Tx: ${burnTx}`);
      return burnTx;
    }
    ```

    ### 3.4. Verify the forwarded mint

    After the burn is confirmed, poll the Iris API until it returns a
    `forwardTxHash`. That hash is the Arc destination mint transaction submitted by
    Circle. In the forwarding path, `forwardTxHash` is the completion signal for the
    destination-side mint. You do not need to retrieve an attestation and call
    `receiveMessage` yourself.

    ```ts TypeScript theme={null}
    async function waitForForwardedMint(transactionHash: string) {
      console.log("Waiting for Forwarding Service to mint on Arc...");

      while (true) {
        const response = await fetch(
          `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`,
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
    ### 3.1. Approve USDC

    Grant approval for the
    [`TokenMessengerV2` contract](/cctp/references/contract-addresses) deployed on
    Ethereum Sepolia to withdraw USDC from your wallet. This allows the contract to
    burn USDC when you initiate the transfer.

    ```ts TypeScript theme={null}
    async function approveUSDC() {
      console.log("Approving USDC transfer...");
      const approveTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_USDC,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, 10_000_000n], // 10 USDC allowance
        }),
      });
      console.log(`USDC Approval Tx: ${approveTx}`);
    }
    ```

    ### 3.2. Burn USDC

    Call the `depositForBurn` function from the
    [`TokenMessengerV2` contract](/cctp/references/contract-interfaces#depositforburn)
    deployed on Ethereum Sepolia to burn USDC on that source chain. You specify the
    following parameters:

    * **Burn amount**: The amount of USDC to burn
    * **Destination domain**: The target blockchain for minting USDC (see
      [supported chains and domains](/cctp/concepts/supported-chains-and-domains))
    * **Mint recipient**: The wallet address that will receive the minted USDC
    * **Burn token**: The contract address of the USDC token being burned on the
      source chain
    * **Destination caller**: The address on the target chain to call
      `receiveMessage`
    * **Max fee**: The maximum [fee](/cctp/concepts/fees) allowed for the transfer
    * **Finality threshold**: Determines whether it's a
      [Fast Transfer](/cctp/concepts/finality-and-block-confirmations#fast-transfer-attestation-times)
      (1000 or less) or a
      [Standard Transfer](/cctp/concepts/finality-and-block-confirmations#standard-transfer-attestation-times)
      (2000 or more)

    ```ts TypeScript theme={null}
    async function burnUSDC() {
      console.log("Burning USDC on Ethereum Sepolia...");
      const burnTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "depositForBurn",
              stateMutability: "nonpayable",
              inputs: [
                { name: "amount", type: "uint256" },
                { name: "destinationDomain", type: "uint32" },
                { name: "mintRecipient", type: "bytes32" },
                { name: "burnToken", type: "address" },
                { name: "destinationCaller", type: "bytes32" },
                { name: "maxFee", type: "uint256" },
                { name: "minFinalityThreshold", type: "uint32" },
              ],
              outputs: [],
            },
          ],
          functionName: "depositForBurn",
          args: [
            AMOUNT,
            ARC_TESTNET_DOMAIN,
            DESTINATION_ADDRESS_BYTES32,
            ETHEREUM_SEPOLIA_USDC,
            DESTINATION_CALLER_BYTES32,
            maxFee,
            1000, // minFinalityThreshold (1000 or less for Fast Transfer)
          ],
        }),
      });
      console.log(`Burn Tx: ${burnTx}`);
      return burnTx;
    }
    ```

    ### 3.3. Retrieve attestation

    Retrieve the attestation required to complete the CCTP transfer by calling
    Circle's attestation API.

    * Call Circle's [`GET /v2/messages`](/api-reference/cctp/all/get-messages-v2)
      API endpoint to retrieve the attestation.
    * Pass the `srcDomain` argument from the
      [CCTP domain](/cctp/concepts/supported-chains-and-domains#domain-identifiers)
      for your source chain.
    * Pass `transactionHash` from the value returned by `sendTransaction` within the
      `burnUSDC` function above.

    ```ts TypeScript theme={null}
    async function retrieveAttestation(transactionHash: string) {
      console.log("Retrieving attestation...");
      const url = `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`;
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

    ### 3.4. Mint USDC

    Call the
    [`receiveMessage` function](/cctp/references/contract-interfaces#receivemessage)
    from the [`MessageTransmitterV2` contract](/cctp/references/contract-addresses)
    deployed on the Arc testnet to mint USDC on that destination chain.

    * Pass the signed attestation and the message data as parameters.
    * The function processes the attestation and mints USDC to the specified Arc
      testnet wallet address.

    ```ts TypeScript theme={null}
    async function mintUSDC(attestation: AttestationMessage) {
      console.log("Minting USDC on Arc testnet...");
      const mintTx = await arcClient.sendTransaction({
        to: ARC_TESTNET_MESSAGE_TRANSMITTER,
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
      console.log(`Mint Tx: ${mintTx}`);
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
      createPublicClient,
      createWalletClient,
      http,
      encodeFunctionData,
      pad,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { sepolia } from "viem/chains";

    type FeeQuote = {
      finalityThreshold: number;
      minimumFee: number;
      forwardFee: { med: number };
    };

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    const ETHEREUM_SEPOLIA_USDC = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
    const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
      "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";

    const DESTINATION_ADDRESS = account.address;
    const AMOUNT = 1_000_000n;
    const ETHEREUM_SEPOLIA_DOMAIN = 0;
    const ARC_TESTNET_DOMAIN = 26;
    const DESTINATION_ADDRESS_BYTES32 = pad(DESTINATION_ADDRESS, { size: 32 });
    const DESTINATION_CALLER_BYTES32 = pad("0x", { size: 32 });
    const FORWARDING_SERVICE_HOOK_DATA =
      "0x636374702d666f72776172640000000000000000000000000000000000000000" as `0x${string}`;

    const sepoliaClient = createWalletClient({
      chain: sepolia,
      transport: http(),
      account,
    });
    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    async function approveUSDC(amount: bigint) {
      console.log("Approving USDC transfer...");
      const approveTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_USDC,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, amount],
        }),
      });
      console.log(`USDC Approval Tx: ${approveTx}`);
      await sepoliaPublicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    async function getForwardingFeeQuote() {
      const response = await fetch(
        `https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/${ETHEREUM_SEPOLIA_DOMAIN}/${ARC_TESTNET_DOMAIN}?forward=true`,
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

    async function burnUSDCWithForwarding(totalAmount: bigint, maxFee: bigint) {
      console.log("Burning USDC on Ethereum Sepolia with Forwarding Service...");
      const burnTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "depositForBurnWithHook",
              stateMutability: "nonpayable",
              inputs: [
                { name: "amount", type: "uint256" },
                { name: "destinationDomain", type: "uint32" },
                { name: "mintRecipient", type: "bytes32" },
                { name: "burnToken", type: "address" },
                { name: "destinationCaller", type: "bytes32" },
                { name: "maxFee", type: "uint256" },
                { name: "minFinalityThreshold", type: "uint32" },
                { name: "hookData", type: "bytes" },
              ],
              outputs: [],
            },
          ],
          functionName: "depositForBurnWithHook",
          args: [
            totalAmount,
            ARC_TESTNET_DOMAIN,
            DESTINATION_ADDRESS_BYTES32,
            ETHEREUM_SEPOLIA_USDC,
            DESTINATION_CALLER_BYTES32,
            maxFee,
            1000,
            FORWARDING_SERVICE_HOOK_DATA,
          ],
        }),
      });

      console.log(`Burn Tx: ${burnTx}`);
      return burnTx;
    }

    async function waitForForwardedMint(transactionHash: string) {
      console.log("Waiting for Forwarding Service to mint on Arc...");

      while (true) {
        const response = await fetch(
          `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`,
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
      console.log("Wallet address:", account.address);

      // [1] Quote forwarding fees and derive the total source-chain burn amount.
      const { maxFee, totalAmount } = await calculateForwardingAmounts();

      // [2] Approve the total burn amount, including forwarding and protocol fees.
      await approveUSDC(totalAmount);

      // [3] Burn on the source chain with the forwarding hook enabled.
      const burnTx = await burnUSDCWithForwarding(totalAmount, maxFee);

      // [4] Poll until Iris returns the destination mint transaction hash.
      await waitForForwardedMint(burnTx);
      console.log("USDC transfer completed with Forwarding Service.");
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Direct mint">
    ```ts index.ts expandable theme={null}
    import {
      createPublicClient,
      createWalletClient,
      http,
      encodeFunctionData,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { arcTestnet, sepolia } from "viem/chains";

    interface AttestationMessage {
      message: string;
      attestation: string;
      status: string;
    }

    interface AttestationResponse {
      messages: AttestationMessage[];
    }

    // ============ Configuration Constants ============
    // Authentication
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    // Contract Addresses
    const ETHEREUM_SEPOLIA_USDC = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
    const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
      "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
    const ARC_TESTNET_MESSAGE_TRANSMITTER =
      "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

    // Transfer Parameters
    const DESTINATION_ADDRESS = account.address; // Address to receive minted tokens on destination chain
    const AMOUNT = 1_000_000n; // 1 USDC (1 USDC = 1,000,000 subunits)
    const maxFee = 500n; // 0.0005 USDC (500 subunits)

    // Bytes32 Formatted Parameters
    const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${DESTINATION_ADDRESS.slice(
      2,
    )}`; // Destination address in bytes32 format
    const DESTINATION_CALLER_BYTES32 =
      "0x0000000000000000000000000000000000000000000000000000000000000000"; // Empty bytes32 allows any address to call MessageTransmitterV2.receiveMessage()

    // Chain-specific Parameters
    const ETHEREUM_SEPOLIA_DOMAIN = 0; // Source domain ID for Ethereum Sepolia
    const ARC_TESTNET_DOMAIN = 26; // Destination domain ID for Arc testnet

    // Set up wallet clients
    const sepoliaClient = createWalletClient({
      chain: sepolia,
      transport: http(),
      account,
    });
    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    const arcClient = createWalletClient({
      chain: arcTestnet,
      transport: http(),
      account,
    });

    // ============ CCTP Flow Functions ============
    async function approveUSDC() {
      console.log("Approving USDC transfer...");
      const approveTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_USDC,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, 10_000_000n], // 10 USDC allowance
        }),
      });
      console.log(`USDC Approval Tx: ${approveTx}`);
      await sepoliaPublicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    async function burnUSDC() {
      console.log("Burning USDC on Ethereum Sepolia...");
      const burnTx = await sepoliaClient.sendTransaction({
        to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "depositForBurn",
              stateMutability: "nonpayable",
              inputs: [
                { name: "amount", type: "uint256" },
                { name: "destinationDomain", type: "uint32" },
                { name: "mintRecipient", type: "bytes32" },
                { name: "burnToken", type: "address" },
                { name: "destinationCaller", type: "bytes32" },
                { name: "maxFee", type: "uint256" },
                { name: "minFinalityThreshold", type: "uint32" },
              ],
              outputs: [],
            },
          ],
          functionName: "depositForBurn",
          args: [
            AMOUNT,
            ARC_TESTNET_DOMAIN,
            DESTINATION_ADDRESS_BYTES32 as `0x${string}`,
            ETHEREUM_SEPOLIA_USDC,
            DESTINATION_CALLER_BYTES32,
            maxFee,
            1000, // minFinalityThreshold (1000 or less for Fast Transfer)
          ],
        }),
      });
      console.log(`Burn Tx: ${burnTx}`);
      return burnTx;
    }

    async function retrieveAttestation(transactionHash: string) {
      console.log("Retrieving attestation...");
      const url = `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`;
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

    async function mintUSDC(attestation: AttestationMessage) {
      console.log("Minting USDC on Arc testnet...");
      const mintTx = await arcClient.sendTransaction({
        to: ARC_TESTNET_MESSAGE_TRANSMITTER,
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
      console.log(`Mint Tx: ${mintTx}`);
    }

    // ============ Main Execution ============
    async function main() {
      await approveUSDC();
      const burnTx = await burnUSDC();
      const attestation = await retrieveAttestation(burnTx);
      await mintUSDC(attestation);
      console.log("USDC transfer completed.");
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

Once the script runs and the transfer is finalized, a confirmation receipt is
logged in the console.

<Note>
  **Rate limit:** The attestation service rate limit is 35 requests per second. If
  you exceed this limit, the service blocks all API requests for the next 5
  minutes and returns an HTTP 429 (Too Many Requests) response.
</Note>
