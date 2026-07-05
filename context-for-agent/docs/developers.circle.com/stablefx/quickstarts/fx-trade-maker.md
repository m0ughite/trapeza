> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Fulfill an FX Trade as a Maker

> Use the StableFX API to fulfill an FX trade on the maker side

This guide walks you through the steps to fulfill and execute a trade from the
maker side on StableFX.

## Prerequisites

Before you begin this quickstart, ensure you have:

* Obtained an API key for StableFX from Circle
* Set up a web3 provider or wallet that supports EIP-712 signatures
* Granted a USDC allowance to the `Permit2` contract. See
  [How-to: Grant USDC Allowance to Permit2](/stablefx/howtos/grant-usdc-allowance-permit2)
  for more information.
* cURL installed on your development machine

This quickstart provides API request examples in cURL format, along with example
responses.

<Note>
  StableFX uses a single endpoint for all API requests. The base URL is
  `https://api.circle.com/`. The StableFX API uses your API key for authentication
  and to determine which environment to use. The `TEST` environment executes
  against Arc testnet and returns mock data.

  When developing or testing your integration, you should use your `TEST` API key.
  When you are ready to move to production, just update your code to use your
  `LIVE` API key.
</Note>

## Part 1: Query for available trades

Query for trades with the `confirmed` status using the
[get trades](/api-reference/stablefx/all/list-trades) endpoint. These are trades
created by takers that are ready for maker fulfillment.

```shell theme={null}
curl --request GET \
  --url https://api.circle.com/v1/exchange/stablefx/trades?type=maker&status=confirmed \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}'
```

**Response**

```json theme={null}
{
  "data": [
    {
      "id": "c2558cd1-98b5-4ccd-90b8-96891512af20",
      "contractTradeId": "b4cdae0f-9285-48bf-8abf-109ae0177621",
      "status": "confirmed",
      "rate": "0.915",
      "from": {
        "currency": "USDC",
        "amount": "1000.00"
      },
      "to": {
        "currency": "EURC",
        "amount": "915.00"
      },
      "createDate": "2025-08-07T11:01:00Z",
      "updateDate": "2025-08-07T11:01:00Z",
      "quoteId": "c4d1da72-111e-4d52-bdbf-2e74a2d803d5"
    }
  ],
  "pagination": {
    "next": "",
    "previous": ""
  }
}
```

## Part 2: Select a trade to fulfill

Choose a trade from the available confirmed trades that you want to fulfill as a
maker. You'll need the trade ID for the subsequent steps.

## Part 3: Confirm trade intent

Confirm your trade intent through the StableFX API before submitting the trade
on the blockchain.

### 3.1. Generate maker signature data

To submit the trade onchain, you must first sign the trade intent with an
EIP-712 signature. To get the data to sign, call the
[generate trade presign data](/api-reference/stablefx/all/generate-trade-signature-data)
endpoint. Your request must include the ID of the trade you want to fulfill.

```shell theme={null}
curl --request GET \
  --url https://api.circle.com/v1/exchange/stablefx/signatures/presign/${stablefx_trade_id} \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}'
```

**Response**

```json theme={null}
{
  "typedData": {
    "domain": {
      "name": "Permit2",
      "chainId": 5042002,
      "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
    },
    "types": {
      "EIP712Domain": [
        { "name": "name", "type": "string" },
        { "name": "chainId", "type": "uint256" },
        { "name": "verifyingContract", "type": "address" }
      ],
      "TokenPermissions": [
        { "name": "token", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "Consideration": [
        { "name": "quoteId", "type": "bytes32" },
        { "name": "base", "type": "address" },
        { "name": "quote", "type": "address" },
        { "name": "baseAmount", "type": "uint256" },
        { "name": "quoteAmount", "type": "uint256" },
        { "name": "maturity", "type": "uint256" }
      ],
      "TradeWitness": [
        { "name": "consideration", "type": "Consideration" },
        { "name": "fee", "type": "uint256" }
      ],
      "PermitWitnessTransferFrom": [
        { "name": "permitted", "type": "TokenPermissions" },
        { "name": "spender", "type": "address" },
        { "name": "nonce", "type": "uint256" },
        { "name": "deadline", "type": "uint256" },
        { "name": "witness", "type": "TradeWitness" }
      ]
    },
    "primaryType": "PermitWitnessTransferFrom",
    "message": {
      "permitted": {
        "token": "0x3600000000000000000000000000000000000000",
        "amount": 429000000
      },
      "spender": "0xa8f94168b4981840ba27d423f4ad6332bedee006",
      "nonce": 309585810,
      "deadline": 1770302983,
      "witness": {
        "consideration": {
          "quoteId": "0x00000000000000000000000000000000c4d1da72111e4d52bdbf2e74a2d803d5",
          "base": "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
          "quote": "0x3600000000000000000000000000000000000000",
          "baseAmount": "915000000",
          "quoteAmount": "1000000000",
          "maturity": 1752148800
        },
        "fee": 80000
      }
    }
  }
}
```

### 3.2. Sign the data

Using an EIP-712 compatible wallet or application, sign the data returned in the
previous step.

### 3.3. Submit the trade signature

Confirm your trade intent by submitting the signed data to the
[submit trade signature](/api-reference/stablefx/all/register-trade-signature)
endpoint. This request must include the trade ID, the address of the wallet that
signed the payload, the typed data `details`, and the `signature`.

```shell theme={null}
curl --request POST \
  --url https://api.circle.com/v1/exchange/stablefx/signatures \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}' \
  --header 'Content-Type: application/json' \
  --data '
{
  "tradeId": "${stablefx_trade_id}",
  "address": "0xYOUR_WALLET_ADDRESS",
  "details": {
    "permitted": {
      "token": "0x3600000000000000000000000000000000000000",
      "amount": 429000000
    },
    "spender": "0xa8f94168b4981840ba27d423f4ad6332bedee006",
    "nonce": 309585810,
    "deadline": 1770302983,
    "witness": {
      "consideration": {
        "quoteId": "0x00000000000000000000000000000000c4d1da72111e4d52bdbf2e74a2d803d5",
        "base": "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
        "quote": "0x3600000000000000000000000000000000000000",
        "baseAmount": "915000000",
        "quoteAmount": "1000000000",
        "maturity": 1752148800
      },
      "fee": 80000
    }
  },
  "signature": "0xsignature"
}
'
```

If the signed data is accepted, the API returns a blank `200` response.

## Part 4: Submit the funds onchain

Next, you need to deliver the funds onchain to complete the trade. The StableFX
API can handle the onchain transaction for you using the `Permit2` contract.

### 4.1. Get the funding signature data

To use the StableFX API to deliver the funds onchain, you must first sign the
funding typed data with an EIP-712 signature. To get the data to sign, call the
[generate funding presign data](/api-reference/stablefx/all/generate-funding-presign-data)
endpoint. Your request must include the contract ID of the trade and the side of
the trade that you are taking. The following is an example request:

```shell theme={null}
curl --request POST \
  --url https://api.circle.com/v1/exchange/stablefx/signatures/funding/presign \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}' \
  --header 'Content-Type: application/json' \
  --data '
{
  "contractTradeIds": ["${stablefx_trade_id}"],
  "type": "maker"
}
'
```

**Response**

```json theme={null}
{
  "typedData": {
    "domain": {
      "name": "Permit2",
      "chainId": 11155111,
      "verifyingContract": "0xffd21ca8F0876DaFAD7de09404E0c1f868bbf1AE"
    },
    "types": {
      "EIP712Domain": [
        {
          "name": "name",
          "type": "string"
        },

        {
          "name": "chainId",
          "type": "uint256"
        },

        {
          "name": "verifyingContract",
          "type": "address"
        }
      ],
      "TokenPermissions": [
        {
          "name": "token",
          "type": "address"
        },

        {
          "name": "amount",
          "type": "uint256"
        }
      ],
      "SingleTradeWitness": [
        {
          "name": "id",
          "type": "uint256"
        }
      ],
      "PermitWitnessTransferFrom": [
        {
          "name": "permitted",
          "type": "TokenPermissions"
        },

        {
          "name": "spender",
          "type": "address"
        },

        {
          "name": "nonce",
          "type": "uint256"
        },

        {
          "name": "deadline",
          "type": "uint256"
        },

        {
          "name": "witness",
          "type": "SingleTradeWitness"
        }
      ]
    },
    "primaryType": "PermitWitnessTransferFrom",
    "message": {
      "permitted": {
        "token": "0xTOKEN",
        "amount": "1000"
      },
      "spender": "0xffd21ca8F0876DaFAD7de09404E0c1f868bbf1AE",
      "nonce": "42",
      "deadline": "1735689600",
      "witness": {
        "id": "10"
      }
    }
  },
  "deliverables": [
    {
      "currency": "EURC",
      "amount": "915.00"
    }
  ],
  "receivables": [
    {
      "currency": "USDC",
      "amount": "1000.00"
    }
  ]
}
```

The `deliverables` array lists the token and amount you must deliver as the
maker. The `receivables` array lists the token and amount you receive after
settlement.

### 4.2. Sign the funding data

Using a `Permit2`-compliant EIP-712 compatible wallet or application, sign the
data returned in the previous step.

### 4.3. Submit the funding signature

To deliver the funds onchain, you must submit the maker-specific `Permit2` data
along with your signature to the
[fund trade](/api-reference/stablefx/all/fund-trade) endpoint. The endpoint
allows you to submit either a single object or a batch of objects along with the
required signatures.

The following is an example request for a single trade:

```shell theme={null}
curl --request POST \
  --url https://api.circle.com/v1/exchange/stablefx/fund \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}' \
  --header 'Content-Type: application/json' \
  --data '
{
  "type": "maker",
  "signature": "0xsignature",
  "permit2": {
    "permitted": {
      "token": "0xTOKEN1",
      "amount": "915"
    },
    "spender": "0xTOKEN1",
    "nonce": "123456",
    "deadline": 1752149700,
    "witness": {
      "id": "123456"
    }
  }
}
'
```

If the signed data is accepted, the API returns a blank `200` response.

<Note>
  It's not required to submit the funding transaction through the StableFX API.
  You can submit the transaction onchain using your own web3 provider or wallet by
  calling the appropriate maker contract methods directly.
</Note>

### 4.4. Confirm the trade is funded

To confirm that the trade is funded, call the
[get a trade by ID](/api-reference/stablefx/all/get-trade-by-id) endpoint. The
trade is funded when the status is `maker_funded`.

```shell theme={null}
curl --request GET \
  --url https://api.circle.com/v1/exchange/stablefx/trades/${stablefx_trade_id} \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}'
```
