> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Deploy an ERC-1155 Contract Template

> Use Circle Contract Templates to deploy smart contracts without writing Solidity

This quickstart walks you through deploying an ERC-1155 Multi-Token contract
using Contract Templates and minting your first token.

Contract Templates make it easy to integrate smart contracts into your
application without writing Solidity code. Deploy contracts in minutes using
curated and audited templates that support popular onchain use cases.

<Note>
  **Note:** This quickstart provides all the code you need to deploy an ERC-1155
  contract and mint tokens. You can deploy using either the
  [Console](#console-path) or [API](#api-path).
</Note>

## Prerequisites

Before you begin, ensure you have:

* A [Circle Developer Account](https://console.circle.com)
* For the API path:
  * An [API key](/contracts/create-api-key)
  * A [dev-controlled wallet](/wallets/dev-controlled/create-your-first-wallet)
  * Your
    [Entity Secret registered](/wallets/dev-controlled/register-entity-secret)

## Evaluate templates

To learn more about the ERC-1155 template or other templates, visit:

* **[Console](https://console.circle.com):** View templates, their use cases,
  ABI functions, events, and code.
* **[Templates Glossary](/contracts/scp-templates-overview):** Review all
  templates and their configuration options.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/D-mmMTaVnQhPM6l2/w3s/images/scp-console-templates02.png?fit=max&auto=format&n=D-mmMTaVnQhPM6l2&q=85&s=26882f20107bbb6215d7ed4b7ffec5d7" width="3020" height="1442" data-path="w3s/images/scp-console-templates02.png" />
</Frame>

***

## Console path

Use the Console and a Console Wallet to deploy a smart contract template and
mint a token. This is the preferred method for those new to smart contracts.

### Step 1: Set up your Console Wallet

Console Wallets are Smart Contract Accounts designed for use within the Console.
They leverage [Gas Station](/wallets/gas-station), eliminating the need to
maintain gas for transaction fees.

If you don't have a Console Wallet, you'll be prompted to create one during
deployment.

<Warning>
  **Console Wallet Deploy Cost:** Unlike EOAs, SCAs cost gas to deploy. With
  lazy deployment, you won't pay the gas fee at wallet creation as it's charged
  when you initiate your first outbound transaction.
</Warning>

### Step 2: Deploy the smart contract

In the [Console](https://console.circle.com):

1. Navigate to the **Templates** tab.
2. Select **Multi-Token** ERC-1155.
3. Fill in the deployment parameters:

| Parameter                  | Description                                                                                            |
| :------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Name**                   | The offchain name of the contract, only visible in Circle's systems. Use `MyERC1155Contract`.          |
| **Contract Name**          | The onchain name for the contract. Use `MyERC1155Contract`.                                            |
| **Default Admin**          | The address with admin permissions to execute permissioned functions. Use your Console Wallet address. |
| **Primary Sale Recipient** | The address that receives first-time sale proceeds. Use your Console Wallet address.                   |
| **Royalty Recipient**      | The address that receives royalties from secondary sales. Use your Console Wallet address.             |
| **Royalty Percent**        | The royalty share as a decimal (for example, `0.05` for 5% of secondary sales). Use `0`.               |
| **Network**                | The blockchain network to deploy onto. Select `Arc Testnet`.                                           |
| **Select Wallet**          | The wallet to deploy the smart contract from. Select your Console Wallet.                              |
| **Deployment Speed**       | The fee level affecting transaction processing speed (FAST, AVERAGE, SLOW). Select `AVERAGE`.          |

4. Select **Deploy**.

<Note>
  **Console Wallet Creation:** After selecting a network, you'll be prompted to
  create a Console Wallet. This wallet is automatically created on all available
  networks. On testnet, a [Gas Station Policy](/wallets/gas-station/policy-management) is also created.

  <Frame>
    <img src="https://mintcdn.com/circle-167b8d39/D-mmMTaVnQhPM6l2/w3s/images/scp-derc1155-consolewallet02.png?fit=max&auto=format&n=D-mmMTaVnQhPM6l2&q=85&s=90cd0fb0e93e1fa5b9a5e431722107de" width="3024" height="1524" data-path="w3s/images/scp-derc1155-consolewallet02.png" />
  </Frame>
</Note>

Once deployed, you'll return to the **Contracts** dashboard. The deployment
status will initially show **Pending**, then change to **Complete** after a few
seconds.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/D-mmMTaVnQhPM6l2/w3s/images/scp-derc1155-consolecontracts02.png?fit=max&auto=format&n=D-mmMTaVnQhPM6l2&q=85&s=e268b2f830c9415cda3c2dc6edc0c768" width="3024" height="1524" data-path="w3s/images/scp-derc1155-consolecontracts02.png" />
</Frame>

### Step 3: Mint a token

In the [Console](https://console.circle.com):

1. Navigate to the **Contracts** tab.
2. Select your **MyERC1155Contract**.
3. Select the **ABI Functions** tab → **Write** → **mintTo**.
4. Fill in the parameters:

| Parameter     | Description                                                                                                                                                                                                                                        |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **\_to**      | The wallet address to receive the minted token. Use your Console Wallet address.                                                                                                                                                                   |
| **\_tokenId** | The token ID to mint, identifying the token type in ERC-1155. Use max uint256 (`115792089237316195423570985008687907853269984665640564039457584007913129639935`) to create token ID 0. For subsequent tokens, use `0` for ID 1, `1` for ID 2, etc. |
| **\_uri**     | The URI for the token metadata, such as an IPFS CID or CDN URL.                                                                                                                                                                                    |
| **\_amount**  | The quantity of tokens to mint. Use `1`.                                                                                                                                                                                                           |

5. Select **Execute Function** → ensure your Console Wallet is selected →
   **Execute**.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/D-mmMTaVnQhPM6l2/w3s/images/scp-derc1155-consolemint03.png?fit=max&auto=format&n=D-mmMTaVnQhPM6l2&q=85&s=1603f77115d7c9e80cfee7e986b8cecb" width="3024" height="1510" data-path="w3s/images/scp-derc1155-consolemint03.png" />
</Frame>

Select **View Transaction History** to monitor the transaction. Once the state
shows **Complete**, the token has been minted successfully.

<Note>
  **Inbound Transaction:** You'll also see an inbound transfer indicating the
  token was minted to your Console Wallet.
</Note>

***

## API path

Use APIs to deploy a smart contract template and mint a token programmatically.
This option requires an API key and a Dev-Controlled Wallet.

### Step 1: Set up your environment

#### 1.1. Get your wallet information

Retrieve your wallet ID using the
[`GET /wallets`](/api-reference/wallets/developer-controlled-wallets/get-wallets)
API. Ensure:

* Wallet custody type is **Dev-Controlled**
* Blockchain is **Arc Testnet**
* Account type is **SCA** (recommended—removes need for gas)

Note your wallet's address for subsequent steps.

#### 1.2. Understand deployment parameters

| Parameter                | Description                                                                                                                           |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `idempotencyKey`         | A unique value for request deduplication.                                                                                             |
| `name`                   | The offchain contract name. Use `MyERC1155Contract`.                                                                                  |
| `walletId`               | The ID of the wallet deploying the contract. Use your dev-controlled wallet ID.                                                       |
| `templateId`             | The template identifier. Use `aea21da6-0aa2-4971-9a1a-5098842b1248` for ERC-1155. See [Templates](/contracts/scp-templates-overview). |
| `blockchain`             | The network to deploy onto. Use `ARC-TESTNET`.                                                                                        |
| `entitySecretCiphertext` | The re-encrypted entity secret. See [How the Entity Secret Works](/wallets/dev-controlled/entity-secret-management).                  |
| `feeLevel`               | The fee level for transaction processing. Use `MEDIUM`.                                                                               |
| `templateParameters`     | The onchain initialization parameters (see below).                                                                                    |

#### 1.3. Template parameters

| Parameter              | Description                                                                       |
| :--------------------- | :-------------------------------------------------------------------------------- |
| `name`                 | The onchain contract name. Use `MyERC1155Contract`.                               |
| `defaultAdmin`         | The address with admin permissions. Use your Dev-Controlled Wallet address.       |
| `primarySaleRecipient` | The address for first-time sale proceeds. Use your Dev-Controlled Wallet address. |
| `royaltyRecipient`     | The address for secondary sale royalties. Use your Dev-Controlled Wallet address. |
| `royaltyPercent`       | The royalty share as a decimal (for example, `0.05` for 5%). Use `0`.             |

### Step 2: Deploy the smart contract

Deploy by making a request to
[`POST /templates/{id}/deploy`](/api-reference/contracts/smart-contract-platform/deploy-contract-template):

<CodeGroup>
  ```javascript Node.js theme={null}
  import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
  import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

  const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
    apiKey: "<API_KEY>",
    entitySecret: "<ENTITY_SECRET>",
  });

  const circleContractSdk = initiateSmartContractPlatformClient({
    apiKey: "<API_KEY>",
    entitySecret: "<ENTITY_SECRET>",
  });

  const response = await circleContractSdk.deployContractTemplate({
    id: "aea21da6-0aa2-4971-9a1a-5098842b1248",
    blockchain: "ARC-TESTNET",
    name: "MyERC1155Contract",
    walletId: "<WALLET_ID>",
    templateParameters: {
      name: "MyERC1155Contract",
      defaultAdmin: "<WALLET_ADDRESS>",
      primarySaleRecipient: "<WALLET_ADDRESS>",
      royaltyRecipient: "<WALLET_ADDRESS>",
      royaltyPercent: 0,
    },
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });
  ```

  ```python Python theme={null}
  from circle.web3 import utils, developer_controlled_wallets, smart_contract_platform

  client = utils.init_developer_controlled_wallets_client(
      api_key="<API_KEY>",
      entity_secret="<ENTITY_SECRET>"
  )

  scpClient = utils.init_smart_contract_platform_client(
      api_key="<API_KEY>",
      entity_secret="<ENTITY_SECRET>"
  )

  api_instance = smart_contract_platform.TemplatesApi(scpClient)

  request = smart_contract_platform.TemplateContractDeploymentRequest.from_dict({
      "blockchain": "ARC-TESTNET",
      "name": "MyERC1155Contract",
      "walletId": "<WALLET_ID>",
      "templateParameters": {
          "name": "MyERC1155Contract",
          "defaultAdmin": "<WALLET_ADDRESS>",
          "primarySaleRecipient": "<WALLET_ADDRESS>",
          "royaltyRecipient": "<WALLET_ADDRESS>",
          "royaltyPercent": "0",
      },
      "feeLevel": "MEDIUM"
  })

  request.template_parameters["royaltyPercent"] = 0

  response = api_instance.deploy_contract_template("aea21da6-0aa2-4971-9a1a-5098842b1248", request)
  ```

  ```shell cURL theme={null}
  curl --request POST \
    --url 'https://api.circle.com/v1/w3s/templates/aea21da6-0aa2-4971-9a1a-5098842b1248/deploy' \
    --header 'accept: application/json' \
    --header 'content-type: application/json' \
    --header 'authorization: Bearer <API_KEY>' \
    --data '{
      "idempotencyKey": "<IDEMPOTENCY_KEY>",
      "blockchain": "ARC-TESTNET",
      "name": "MyERC1155Contract",
      "walletId": "<WALLET_ID>",
      "templateParameters": {
        "name": "MyERC1155Contract",
        "defaultAdmin": "<WALLET_ADDRESS>",
        "primarySaleRecipient": "<WALLET_ADDRESS>",
        "royaltyRecipient": "<WALLET_ADDRESS>",
        "royaltyPercent": 0
      },
      "feeLevel": "MEDIUM",
      "entitySecretCiphertext": "<ENTITY_SECRET_CIPHERTEXT>"
    }'
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "data": {
    "contractIds": ["b7c35372-ce69-4ccd-bfaa-504c14634f0d"],
    "transactionId": "601a0815-f749-41d8-b193-22cadd2a8977"
  }
}
```

<Note>
  A successful response indicates deployment has been **initiated**, not
  completed. Use the `transactionId` to check status.
</Note>

#### 2.1. Check deployment status

Verify deployment with
[`GET /transactions/{id}`](/api-reference/wallets/developer-controlled-wallets/get-transaction):

<CodeGroup>
  ```javascript Node.js theme={null}
  const response = await circleDeveloperSdk.getTransaction({
    id: "601a0815-f749-41d8-b193-22cadd2a8977",
  });
  ```

  ```python Python theme={null}
  api_instance = developer_controlled_wallets.TransactionsApi(client)
  response = api_instance.get_transaction(id="601a0815-f749-41d8-b193-22cadd2a8977")
  ```

  ```shell cURL theme={null}
  curl --request GET \
    --url 'https://api.circle.com/v1/w3s/transactions/601a0815-f749-41d8-b193-22cadd2a8977' \
    --header 'accept: application/json' \
    --header 'authorization: Bearer <API_KEY>'
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "data": {
    "transaction": {
      "id": "601a0815-f749-41d8-b193-22cadd2a8977",
      "blockchain": "ARC-TESTNET",
      "state": "COMPLETE"
    }
  }
}
```

### Step 3: Mint a token

Use the `mintTo` function to mint tokens. The wallet must have `MINTER_ROLE`.

<CodeGroup>
  ```javascript Node.js theme={null}
  const response = await circleDeveloperSdk.createContractExecutionTransaction({
    walletId: "<WALLET_ID>",
    abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
    abiParameters: [
      "<WALLET_ADDRESS>",
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
      "1",
    ],
    contractAddress: "<CONTRACT_ADDRESS>",
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });
  ```

  ```python Python theme={null}
  api_instance = developer_controlled_wallets.TransactionsApi(client)

  request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
      "walletId": "<WALLET_ID>",
      "abiFunctionSignature": "mintTo(address,uint256,string,uint256)",
      "abiParameters": [
          "<WALLET_ADDRESS>",
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
          "1"
      ],
      "contractAddress": "<CONTRACT_ADDRESS>",
      "feeLevel": "MEDIUM",
  })

  response = api_instance.create_developer_transaction_contract_execution(request)
  ```

  ```shell cURL theme={null}
  curl --request POST \
    --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
    --header 'authorization: Bearer <API_KEY>' \
    --header 'accept: application/json' \
    --header 'content-type: application/json' \
    --data '{
      "abiFunctionSignature": "mintTo(address,uint256,string,uint256)",
      "abiParameters": [
        "<WALLET_ADDRESS>",
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei",
        "1"
      ],
      "idempotencyKey": "<IDEMPOTENCY_KEY>",
      "contractAddress": "<CONTRACT_ADDRESS>",
      "feeLevel": "MEDIUM",
      "walletId": "<WALLET_ID>",
      "entitySecretCiphertext": "<ENTITY_SECRET_CIPHERTEXT>"
    }'
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "data": {
    "id": "601a0815-f749-41d8-b193-22cadd2a8977",
    "state": "INITIATED"
  }
}
```

Check the transaction status using
[`GET /transactions/{id}`](/api-reference/wallets/developer-controlled-wallets/get-transaction)
as shown above.

***

## Summary

After completing this quickstart, you've successfully:

* Deployed an ERC-1155 Multi-Token contract on Arc Testnet
* Minted your first token using either the Console or API

## Next steps

* Explore the [Templates Glossary](/contracts/scp-templates-overview) for other
  contract templates
* Learn about [Gas Station](/wallets/gas-station) for sponsoring transactions
* View your contract on the [Arc Testnet Explorer](https://testnet.arcscan.app/)
