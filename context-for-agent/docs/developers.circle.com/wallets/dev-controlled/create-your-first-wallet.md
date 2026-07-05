> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Create a Dev-Controlled Wallet

> Get started with developer-controlled wallets by creating a wallet set and a wallet within it.

A wallet set is a container that groups your developer-controlled wallets under
a single [entity secret](/wallets/dev-controlled/entity-secret-management). All
wallets in a set share the same entity secret, and EVM wallets in the same set
share the [same address](/wallets/unified-wallet-addressing-evm). After
completing this tutorial, you'll have a wallet set and a developer-controlled
wallet. The examples use an
[externally owned account (EOA)](/wallets/account-types#externally-owned-accounts-eoa)
on Arc Testnet, but you can create a
[smart contract account (SCA)](/wallets/account-types#smart-contract-accounts-sca-and-msca)
or use any [supported blockchain](/wallets/supported-blockchains).

## Prerequisites

Before you begin, ensure you have:

* Obtained an [API key](/api-reference/keys) from the
  [Circle Console](https://console.circle.com/).
* Generated and registered an
  [entity secret](/wallets/dev-controlled/register-entity-secret).
* Installed [Node.js 22+](https://nodejs.org/) or
  [Python 3.11+](https://www.python.org/).

## Step 1. Set up your project

### 1.1. Create the project and install dependencies

Create a new directory and install the SDK for the path you want to use.

<CodeGroup>
  ```shell Node.js theme={null}
  # Create the project directory and initialize Node.js
  mkdir dev-controlled-projects
  cd dev-controlled-projects
  npm init -y

  # Set up module type and a start command
  npm pkg set type=module
  npm pkg set scripts.create-wallet="tsx --env-file=.env create-wallet.ts"

  # Install runtime dependencies
  npm install @circle-fin/developer-controlled-wallets

  # Install dev dependencies
  npm install --save-dev tsx typescript @types/node
  ```

  ```shell Python theme={null}
  # Create the project directory and initialize Python
  mkdir dev-controlled-projects
  cd dev-controlled-projects
  python3 -m venv .venv
  source .venv/bin/activate

  # Install runtime dependencies
  pip install circle-developer-controlled-wallets python-dotenv
  ```
</CodeGroup>

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
```

* `CIRCLE_API_KEY` is your Circle Developer API key.
* `CIRCLE_ENTITY_SECRET` is your registered entity secret.

<Tip>
  Open `.env` in your editor rather than writing values with shell commands, and
  add `.env` to your `.gitignore`. This prevents credentials from leaking into
  your shell history or version control.
</Tip>

## Step 2. Create your wallet

Write a script creates a wallet set and a developer-controlled wallet, then
prints the wallet set ID, wallet ID, and wallet address.

### 2.1. Create the script

Create a `create-wallet.ts` (or `create_wallet.py`) file and add the following
code. This code creates a wallet set first, and then creates a wallet within it:

<CodeGroup>
  ```ts create-wallet.ts theme={null}
  import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  async function main() {
    const walletSetResponse = await client.createWalletSet({
      name: "My First Dev-Controlled Wallet Set",
    });

    const walletSet = walletSetResponse.data?.walletSet;
    if (!walletSet?.id) {
      throw new Error("Wallet set creation failed: no ID returned");
    }

    const walletResponse = await client.createWallets({
      walletSetId: walletSet.id,
      blockchains: ["ARC-TESTNET"], // Can be any supported blockchain
      count: 1,
      accountType: "EOA", // Can be EOA or SCA
    });

    console.log("Wallet set response:", walletSetResponse.data);
    console.log("Wallet response:", walletResponse.data);
  }

  main().catch((err) => {
    console.error("Error:", err.message || err);
    process.exit(1);
  });
  ```

  ```python create_wallet.py theme={null}
  from circle.web3 import utils, developer_controlled_wallets
  from dotenv import load_dotenv
  import os
  import json

  load_dotenv()

  client = utils.init_developer_controlled_wallets_client(
      api_key=os.getenv("CIRCLE_API_KEY"),
      entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
  )

  wallet_sets_api = developer_controlled_wallets.WalletSetsApi(client)
  wallets_api = developer_controlled_wallets.WalletsApi(client)

  try:
      wallet_set = wallet_sets_api.create_wallet_set(
          developer_controlled_wallets.CreateWalletSetRequest.from_dict({
              "name": "My First Dev-Controlled Wallet Set"
          })
      )

      wallet = wallets_api.create_wallet(
          developer_controlled_wallets.CreateWalletRequest.from_dict({
              "walletSetId": wallet_set.data.wallet_set.actual_instance.id,
              "blockchains": ["ARC-TESTNET"],
              "count": 1,
              "accountType": "EOA"
          })
      )

      print(json.dumps(json.loads(wallet_set.model_dump_json()), indent=2))
      print(json.dumps(json.loads(wallet.model_dump_json()), indent=2))
  except developer_controlled_wallets.ApiException as e:
      print("Exception when calling the Circle Wallets API: %s\n" % e)
  ```
</CodeGroup>

<Note>
  If you are calling the API directly instead of using the SDK, you need two
  requests: one to [create the wallet
  set](/api-reference/wallets/developer-controlled-wallets/create-wallet-set)
  and one to [create the
  wallet](/api-reference/wallets/developer-controlled-wallets/create-wallet).
  Replace the entity secret ciphertext and idempotency key in your request. The
  SDKs handle this automatically.
</Note>

### 2.2. Run the script

Run the script from your project directory:

<CodeGroup>
  ```shell Node.js theme={null}
  npm run create-wallet
  ```

  ```shell Python theme={null}
  python create_wallet.py
  ```
</CodeGroup>

The output looks similar to:

<CodeGroup>
  ```text Node.js theme={null}
  Wallet set response: {
    walletSet: {
      id: "9d4f..."
    }
  }
  Wallet response: {
    wallets: [
      {
        id: "1f29...",
        address: "0x1234...",
        blockchain: "ARC-TESTNET"
      }
    ]
  }
  ```

  ```text Python theme={null}
  {
    "data": {
      "wallet_set": {
        "id": "9d4f..."
      }
    }
  }
  {
    "data": {
      "wallets": [
        {
          "id": "1f29...",
          "address": "0x1234...",
          "blockchain": "ARC-TESTNET"
        }
      ]
    }
  }
  ```
</CodeGroup>

Save the wallet ID and address for future wallet operations such as transferring
tokens or checking balances.

## Next steps

Now that you have a developer-controlled wallet, you can:

* **Fund the wallet**: Get testnet USDC from the
  [Circle Faucet](https://faucet.circle.com/).
* **[Send tokens across wallets](/wallets/dev-controlled/transfer-tokens-across-wallets)**:
  Transfer USDC from one developer-controlled wallet to another.
* **Build payment workflows with
  [Arc App Kit](https://docs.arc.network/app-kit)**: Use the
  [Circle Wallets adapter](https://docs.arc.network/app-kit/tutorials/adapter-setups#circle-wallets)
  to add token transfers, swaps, bridging, and chain-agnostic unified balances
  to your app without building each integration yourself.
