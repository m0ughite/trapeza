> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrate with CPN as an OFI

> Request, lock, and fulfill a USDC payment quote as an OFI using CPN. Covers Transactions V1 and V2 on EVM blockchains and Solana signing.

Complete this quickstart to request, lock, and fulfill your first USDC payment
quote as an OFI using CPN. Examples cover both Transactions V1 and V2 on EVM
blockchains; where the two versions differ, each step provides version-specific
guidance. Solana follows the same overall flow with differences in the signing
process.

<Note>
  This quickstart uses **Circle Wallets** and **Circle On/Off-Ramps** as
  examples; CPN does not require them. If you use your own wallet and USDC, see
  [Bring your own wallet for CPN](/cpn/concepts/wallets/bring-your-own-wallet)
  and [Wallet provider
  compatibility](/cpn/references/blockchains/wallet-provider-compatibility). For
  Circle setup, follow the how-tos under Prerequisites.
</Note>

## Prerequisites

Before you begin this quickstart, ensure you have:

* API keys created in
  [CPN Console → Developer → API Keys](https://cpn.circle.com/signin) with
  access to **CPN** and **Programmable Wallets**. If you fund USDC through
  Circle APIs for this exercise, you also need a key authorized for those
  **Circle APIs** endpoints.
* Completed operational wallet setup for the quickstart:
  * Follow how to
    [Set Up a Circle Wallet for CPN Payments](/cpn/guides/wallets/setup-circle-wallet-for-cpn-payments),
    **or** use your own wallet that meets
    [Wallet provider compatibility](/cpn/references/blockchains/wallet-provider-compatibility).
  * You need the **wallet ID** of an EOA on the correct chain (`EVM-TESTNET` for
    Transactions V1, `ETH-SEPOLIA` for Transactions V2 when using testnet).
* Funded the operational wallet with enough **USDC** (and, for Transactions V1
  on EVM, enough **native gas**). For sandbox you can use the
  [Circle faucet](https://faucet.circle.com) and an
  [EVM testnet ETH faucet](https://cloud.google.com/application/web3/faucet/ethereum).
  For a guided Circle fiat-to-wallet path, follow how to
  [Set Up Circle On/Off-Ramps for CPN Payments](/cpn/guides/circle-liquidity/setup-circle-on-off-ramps-for-cpn-payments).
* Python installed on your development machine
  * The latest `jwcrypto`, `web3`, `eth_utils`, `hexbytes`, and `eth_abi`
    libraries are installed with the `pip` package manager
* cURL installed on your development machine
* (If using Transactions V2) Granted a USDC allowance to the `Permit2` contract.
  See how to
  [Grant USDC Allowance to Permit2](/cpn/guides/transactions/grant-usdc-allowance-to-permit2)
  for more information.
* (Optional) a
  [configured webhook notification endpoint](/cpn/guides/webhooks/setup-webhook-notifications)

This quickstart provides API requests in cURL format, along with example
responses.

<Note>
  The base URL for all API endpoints is `https://api.circle.com/v1/cpn` for both
  sandbox and production environments. The API determines if a request is for
  testnet or mainnet based on the key used to authenticate the request.
</Note>

## Part 1: Request a quote

Request quotes for a USDC to MX payment with the SPEI payment method. Request
quotes with the [create a quote](/api-reference/cpn/cpn-platform/create-quotes)
endpoint, providing the source currency and destination amount. For Transactions
V2, you must specify `transactionVersion` as `VERSION_2`. The endpoint returns a
list of quotes from various BFIs with the rate, expiration time, USDC settlement
window, and unique ID.

<Note>
  Quotes expire quickly (typically 30–60 seconds). If a quote expires before you
  create the payment, the payment creation endpoint returns an error. Request a
  new quote and restart from Part 1. Save the `id` and `quoteExpireDate` from
  the response so you can check expiration before proceeding.
</Note>

<Tabs>
  <Tab title="Transactions V2">
    ```shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/cpn/quotes \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
        "paymentMethodType": "SPEI",
        "senderCountry": "US",
        "destinationCountry": "MX",
        "sourceAmount": {
            "currency": "USDC"
        },
        "destinationAmount": {
            "amount": "200",
            "currency": "MXN"
        },
        "blockchain": "ETH-SEPOLIA",
        "senderType": "INDIVIDUAL",
        "recipientType": "INDIVIDUAL",
        "transactionVersion": "VERSION_2"
    }
    '
    ```

    **Response**

    ```json theme={null}
    {
      "data": [
        {
          "id": "2792f4a6-f1bd-4435-b681-1da309122159",
          "paymentMethodType": "SPEI",
          "blockchain": "ETH-SEPOLIA",
          "senderCountry": "US",
          "destinationCountry": "MX",
          "createDate": "2025-09-24T00:01:13.532073875Z",
          "quoteExpireDate": "2025-09-24T00:01:42.502094Z",
          "cryptoFundsSettlementExpireDate": "2025-09-24T01:01:12.502097Z",
          "sourceAmount": {
            "amount": "15.000000",
            "currency": "USDC"
          },
          "destinationAmount": {
            "amount": "252.91",
            "currency": "MXN"
          },
          "fiatSettlementTime": {
            "min": "0",
            "max": "5",
            "unit": "MINUTES"
          },
          "exchangeRate": {
            "rate": "16.860667",
            "pair": "USDC/MXN"
          },
          "fees": {
            "totalAmount": {
              "amount": "1.568971",
              "currency": "USDC"
            },
            "breakdown": [
              {
                "type": "TAX_FEE",
                "amount": {
                  "amount": "0.234663",
                  "currency": "USDC"
                }
              },
              {
                "type": "BFI_TRANSACTION_FEE",
                "amount": {
                  "amount": "0.138037",
                  "currency": "USDC"
                }
              },
              {
                "type": "CIRCLE_SERVICE_FEE",
                "amount": {
                  "amount": "0.000000",
                  "currency": "USDC"
                }
              },
              {
                "type": "BLOCKCHAIN_GAS_FEE",
                "amount": {
                  "amount": "1.196271",
                  "currency": "USDC"
                }
              }
            ]
          },
          "senderType": "INDIVIDUAL",
          "recipientType": "INDIVIDUAL",
          "certificate": {
            // certificate object
          },
          "quoteOptions": {
            "isFirstParty": false
          },
          "transactionVersion": "VERSION_2"
        }
      ]
    }
    ```
  </Tab>

  <Tab title="Transactions V1">
    ```shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/cpn/quotes \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
        "paymentMethodType": "SPEI",
        "senderCountry": "US",
        "destinationCountry": "MX",
        "sourceAmount": {
            "currency": "USDC"
        },
        "destinationAmount": {
            "amount": "200",
            "currency": "MXN"
        },
        "blockchain": "ETH-SEPOLIA",
        "senderType": "INDIVIDUAL",
        "recipientType": "INDIVIDUAL"
    }
    '
    ```

    **Response**

    ```json theme={null}
    {
      "data": [
        {
          "id": "922a06cd-ff1e-4ee4-840e-54006893fd1a",
          "paymentMethodType": "SPEI",
          "blockchain": "ETH-SEPOLIA",
          "senderCountry": "US",
          "destinationCountry": "MX",
          "createDate": "2025-03-28T16:21:47.089081899Z",
          "quoteExpireDate": "2025-03-28T16:22:45.713598Z",
          "cryptoFundsSettlementExpireDate": "2025-03-28T18:21:45.713615Z",
          "sourceAmount": {
            "amount": "10.000000",
            "currency": "USDC"
          },
          "destinationAmount": {
            "amount": "200.23",
            "currency": "MXN"
          },
          "fiatSettlementTime": {
            "min": "1",
            "max": "12",
            "unit": "HOURS"
          },
          "exchangeRate": {
            "rate": "20.040000",
            "pair": "USDC/MXN"
          },
          "fees": {
            "totalAmount": {
              "amount": "0.170000",
              "currency": "USDC"
            },
            "breakdown": [
              {
                "type": "TAX_FEE",
                "amount": {
                  "amount": "0.070000",
                  "currency": "USDC"
                }
              },
              {
                "type": "BFI_TRANSACTION_FEE",
                "amount": {
                  "amount": "0.100000",
                  "currency": "USDC"
                }
              }
            ]
          },
          "senderType": "INDIVIDUAL",
          "recipientType": "INDIVIDUAL",
          "certificate": {
            "id": "201c52fc-8866-44cf-a2e2-3ceae098381c",
            "certPem": "LS0t...",
            "domain": "api.circle.com",
            "jwk": {
              "kty": "EC",
              "crv": "P-256",
              "kid": "263521881931753643998528753619816524468853605762",
              "x": "YdjOeAmlNfWV0xIryFAivcp9of21s0c-JhyGEOINV2Y",
              "y": "n621ve_OV_p3jdocxtNkAk4uaKcYR2XWYUu1NMzBei8"
            }
          }
        }
      ]
    }
    ```
  </Tab>
</Tabs>

## Part 2: Create a payment

Use the API to get the requirements for a payment, accept the quote, and create
a payment.

### 2.1. Get payment requirements

Call the
[`/payments/requirements`](/api-reference/cpn/cpn-platform/get-payment-requirements)
endpoint with the quote ID to get the requirements for a payment. The endpoint
returns an object describing the required fields for the compliance check. The
`optional` field for each parameter defines if the parameter must be included in
the response constructed in the next step.

```shell theme={null}
curl -H "Authorization: Bearer ${YOUR_API_KEY}" \
  -X GET "https://api.circle.com/v1/cpn/payments/requirements?quoteId=${QUOTE_ID}"
```

**Response**

```json theme={null}
{
  "data": {
    "travelRule": [
      {
        "name": "ORIGINATOR_FINANCIAL_INSTITUTION_NAME",
        "type": "TEXT",
        "optional": false
      },
      {
        "name": "ORIGINATOR_FINANCIAL_INSTITUTION_ADDRESS",
        "type": "ADDRESS",
        "optional": false
      },
      {
        "name": "ORIGINATOR_FINANCIAL_INSTITUTION_ID",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "ORIGINATOR_NAME",
        "type": "TEXT",
        "optional": false
      },
      {
        "name": "ORIGINATOR_ACCOUNT_NUMBER",
        "type": "TEXT",
        "optional": false
      },
      {
        "name": "ORIGINATOR_ADDRESS",
        "type": "ADDRESS",
        "optional": false
      },
      {
        "name": "BENEFICIARY_NAME",
        "type": "TEXT",
        "optional": false
      },
      {
        "name": "BENEFICIARY_ADDRESS",
        "type": "ADDRESS",
        "optional": false
      },
      {
        "name": "ORIGINATOR_DATE_OF_BIRTH",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "ORIGINATOR_NATIONALITY",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "ORIGINATOR_NATIONAL_IDENTIFICATION_NUMBER",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "BENEFICIARY_DATE_OF_BIRTH",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "BENEFICIARY_NATIONALITY",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "BENEFICIARY_NATIONAL_IDENTIFICATION_NUMBER",
        "type": "TEXT",
        "optional": false
      },
      {
        "name": "BENEFICIARY_PHONE_NUMBER",
        "type": "TEXT",
        "optional": true
      },
      {
        "name": "BENEFICIARY_EMAIL",
        "type": "TEXT",
        "optional": true
      }
    ],
    "beneficiaryAccount": [
      {
        "name": "CLABE",
        "type": "TEXT",
        "optional": false
      }
    ]
  }
}
```

### 2.2. Encrypt the required fields

Construct a JSON object with the information requested in the previous step. For
each schema, the properties that you must include are outlined by the `optional`
field. Encrypt the object with the `jwk` certificate provided in the quote
response.

The correct format for travel rule data and beneficiary account data is a JSON
array of objects where each object contains two properties: `name` and `value`.
You can review an example of each field in how to
[Encrypt Travel Rule Data](/cpn/guides/payments/encrypt-travel-rule-beneficiary-data#step-4-prepare-the-payload).

Create a file called `cpn_encryption.py` and put the following code in it,
replacing the `requirements_response_json` parameter with the contents of the
response from the previous step, and the `certificate_json` parameter with the
`jwk` from the quote response. When you run the script, it outputs the encrypted
beneficiary and travel rule data to the console.

```python Python theme={null}
"""
CPN Requirements V1 Encryption Quickstart

This script demonstrates how to:
1. Parse V1 Requirements response
2. Generate realistic test data matching the fields
3. Encrypt data using JWE for CPN API integration

Usage:
1. Replace certificate_json with your JWK from Quote response
2. Replace requirements_response_json with your Requirements response
3. Run the script to get encrypted data for creating payment API requests
"""

import json
import os
import base64
import random
from typing import Dict, Any, Optional, List
from jwcrypto import jwk, jwe

# ========================================
# Test Data Lists for Realistic Generation
# ========================================

FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Joseph", "Thomas",
    "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara",
    "Susan", "Jessica", "Sarah", "Karen", "Nancy"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
    "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
]

STREET_TYPES = ["St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Way", "Circle", "Court"]
STREET_NAMES = [
    "Main", "Oak", "Maple", "Cedar", "Pine", "Elm", "Washington", "Lake", "Hill",
    "River", "Valley", "Park", "Spring", "Market", "Church", "Bridge", "Highland"
]

CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis",
    "Seattle", "Denver", "Washington"
]

# ========================================
# Helper Functions
# ========================================

def generate_random_name() -> str:
    """Generate a random realistic name."""
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def generate_random_address() -> Dict[str, str]:
    """Generate a random realistic address."""
    street_number = str(random.randint(1, 9999))
    street_name = random.choice(STREET_NAMES)
    street_type = random.choice(STREET_TYPES)
    return {
        "street": f"{street_number} {street_name} {street_type}",
        "city": random.choice(CITIES),
        "country": "US",
        "postalCode": f"{random.randint(10000, 99999)}"
    }

def random_string(length: int = 12) -> str:
    """Generate a random string of given length."""
    return base64.b64encode(os.urandom(length)).decode()[:length]

def get_originator_name(case: Optional[str] = None) -> str:
    """Get the originator name based on test case."""
    if case == 'rfi-failed':
        return "Failed"
    return "Alice Johnson"  # Default for success case

# ========================================
# Core Data Generation
# ========================================

def generate_group_data(fields: List[Dict[str, Any]], originator_name: str) -> List[Dict[str, Any]]:
    """
    Generate test data matching Requirements fields as an array of {name, value}.

    Args:
        fields: List of field objects from Requirements
        originator_name: Name to use for originator fields

    Returns:
        List[{"name": str, "value": Any}] for required fields
    """
    items: List[Dict[str, Any]] = []

    for field in fields:
        name = field["name"]
        field_type = field["type"].upper()
        optional = field.get("optional", False)

        if optional:
            continue  # only include required fields

        # Address fields
        if field_type == "ADDRESS" or "ADDRESS" in name.upper():
            items.append({"name": name, "value": generate_random_address()})

        # Text fields
        elif field_type == "TEXT":
            if "NAME" in name.upper():
                if "ORIGINATOR" in name.upper():
                    items.append({"name": name, "value": originator_name})
                else:
                    items.append({"name": name, "value": generate_random_name()})
            elif "CLABE" in name.upper():
                items.append({"name": name, "value": ''.join(str(random.randint(0, 9)) for _ in range(18))})
            elif "ACCOUNT" in name.upper():
                items.append({"name": name, "value": ''.join(str(random.randint(0, 9)) for _ in range(12))})
            elif "DATE" in name.upper() or "BIRTH" in name.upper():
                year = random.randint(1970, 2000)
                month = random.randint(1, 12)
                day = random.randint(1, 28)
                items.append({"name": name, "value": f"{year:04d}-{month:02d}-{day:02d}"})
            elif "EMAIL" in name.upper():
                items.append({"name": name, "value": f"{random_string(8)}@example.com"})
            else:
                items.append({"name": name, "value": random_string(12)})

    return items

# ========================================
# Encryption
# ========================================

def encrypt_data(data: Any, jwk_data: Dict[str, Any]) -> str:
    """
    Encrypt data using JWE with provided JWK.

    Args:
        data: Data to encrypt (will be JSON serialized)
        jwk_data: JWK from certificate

    Returns:
        Encrypted JWE string
    """
    recipient_key = jwk.JWK(**jwk_data)
    jwe_obj = jwe.JWE(
        plaintext=json.dumps(data).encode(),
        protected=json.dumps({"alg": "ECDH-ES+A128KW", "enc": "A128GCM"})
    )
    jwe_obj.add_recipient(recipient_key)
    return jwe_obj.serialize(True)

# ========================================
# Configuration - Replace with your data
# ========================================

# Certificate JWK - copy from Quote response
# e.g. {"kty":"EC","crv":"P-256","kid":"263...5762","x":"Ydj...2Y","y":"n621...i8"}
certificate_json = '''certificate_json'''

# Requirements response - copy from Requirements API
# e.g. {"data": {"travelRule": [...], "beneficiaryAccount": [...]}}
requirements_response_json = '''requirements_response_json'''

# ========================================
# Main Execution
# ========================================

if __name__ == "__main__":
    # Parse configuration
    certificate = json.loads(certificate_json)
    required_fields = json.loads(requirements_response_json)

    # Extract field arrays
    travel_rule_fields = required_fields['data']['travelRule']
    beneficiary_account_fields = required_fields['data']['beneficiaryAccount']

    # Generate test data (array of {name, value})
    test_data = {
        "travelRuleData": generate_group_data(travel_rule_fields, get_originator_name()),
        "beneficiaryAccountData": generate_group_data(beneficiary_account_fields, get_originator_name())
    }

    # Create encrypted data (encrypt arrays directly)
    travel_rule_encrypted = encrypt_data(test_data["travelRuleData"], certificate)
    beneficiary_account_encrypted = encrypt_data(test_data["beneficiaryAccountData"], certificate)

    # Output encrypted data ready for API
    print(f"Travel Rule encryptedData: {travel_rule_encrypted}\n")
    print(f"Beneficiary Account encryptedData: {beneficiary_account_encrypted}")
```

### 2.3. Create a payment

After the quote is accepted, create a payment by calling the
[`/payments`](/api-reference/cpn/cpn-platform/create-payment) endpoint. You need
to provide the quote ID and encrypted sender and receiver information. The
endpoint returns a unique payment ID and the initial status of the payment.

<Note>
  You must create the payment before the quote expires. If the quote has
  expired, request a new quote and restart from Part 1. Once the payment is
  created, save the payment `id` and `expireDate`. You must complete the onchain
  transaction before the payment expires.
</Note>

```bash Shell theme={null}
curl --request POST \
  --url https://api.circle.com/v1/cpn/payments \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer ${YOUR_API_KEY}' \
  --header 'Content-type: application/json' \
  --data '
{
  "idempotencyKey" : "${randomUUID}",
  "quoteId" : "${cpn_ofi_quote_id}",
  "beneficiaryAccountData" : "${encrypted_beneficiary_data}",
  "travelRuleData" : "${encrypted_travel_rule_data}",
  "senderAddress" : "${YOUR_WALLET_ADDRESS}",
  "blockchain" : "ETH-SEPOLIA",
  "reasonForPayment" : "PMT001",
  "customerRefId" : "123c7442-e843-4afa-bfad-35f50636d35b",
  "refCode" : "7b479c5a-3684-4423-9fc6-f7c890c0e816",
  "useCase" : "B2B"
}
'
```

**Response**

```json JSON theme={null}
{
  "data": {
    "id": "07dbe320-6bcb-475b-8d21-17b57263cd3e",
    "quoteId": "922a06cd-ff1e-4ee4-840e-54006893fd1a",
    "blockchain": "ETH-SEPOLIA",
    "paymentMethodType": "SPEI",
    "sourceAmount": {
      "amount": "10.000000",
      "currency": "USDC"
    },
    "destinationAmount": {
      "amount": "200.23",
      "currency": "MXN"
    },
    "status": "CRYPTO_FUNDS_PENDING",
    "refCode": "7b479c5a-3684-4423-9fc6-f7c890c0e816",
    "customerRefId": "123c7442-e843-4afa-bfad-35f50636d35b",
    "useCase": "B2B_INVOICE_PAYMENT",
    "expireDate": "2025-03-31T20:59:21.211547Z",
    "createDate": "2025-03-31T18:59:30.183044Z",
    "fees": {
      "totalAmount": {
        "amount": "0.170000",
        "currency": "USDC"
      },
      "breakdown": [
        {
          "type": "TAX_FEE",
          "amount": {
            "amount": "0.070000",
            "currency": "USDC"
          }
        },
        {
          "type": "BFI_TRANSACTION_FEE",
          "amount": {
            "amount": "0.100000",
            "currency": "USDC"
          }
        }
      ]
    },
    "fiatSettlementTime": {
      "min": "1",
      "max": "12",
      "unit": "HOURS"
    },
    "rfis": [],
    "onChainTransactions": []
  }
}
```

## Part 3: Create a transaction

Use the API to create a blockchain transaction to transfer USDC. Sign the
transaction locally, and use the API to broadcast it to the blockchain.

<Note>
  This quickstart uses Circle Wallets (or your equivalent operational wallet) as
  the originator wallet. Use the wallet ID from the
  [prerequisites](#prerequisites) section, including any funding you completed
  via the Circle Wallet or Circle On/Off-Ramps how-tos.
</Note>

### 3.1. Initiate the onchain transaction

Initiate the onchain funds transfer by calling the
[`/payments/{paymentId}/transactions`](/api-reference/cpn/cpn-platform/create-transaction)
endpoint with the payment ID from the previous step, and other
transaction-related parameters. Note that if you are using Transactions V2, you
should use the
[create transaction V2](/api-reference/cpn/cpn-platform/create-transaction-v2)
endpoint. The endpoint returns an unsigned onchain transaction object and a
transaction ID.

<Tabs>
  <Tab title="Transactions V2">
    ```shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v2/cpn/payments/:paymentId/transactions \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
      "idempotencyKey" : "${RANDOM_UUID}"
    }
    '
    ```

    **Response**

    ```json theme={null}
    {
      "data": {
        "id": "dbc27d23-cd4f-447e-855e-349cb2853d23",
        "status": "CREATED",
        "paymentId": "49d4231e-6c4f-319e-946d-ed8c8bab5abc",
        "expireDate": "2025-09-08T20:02:06.651391Z",
        "blockchain": "ETH-SEPOLIA",
        "senderAddress": "0x57414adbBbc4BBA36f1dE26b2dc1648b28ae7799",
        "destinationAddress": "0xc75c3e371d617b3e60db1b6f3fa2f0689562e5a7",
        "amount": {
          "amount": "15.000000",
          "currency": "USDC"
        },
        "messageType": "PAYMENT_SETTLEMENT_CONTRACT_V1_0_PAYMENT_INTENT",
        "messageToBeSigned": {
          "domain": {
            "name": "Permit2",
            "chainId": "11155111",
            "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
          },
          "message": {
            "permitted": {
              "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
              "amount": "14174474"
            },
            "spender": "0xe2B17D0C1736dc7C462ABc4233C91BDb9F27DD1d",
            "nonce": "25668617285137697861288274946631174355105919960416755114569514179393151588120",
            "deadline": "1757362866",
            "witness": {
              "from": "0x57414adbBbc4BBA36f1dE26b2dc1648b28ae7799",
              "to": "0xc75c3e371d617b3e60db1b6f3fa2f0689562e5a7",
              "value": 14174474,
              "validAfter": "1757358106",
              "validBefore": "1757361726",
              "nonce": "0x38bfec2b230187932870d575132e8ae1f83b34c10e3bf6d64c377f0c13245718",
              "beneficiary": "0x4f1c3a0359A7fAd8Fa8E9E872F7C06dAd97C91Fd",
              "maxFee": "0",
              "attester": "0x768919ef04853b5fd444ccff48cea154768a0291",
              "requirePayeeSign": false
            }
          },
          "primaryType": "PermitWitnessTransferFrom",
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
                "type": "PaymentIntent"
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
            "PaymentIntent": [
              {
                "name": "from",
                "type": "address"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              },
              {
                "name": "validAfter",
                "type": "uint256"
              },
              {
                "name": "validBefore",
                "type": "uint256"
              },
              {
                "name": "nonce",
                "type": "bytes32"
              },
              {
                "name": "beneficiary",
                "type": "address"
              },
              {
                "name": "maxFee",
                "type": "uint256"
              },
              {
                "name": "requirePayeeSign",
                "type": "bool"
              },
              {
                "name": "attester",
                "type": "address"
              }
            ]
          }
        },
        "metadata": {}
      }
    }
    ```
  </Tab>

  <Tab title="Transactions V1">
    ```shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/cpn/payments/:paymentId/transactions \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
      "idempotencyKey" : "${RANDOM_UUID}",
      "senderAccountType": "EOA",
    }
    '
    ```

    **Response**

    ```json theme={null}
    {
      "data": {
        "id": "8e0cc03f-799c-4971-ba41-6b790b4f9548",
        "status": "CREATED",
        "paymentId": "0a6973af-3089-4265-812b-0f68a426a4d8",
        "expireDate": "2025-04-01T17:28:25.198159Z",
        "senderAddress": "0x140f52a9D27764a51032ebDff7E6352D1640cbfd",
        "senderAccountType": "EOA",
        "blockchain": "ETH-SEPOLIA",
        "amount": {
          "amount": "10.000000",
          "currency": "USDC"
        },
        "destinationAddress": "0x6e87cdf0b9d2d96232f5c605526cb0e89db7387a",
        "estimatedFee": {
          "type": "EIP1559",
          "payload": {
            "gasLimit": "150000",
            "maxFeePerGas": "4829089726",
            "maxPriorityFeePerGas": "2000000000"
          }
        },
        "messageType": "EIP3009",
        "messageToBeSigned": {
          "domain": {
            "chainId": "11155111",
            "name": "USDC",
            "verifyingContract": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            "version": "2"
          },
          "message": {
            "from": "0x140f52a9D27764a51032ebDff7E6352D1640cbfd",
            "nonce": "0x75cc053bfcdedd359bfdaaa560fc0c7d3899097dcf6396e65b029df3b1e05a0e",
            "to": "0x6e87cdf0b9d2d96232f5c605526cb0e89db7387a",
            "validAfter": "1743519573",
            "validBefore": "1743527605",
            "value": "10000000"
          },
          "primaryType": "TransferWithAuthorization",
          "types": {
            "EIP712Domain": [
              {
                "name": "name",
                "type": "string"
              },
              {
                "name": "version",
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
            "TransferWithAuthorization": [
              {
                "name": "from",
                "type": "address"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              },
              {
                "name": "validAfter",
                "type": "uint256"
              },
              {
                "name": "validBefore",
                "type": "uint256"
              },
              {
                "name": "nonce",
                "type": "bytes32"
              }
            ]
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

### 3.2 Sign the onchain transaction

<Note>
  The following steps are for EVM blockchains. For Solana, you would follow a
  similar process with some differences in the signing. Refer to how to [Create
  an Onchain Transaction](/cpn/guides/transactions/create-an-onchain-txn) for
  more information.
</Note>

<Tabs>
  <Tab title="Transactions V2">
    Using the
    [`/sign/typedData`](/api-reference/wallets/developer-controlled-wallets/sign-typed-data)
    endpoint, input the `messageToBeSigned` object from the previous step along with
    your entity secret and wallet ID. The transaction parameter should be
    [stringified](https://jsonformatter.org/json-stringify-online) from the
    `messageToBeSigned` field from the transaction response.

    ```bash Shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/w3s/developer/sign/typedData \
      --header 'Accept: application/json' \
      --header 'authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
      "entitySecretCiphertext": "qXnnGgbsU5lBUGiW9kp2/ltuvSSWW4qJ4/9VKuQT7wd6+ge2y7xqYnEc0pHbqLuj+YBDaPMfRUl1X+K1hbyiPTRVjCqHD5x3DyLtj8eTG/GmIimYfXOveXIJjsT95T8bI9uJ9kxygYAQbNev6wX993OYTYZ8D2PfVLUV3BicTSiClqhgSLW1Nh0qJ+TK0p2rOHs2HZkGA/WTv4SQv+uq//wEbUWFmrrD/ToTSuv3tMQvluCMYDF9xO/F6EoQwmP/XJCpPihGZuvrweTnhHbNWe5suvSSKpB+8Yo6f24ttNtCwvHrLBVaF6U9EZrCRpCydHJuuVBf5j7AD0JPC2DPFAG2p/Upq/KdzF1r8GJ4j2SsFLyzQEAw3ZAl623UiB/F3Szu2T/fYeF0rkfNt6tYKqmCmhvlzvn8BBkgIXsdcoEmNsf4x7b7UwPk9EloTibF4MhkGIW7jDHWWXlL3gKpGzMug+A2bIYdwUtqQ+u65pDi4+o+tuEH8MtM9Mmt3YaP2Zr40wj/uMnRv53hc+Apzsvh6UIsmliK2ldPyfXg77eDEzU7E228al/jIi2YQacQLNAAV870v3iKFB0PeWiUNtVlUdnqXmZkMA/bmg4TOo05ROGJWkfPVFWUNoocyEvCfEasj0ZflfbO8W2Q0M9BqhqjU/WHEBrYnF65ytY0A+8=",
      "data": "{\"domain\":{\"chainId\":\"11155111\",\"name\":\"USDC\",\"verifyingContract\":\"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238\",\"version\":\"2\"},\"message\":{\"from\":\"0x39fd73b03a01c6230b5e0d946e1960d79db44fd8\",\"nonce\":\"0x854f1f66cb7cb0e266e17a3715c24c8dae1eb540c4eb00a7a1b39f4bfa9bcf09\",\"to\":\"0x6734b39043f1029f8d5f1b6948d5417b75a72cf8\",\"validAfter\":\"1743522751\",\"validBefore\":\"1743530842\",\"value\":\"10000000\"},\"primaryType\":\"TransferWithAuthorization\",\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"TransferWithAuthorization\":[{\"name\":\"from\",\"type\":\"address\"},{\"name\":\"to\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"},{\"name\":\"validAfter\",\"type\":\"uint256\"},{\"name\":\"validBefore\",\"type\":\"uint256\"},{\"name\":\"nonce\",\"type\":\"bytes32\"}]}}",
      "walletId": "${YOUR_CIRCLE_WALLET_ID}"
    }
    '
    ```

    **Response**

    ```json JSON theme={null}
    {
      "signature": "0x905d70de3f1d9e86b982f6aee2755807fcd50a11cd9035bf47845c856be920fc3b7af8d06bf953bfdecdcea4cc9250aeaeb178b50116774d6bfab37bcc3757621c"
    }
    ```
  </Tab>

  <Tab title="Transactions V1">
    Using the
    [`/sign/typedData`](/api-reference/wallets/developer-controlled-wallets/sign-typed-data)
    endpoint, input the `messageToBeSigned` object from the previous step along with
    your entity secret and wallet ID. The transaction parameter should be
    [stringified](https://jsonformatter.org/json-stringify-online) from the
    `messageToBeSigned` field from the transaction response.

    ```bash Shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/w3s/developer/sign/typedData \
      --header 'Accept: application/json' \
      --header 'authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
      "entitySecretCiphertext": "qXnnGgbsU5lBUGiW9kp2/ltuvSSWW4qJ4/9VKuQT7wd6+ge2y7xqYnEc0pHbqLuj+YBDaPMfRUl1X+K1hbyiPTRVjCqHD5x3DyLtj8eTG/GmIimYfXOveXIJjsT95T8bI9uJ9kxygYAQbNev6wX993OYTYZ8D2PfVLUV3BicTSiClqhgSLW1Nh0qJ+TK0p2rOHs2HZkGA/WTv4SQv+uq//wEbUWFmrrD/ToTSuv3tMQvluCMYDF9xO/F6EoQwmP/XJCpPihGZuvrweTnhHbNWe5suvSSKpB+8Yo6f24ttNtCwvHrLBVaF6U9EZrCRpCydHJuuVBf5j7AD0JPC2DPFAG2p/Upq/KdzF1r8GJ4j2SsFLyzQEAw3ZAl623UiB/F3Szu2T/fYeF0rkfNt6tYKqmCmhvlzvn8BBkgIXsdcoEmNsf4x7b7UwPk9EloTibF4MhkGIW7jDHWWXlL3gKpGzMug+A2bIYdwUtqQ+u65pDi4+o+tuEH8MtM9Mmt3YaP2Zr40wj/uMnRv53hc+Apzsvh6UIsmliK2ldPyfXg77eDEzU7E228al/jIi2YQacQLNAAV870v3iKFB0PeWiUNtVlUdnqXmZkMA/bmg4TOo05ROGJWkfPVFWUNoocyEvCfEasj0ZflfbO8W2Q0M9BqhqjU/WHEBrYnF65ytY0A+8=",
      "data": "{\"domain\":{\"chainId\":\"11155111\",\"name\":\"USDC\",\"verifyingContract\":\"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238\",\"version\":\"2\"},\"message\":{\"from\":\"0x39fd73b03a01c6230b5e0d946e1960d79db44fd8\",\"nonce\":\"0x854f1f66cb7cb0e266e17a3715c24c8dae1eb540c4eb00a7a1b39f4bfa9bcf09\",\"to\":\"0x6734b39043f1029f8d5f1b6948d5417b75a72cf8\",\"validAfter\":\"1743522751\",\"validBefore\":\"1743530842\",\"value\":\"10000000\"},\"primaryType\":\"TransferWithAuthorization\",\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"TransferWithAuthorization\":[{\"name\":\"from\",\"type\":\"address\"},{\"name\":\"to\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"},{\"name\":\"validAfter\",\"type\":\"uint256\"},{\"name\":\"validBefore\",\"type\":\"uint256\"},{\"name\":\"nonce\",\"type\":\"bytes32\"}]}}",
      "walletId": "${YOUR_CIRCLE_WALLET_ID}"
    }
    '
    ```

    **Response**

    ```json JSON theme={null}
    {
      "signature": "0x905d70de3f1d9e86b982f6aee2755807fcd50a11cd9035bf47845c856be920fc3b7af8d06bf953bfdecdcea4cc9250aeaeb178b50116774d6bfab37bcc3757621c"
    }
    ```

    Create a file called `cpn_signature.py` and add the following code to it,
    replacing `circle_signature` with the signature returned from the endpoint, and
    replacing the message object values with the corresponding values from the
    response in
    [step 3.1](/cpn/quickstarts/integrate-with-cpn-ofi#3-1-initiate-the-onchain-transaction).

    ```python Python theme={null}
    from web3 import Web3
    from eth_utils import keccak, to_hex
    from hexbytes import HexBytes
    from eth_abi import encode

    def get_function_selector(signature: str) -> str:
        """Return 4-byte function selector from signature."""
        hash_bytes = keccak(text=signature)
        return to_hex(hash_bytes[:4])

    def encode_transfer_with_authorization(
        from_address: str,
        to_address: str,
        value: int,
        valid_after: int,
        valid_before: int,
        nonce: str,
        v: int,
        r: str,
        s: str
    ) -> str:
        """Encode callData for transferWithAuthorization (EIP-3009 USDC)."""
        types = [
            "address", "address", "uint256", "uint256", "uint256",
            "bytes32", "uint8", "bytes32", "bytes32"
        ]
        args = [
            Web3.to_checksum_address(from_address),
            Web3.to_checksum_address(to_address),
            value,
            valid_after,
            valid_before,
            HexBytes(nonce),
            v,
            HexBytes(r),
            HexBytes(s)
        ]
        encoded_args = encode(types, args)
        selector = get_function_selector(f"transferWithAuthorization({','.join(types)})")
        return selector + encoded_args.hex()

    # === INPUT DATA ===

    circle_signature = your_signature
    message = {
        "from": your_from_address,
        "to": your_to_address,
        "value": 10_000_000,  # 10 USDC (6 decimals)
        "validAfter": your_valid_after,
        "validBefore": your_valid_before,
        "nonce": your_nonce
    }

    # === SPLIT SIGNATURE ===

    sig_bytes = Web3.to_bytes(hexstr=circle_signature)
    r = Web3.to_hex(sig_bytes[0:32])
    s = Web3.to_hex(sig_bytes[32:64])
    v = sig_bytes[64]
    if v < 27:
        v += 27  # Normalize v for Ethereum

    # === ENCODE CALL DATA ===

    call_data = encode_transfer_with_authorization(
        from_address=message["from"],
        to_address=message["to"],
        value=message["value"],
        valid_after=message["validAfter"],
        valid_before=message["validBefore"],
        nonce=message["nonce"],
        v=v,
        r=r,
        s=s
    )

    print(f"✅ Final Call Data:\n{call_data}")
    ```

    Next, you must create and sign the raw transaction using the
    [`/sign-transaction`](/api-reference/wallets/developer-controlled-wallets/sign-transaction)
    endpoint. Include the call data from the script as the `data` field and the
    wallet ID from your Circle Wallet.

    The raw transaction to be signed can be composed like the following example:

    ```json JSON theme={null}
    {
      "nonce": 1, // The nonce of the sender address, obtained via eth_getTransactionCount RPC call
      "to": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // The target contract address, in this case, the USDC contract address
      "gas": "150000", // The gas limit for the transaction, from `data.estimatedFee.payload.gasLimit` in the step 3.1 response.
      "maxFeePerGas": "70000000000", // The max fee per gas, from `data.estimatedFee.payload.maxFeePerGas` in the step 3.1 response.
      "maxPriorityFeePerGas": "3000000000", // The max priority fee per gas, from `data.estimatedFee.payload.maxPriorityFeePerGas` in the step 3.1 response.
      "chainId": 11155111, // The chain ID, for Ethereum Sepolia testnet, the chain ID is 11155111
      // The call data, obtained from the script in step 3.2
      "data": "0xe3ee160e00000000000000000000000039fd73b03a01c6230b5e0d946e1960d79db44fd80000000000000000000000003eebc158f254838e2f6275b892e6a0621e3ea321000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000680bc9e000000000000000000000000000000000000000000000000000000000680be8863a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2000000000000000000000000000000000000000000000000000000000000001bd6960c1cc4c28482a3c96ea35e5c0cfe84f4e466f734de02023b15101c9735a04830dbfeeccd565705c1e8b92b3dd038d720130f5a3101bf43160be49e0f1651"
    }
    ```

    Use the following endpoint to sign the transaction:

    ```bash Shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/w3s/developer/sign/transaction \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-Type: application/json' \
      --data '
    {
      "entitySecretCiphertext": "h8R0RizKx0KWX2wpZgfcUoSSFms0Qj/6pkGH3JSKaYJPhSNRl2GpPWba9ZilCRivI42Di9MRAxI5jsGjay1tyQcrasq3o0aC4jNvK6RH7f8DOnoeNQjmL4pFlLzp/R+NduNI/w/JH5rk84JhsAkOy5yXkMmGf9IkQbh4+381VojV3P8FCuVzsJDTI5KDWzzwMR3eExmQN8QmKlIIyxlAm1JSxhS5Y/9GqqMY+jtcSkxzkX965GzkGyODRo0gxPuUZCiES1lHSe9tkLJWs5AgvJ/2MVpaiDmcIXZJ3JNBw2EuAMp6uRiv3OiODrThgP44YSpvTPavfxDtAnxyw7ZrPSUeN8wX8RBsTpqxZaJvy4aJTCgnDjfvqfPcsg90UqhXYI0VBVU5489s89HHKw76AYp4Hz52Iu4FtsA6r2PidN4Cccp7Ges7gOde6vG36mOG0ODcxMwKyWcAkNdZYEPBQ1DK0c1s5dbNYImBHZ+EnfY0TlHroFOKYhMihrhkXTjCTL+HiSboJtoVGvOphmsyvoQMg0fzprJUVhOraH/soQkd61eulETFN6vJq8R5ODFeeBDlOkZny1Om2ZUd8tdobZDlVGiSZFUR4rPlntoUN5g/hPp8lB+25UN2KaIUiX3OR01EvRedA6Xr+kqzVsmgKmkNW1aFuOJFXEAXlMjR2fU=",
      "transaction": "{\"nonce\":1,\"to\":\"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238\",\"gas\":\"150000\",\"maxFeePerGas\":\"70000000000\",\"maxPriorityFeePerGas\":\"3000000000\",\"chainId\":11155111,\"data\":\"0xe3ee160e00000000000000000000000039fd73b03a01c6230b5e0d946e1960d79db44fd80000000000000000000000003eebc158f254838e2f6275b892e6a0621e3ea321000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000680bc9e000000000000000000000000000000000000000000000000000000000680be8863a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2000000000000000000000000000000000000000000000000000000000000001bd6960c1cc4c28482a3c96ea35e5c0cfe84f4e466f734de02023b15101c9735a04830dbfeeccd565705c1e8b92b3dd038d720130f5a3101bf43160be49e0f1651\"}",
      "walletId": "${YOUR_CIRCLE_WALLET_ID}"
    }
    '
    ```

    **Response**

    ```json JSON theme={null}
    {
      "signature": "0xe59d32312a920b6c63ad4c7344bb76d8e7cae2615f79f707649e325abea00a247cddec90138bb6790e68e01998fdf77efc9496a91b3b4b42e59fd0e8ad89d0bc00",
      "signedTransaction": "0x02f9019583aa36a70184b2d05e0085104c533c00830249f0941c7d4b196cb0c7b01d743fbc6116a902379c723880b90124e3ee160e00000000000000000000000039fd73b03a01c6230b5e0d946e1960d79db44fd80000000000000000000000003eebc158f254838e2f6275b892e6a0621e3ea321000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000680bc9e000000000000000000000000000000000000000000000000000000000680be8863a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2000000000000000000000000000000000000000000000000000000000000001bd6960c1cc4c28482a3c96ea35e5c0cfe84f4e466f734de02023b15101c9735a04830dbfeeccd565705c1e8b92b3dd038d720130f5a3101bf43160be49e0f1651c080a0e59d32312a920b6c63ad4c7344bb76d8e7cae2615f79f707649e325abea00a24a07cddec90138bb6790e68e01998fdf77efc9496a91b3b4b42e59fd0e8ad89d0bc",
      "txHash": "0xc1d5963f87e4a9035eae4e31fe7842a8bc1cd0ebf941d541c0b7ff37b4d1f5df"
    }
    ```
  </Tab>
</Tabs>

### 3.3. Submit the signed transaction

<Tabs>
  <Tab title="Transactions V2">
    Use the
    [`/v2/cpn/payments/{paymentId}/transactions/{transactionId}/submit`](/api-reference/cpn/cpn-platform/submit-transaction-v2)
    endpoint to submit the transaction to be broadcast to the blockchain.
    You should submit the EIP-712 typed data signature you obtained from the `/sign/typedData` endpoint in
    [step 3.2.](#3-2-sign-the-onchain-transaction) as `signedTransaction`.

    ```bash Shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v2/cpn/payments/:paymentId/transactions/:transactionId/submit \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-type: application/json' \
      --data '
    {
      "signedTransaction": "0x12b5fb72e99f9bb0300d2eb66a6d89dd5a667f43669893cf14bfcc390754dcb61b69f92cba598ec83a184e11c97e3bb9964a2bfd7a09688eee63f586ad9ccae21c"
    }
    '
    ```

    **Response**

    ```json JSON theme={null}
    {
      "data": {
        "id": "5cae9e1c-f3e3-44e5-ac36-d78f4ff9c56e",
        "status": "PENDING",
        "paymentId": "2b2b314a-0c06-39bb-b111-506f56599a17",
        "expireDate": "2025-11-12T00:08:42.000875Z",
        "blockchain": "ETH-SEPOLIA",
        "senderAddress": "0x57414adbBbc4BBA36f1dE26b2dc1648b28ae7799",
        "destinationAddress": "0xded12af48fb343b446bcbe739c5211636896362b",
        "amount": {
          "amount": "11.948672",
          "currency": "USDC"
        },
        "messageType": "PAYMENT_SETTLEMENT_CONTRACT_V1_0_PAYMENT_INTENT",
        "messageToBeSigned": {
          "domain": {
            "name": "Permit2",
            "chainId": "11155111",
            "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
          },
          "message": {
            "permitted": {
              "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
              "amount": "11948672"
            },
            "spender": "0x8ea7239f185CC32AB1Ff698f1b1A3aAB615D6d2c",
            "nonce": "55519981872451242578307489093459806523820915276389791540432104685160022674073",
            "deadline": "1762907262",
            "witness": {
              "from": "0x57414adbBbc4BBA36f1dE26b2dc1648b28ae7799",
              "to": "0xded12af48fb343b446bcbe739c5211636896362b",
              "value": 11048874,
              "validAfter": "1762901905",
              "validBefore": "1762906122",
              "nonce": "0x7abf323679377bff4d064e663e44b7064985eab99693dec4a9e8a9f941a80a99",
              "beneficiary": "0x8049E74C07A6BAdc8ddeB7C3530Ab9Af30037211",
              "maxFee": "899798",
              "attester": "0xcf9e077c75ce6bd22f48163e559d20b10708ae85",
              "requirePayeeSign": false
            }
          },
          "primaryType": "PermitWitnessTransferFrom",
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
                "type": "PaymentIntent"
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
            "PaymentIntent": [
              {
                "name": "from",
                "type": "address"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              },
              {
                "name": "validAfter",
                "type": "uint256"
              },
              {
                "name": "validBefore",
                "type": "uint256"
              },
              {
                "name": "nonce",
                "type": "bytes32"
              },
              {
                "name": "beneficiary",
                "type": "address"
              },
              {
                "name": "maxFee",
                "type": "uint256"
              },
              {
                "name": "requirePayeeSign",
                "type": "bool"
              },
              {
                "name": "attester",
                "type": "address"
              }
            ]
          }
        },
        "encodedMessageToBeSigned": "0xabc6f65eb8b2c264ae486b7244e9ca887cd0f8bd29422f651042665c14974ef3",
        "metadata": {},
        "version": "VERSION_2"
      }
    }
    ```

    <Note>
      `transactionHash` will be provided after transaction is in `COMPLETED` status.
      You can monitor for the transactions webhook events to get the
      `transactionHash`.
    </Note>
  </Tab>

  <Tab title="Transactions V1">
    Use the
    [`/v1/cpn/payments/{paymentId}/transactions/{transactionId}/submit`](/api-reference/cpn/cpn-platform/submit-transaction)
    endpoint to submit the transaction to be broadcast to the blockchain.
    You should submit the `signedTransaction` you obtained from the
    `/sign/transaction` endpoint in [step 3.2](#3-2-sign-the-onchain-transaction).

    ```shell theme={null}
    curl --request POST \
      --url https://api.circle.com/v1/cpn/payments/:paymentId/transactions/:transactionId/submit \
      --header 'Accept: application/json' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}' \
      --header 'Content-type: application/json' \
      --data '
    {
      "signedTransaction": "0x02f9019583aa36a70184b2d05e0085104c533c00830249f0941c7d4b196cb0c7b01d743fbc6116a902379c723880b90124e3ee160e00000000000000000000000039fd73b03a01c6230b5e0d946e1960d79db44fd80000000000000000000000003eebc158f254838e2f6275b892e6a0621e3ea321000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000680bc9e000000000000000000000000000000000000000000000000000000000680be8863a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2000000000000000000000000000000000000000000000000000000000000001bd6960c1cc4c28482a3c96ea35e5c0cfe84f4e466f734de02023b15101c9735a04830dbfeeccd565705c1e8b92b3dd038d720130f5a3101bf43160be49e0f1651c080a0e59d32312a920b6c63ad4c7344bb76d8e7cae2615f79f707649e325abea00a24a07cddec90138bb6790e68e01998fdf77efc9496a91b3b4b42e59fd0e8ad89d0bc"
    }
    '
    ```

    **Response**

    ```json theme={null}
    {
      "data": {
        "id": "1f3ccc13-69e3-4811-9648-755bc9aa26f4",
        "status": "PENDING",
        "paymentId": "fed8687a-d911-3682-a6f2-b2474a1016ba",
        "expireDate": "2025-04-25T19:54:46.230217Z",
        "senderAddress": "0x39fd73b03a01c6230b5e0d946e1960d79db44fd8",
        "senderAccountType": "EOA",
        "blockchain": "ETH-SEPOLIA",
        "amount": {
          "amount": "10.000000",
          "currency": "USDC"
        },
        "destinationAddress": "0x3eebc158f254838e2f6275b892e6a0621e3ea321",
        "estimatedFee": {
          "type": "EIP1559",
          "payload": {
            "gasLimit": "150000",
            "maxFeePerGas": "27514930294",
            "maxPriorityFeePerGas": "2000000000"
          }
        },
        "messageType": "EIP3009",
        "messageToBeSigned": {
          "domain": {
            "chainId": "11155111",
            "name": "USDC",
            "verifyingContract": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            "version": "2"
          },
          "message": {
            "from": "0x39fd73b03a01c6230b5e0d946e1960d79db44fd8",
            "nonce": "0x3a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2",
            "to": "0x3eebc158f254838e2f6275b892e6a0621e3ea321",
            "validAfter": "1745603040",
            "validBefore": "1745610886",
            "value": "10000000"
          },
          "primaryType": "TransferWithAuthorization",
          "types": {
            "EIP712Domain": [
              {
                "name": "name",
                "type": "string"
              },
              {
                "name": "version",
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
            "TransferWithAuthorization": [
              {
                "name": "from",
                "type": "address"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              },
              {
                "name": "validAfter",
                "type": "uint256"
              },
              {
                "name": "validBefore",
                "type": "uint256"
              },
              {
                "name": "nonce",
                "type": "bytes32"
              }
            ]
          }
        },
        "signedTransaction": "0x02f9019583aa36a70184b2d05e0085104c533c00830249f0941c7d4b196cb0c7b01d743fbc6116a902379c723880b90124e3ee160e00000000000000000000000039fd73b03a01c6230b5e0d946e1960d79db44fd80000000000000000000000003eebc158f254838e2f6275b892e6a0621e3ea321000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000680bc9e000000000000000000000000000000000000000000000000000000000680be8863a30a084fe9ef623cf95ea778067b98b69accf602b8f240f55073339f4c2f2b2000000000000000000000000000000000000000000000000000000000000001bd6960c1cc4c28482a3c96ea35e5c0cfe84f4e466f734de02023b15101c9735a04830dbfeeccd565705c1e8b92b3dd038d720130f5a3101bf43160be49e0f1651c080a0e59d32312a920b6c63ad4c7344bb76d8e7cae2615f79f707649e325abea00a24a07cddec90138bb6790e68e01998fdf77efc9496a91b3b4b42e59fd0e8ad89d0bc",
        "transactionHash": "0xc1d5963f87e4a9035eae4e31fe7842a8bc1cd0ebf941d541c0b7ff37b4d1f5df"
      }
    }
    ```
  </Tab>
</Tabs>

Once the onchain transaction is confirmed by the BFI, the BFI initiates a fiat
payout to the recipient. As the fiat payout progresses, the OFI is notified by
[webhook notifications](/cpn/guides/webhooks/setup-webhook-notifications).
