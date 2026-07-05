> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Transfer USDC on EVM chains

> Transfer USDC between wallets on EVM chains using a Node.js script

This guide walks you through transferring USDC on EVM testnets using Viem and
Node.js. You'll build a simple script that checks your balance and sends test
transfers.

## Prerequisites

Before you begin, ensure that you've:

* Installed [Node.js v22+](https://nodejs.org/)
* Prepared a testnet wallet on the selected chain funded with:
  * Testnet USDC for the transfer
  * Testnet native tokens for gas fees

<Note>
  You can get testnet USDC from [Circle's faucet](https://faucet.circle.com/).
</Note>

## Step 1. Set up the project

This step shows you how to prepare your project and environment.

### 1.1. Create the project and install dependencies

Create a new directory and install the required dependencies:

```bash Shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir transfer-usdc-evm
cd transfer-usdc-evm
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
* `RECIPIENT_ADDRESS` is the EVM wallet address that will receive the USDC.

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

In this step, you'll build a script in TypeScript that transfers USDC on the
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
  defineChain,
  formatUnits,
  http,
  isAddress,
  isHex,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  arcTestnet,
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  celoSepolia,
  codexTestnet,
  hyperliquidEvmTestnet,
  injectiveTestnet,
  inkSepolia,
  lineaSepolia,
  monadTestnet,
  optimismSepolia,
  plumeSepolia,
  polygonAmoy,
  seiTestnet,
  sepolia,
  sonicTestnet,
  unichainSepolia,
  worldchainSepolia,
  xdcTestnet,
  zkSyncSepoliaTestnet,
} from "viem/chains";

const USDC_DECIMALS = 6;
const USDC_ABI = [
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
    tokenAddress: "0x3600000000000000000000000000000000000000",
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chain: arbitrumSepolia,
    tokenAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
  {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chain: avalancheFuji,
    tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chain: baseSepolia,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  {
    id: "celo-sepolia",
    name: "Celo Sepolia",
    chain: celoSepolia,
    tokenAddress: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
  },
  {
    id: "codex-testnet",
    name: "Codex Testnet",
    chain: codexTestnet,
    tokenAddress: "0x6d7f141b6819C2c9CC2f818e6ad549E7Ca090F8f",
  },
  {
    id: "edge-testnet",
    name: "Edge Testnet",
    chain: defineChain({
      id: 33431,
      name: "Edge Testnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: ["https://edge-testnet.g.alchemy.com/public"] },
      },
      blockExplorers: {
        default: {
          name: "Edge Testnet Explorer",
          url: "https://edge-testnet.explorer.alchemy.com",
        },
      },
    }),
    tokenAddress: "0x2d9F7CAD728051AA35Ecdc472a14cf8cDF5CFD6B",
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chain: sepolia,
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  {
    id: "hyperevm-testnet",
    name: "HyperEVM Testnet",
    chain: hyperliquidEvmTestnet,
    tokenAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
  },
  {
    id: "injective-testnet",
    name: "Injective Testnet",
    chain: injectiveTestnet,
    tokenAddress: "0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d",
  },
  {
    id: "ink-sepolia",
    name: "Ink Sepolia",
    chain: inkSepolia,
    tokenAddress: "0xFabab97dCE620294D2B0b0e46C68964e326300Ac",
  },
  {
    id: "linea-sepolia",
    name: "Linea Sepolia",
    chain: lineaSepolia,
    tokenAddress: "0xFEce4462D57bD51A6A552365A011b95f0E16d9B7",
  },
  {
    id: "monad-testnet",
    name: "Monad Testnet",
    chain: monadTestnet,
    tokenAddress: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  },
  {
    id: "morph-hoodi",
    name: "Morph Hoodi",
    chain: defineChain({
      id: 2910,
      name: "Morph Hoodi",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: ["https://rpc-hoodi.morph.network"] },
      },
      blockExplorers: {
        default: {
          name: "Morph Hoodi Explorer",
          url: "https://explorer-hoodi.morph.network",
        },
      },
    }),
    tokenAddress: "0x7433b41C6c5e1d58D4Da99483609520255ab661B",
  },
  {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    chain: optimismSepolia,
    tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  },
  {
    id: "pharos-atlantic",
    name: "Pharos Atlantic",
    chain: defineChain({
      id: 688689,
      name: "Pharos Atlantic",
      nativeCurrency: { name: "PHRS", symbol: "PHRS", decimals: 18 },
      rpcUrls: {
        default: { http: ["https://atlantic.dplabs-internal.com"] },
      },
      blockExplorers: {
        default: {
          name: "Pharos Testnet Explorer",
          url: "https://atlantic.pharosscan.xyz",
        },
      },
      testnet: true,
    }),
    tokenAddress: "0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B",
  },
  {
    id: "plume-sepolia",
    name: "Plume Sepolia",
    chain: plumeSepolia,
    tokenAddress: "0xcB5f30e335672893c7eb944B374c196392C19D18",
  },
  {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    chain: polygonAmoy,
    tokenAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  },
  {
    id: "sei-testnet",
    name: "Sei Testnet",
    chain: seiTestnet,
    tokenAddress: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED",
  },
  {
    id: "sonic-testnet",
    name: "Sonic Testnet",
    chain: sonicTestnet,
    tokenAddress: "0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51",
  },
  {
    id: "unichain-sepolia",
    name: "Unichain Sepolia",
    chain: unichainSepolia,
    tokenAddress: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
  },
  {
    id: "world-chain-sepolia",
    name: "World Chain Sepolia",
    chain: worldchainSepolia,
    tokenAddress: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
  },
  {
    id: "xdc-apothem",
    name: "XDC Apothem",
    chain: xdcTestnet,
    tokenAddress: "0xb5AB69F7bBada22B28e79C8FFAECe55eF1c771D4",
  },
  {
    id: "zksync-era-testnet",
    name: "ZKsync Era Testnet",
    chain: zkSyncSepoliaTestnet,
    tokenAddress: "0xAe045DE5638162fa134807Cb558E15A3F5A7F853",
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
      "Select a chain for your USDC transfer:\n" +
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
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    const balanceFormatted = Number(
      formatUnits(balance as bigint, USDC_DECIMALS),
    );
    const amount = 1; // Send 1 USDC in this example.

    console.log("Chain:", selectedChain.name);
    console.log("Sender:", account.address);
    console.log("Recipient:", recipientAddress);
    console.log("Balance:", balanceFormatted, "USDC");

    if (amount > balanceFormatted) {
      throw new Error("Insufficient balance");
    }

    const amountInDecimals = parseUnits(amount.toString(), USDC_DECIMALS);

    // Submit the transfer transaction.
    const hash = await walletClient.writeContract({
      address: selectedChain.tokenAddress,
      abi: USDC_ABI,
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
Select a chain for your USDC transfer:
1. Arc Testnet
2. Arbitrum Sepolia
...

Enter a number: 4
Chain: Base Sepolia
Sender: 0x1A2b...7890
Recipient: 0x9F8f...1234
Balance: 250.0 USDC
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

In this quickstart, you learned how to check balances and transfer USDC on EVM
testnets using one multi-chain Viem script in Node.js. Here are the key points
to remember:

* **Testnet only**. Testnet USDC has no real value.
* **Gas fees**. You need a small amount of the testnet's native token for gas.
* **Security**. Keep your private key in `.env`. Never commit secrets.
* **Single script**. The same script works across all supported EVM testnets.
* **Minimal ABI**. The script only uses `balanceOf` and `transfer` for
  simplicity.
