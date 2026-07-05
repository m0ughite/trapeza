> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Send tokens across wallets on the same blockchain

> Use App Kit to send tokens from one wallet to another on the same blockchain

This quickstart walks you through sending tokens from one wallet to another on
the same blockchain. The example in this quickstart sends USDC on Arc Testnet,
but you can use another
[supported token or blockchain](/app-kit/references/supported-blockchains).

## Prerequisites

Before you begin, ensure that you've:

* Installed [Node.js v22+](https://nodejs.org/).
* Created an
  [Arc Testnet](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup)
  wallet and funded it with testnet USDC and testnet native tokens.

## Step 1. Set up the project

This step shows you how to prepare your project and environment.

### 1.1. Set up your development environment

Create a new directory and install App Kit and its dependencies:

```bash Shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir app-kit-quickstart-send
cd app-kit-quickstart-send
npm init -y

# Install App Kit and tools
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem typescript tsx
```

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

Then, add your wallet private key. Replace `YOUR_PRIVATE_KEY` with the private
key for your wallet:

```text .env theme={null}
PRIVATE_KEY=YOUR_PRIVATE_KEY
```

<Tip>
  Edit `.env` files in your IDE or editor so credentials are not leaked to your
  shell history.
</Tip>

## Step 2. Send tokens to recipient

This step shows you how to set up your script, send tokens from your wallet to a
recipient on the same blockchain, and check the result.

### 2.1. Create the script

Create an `index.ts` file in the project directory and add the following code.
This code sends 1.00 USDC from your wallet to a recipient on Arc Testnet:

<Info>
  Using another
  [token](/app-kit/references/supported-blockchains#supported-tokens) or
  [blockchain](/app-kit/references/supported-blockchains)? Change the `token` and
  `chain` values in `kit.send()` and use an adapter for that chain.
</Info>

```typescript TypeScript theme={null}
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import type { SendParams } from "@circle-fin/app-kit";
import { inspect } from "node:util";

const kit = new AppKit();

const sendTokens = async (): Promise<void> => {
  const adapter = createViemAdapterFromPrivateKey({
    privateKey: process.env.PRIVATE_KEY as string,
  });

  const sendParams: SendParams = {
    from: { adapter, chain: "Arc_Testnet" },
    to: "RECIPIENT_ADDRESS", // Replace with recipient address
    amount: "1.00",
    token: "USDC",
  };

  const estimate = await kit.estimateSend(sendParams);
  const result = await kit.send(sendParams);
  console.log(inspect(result, false, null, true));
};

void sendTokens();
```

### 2.2. Run the script

Save the `index.ts` file and run the script in your terminal:

```bash Shell theme={null}
npx tsx --env-file=.env index.ts
```

### 2.3. Verify the transaction

After the script finishes, find the returned result in the terminal output. Use
the transaction explorer URL to verify the amount and recipient on the
blockchain.

The following is an example of how the result of a successful send might look in
the terminal output. The values are used in this example only and are not a real
transaction:

```bash Shell theme={null}
{
  name: "transfer",
  state: "success",
  txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  explorerUrl: "https://testnet.arcscan.app/tx/0x1234567890abcdef..."
}
```

## Next steps

* Review the [Send overview](/app-kit/send) for more on the Send capability.
* Try [Bridge](/app-kit/bridge) or [Swap](/app-kit/swap) to move value across
  chains or swap tokens on the same chain.
* See [Adapter setups](/app-kit/tutorials/adapter-setups) to use different
  wallet adapters, or the [SDK reference](/app-kit/references/sdk-reference) for
  the full API.
