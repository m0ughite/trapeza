> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Transfer EURC on EVM chains

> Transfer EURC between wallets on EVM chains using a Node.js script

This guide walks you through transferring EURC on EVM testnets using Viem and
Node.js. You'll build a simple script that checks your balance and sends test
transfers.

## Prerequisites

Before you begin, ensure that you've:

* Installed [Node.js v22+](https://nodejs.org/)
* Prepared a testnet wallet on the selected chain funded with:
  * Testnet EURC for the transfer
  * Testnet native tokens for gas fees

<Note>
  You can get testnet EURC from [Circle's faucet](https://faucet.circle.com/).
</Note>

## Step 1. Set up the project

This step shows you how to prepare your project and environment.

### 1.1. Create the project and install dependencies

Create a new directory and install the required dependencies:

```bash Shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir transfer-eurc-evm
cd transfer-eurc-evm
npm init -y

# Set up module type and start command
npm pkg set type=module
npm pkg set scripts.start="npx tsx --env-file=.env index.ts"

# Install runtime dependencies
npm install viem tsx

# Install dev dependencies
npm install --save-dev typescript @types/node
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

Create a `.env` file in the project directory and add your wallet private key,
replacing `{YOUR_PRIVATE_KEY}` with the private key from your EVM wallet and
`{YOUR_RECIPIENT_ADDRESS}` with the address of the recipient.

```text theme={null}
PRIVATE_KEY={YOUR_PRIVATE_KEY}
RECIPIENT_ADDRESS={YOUR_RECIPIENT_ADDRESS}
```

* `PRIVATE_KEY` is the private key for the EVM wallet sending the transfer.
* `RECIPIENT_ADDRESS` is the EVM wallet address that will receive the EURC.

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

## Step 2. Create the transfer script

In this step, you'll build a script in TypeScript that transfers EURC on the
selected EVM testnet. The script includes a single list of supported chains,
prompts you to choose one at runtime, and then runs the same transfer flow for
that chain.

### 2.1. Create the script file

```shell theme={null}
touch index.ts
```

### 2.2. Add the script

In `index.ts`, add the following script. It keeps the per-chain data in one
`CHAIN_CONFIGS` list so supporting another EVM testnet only requires one new
entry.

```typescript TypeScript expandable theme={null}
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  isAddress,
  isHex,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  arcTestnet,
  avalancheFuji,
  baseSepolia,
  sepolia,
  worldchainSepolia,
} from "viem/chains";

const EURC_DECIMALS = 6;
const EURC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Store each supported chain in one place so the transfer flow stays shared.
const CHAIN_CONFIGS = [
  {
    id: "arc-testnet",
    name: "Arc Testnet",
    chain: arcTestnet,
    tokenAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  },
  {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chain: avalancheFuji,
    tokenAddress: "0x5E44db7996c682E92a960b65AC713a54AD815c6B",
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chain: baseSepolia,
    tokenAddress: "0x808456652fdb597867f38412077A9182bf77359F",
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chain: sepolia,
    tokenAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
  },
  {
    id: "world-chain-sepolia",
    name: "World Chain Sepolia",
    chain: worldchainSepolia,
    tokenAddress: "0xe479EcA5740Ac65d6E1823bea2f1C08Bc14e954F",
  },
] as const;

const { PRIVATE_KEY, RECIPIENT_ADDRESS } = process.env;

if (!PRIVATE_KEY || !isHex(PRIVATE_KEY) || PRIVATE_KEY.length !== 66) {
  throw new Error(
    "PRIVATE_KEY must be a 0x-prefixed 32-byte hex string (66 chars)",
  );
}

if (!RECIPIENT_ADDRESS || !isAddress(RECIPIENT_ADDRESS)) {
  throw new Error("RECIPIENT_ADDRESS must be a valid EVM address");
}

const privateKey: `0x${string}` = PRIVATE_KEY;
const recipientAddress: `0x${string}` = RECIPIENT_ADDRESS;

async function selectChain() {
  // Prompt for a chain so one script can support every listed testnet.
  const chainList = CHAIN_CONFIGS.map(
    (chain, index) => `${index + 1}. ${chain.name}`,
  ).join("\n");
  const readline = createInterface({ input, output });

  try {
    const answer = await readline.question(
      "Select a chain for your EURC transfer:\n" +
        chainList +
        "\n\nEnter a number: ",
    );

    const selectedIndex = Number.parseInt(answer, 10) - 1;
    const selectedChain = CHAIN_CONFIGS[selectedIndex];

    if (!selectedChain) {
      throw new Error("Invalid chain selection");
    }

    return selectedChain;
  } finally {
    readline.close();
  }
}

async function main() {
  try {
    const selectedChain = await selectChain();
    const account = privateKeyToAccount(privateKey);

    // Create clients for the selected chain.
    const publicClient = createPublicClient({
      chain: selectedChain.chain,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: selectedChain.chain,
      transport: http(),
    });

    // Read the sender's token balance before attempting the transfer.
    const balance = await publicClient.readContract({
      address: selectedChain.tokenAddress,
      abi: EURC_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    const balanceFormatted = Number(
      formatUnits(balance as bigint, EURC_DECIMALS),
    );
    const amount = 1; // Send 1 EURC in this example.

    console.log("Chain:", selectedChain.name);
    console.log("Sender:", account.address);
    console.log("Recipient:", recipientAddress);
    console.log("Balance:", balanceFormatted, "EURC");

    if (amount > balanceFormatted) {
      throw new Error("Insufficient balance");
    }

    const amountInDecimals = parseUnits(amount.toString(), EURC_DECIMALS);

    // Submit the transfer transaction.
    const hash = await walletClient.writeContract({
      address: selectedChain.tokenAddress,
      abi: EURC_ABI,
      functionName: "transfer",
      args: [recipientAddress, amountInDecimals],
    });

    console.log("Transaction submitted.");
    console.log("Tx hash:", hash);
    console.log(
      "Explorer:",
      `${selectedChain.chain.blockExplorers?.default.url}/tx/${hash}`,
    );

    // Wait for the transaction to be confirmed onchain.
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      throw new Error("Transaction reverted");
    }

    console.log("Transfer confirmed!");
  } catch (err) {
    console.error("Transfer failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
```

## Step 3. Run the script

Run the script using the following command:

```shell Shell theme={null}
npm start
```

You'll see output similar to the following:

```text theme={null}
Select a chain for your EURC transfer:
1. Arc Testnet
2. Avalanche Fuji
...

Enter a number: 3
Chain: Base Sepolia
Sender: 0x1A2b...7890
Recipient: 0x9F8f...1234
Balance: 250.0 EURC
Transaction submitted.
Tx hash: 0xabc123...def456
Explorer: https://sepolia.basescan.org/tx/0xabc123...def456
Transfer confirmed!
```

To verify the transfer, copy the transaction hash URL from the `Explorer:` line
and open it in your browser. This will take you to the testnet's block explorer,
where you can view full transaction details.

<Tip>
  **Tip:** If your script doesn't output a full explorer URL, you can manually
  paste the transaction hash into the testnet's block explorer.
</Tip>

## Summary

In this quickstart, you learned how to check balances and transfer EURC on EVM
testnets using one multi-chain Viem script in Node.js. Here are the key points
to remember:

* **Testnet only**. Testnet EURC has no real value.
* **Gas fees**. You need a small amount of the testnet's native token for gas.
* **Security**. Keep your private key in `.env`. Never commit secrets.
* **Single script**. The same script works across all supported EVM testnets.
* **Minimal ABI**. The script only uses `balanceOf` and `transfer` for
  simplicity.
