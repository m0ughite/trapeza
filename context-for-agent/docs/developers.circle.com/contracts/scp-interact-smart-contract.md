> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Interact With a Smart Contract

In this guide, we will interact with a deployed smart contract using APIs. If
you haven't deployed a smart contract, follow the
[deploy a smart contract](/contracts/scp-deploy-smart-contract) tutorial.

## 1. Retrieve the Smart Contract's Functions

To fetch the new Contract object, make a `GET /contracts/{id}` request that
includes the `contractId` object returned from your deployment request. The
`functions` property returned in the successful request contains a list of all
of the functions on the contract:

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  // Import and configure the developer-controlled wallet SDK
  const {
    initiateDeveloperControlledWalletsClient,
  } = require("@circle-fin/developer-controlled-wallets");
  const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
    apiKey: "<API_KEY>",
    entitySecret: "<ENTITY_SECRET>",
  });

  // Import and configure the smart contract SDK
  const {
    initiateSmartContractPlatformClient,
  } = require("@circle-fin/smart-contract-platform");
  const circleContractSdk = initiateSmartContractPlatformClient({
    apiKey: "<API_KEY>",
    entitySecret: "<ENTITY_SECRET>",
  });

  const response = await circleContractSdk.getContract({
    id: "0189db84-72b7-7fcc-832b-5bf886b9a0ef",
  });
  ```

  ```coffeescript Python SDK theme={null}
  from circle.web3 import smart_contract_platform, developer_controlled_wallets
  from circle.web3 import utils

  # Import and configure the developer-controlled wallet SDK
  client = utils.init_developer_controlled_wallets_client(api_key=key, entity_secret=entitySecret)
  # Import and configure the smart contract SDK
  scpClient = utils.init_smart_contract_platform_client(api_key=key, entity_secret=entitySecret)

  # create an api instance
  api_instance = smart_contract_platform.ViewUpdateApi(scpClient)
  try:
      response = api_instance.get_contract(id='0189db84-72b7-7fcc-832b-5bf886b9a0ef')
      print(response)
  except smart_contract_platform.ApiException as e:
      print("Exception when calling ViewUpdateApi->get_contract: %s\n" % e)
  ```

  ```curl cURL theme={null}
  curl --request GET \
       --url 'https://api.circle.com/v1/w3s/contracts/{id}' \
       --header 'accept: application/json' \
       --header 'authorization: Bearer <API_KEY>'
  ```
</CodeGroup>

```json JSON theme={null}
{
  "data": {
    "contract": {
      "id": "0189db84-72b7-7fcc-832b-5bf886b9a0ef",
      "entityId": "dcfa8149-98d8-4ed4-91fb-de7f3627b384",
      "deploymentTransactionId": "4f5bfa38-c598-56a6-932e-8b5bbd3d5fc9",
      "name": "First Contract Name",
      "description": "First Contract Description",
      "contractInputType": "BYTECODE",
      "createDate": "2023-08-09T18:17:17Z",
      "updateDate": "2023-08-09T18:17:17Z",
      "archived": false,
      "contractAddress": "0x1e124d7384cd34448ea5907bd0052a79355ab5eb",
      "blockchain": "MATIC-AMOY",
      "status": "COMPLETE",
      "deployerAddress": "0x1bf9ad0cc2ad298c69a2995aa806ee832788218c",
      "txHash": "0x241c4df6f08f9ed2b569c9f9b1cc48fb6074ffffaeee7552e716ce059161a743",
      "abiJson": "[\n\t{\n\t\t\"inputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"constructor\"\n\t},\n\t{\n\t\t\"anonymous\": false,\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"owner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"approved\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"Approval\",\n\t\t\"type\": \"event\"\n\t},\n\t{\n\t\t\"anonymous\": false,\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"owner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"operator\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": false,\n\t\t\t\t\"internalType\": \"bool\",\n\t\t\t\t\"name\": \"approved\",\n\t\t\t\t\"type\": \"bool\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"ApprovalForAll\",\n\t\t\"type\": \"event\"\n\t},\n\t{\n\t\t\"anonymous\": false,\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"previousOwner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"newOwner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"OwnershipTransferred\",\n\t\t\"type\": \"event\"\n\t},\n\t{\n\t\t\"anonymous\": false,\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"from\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"indexed\": true,\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"Transfer\",\n\t\t\"type\": \"event\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"approve\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"owner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"balanceOf\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"getApproved\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"owner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"operator\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"isApprovedForAll\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"bool\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"bool\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [],\n\t\t\"name\": \"name\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"string\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"string\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [],\n\t\t\"name\": \"owner\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"ownerOf\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [],\n\t\t\"name\": \"renounceOwnership\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"safeMint\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"from\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"safeTransferFrom\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"from\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"bytes\",\n\t\t\t\t\"name\": \"data\",\n\t\t\t\t\"type\": \"bytes\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"safeTransferFrom\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"operator\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"bool\",\n\t\t\t\t\"name\": \"approved\",\n\t\t\t\t\"type\": \"bool\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"setApprovalForAll\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"bytes4\",\n\t\t\t\t\"name\": \"interfaceId\",\n\t\t\t\t\"type\": \"bytes4\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"supportsInterface\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"bool\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"bool\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [],\n\t\t\"name\": \"symbol\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"string\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"string\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"tokenURI\",\n\t\t\"outputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"string\",\n\t\t\t\t\"name\": \"\",\n\t\t\t\t\"type\": \"string\"\n\t\t\t}\n\t\t],\n\t\t\"stateMutability\": \"view\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"from\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"to\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t},\n\t\t\t{\n\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\"name\": \"tokenId\",\n\t\t\t\t\"type\": \"uint256\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"transferFrom\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t},\n\t{\n\t\t\"inputs\": [\n\t\t\t{\n\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\"name\": \"newOwner\",\n\t\t\t\t\"type\": \"address\"\n\t\t\t}\n\t\t],\n\t\t\"name\": \"transferOwnership\",\n\t\t\"outputs\": [],\n\t\t\"stateMutability\": \"nonpayable\",\n\t\t\"type\": \"function\"\n\t}\n]",
      "functions": [
        {
          "name": "approve",
          "type": "function",
          "inputs": [
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "balanceOf",
          "type": "function",
          "inputs": [
            {
              "name": "owner",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "uint256"
            }
          ]
        },
        {
          "name": "getApproved",
          "type": "function",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "address"
            }
          ]
        },
        {
          "name": "isApprovedForAll",
          "type": "function",
          "inputs": [
            {
              "name": "owner",
              "type": "address"
            },
            {
              "name": "operator",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "bool"
            }
          ]
        },
        {
          "name": "name",
          "type": "function",
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "string"
            }
          ]
        },
        {
          "name": "owner",
          "type": "function",
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "address"
            }
          ]
        },
        {
          "name": "ownerOf",
          "type": "function",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "address"
            }
          ]
        },
        {
          "name": "renounceOwnership",
          "type": "function",
          "stateMutability": "nonpayable"
        },
        {
          "name": "safeMint",
          "type": "function",
          "inputs": [
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "safeTransferFrom",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "address"
            },
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "safeTransferFrom",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "address"
            },
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256"
            },
            {
              "name": "data",
              "type": "bytes"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "setApprovalForAll",
          "type": "function",
          "inputs": [
            {
              "name": "operator",
              "type": "address"
            },
            {
              "name": "approved",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "supportsInterface",
          "type": "function",
          "inputs": [
            {
              "name": "interfaceId",
              "type": "bytes4"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "bool"
            }
          ]
        },
        {
          "name": "symbol",
          "type": "function",
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "string"
            }
          ]
        },
        {
          "name": "tokenURI",
          "type": "function",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "outputs": [
            {
              "name": "",
              "type": "string"
            }
          ]
        },
        {
          "name": "transferFrom",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "address"
            },
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "name": "transferOwnership",
          "type": "function",
          "inputs": [
            {
              "name": "newOwner",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable"
        }
      ],
      "events": [
        {
          "name": "Approval",
          "type": "event",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true
            },
            {
              "name": "approved",
              "type": "address",
              "indexed": true
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true
            }
          ],
          "anonymous": false
        },
        {
          "name": "ApprovalForAll",
          "type": "event",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true
            },
            {
              "name": "operator",
              "type": "address",
              "indexed": true
            },
            {
              "name": "approved",
              "type": "bool",
              "indexed": false
            }
          ],
          "anonymous": false
        },
        {
          "name": "OwnershipTransferred",
          "type": "event",
          "inputs": [
            {
              "name": "previousOwner",
              "type": "address",
              "indexed": true
            },
            {
              "name": "newOwner",
              "type": "address",
              "indexed": true
            }
          ],
          "anonymous": false
        },
        {
          "name": "Transfer",
          "type": "event",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "indexed": true
            },
            {
              "name": "to",
              "type": "address",
              "indexed": true
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true
            }
          ],
          "anonymous": false
        }
      ],
      "verificationStatus": "UNVERIFIED"
    }
  }
```

**Note:** Smart contract functions are defined using the Application Binary
Interface (ABI). Some important ABI properties are:

1. `name`: The function name. This is used in the `abiFunctionSignature` to
   select which function to call when reading from or executing a function on a
   smart contract.
2. `inputs`: The names and types of the arguments to the function. These
   parameters are passed to the `contracts/read` or
   `developer/transactions/contractExecution` APIs via the `abiParameters`
   property.
3. `outputs`: The output values when the function returns. Some functions do not
   return anything.
4. `stateMutability`: Defines how the function interacts with the blockchain.
   1. `view` and `pure` functions do not change the state of the blockchain, so
      these are `read` functions.
   2. `nonpayable` and `payable` functions update the state of the blockchain,
      so these are `execute` functions. `nonpayable` is the default for a
      function if no `stateMutability` property exists.

## 2. Contract Query Function

Once you have selected a read function from the list, you can send an API
request to `POST /contracts/query`. The example below is making a request to the
`owner()` function to check the current owner of the contract

**Notes:**

* The `abiFunctionSignature` is derived from the function name and the
  parenthesized list of parameter types. For instance, the
  `abiFunctionSignature` for a function named `testFunction` that takes an
  `address` and an `uint256` would be `testFunction(address,uint256)`.
* Read interactions *do not* require gas on the blockchain, so you are not
  required to a specify a wallet.
* A shortened `abiJson`, containing only the part of the ABI describing the
  `owner` function of the contract, was used to demonstrate, but ordinarily, the
  entire ABI would be included in the request.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  response = await client.queryContract({
    abiFunctionSignature: "owner()",
    address: "0x1e124d7384cd34448ea5907bd0052a79355ab5eb",
    blockchain: "MATIC-AMOY",
    abiJson:
      '[{"inputs": [],"name": "owner","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"}]',
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = smart_contract_platform.InteractApi(scpClient)
  try:
      request = smart_contract_platform.ReadContractStateRequest.from_dict({
          "abiFunctionSignature": "owner()",
          "address": "0x1e124d7384cd34448ea5907bd0052a79355ab5eb",
          "blockchain": "MATIC-AMOY",
          "abiJson": "[{\"inputs\": [],\"name\": \"owner\",\"outputs\": [{\"internalType\": \"address\",\"name\": \"\",\"type\": \"address\"}],\"stateMutability\": \"view\",\"type\": \"function\"}]"
      })
      response = api_instance.query_contract(request)
  except smart_contract_platform.ApiException as e:
      print("Exception when calling InteractApi->read_contract: %s\n" % e)
  ```

  ```curl Bash theme={null}
  curl --request POST \
    --url https://api.circle.com/v1/w3s/contracts/query \
    --header "Authorization: Bearer $API_KEY" \
    --header 'accept: application/json' \
    --header 'content-type: application/json' \
    --data '{
        "abiFunctionSignature": "owner()",
        "address": "0x1e124d7384cd34448ea5907bd0052a79355ab5eb",
        "blockchain": "MATIC-AMOY",
        "abiJson": "[{\"inputs\": [],\"name\": \"owner\",\"outputs\": [{\"internalType\": \"address\",\"name\": \"\",\"type\": \"address\"}],\"stateMutability\": \"view\",\"type\": \"function\"}]"
      }'
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "outputData": "0x000000000000000000000000D4D2DB6B4e42Db2c2C0797F009942b35e466DB29",
    "outputValues": ["0xD4D2DB6B4e42Db2c2C0797F009942b35e466DB29"]
  }
}
```

## 3. Contract Execution Function

Once you have chosen an execute function you can make a request to
`POST developer/transactions/contractExecution` or
`user/transactions/contractExecution`, for developer-controlled and
user-controlled wallets, respectively. The example below uses the
developer-controlled endpoint to call the `safeMint()` function to mint an NFT.
The function takes in two parameters: the `to` address and the assigned
`tokenId` for the NFT. The `abiFunctionSignature` is
`safeMint(address, uint256)`.

* **Note:** The `safeMint` function must be called by the `owner` of the
  contract. We specified this function modifier when generating the contract
  earlier.
* **Note:** Write functions *do* require gas on the blockchain, so a `walletId`
  must be specified in the request.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleDeveloperSdk.createContractExecutionTransaction({
    walletId: "ce714f5b-0d8e-4062-9454-61aa1154869b",
    contractAddress: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
    abiFunctionSignature: "safeMint(address, uint256)",
    abiParameters: ["0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3", 1],
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = developer_controlled_wallets.TransactionsApi(client)
  try:
      request = developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict({
          "walletId": 'ce714f5b-0d8e-4062-9454-61aa1154869b',
          "contractAddress": '0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557',
          "abiFunctionSignature": 'safeMint(address, uint256)',
          "abiParameters": ['0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3', 1],
          "feeLevel": 'MEDIUM'
      })
      response = api_instance.create_developer_transaction_contract_execution(request)
      print(response)
  except developer_controlled_wallets.ApiException as e:
      print("Exception when calling TransactionsApi->create_developer_transaction_contract_execution: %s\n" % e)
  ```

  ```curl Bash theme={null}
  curl --request POST \
       --url 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution' \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --data '
  {
    "idempotencyKey":  "d6d56c67-9d8b-4e87-a618-1c44fa04a495",
    "walletId":  "ce714f5b-0d8e-4062-9454-61aa1154869b",
    "contractAddress": "0x1e124d7384cd34448ea5907bd0052a79355ab5eb",
    "abiFunctionSignature": "safeMint(address, uint256)",
    "abiParameters": [
      "0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3",
      1
    ],
    "feeLevel": "MEDIUM",
    "entitySecretCiphertext": "N8sYP20DJvujfnlSM4qirGXGN8Pr+FjgMWN7zHc96EiSJnPxoGviniZlNaLT..."
  }
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "transactionId": "84cb1754-f236-4bfc-8562-70fa6ee168c8"
  }
}
```
