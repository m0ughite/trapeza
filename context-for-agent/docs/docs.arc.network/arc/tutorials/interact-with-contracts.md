> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Interact with contracts

> Execute contract functions on Arc Testnet to mint tokens, transfer assets, and perform contract operations.

This tutorial guides you through interacting with smart contracts deployed on
Arc Testnet. You'll learn how to execute contract functions like minting tokens,
transferring assets, and performing contract-specific operations for ERC-20,
ERC-721, ERC-1155, and Airdrop contracts.

## Prerequisites

Complete the [Deploy contracts](/arc/tutorials/deploy-contracts) tutorial first.
You'll need a deployed contract.

## Step 1. Update your project

In this step, you update the project you created in the Deploy contracts
tutorial with the additional environment variable and npm scripts needed for
contract interactions.

### 1.1. Set environment variables

Add this new variable to your existing `.env` file (from the Deploy contracts
tutorial):

```text .env theme={null}
RECIPIENT_WALLET_ADDRESS=YOUR_RECIPIENT_ADDRESS
```

* `RECIPIENT_WALLET_ADDRESS` is the wallet address that receives transferred
  tokens during the interaction examples.

<Note>
  Your `.env` file should already have `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`,
  `WALLET_ID`, `WALLET_ADDRESS`, and `CONTRACT_ADDRESS` from the Deploy
  contracts tutorial. You're only adding 1 new variable here.
</Note>

The npm run commands in this tutorial load variables from `.env` using Node.js
native env-file support.

<Tip>
  Prefer editing `.env` files in your IDE or editor so credentials are not
  leaked to your shell history.
</Tip>

### 1.2. Add npm scripts

Add run scripts for contract interactions to your `package.json`:

```shell theme={null}
npm pkg set scripts.interact-erc20="tsx --env-file=.env interact-erc20.ts"
npm pkg set scripts.interact-erc721="tsx --env-file=.env interact-erc721.ts"
npm pkg set scripts.interact-erc1155="tsx --env-file=.env interact-erc1155.ts"
npm pkg set scripts.interact-airdrop="tsx --env-file=.env interact-airdrop.ts"
```

## Step 2. Interact with contracts

Select the contract type you want to interact with from the tabs below.

<Tabs>
  <Tab title="ERC-20">
    ## Interact with ERC-20 contracts

    ERC-20 tokens support standard fungible token operations. You'll learn to mint
    new tokens and transfer them between addresses.

    ### Mint tokens

    Use the `mintTo` function to mint tokens. The wallet must have `MINTER_ROLE`.

    <CodeGroup>
      ```ts Node.js theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      const mintResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "mintTo(address,uint256)",
          abiParameters: [
            process.env.WALLET_ADDRESS,
            "1000000000000000000", // 1 token with 18 decimals
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(mintResponse.data, null, 2));
      ```

      ```python Python theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,uint256)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "1000000000000000000"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)

      print(json.dumps(mint_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "mintTo(address,uint256)",
          "abiParameters": [
            "<WALLET_ADDRESS>",
            "1000000000000000000"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    <Note>
      **Token decimals**: ERC-20 tokens typically use 18 decimals. To mint 1 token,
      use `1000000000000000000` (1 × 10^18).
    </Note>

    ### Transfer tokens

    Use the `transfer` function to send tokens to another address.

    <CodeGroup>
      ```ts Node.js theme={null}
      const transferResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "transfer(address,uint256)",
          abiParameters: [
            process.env.RECIPIENT_WALLET_ADDRESS,
            "1000000000000000000", // 1 token with 18 decimals
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(transferResponse.data, null, 2));
      ```

      ```python Python theme={null}
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "transfer(address,uint256)",
          "abiParameters": [
              os.getenv("RECIPIENT_WALLET_ADDRESS"),
              "1000000000000000000"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)

      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "transfer(address,uint256)",
          "abiParameters": [
            "<RECIPIENT_ADDRESS>",
            "1000000000000000000"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    ### Full ERC-20 interaction script

    Here's the full script combining mint and transfer operations:

    <CodeGroup>
      ```ts interact-erc20.ts theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      async function main() {
        // Mint tokens
        const mintResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "mintTo(address,uint256)",
            abiParameters: [
              process.env.WALLET_ADDRESS,
              "1000000000000000000", // 1 token with 18 decimals
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(mintResponse.data, null, 2));

        // Transfer tokens
        const transferResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "transfer(address,uint256)",
            abiParameters: [
              process.env.RECIPIENT_WALLET_ADDRESS,
              "1000000000000000000", // 1 token with 18 decimals
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(transferResponse.data, null, 2));
      }

      main();
      ```

      ```python interact_erc20.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      # Mint tokens
      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,uint256)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "1000000000000000000"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)
      print(json.dumps(mint_response.data.to_dict(), indent=2))

      # Transfer tokens
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "transfer(address,uint256)",
          "abiParameters": [
              os.getenv("RECIPIENT_WALLET_ADDRESS"),
              "1000000000000000000"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)
      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```
    </CodeGroup>

    **Run the script:**

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run interact-erc20
      ```

      ```shell Python theme={null}
      python interact_erc20.py
      ```
    </CodeGroup>
  </Tab>

  <Tab title="ERC-721">
    ## Interact with ERC-721 contracts

    ERC-721 tokens are unique tokens. Each token has a unique ID and can have
    associated metadata stored on IPFS or other storage.

    ### Mint tokens

    Use the `mintTo` function to mint tokens. The wallet must have `MINTER_ROLE`.

    <CodeGroup>
      ```ts Node.js theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      const mintResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "mintTo(address,string)",
          abiParameters: [
            process.env.WALLET_ADDRESS,
            "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(mintResponse.data, null, 2));
      ```

      ```python Python theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,string)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)

      print(json.dumps(mint_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "mintTo(address,string)",
          "abiParameters": [
            "<WALLET_ADDRESS>",
            "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    <Note>
      **Metadata URI**: The second parameter is the token metadata URI. It typically
      points to an IPFS hash containing the token's metadata (name, description,
      image, etc.). You can use the example IPFS URI from the code sample for
      testing.
    </Note>

    ### Transfer tokens

    Use the `transferFrom` or `safeTransferFrom` function to transfer tokens between
    addresses.

    <CodeGroup>
      ```ts Node.js theme={null}
      const transferResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "safeTransferFrom(address,address,uint256)",
          abiParameters: [
            "<FROM_ADDRESS>",
            "<TO_ADDRESS>",
            "1", // Token ID
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(transferResponse.data, null, 2));
      ```

      ```python Python theme={null}
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "safeTransferFrom(address,address,uint256)",
          "abiParameters": [
              "<FROM_ADDRESS>",
              "<TO_ADDRESS>",
              "1"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)

      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "safeTransferFrom(address,address,uint256)",
          "abiParameters": [
            "<FROM_ADDRESS>",
            "<TO_ADDRESS>",
            "1"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    ### Full ERC-721 interaction script

    Here's the full script combining mint and transfer operations:

    <CodeGroup>
      ```ts interact-erc721.ts theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      async function main() {
        // Mint token
        const mintResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "mintTo(address,string)",
            abiParameters: [
              process.env.WALLET_ADDRESS,
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(mintResponse.data, null, 2));

        // Transfer token (token ID 1)
        const transferResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "safeTransferFrom(address,address,uint256)",
            abiParameters: [
              process.env.WALLET_ADDRESS,
              process.env.RECIPIENT_WALLET_ADDRESS,
              "1", // Token ID
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(transferResponse.data, null, 2));
      }

      main();
      ```

      ```python interact_erc721.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      # Mint token
      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,string)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)
      print(json.dumps(mint_response.data.to_dict(), indent=2))

      # Transfer token (token ID 1)
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "safeTransferFrom(address,address,uint256)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              os.getenv("RECIPIENT_WALLET_ADDRESS"),
              "1"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)
      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```
    </CodeGroup>

    **Run the script:**

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run interact-erc721
      ```

      ```shell Python theme={null}
      python interact_erc721.py
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```
  </Tab>

  <Tab title="ERC-1155">
    ## Interact with ERC-1155 contracts

    ERC-1155 contracts support multiple token types in a single contract. Each token
    has a unique ID and can be fungible or non-fungible.

    ### Mint tokens

    Use the `mintTo` function to mint tokens. The wallet must have `MINTER_ROLE`.
    The first mint requires the maximum uint256 value to create token ID 0. For
    subsequent mints, always use `0` which creates the next token ID.

    <CodeGroup>
      ```ts Node.js theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      const mintResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
          abiParameters: [
            process.env.WALLET_ADDRESS,
            "115792089237316195423570985008687907853269984665640564039457584007913129639935", // Max uint256 = ID 0
            "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
            "1", // Amount
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(mintResponse.data, null, 2));
      ```

      ```python Python theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,uint256,string,uint256)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
              "1"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)

      print(json.dumps(mint_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "mintTo(address,uint256,string,uint256)",
          "abiParameters": [
            "<WALLET_ADDRESS>",
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
            "1"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    <Note>
      **ERC-1155 Token ID Creation**: The first mint of each token ID requires
      passing the maximum uint256 value (`2^256 - 1` or
      `115792089237316195423570985008687907853269984665640564039457584007913129639935`)
      to create token ID 0 in the contract. For all subsequent mints, use `0` which
      creates the next sequential token ID (1, 2, 3, etc.). This is an ERC-1155
      standard requirement for lazy minting, where token IDs are created on demand
      rather than pre-initialized.
    </Note>

    ### Batch transfer tokens

    Use the `safeBatchTransferFrom` function to transfer multiple token types in a
    single transaction.

    <CodeGroup>
      ```ts Node.js theme={null}
      const transferResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature:
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
          abiParameters: [
            "<FROM_ADDRESS>",
            "<TO_ADDRESS>",
            ["0"], // Token IDs
            ["1"], // Amounts
            "0x", // Empty bytes
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(transferResponse.data, null, 2));
      ```

      ```python Python theme={null}
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
          "abiParameters": [
              "<FROM_ADDRESS>",
              "<TO_ADDRESS>",
              ["0"],
              ["1"],
              "0x"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)

      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
          "abiParameters": [
            "<FROM_ADDRESS>",
            "<TO_ADDRESS>",
            ["0"],
            ["1"],
            "0x"
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    ### Full ERC-1155 interaction script

    Here's the full script combining mint and batch transfer operations:

    <CodeGroup>
      ```ts interact-erc1155.ts theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      async function main() {
        // Mint tokens (token ID 0)
        const mintResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
            abiParameters: [
              process.env.WALLET_ADDRESS,
              "115792089237316195423570985008687907853269984665640564039457584007913129639935", // Max uint256 = ID 0
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
              "1", // Amount
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(mintResponse.data, null, 2));

        // Batch transfer tokens
        const transferResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature:
              "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            abiParameters: [
              process.env.WALLET_ADDRESS,
              process.env.RECIPIENT_WALLET_ADDRESS,
              ["0"], // Token IDs
              ["1"], // Amounts
              "0x", // Empty bytes
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(transferResponse.data, null, 2));
      }

      main();
      ```

      ```python interact_erc1155.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      # Mint tokens (token ID 0)
      mint_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "mintTo(address,uint256,string,uint256)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
              "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
              "1"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      mint_response = api_instance.create_developer_transaction_contract_execution(mint_request)
      print(json.dumps(mint_response.data.to_dict(), indent=2))

      # Batch transfer tokens
      transfer_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
          "abiParameters": [
              os.getenv("WALLET_ADDRESS"),
              os.getenv("RECIPIENT_WALLET_ADDRESS"),
              ["0"],
              ["1"],
              "0x"
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      transfer_response = api_instance.create_developer_transaction_contract_execution(transfer_request)
      print(json.dumps(transfer_response.data.to_dict(), indent=2))
      ```
    </CodeGroup>

    **Run the script:**

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run interact-erc1155
      ```

      ```shell Python theme={null}
      python interact_erc1155.py
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```
  </Tab>

  <Tab title="Airdrop">
    ## Execute airdrop operations

    The Airdrop contract enables mass token distribution to multiple recipients.

    ### Prerequisites

    Before executing an airdrop, you need:

    1. **A token contract address** - Deploy one using the
       [ERC-20](/arc/tutorials/deploy-contracts#erc-20),
       [ERC-721](/arc/tutorials/deploy-contracts#erc-721), or
       [ERC-1155](/arc/tutorials/deploy-contracts#erc-1155) templates, or use an
       existing token
    2. **Token balance** - Your wallet must hold enough tokens to distribute
    3. **Token approval** - Call the `approve` or `setApprovalForAll` function on
       your token contract to allow the airdrop contract to transfer tokens

    ### Execute an ERC-20 airdrop

    Use the `airdropERC20` function to distribute ERC-20 tokens to multiple
    recipients.

    <CodeGroup>
      ```ts Node.js theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      const airdropResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "airdropERC20(address,(address,uint256)[])",
          abiParameters: [
            "<TOKEN_CONTRACT_ADDRESS>", // ERC-20 token contract address
            [
              ["<RECIPIENT_ADDRESS_1>", "1000000000000000000"],
              ["<RECIPIENT_ADDRESS_2>", "2000000000000000000"],
            ],
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(airdropResponse.data, null, 2));
      ```

      ```python Python theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      airdrop_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "airdropERC20(address,(address,uint256)[])",
          "abiParameters": [
              "<TOKEN_CONTRACT_ADDRESS>",
              [
                  ["<RECIPIENT_ADDRESS_1>", "1000000000000000000"],
                  ["<RECIPIENT_ADDRESS_2>", "2000000000000000000"]
              ]
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      airdrop_response = api_instance.create_developer_transaction_contract_execution(airdrop_request)

      print(json.dumps(airdrop_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "airdropERC20(address,(address,uint256)[])",
          "abiParameters": [
            "<TOKEN_CONTRACT_ADDRESS>",
            [
              ["<RECIPIENT_ADDRESS_1>", "1000000000000000000"],
              ["<RECIPIENT_ADDRESS_2>", "2000000000000000000"]
            ]
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    <Note>
      **Token contract**: The first parameter is the address of the ERC-20 token
      contract you want to airdrop. You must deploy this contract first using the
      [Deploy contracts](/arc/tutorials/deploy-contracts) tutorial.
    </Note>

    ### Execute an ERC-721 airdrop

    Use the `airdropERC721` function to distribute tokens to multiple recipients.

    <CodeGroup>
      ```ts Node.js theme={null}
      const airdropResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "airdropERC721(address,(address,uint256)[])",
          abiParameters: [
            "<TOKEN_CONTRACT_ADDRESS>", // ERC-721 token contract address
            [
              ["<RECIPIENT_ADDRESS_1>", "1"], // Token ID 1
              ["<RECIPIENT_ADDRESS_2>", "2"], // Token ID 2
            ],
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(airdropResponse.data, null, 2));
      ```

      ```python Python theme={null}
      airdrop_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "airdropERC721(address,(address,uint256)[])",
          "abiParameters": [
              "<TOKEN_CONTRACT_ADDRESS>",
              [
                  ["<RECIPIENT_ADDRESS_1>", "1"],
                  ["<RECIPIENT_ADDRESS_2>", "2"]
              ]
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      airdrop_response = api_instance.create_developer_transaction_contract_execution(airdrop_request)

      print(json.dumps(airdrop_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "airdropERC721(address,(address,uint256)[])",
          "abiParameters": [
            "<TOKEN_CONTRACT_ADDRESS>",
            [
              ["<RECIPIENT_ADDRESS_1>", "1"],
              ["<RECIPIENT_ADDRESS_2>", "2"]
            ]
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```

    ### Execute an ERC-1155 airdrop

    Use the `airdropERC1155` function to distribute ERC-1155 tokens to multiple
    recipients.

    <CodeGroup>
      ```ts Node.js theme={null}
      const airdropResponse =
        await circleDeveloperSdk.createContractExecutionTransaction({
          walletId: process.env.WALLET_ID,
          abiFunctionSignature: "airdropERC1155(address,(address,uint256,uint256)[])",
          abiParameters: [
            "<TOKEN_CONTRACT_ADDRESS>", // ERC-1155 token contract address
            [
              ["<RECIPIENT_ADDRESS_1>", "0", "10"], // Token ID 0, amount 10
              ["<RECIPIENT_ADDRESS_2>", "1", "5"], // Token ID 1, amount 5
            ],
          ],
          contractAddress: process.env.CONTRACT_ADDRESS,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        });

      console.log(JSON.stringify(airdropResponse.data, null, 2));
      ```

      ```python Python theme={null}
      airdrop_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "airdropERC1155(address,(address,uint256,uint256)[])",
          "abiParameters": [
              "<TOKEN_CONTRACT_ADDRESS>",
              [
                  ["<RECIPIENT_ADDRESS_1>", "0", "10"],
                  ["<RECIPIENT_ADDRESS_2>", "1", "5"]
              ]
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      airdrop_response = api_instance.create_developer_transaction_contract_execution(airdrop_request)

      print(json.dumps(airdrop_response.data.to_dict(), indent=2))
      ```

      ```shell cURL theme={null}
      curl --request POST \
        --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
        --header 'authorization: Bearer <API_KEY>' \
        --header 'accept: application/json' \
        --header 'content-type: application/json' \
        --data '{
          "idempotencyKey": "<string>",
          "entitySecretCiphertext": "<string>",
          "walletId": "<WALLET_ID>",
          "abiFunctionSignature": "airdropERC1155(address,(address,uint256,uint256)[])",
          "abiParameters": [
            "<TOKEN_CONTRACT_ADDRESS>",
            [
              ["<RECIPIENT_ADDRESS_1>", "0", "10"],
              ["<RECIPIENT_ADDRESS_2>", "1", "5"]
            ]
          ],
          "contractAddress": "<CONTRACT_ADDRESS>",
          "feeLevel": "MEDIUM"
        }'
      ```
    </CodeGroup>

    ### Full airdrop interaction script

    Here's the full script for executing an ERC-20 airdrop. You can adapt it for
    ERC-721 or ERC-1155 by changing the function signature and parameters as shown
    in the examples previously:

    <CodeGroup>
      ```ts interact-airdrop.ts theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });

      async function main() {
        // Execute ERC-20 airdrop
        const airdropResponse =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId: process.env.WALLET_ID,
            abiFunctionSignature: "airdropERC20(address,(address,uint256)[])",
            abiParameters: [
              process.env.TOKEN_CONTRACT_ADDRESS, // ERC-20 token contract address
              [
                [process.env.RECIPIENT_ADDRESS_1, "1000000000000000000"],
                [process.env.RECIPIENT_ADDRESS_2, "2000000000000000000"],
              ],
            ],
            contractAddress: process.env.CONTRACT_ADDRESS,
            fee: {
              type: "level",
              config: {
                feeLevel: "MEDIUM",
              },
            },
          });

        console.log(JSON.stringify(airdropResponse.data, null, 2));

        // For ERC-721 airdrop, use:
        // abiFunctionSignature: "airdropERC721(address,(address,uint256)[])"
        // abiParameters: [tokenAddress, [[recipient1, tokenId1], [recipient2, tokenId2]]]

        // For ERC-1155 airdrop, use:
        // abiFunctionSignature: "airdropERC1155(address,(address,uint256,uint256)[])"
        // abiParameters: [tokenAddress, [[recipient1, tokenId, amount], [recipient2, tokenId, amount]]]
      }

      main();
      ```

      ```python interact_airdrop.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      import json

      client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET")
      )

      api_instance = developer_controlled_wallets.TransactionsApi(client)

      # Execute ERC-20 airdrop
      airdrop_request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": os.getenv("WALLET_ID"),
          "abiFunctionSignature": "airdropERC20(address,(address,uint256)[])",
          "abiParameters": [
              os.getenv("TOKEN_CONTRACT_ADDRESS"),
              [
                  [os.getenv("RECIPIENT_ADDRESS_1"), "1000000000000000000"],
                  [os.getenv("RECIPIENT_ADDRESS_2"), "2000000000000000000"]
              ]
          ],
          "contractAddress": os.getenv("CONTRACT_ADDRESS"),
          "feeLevel": "MEDIUM",
      })

      airdrop_response = api_instance.create_developer_transaction_contract_execution(airdrop_request)
      print(json.dumps(airdrop_response.data.to_dict(), indent=2))

      # For ERC-721 airdrop, use:
      # abiFunctionSignature: "airdropERC721(address,(address,uint256)[])"
      # abiParameters: [token_address, [[recipient1, token_id1], [recipient2, token_id2]]]

      # For ERC-1155 airdrop, use:
      # abiFunctionSignature: "airdropERC1155(address,(address,uint256,uint256)[])"
      # abiParameters: [token_address, [[recipient1, token_id, amount], [recipient2, token_id, amount]]]
      ```
    </CodeGroup>

    **Run the script:**

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run interact-airdrop
      ```

      ```shell Python theme={null}
      python interact_airdrop.py
      ```
    </CodeGroup>

    **Response:**

    ```json theme={null}
    {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "state": "INITIATED"
    }
    ```
  </Tab>
</Tabs>

***

## Summary

After completing this tutorial, you've learned how to:

* Execute contract functions using the Circle SDKs
* Mint and transfer tokens for your deployed contracts
* Perform contract-specific operations based on token type
