> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Pay for Resources with Nanopayments

> Deposit USDC into Gateway and make gasless payments to x402-protected APIs

In this quickstart, you will deposit USDC into a Gateway Wallet, pay for an
x402-protected resource without gas fees, and check your balance. By the end,
you'll have a working client that can make gasless payments to any
x402-compatible API that supports Circle Gateway.

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v22+](https://nodejs.org/)
* An
  [EOA (externally owned account)](/wallets/account-types#externally-owned-accounts-eoa)
  wallet private key for signing transactions and payment authorizations.
* Obtained testnet USDC from the [Circle Faucet](https://faucet.circle.com).
* Testnet ETH (or native gas token) for the one-time deposit transaction.

<Warning>
  Nanopayments require an EOA wallet. Smart contract account (SCA) wallets are not
  supported because Gateway verifies payment signatures offchain using
  `ecrecover`, which is incompatible with EIP-1271 contract signatures.
</Warning>

## Step 1. Set up your project

### 1.1. Create the project and install dependencies

```shell theme={null}
# Set up your directory and initialize a Node.js project
mkdir nanopayments-buyer
cd nanopayments-buyer
npm init -y

# Set up module type and start command
npm pkg set type=module
npm pkg set scripts.pay="tsx --env-file=.env pay.ts"

# Install runtime dependencies
npm install @circle-fin/x402-batching viem tsx typescript

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

Open `.env` in your editor and add:

```text theme={null}
PRIVATE_KEY=YOUR_PRIVATE_KEY
```

* `PRIVATE_KEY` is the private key for the EOA you use to deposit USDC and sign
  nanopayment authorizations.

<Tip>
  Open `.env` in your editor rather than writing values with shell commands, and
  add `.env` to your `.gitignore`. This prevents credentials from leaking into
  your shell history or version control.
</Tip>

The `npm run pay` command loads variables from `.env` using Node.js native
env-file support.

<Warning>
  This example uses one or more private keys for local testing. In production,
  use a secure key management solution and never expose or share private keys.
</Warning>

## Step 2: Initialize the client

Create a new file `pay.ts` and initialize the `GatewayClient` with your chain
and private key:

```ts pay.ts theme={null}
import { GatewayClient } from "@circle-fin/x402-batching/client";

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
});
```

The `chain` parameter determines which blockchain the client connects to for
deposits and withdrawals. See the
[SDK reference](/gateway/nanopayments/references/sdk) for all supported chain
names.

## Step 3: Deposit USDC into Gateway

Before you can make gasless payments, deposit USDC from your wallet into the
Gateway Wallet contract. This is a one-time onchain transaction:

```ts pay.ts theme={null}
const balances = await client.getBalances();
console.log(`Gateway balance: ${balances.gateway.formattedAvailable} USDC`);

// 1 USDC = 1_000_000 base units (6 decimals)
if (balances.gateway.available < 1_000_000n) {
  console.log("Depositing 1 USDC...");
  const deposit = await client.deposit("1");
  console.log(`Deposit tx: ${deposit.depositTxHash}`);
}
```

`getBalances()` calls the
[Get Token Balances](/api-reference/gateway/all/get-token-balances) API
endpoint. The deposit itself is an onchain transaction and does not use the
Gateway API.

After the deposit confirms, your Gateway balance can be used for gasless
payments to any supported seller. See the discussion at
[Fast deposits](/gateway/references/supported-blockchains#fast-deposits) about
increasing deposit speeds.

## Step 4: Pay for a resource

Add the payment logic to `pay.ts`. Call `client.pay()` with the URL of an
x402-protected resource. The client handles the full payment flow automatically:

1. Sends the initial request to the URL.
2. Receives the `402 Payment Required` response with payment details.
3. Signs an EIP-3009 authorization offchain (zero gas).
4. Retries the request with the `PAYMENT-SIGNATURE` header.

```ts pay.ts theme={null}
const url = "http://localhost:3000/premium-data";

const { data, status } = await client.pay(url);

console.log(`Status: ${status}`);
console.log("Response:", data);
```

Under the hood, `pay()` negotiates the `402` flow and submits the payment
through the [Settle x402 Payment](/api-reference/gateway/all/settle-x402payment)
API endpoint.

<Tip>
  Don't have a seller URL to test with? Set up a local test API in two minutes
  using the [seller quickstart](/gateway/nanopayments/quickstarts/seller).
</Tip>

## Step 5: Check your balance

Add balance checking after the payment using the
[Get Token Balances](/api-reference/gateway/all/get-token-balances) API
endpoint:

```ts pay.ts theme={null}
const updated = await client.getBalances();
console.log(`Wallet USDC: ${updated.wallet.formatted}`);
console.log(`Gateway available: ${updated.gateway.formattedAvailable}`);
```

## Step 6: Run the script

Run the complete script:

```shell theme={null}
npm run pay
```

You should see the deposit transaction (if needed), the response from the paid
resource, and your updated balance.

## Step 7: Withdraw funds (optional)

You can withdraw USDC from Gateway back to your wallet at any time. Same-chain
withdrawals are instant:

```ts pay.ts theme={null}
const result = await client.withdraw("5");
console.log(`Withdrew ${result.formattedAmount} USDC`);
console.log(`Tx: ${result.mintTxHash}`);
```

To withdraw to a different blockchain:

```ts pay.ts theme={null}
const crossChain = await client.withdraw("5", { chain: "baseSepolia" });
console.log(`Withdrew to ${crossChain.destinationChain}`);
```

<Note>
  Crosschain withdrawals require native gas tokens on the destination blockchain
  to cover the minting transaction.
</Note>

## Check support before paying

Before attempting a payment, you can verify that the target URL supports Gateway
batching. The `supports()` method requests the target URL, checks for a `402`
response, and inspects the `PAYMENT-REQUIRED` header for a compatible Gateway
batching option:

```ts theme={null}
const support = await client.supports(url);

if (!support.supported) {
  console.error("This URL does not support Gateway payments");
} else {
  const { data } = await client.pay(url);
}
```

This is useful when building clients that interact with APIs where Gateway
support is not guaranteed.
