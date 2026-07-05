> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Receive a Stablecoin Payin

> Create a payment intent, obtain a deposit address, and confirm onchain USDC or EURC payins using the Crypto Deposits API.

Use the Crypto Deposits API to accept onchain USDC or EURC
[stablecoin payins](/circle-mint/how-stablecoin-payins-and-payouts-work) into
Circle Mint from your customers' wallets. You create the payment intent, share
the deposit address, have the customer send funds, then confirm the transfer
using the API or webhooks. The examples in this quickstart use Ethereum, but you
can use any
[supported blockchain](/circle-mint/references/supported-chains-and-currencies).

## Prerequisites

Before you begin this tutorial, ensure you've:

* Obtained a
  [Circle Mint sandbox API key](/circle-mint/quickstarts/getting-started) with
  access to the Crypto Deposits API (stablecoin payins).
* Obtained a `merchantWalletId` for the wallet that receives settled funds.
* Installed cURL for API calls.
* (Optional) Configured
  [webhook notifications](/circle-mint/circle-apis-notifications-quickstart).

## Step 1: Create a payment intent

Call
[Create a payment intent](/api-reference/circle-mint/payments/create-payment-intent)
when the customer chooses to pay with USDC or EURC onchain. Choose continuous or
transient mode.

**Expected result:** a response with a payment intent `id` and `timeline`
including `created`.

<Tabs>
  <Tab title="Continuous (default mode)">
    Continuous payment intents are the default type. You do not include an `amount`
    at creation.

    Example request:

    ```bash cURL theme={null}
    curl --location --request POST 'https://api-sandbox.circle.com/v1/paymentIntents' \
    --header 'X-Request-Id: ${GUID}' \
    --header 'Authorization: Bearer ${YOUR_API_KEY}' \
    --header 'Content-Type: application/json' \
    --data-raw '{
      "idempotencyKey": "17607606-e383-4874-87c3-7e46a5dc03dd",
      "currency": "USD",
      "settlementCurrency": "USD",
      "merchantWalletId": "${MERCHANT_WALLET_ID}",
      "paymentMethods": [
        {
          "type": "blockchain",
          "chain": "ETH"
        }
      ],
      "type": "continuous"
    }'
    ```

    Example response:

    ```json JSON theme={null}
    {
      "data": {
        "id": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
        "currency": "USD",
        "settlementCurrency": "USD",
        "amountPaid": {
          "amount": "0.00",
          "currency": "USD"
        },
        "paymentMethods": [
          {
            "type": "blockchain",
            "chain": "ETH"
          }
        ],
        "timeline": [
          {
            "status": "created",
            "time": "2023-01-21T20:13:35.579331Z"
          }
        ],
        "type": "continuous",
        "createDate": "2023-01-21T20:13:35.578678Z",
        "updateDate": "2023-01-21T20:13:35.578678Z"
      }
    }
    ```
  </Tab>

  <Tab title="Transient">
    Transient intents include a specific `amount` and are intended for a single
    checkout payment. You must set the `type` to `transient`.

    Example request:

    ```bash cURL theme={null}
    curl --location --request POST 'https://api-sandbox.circle.com/v1/paymentIntents' \
    --header 'X-Request-Id: ${GUID}' \
    --header 'Authorization: Bearer ${YOUR_API_KEY}' \
    --header 'Content-Type: application/json' \
    --data-raw '{
      "idempotencyKey": "17607606-e383-4874-87c3-7e46a5dc03dd",
      "type": "transient",
      "amount": {
        "amount": "1.00",
        "currency": "USD"
      },
      "settlementCurrency": "USD",
      "merchantWalletId": "${MERCHANT_WALLET_ID}",
      "paymentMethods": [
        {
          "type": "blockchain",
          "chain": "ETH"
        }
      ]
    }'
    ```

    Example response:

    ```json JSON theme={null}
    {
      "data": {
        "id": "6e4d4047-db14-4c09-b238-1215aee50d03",
        "amount": {
          "amount": "1.00",
          "currency": "USD"
        },
        "amountPaid": {
          "amount": "0.00",
          "currency": "USD"
        },
        "amountRefunded": {
          "amount": "0.00",
          "currency": "USD"
        },
        "settlementCurrency": "USD",
        "paymentMethods": [
          {
            "type": "blockchain",
            "chain": "ETH"
          }
        ],
        "paymentIds": [],
        "timeline": [
          {
            "status": "created",
            "time": "2022-07-21T20:13:35.579331Z"
          }
        ],
        "createDate": "2022-07-21T20:13:35.578678Z",
        "updateDate": "2022-07-21T20:19:24.859052Z"
      }
    }
    ```
  </Tab>
</Tabs>

## Step 2: Obtain the deposit address

Circle does not return the deposit address in the create response. Use webhooks
or poll
[Get a payment intent](/api-reference/circle-mint/payments/get-payment-intent)
until `paymentMethods.address` is set.

**Expected result:** you have the onchain deposit address to show the customer.

<Tabs>
  <Tab title="Webhooks">
    After you
    [subscribe to notifications](/circle-mint/circle-apis-notifications-quickstart)
    for `paymentIntents`, you receive updates when the payment intent changes. When
    `paymentMethods.address` is set, the payload includes an updated `timeline` of
    the historical payment intent statuses and timestamps.

    **Expected result:** the notification includes `paymentIntent.paymentMethods`
    with `address` and `timeline` with `pending` after the address is assigned.

    Example `paymentIntents` notification after the deposit address is assigned:

    <CodeGroup>
      ```json Continuous theme={null}
      {
        "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "notificationType": "paymentIntents",
        "version": 1,
        "customAttributes": { "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522" },
        "paymentIntent": {
          "id": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
          "currency": "USD",
          "settlementCurrency": "USD",
          "amountPaid": { "amount": "0.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" }
          ],
          "paymentIds": [],
          "refundIds": [],
          "timeline": [
            { "status": "pending", "time": "2023-01-21T20:13:38.188286Z" },
            { "status": "created", "time": "2023-01-21T20:13:35.579331Z" }
          ],
          "type": "continuous",
          "createDate": "2023-01-21T20:13:35.578678Z",
          "updateDate": "2023-01-21T20:13:38.186831Z"
        }
      }
      ```

      ```json Transient theme={null}
      {
        "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "notificationType": "paymentIntents",
        "version": 1,
        "customAttributes": { "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522" },
        "paymentIntent": {
          "id": "6e4d4047-db14-4c09-b238-1215aee50d03",
          "amount": { "amount": "1.00", "currency": "USD" },
          "amountPaid": { "amount": "0.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "settlementCurrency": "USD",
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" }
          ],
          "paymentIds": [],
          "refundIds": [],
          "timeline": [
            { "status": "pending", "time": "2022-07-21T20:13:38.188286Z" },
            { "status": "created", "time": "2022-07-21T20:13:35.579331Z" }
          ],
          "createDate": "2022-07-21T20:13:35.578678Z",
          "updateDate": "2022-07-21T20:13:38.186831Z",
          "expiresOn": "2022-07-21T21:13:38.087275Z"
        }
      }
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Polling">
    Call the
    [Get a payment intent](/api-reference/circle-mint/payments/get-payment-intent)
    endpoint until `paymentMethods.address` is present in the response.

    **Expected result:** the response `data` includes `paymentMethods` with
    `address` for the deposit.

    Example request:

    ```bash cURL theme={null}
    curl --location --request GET 'https://api-sandbox.circle.com/v1/paymentIntents/{id}' \
    --header 'X-Request-Id: ${GUID}' \
    --header 'Authorization: Bearer ${YOUR_API_KEY}'
    ```

    Example response after the address is available:

    <CodeGroup>
      ```json Continuous theme={null}
      {
        "data": {
          "id": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
          "currency": "USD",
          "settlementCurrency": "USD",
          "amountPaid": { "amount": "0.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" }
          ],
          "paymentIds": [],
          "refundIds": [],
          "timeline": [
            { "status": "pending", "time": "2023-01-21T20:13:38.188286Z" },
            { "status": "created", "time": "2023-01-21T20:13:35.579331Z" }
          ],
          "type": "continuous",
          "createDate": "2023-01-21T20:13:35.578678Z",
          "updateDate": "2023-01-21T20:13:38.186831Z"
        }
      }
      ```

      ```json Transient theme={null}
      {
        "data": {
          "id": "6e4d4047-db14-4c09-b238-1215aee50d03",
          "amount": { "amount": "1.00", "currency": "USD" },
          "amountPaid": { "amount": "0.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "settlementCurrency": "USD",
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" }
          ],
          "paymentIds": [],
          "refundIds": [],
          "timeline": [
            { "status": "pending", "time": "2022-07-21T20:13:38.188286Z" },
            { "status": "created", "time": "2022-07-21T20:13:35.579331Z" }
          ],
          "createDate": "2022-07-21T20:13:35.578678Z",
          "updateDate": "2022-07-21T20:13:38.186831Z",
          "expiresOn": "2022-07-21T21:13:38.087275Z"
        }
      }
      ```
    </CodeGroup>
  </Tab>
</Tabs>

## Step 3: Have the customer pay onchain

Display the deposit address and have the customer send USDC or EURC on the
chosen chain.

**Expected result:** an onchain transfer to the deposit address is submitted
(you confirm settlement in Step 4).

### 3.1. Display the deposit address

Give the customer the deposit address, the stablecoin to send (USDC or EURC),
and for transient intents the amount. Plain text or a QR code is fine.

**Expected result:** the customer can send funds from their wallet.

<Note>
  For transient payment intents, you can display the `expiresOn` time to show the
  customer how long they have to pay.

  If the customer does not send funds before `expiresOn`, the payment intent moves
  to a `complete` status with context `expired`. You cannot reuse an expired
  intent. Create a new payment intent to retry the checkout.
</Note>

### 3.2. Customer sends funds onchain

The customer sends USDC or EURC to the deposit address on the specified
blockchain.

**Expected result:** the transfer appears onchain against that address.

## Step 4: Confirm payment completion

After Circle confirms the transfer, it updates the payment intent and creates a
payment record for that inbound transfer. Confirm the intent and the payment
match what you expect using webhooks or polling.

**Expected result:** payment intent `timeline` shows `complete` with context
`paid`, and the linked payment has `status` `paid`.

### 4.1. Inspect the payment intent

<Tabs>
  <Tab title="Webhooks">
    Subscribe to `paymentIntents` notifications. After the customer pays, the
    payload includes an updated `timeline`, `amountPaid`, and `paymentIds`.

    **Expected result:** `paymentIntent` in the notification includes:

    * `timeline` with `complete` and context `paid`
    * `paymentIds` listing the payin payment for this transfer
    * `amountPaid` reflecting the settled amount

    Example when the payment intent is complete and paid:

    <CodeGroup>
      ```json Continuous theme={null}
      {
        "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "notificationType": "paymentIntents",
        "version": 1,
        "customAttributes": { "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522" },
        "paymentIntent": {
          "id": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
          "currency": "USD",
          "settlementCurrency": "USD",
          "amountPaid": { "amount": "1.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" },
            { "type": "totalPaymentFees", "amount": "0.01", "currency": "USD" }
          ],
          "paymentIds": ["66c56b6a-fc79-338b-8b94-aacc4f0f18de"],
          "refundIds": [],
          "timeline": [
            {
              "status": "complete",
              "context": "paid",
              "time": "2023-01-21T20:19:24.861094Z"
            },
            { "status": "pending", "time": "2023-01-21T20:13:38.188286Z" },
            { "status": "created", "time": "2023-01-21T20:13:35.579331Z" }
          ],
          "type": "continuous",
          "createDate": "2023-01-21T20:13:35.578678Z",
          "updateDate": "2023-01-21T20:19:24.859052Z"
        }
      }
      ```

      ```json Transient theme={null}
      {
        "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "notificationType": "paymentIntents",
        "version": 1,
        "customAttributes": { "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522" },
        "paymentIntent": {
          "id": "6e4d4047-db14-4c09-b238-1215aee50d03",
          "amount": { "amount": "1.00", "currency": "USD" },
          "amountPaid": { "amount": "1.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "settlementCurrency": "USD",
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" },
            { "type": "totalPaymentFees", "amount": "0.01", "currency": "USD" }
          ],
          "paymentIds": ["2b8f9d4e-515f-3c3a-a409-8ab99a2e72c7"],
          "refundIds": [],
          "timeline": [
            {
              "status": "complete",
              "context": "paid",
              "time": "2022-07-21T20:19:24.861094Z"
            },
            { "status": "pending", "time": "2022-07-21T20:13:38.188286Z" },
            { "status": "created", "time": "2022-07-21T20:13:35.579331Z" }
          ],
          "createDate": "2022-07-21T20:13:35.578678Z",
          "updateDate": "2022-07-21T20:19:24.859052Z",
          "expiresOn": "2022-07-21T21:13:38.087275Z"
        }
      }
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Polling">
    Call the
    [Get a payment intent](/api-reference/circle-mint/payments/get-payment-intent)
    endpoint on an interval until the newest `timeline` entry has `status` as
    `complete` and `context` as `paid`, or until `amountPaid` matches what you
    expect.

    **Expected result:** the response `data` includes:

    * `timeline` with `complete` and context `paid`
    * `paymentIds` listing the payin payment for this transfer
    * `amountPaid` reflecting the settled amount

    Example request:

    <CodeGroup>
      ```curl Continuous theme={null}
      curl --location --request GET 'https://api-sandbox.circle.com/v1/paymentIntents/e2e90ba3-9d1f-490d-9460-24ac6eb55a1b' \
      --header 'X-Request-Id: ${GUID}' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}'
      ```

      ```curl Transient theme={null}
      curl --location --request GET 'https://api-sandbox.circle.com/v1/paymentIntents/6e4d4047-db14-4c09-b238-1215aee50d03' \
      --header 'X-Request-Id: ${GUID}' \
      --header 'Authorization: Bearer ${YOUR_API_KEY}'
      ```
    </CodeGroup>

    Example response when one payin has completed:

    <CodeGroup>
      ```json Continuous theme={null}
      {
        "data": {
          "id": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
          "currency": "USD",
          "settlementCurrency": "USD",
          "amountPaid": { "amount": "1.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" },
            { "type": "totalPaymentFees", "amount": "0.01", "currency": "USD" }
          ],
          "paymentIds": ["66c56b6a-fc79-338b-8b94-aacc4f0f18de"],
          "refundIds": [],
          "timeline": [
            {
              "status": "complete",
              "context": "paid",
              "time": "2023-01-21T20:19:24.861094Z"
            },
            { "status": "pending", "time": "2023-01-21T20:13:38.188286Z" },
            { "status": "created", "time": "2023-01-21T20:13:35.579331Z" }
          ],
          "type": "continuous",
          "createDate": "2023-01-21T20:13:35.578678Z",
          "updateDate": "2023-01-21T20:19:24.859052Z"
        }
      }
      ```

      ```json Transient theme={null}
      {
        "data": {
          "id": "6e4d4047-db14-4c09-b238-1215aee50d03",
          "amount": { "amount": "1.00", "currency": "USD" },
          "amountPaid": { "amount": "1.00", "currency": "USD" },
          "amountRefunded": { "amount": "0.00", "currency": "USD" },
          "settlementCurrency": "USD",
          "paymentMethods": [
            {
              "type": "blockchain",
              "chain": "ETH",
              "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
            }
          ],
          "fees": [
            { "type": "blockchainLeaseFee", "amount": "0.00", "currency": "USD" },
            { "type": "totalPaymentFees", "amount": "0.01", "currency": "USD" }
          ],
          "paymentIds": ["2b8f9d4e-515f-3c3a-a409-8ab99a2e72c7"],
          "refundIds": [],
          "timeline": [
            {
              "status": "complete",
              "context": "paid",
              "time": "2022-07-21T20:19:24.861094Z"
            },
            { "status": "pending", "time": "2022-07-21T20:13:38.188286Z" },
            { "status": "created", "time": "2022-07-21T20:13:35.579331Z" }
          ],
          "createDate": "2022-07-21T20:13:35.578678Z",
          "updateDate": "2022-07-21T20:19:24.859052Z",
          "expiresOn": "2022-07-21T21:13:38.087275Z"
        }
      }
      ```
    </CodeGroup>

    For continuous payment intents, the same deposit address can receive multiple
    transfers. Each settled transfer adds another ID to `paymentIds`.
  </Tab>
</Tabs>

### 4.2. Inspect the payment for the same transfer

The payment record holds the onchain `transactionHash` and the customer's
`fromAddresses` for that transfer.

<Tabs>
  <Tab title="Webhooks">
    Subscribe to `payments` notifications to receive the updated `payment` object
    when the transfer settles.

    **Expected result:** `payment` in the notification has `status` `paid`, a
    populated `transactionHash`, and `fromAddresses` for the sender.

    ```json JSON theme={null}
    {
      "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
      "notificationType": "payments",
      "version": 1,
      "customAttributes": { "clientId": "f1397191-56e6-42fd-be86-0a7b9bd91522" },
      "payment": {
        "id": "66c56b6a-fc79-338b-8b94-aacc4f0f18de",
        "type": "payment",
        "status": "paid",
        "amount": { "amount": "1.00", "currency": "USD" },
        "fees": { "amount": "0.01", "currency": "USD" },
        "createDate": "2023-01-21T20:16:35.092Z",
        "updateDate": "2023-01-21T20:19:24.719Z",
        "merchantId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "merchantWalletId": "1000999922",
        "paymentIntentId": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
        "settlementAmount": { "amount": "1.00", "currency": "USD" },
        "fromAddresses": {
          "chain": "ETH",
          "addresses": ["0x0d4344cff68f72a5b9abded37ca5862941a62050"]
        },
        "depositAddress": {
          "chain": "ETH",
          "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
        },
        "transactionHash": "0x7351585460bd657f320b9afa02a52c26d89272d0d10cc29913eb8b28e64fd906"
      }
    }
    ```
  </Tab>

  <Tab title="Polling">
    Poll the [Get a payment](/api-reference/circle-mint/payments/get-payment)
    endpoint using the ID from `paymentIds` on the
    [payment intent](#4-1-inspect-the-payment-intent). Stop when that payment
    `status` is `paid` and, if you check onchain, when `transactionHash` matches the
    transfer you expect.

    For continuous payment intents, `paymentIds` can list more than one transfer
    over time. Make sure you poll the ID for this specific transfer.

    **Expected result:** `data` has `type` `payment` and `status` `paid`, a
    populated `transactionHash`, and `fromAddresses` for the sender when the payin
    has settled.

    Example request:

    ```bash cURL theme={null}
    curl --location --request GET 'https://api-sandbox.circle.com/v1/payments/{id}' \
    --header 'X-Request-Id: ${GUID}' \
    --header 'Authorization: Bearer ${YOUR_API_KEY}'
    ```

    Example response:

    ```json JSON theme={null}
    {
      "data": {
        "id": "66c56b6a-fc79-338b-8b94-aacc4f0f18de",
        "type": "payment",
        "status": "paid",
        "amount": { "amount": "1.00", "currency": "USD" },
        "fees": { "amount": "0.01", "currency": "USD" },
        "createDate": "2023-01-21T20:16:35.092Z",
        "updateDate": "2023-01-21T20:19:24.719Z",
        "merchantId": "f1397191-56e6-42fd-be86-0a7b9bd91522",
        "merchantWalletId": "1000999922",
        "paymentIntentId": "e2e90ba3-9d1f-490d-9460-24ac6eb55a1b",
        "settlementAmount": { "amount": "1.00", "currency": "USD" },
        "fromAddresses": {
          "chain": "ETH",
          "addresses": ["0x0d4344cff68f72a5b9abded37ca5862941a62050"]
        },
        "depositAddress": {
          "chain": "ETH",
          "address": "0x97de855690955e0da79ce5c1b6804847e7070c7f"
        },
        "transactionHash": "0x7351585460bd657f320b9afa02a52c26d89272d0d10cc29913eb8b28e64fd906"
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
  For blockchains that use a memo or address tag (for example, XLM or HBAR), the
  `addressTag` field can appear on `depositAddress` in payment payloads.
</Note>

The payment is complete when `status` is `paid`.
