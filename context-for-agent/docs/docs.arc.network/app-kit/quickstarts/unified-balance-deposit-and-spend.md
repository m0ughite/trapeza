> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Deposit and spend a Unified Balance

> Deposit USDC from an EVM chain and Solana into a Unified Balance, then spend from the combined pool on another blockchain

Use App Kit to deposit into a Unified Balance and spend from it. In this
quickstart, you'll write scripts that deposit from Base Sepolia and Solana
Devnet, check your balance, and spend on Arc Testnet.

These are examples only. You can use any of the
[supported blockchains](/app-kit/references/supported-blockchains) and fund the
Unified Balance from as many sources as you need. The scripts use built-in
public RPC URLs, which may be rate-limited or unreliable. For a more stable
connection, you can
[configure a custom RPC](/app-kit/tutorials/adapter-setups#custom-rpc).

## Prerequisites

Before you begin, ensure that you've:

* Installed [Node.js v22+](https://nodejs.org/).
* Created an EVM wallet using a wallet provider such as
  [MetaMask](https://metamask.io/) and added the
  [Base Sepolia](https://docs.base.org/docs/network-information#base-testnet-sepolia)
  and
  [Arc Testnet](https://docs.arc.network/arc/references/connect-to-arc#wallet-setup)
  networks.
* Created a Solana wallet (for example, [Phantom](https://phantom.app/) or
  [Solflare](https://solflare.com/)) on Devnet.
* Funded your wallets with testnet tokens:
  * Get testnet USDC from the [Circle Faucet](https://faucet.circle.com/) on
    Base Sepolia and Solana Devnet.
  * Get testnet ETH on Base Sepolia from a
    [public faucet](https://www.alchemy.com/faucets/base-sepolia) (needed for
    deposit and spend transactions on Base Sepolia).
  * Get SOL for Solana Devnet from the
    [Solana Faucet](https://faucet.solana.com/).
  * Fund the recipient wallet on Arc Testnet if needed (USDC on Arc can cover
    gas for the destination credit when you spend on Arc).
* Obtained an Arc Testnet address that will receive USDC when you spend on Arc
  Testnet.

## Step 1. Set up your project

### 1.1. Create the project and install dependencies

Create a new directory and install App Kit and its dependencies:

```bash Shell theme={null}
mkdir unified-balance-multichain
cd unified-balance-multichain
npm init -y
npm pkg set type=module

npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 @circle-fin/adapter-solana viem @solana/web3.js
npm install --save-dev typescript tsx @types/node
```

<Tip>
  Only need a Unified Balance and want a lighter install than the full App Kit?
  Install the standalone package instead: `@circle-fin/unified-balance-kit`
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

### 1.3. Set environment variables

Create a `.env` file in the project directory:

```text .env theme={null}
EVM_PRIVATE_KEY=0xYOUR_EVM_PRIVATE_KEY
SOLANA_PRIVATE_KEY=YOUR_SOLANA_PRIVATE_KEY
EVM_RECIPIENT_ADDRESS=0xYOUR_RECIPIENT_ADDRESS
```

* Replace `0xYOUR_EVM_PRIVATE_KEY` with the private key for the wallet that
  holds USDC on Base Sepolia.
* Replace `YOUR_SOLANA_PRIVATE_KEY` with the base58 private key for the wallet
  that holds USDC on Solana Devnet.
* Replace `0xYOUR_RECIPIENT_ADDRESS` with the address that should receive USDC
  on Arc Testnet when you spend.

<Info>
  If you use MetaMask, follow their guide for how to [find and export your
  private
  key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
</Info>

<Tip>
  Edit `.env` files in your IDE or editor so credentials are not leaked to your
  shell history.
</Tip>

## Step 2. Deposit into a Unified Balance

In this step, you'll deposit from Base Sepolia and Solana Devnet using two small
scripts. Each script handles one source blockchain only.

### 2.1. Create the deposit scripts

<Tip>
  You can combine both deposits in a single script if you prefer. One `main`
  function can create both adapters and call `kit.unifiedBalance.deposit` once per
  blockchain (await each call in sequence). This example uses two files to keep
  each deposit easy to run and verify on its own.
</Tip>

<Steps>
  <Step title="Create Base Sepolia deposit script">
    Create `deposit-base.ts`. This script deposits 2.00 USDC from your Base Sepolia
    wallet into your Unified Balance:

    ```typescript deposit-base.ts theme={null}
    import { AppKit } from "@circle-fin/app-kit";
    import { inspect } from "node:util";
    import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

    const DEPOSIT_AMOUNT = "2.00";

    const kit = new AppKit();

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
    });

    async function main() {
      const result = await kit.unifiedBalance.deposit({
        from: { adapter, chain: "Base_Sepolia" },
        amount: DEPOSIT_AMOUNT,
        token: "USDC",
      });

      console.log("Result:", inspect(result, false, null, true));
    }

    void main();
    ```
  </Step>

  <Step title="Create Solana Devnet deposit script">
    Create `deposit-solana.ts`. This script deposits 1.00 USDC from your Solana
    Devnet wallet into your Unified Balance:

    ```typescript deposit-solana.ts theme={null}
    import { AppKit } from "@circle-fin/app-kit";
    import { inspect } from "node:util";
    import { createSolanaAdapterFromPrivateKey } from "@circle-fin/adapter-solana";

    const DEPOSIT_AMOUNT = "1.00";

    const kit = new AppKit();

    const adapter = createSolanaAdapterFromPrivateKey({
      privateKey: process.env.SOLANA_PRIVATE_KEY as string,
    });

    async function main() {
      const result = await kit.unifiedBalance.deposit({
        from: { adapter, chain: "Solana_Devnet" },
        amount: DEPOSIT_AMOUNT,
        token: "USDC",
      });

      console.log("Result:", inspect(result, false, null, true));
    }

    void main();
    ```
  </Step>
</Steps>

### 2.2. Run the deposit scripts

<Steps>
  <Step title="Run the Base Sepolia deposit script">
    In your terminal, run:

    ```bash Shell theme={null}
    npx tsx --env-file=.env deposit-base.ts
    ```

    You'll see output like:

    ```bash Shell theme={null}
    Result:
    {
      amount: '2.00',
      token: 'USDC',
      chain: 'Base_Sepolia',
      txHash: '0x...',
      explorerUrl: 'https://sepolia.basescan.org/tx/0x...',
      ...
    }
    ```
  </Step>

  <Step title="Run the Solana Devnet deposit script">
    In your terminal, run:

    ```bash Shell theme={null}
    npx tsx --env-file=.env deposit-solana.ts
    ```

    You'll see output like:

    ```bash Shell theme={null}
    Result:
    {
      amount: '1.00',
      token: 'USDC',
      chain: 'Solana_Devnet',
      txHash: '2k41...',
      explorerUrl: 'https://solscan.io/tx/2k41...?cluster=devnet',
      ...
    }
    ```
  </Step>
</Steps>

### 2.3. Verify the deposits

Open the `explorerUrl` from each deposit result and confirm the onchain
transactions on Base Sepolia and Solana Devnet. When both deposits are
finalized, continue to the next step.

## Step 3. Check your Unified Balance

In this step, you query your Unified Balance across the Base Sepolia and Solana
Devnet depositors and print the confirmed and pending amounts.

### 3.1. Create the balance check script

Create a `check-balance.ts` file:

```typescript check-balance.ts theme={null}
import { AppKit } from "@circle-fin/app-kit";
import { inspect } from "node:util";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromPrivateKey } from "@circle-fin/adapter-solana";

const kit = new AppKit();

const evmAdapter = createViemAdapterFromPrivateKey({
  privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
});

const solanaAdapter = createSolanaAdapterFromPrivateKey({
  privateKey: process.env.SOLANA_PRIVATE_KEY as string,
});

async function main() {
  const balances = await kit.unifiedBalance.getBalances({
    // Both wallets that deposited, one adapter per source
    sources: [{ adapter: evmAdapter }, { adapter: solanaAdapter }],
    networkType: "testnet",
    includePending: true,
  });

  console.log("Result:", inspect(balances, false, null, true));
}

void main();
```

### 3.2. Run the balance check script

In your terminal, run:

```bash Shell theme={null}
npx tsx --env-file=.env check-balance.ts
```

You'll see output like:

```bash Shell theme={null}
Result:
{
  token: 'USDC',
  totalConfirmedBalance: '3.00',
  totalPendingBalance: '0.00',
  breakdown: [
    {
      depositor: '0x...',
      totalConfirmed: '2.00',
      totalPending: '0.00',
      breakdown: [{ chain: 'Base_Sepolia', confirmedBalance: '2.00', ... }]
    },
    {
      depositor: '...',
      totalConfirmed: '1.00',
      totalPending: '0.00',
      breakdown: [{ chain: 'Solana_Devnet', confirmedBalance: '1.00', ... }]
    }
  ]
}
```

After a deposit, funds can appear in `totalPendingBalance` before they are
reflected in `totalConfirmedBalance`. Wait until the confirmed balance is
sufficient before you spend.

## Step 4. Spend from the combined balance

In this step, you spend USDC on Arc Testnet from your Unified Balance.

### 4.1. Create the spend script

Create a `spend.ts` file. This script spends 2.50 USDC on Arc Testnet for the
recipient.
[App Kit chooses](/app-kit/tutorials/unified-balance/select-source-blockchains)
how much USDC to use from each blockchain.

```typescript spend.ts theme={null}
import { AppKit } from "@circle-fin/app-kit";
import { inspect } from "node:util";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromPrivateKey } from "@circle-fin/adapter-solana";

const SPEND_AMOUNT = "2.50";

const kit = new AppKit();

const evmAdapter = createViemAdapterFromPrivateKey({
  privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
});

const solanaAdapter = createSolanaAdapterFromPrivateKey({
  privateKey: process.env.SOLANA_PRIVATE_KEY as string,
});

async function main() {
  const recipientAddress = process.env.EVM_RECIPIENT_ADDRESS as string;

  console.log(
    `Spending ${SPEND_AMOUNT} USDC on Arc_Testnet for ${recipientAddress}...\n`,
  );

  const result = await kit.unifiedBalance.spend({
    amount: SPEND_AMOUNT,
    token: "USDC",
    from: [{ adapter: evmAdapter }, { adapter: solanaAdapter }],
    to: {
      adapter: evmAdapter,
      chain: "Arc_Testnet",
      recipientAddress,
    },
  });

  console.log("Result:", inspect(result, false, null, true));
}

void main();
```

<Tip>
  You can customize your Unified Balance to
  [collect a custom fee](/app-kit/tutorials/unified-balance/collect-custom-spend-fees)
  from end users,
  [estimate fees](/app-kit/tutorials/unified-balance/estimate-spend-fees) before
  spending,
  [select source blockchains and allocations](/app-kit/tutorials/unified-balance/select-source-blockchains)
  to fund a balance, or use the
  [Forwarding Service](/app-kit/tutorials/unified-balance/use-forwarding-service).
</Tip>

### 4.2. Run the spend script

In your terminal, run:

```bash Shell theme={null}
npx tsx --env-file=.env spend.ts
```

When the script completes, you should see output similar to:

```bash Shell theme={null}
Spending 2.50 USDC on Arc_Testnet for 0x...

Result:
{ recipientAddress: '0x...', destinationChain: 'Arc Testnet', txHash: '0x...', ... }
```

### 4.3. Verify the spend

Use the `explorerUrl` from the spend result to confirm that USDC arrived at the
recipient address on Arc Testnet. The received amount can be less than the
requested spend after fees. For more on fees, see
[How Unified Balance fees work](/app-kit/concepts/unified-balance-fees).
