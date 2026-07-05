> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Withdraw to Bank

> Learn the basics of sending funds from your Circle account to an external bank account.

*Sending funds from your Circle Account to an external bank account is one of
the most basic primitives (building blocks) enabled by the APIs. This quickstart
walks through sending USDC USD externally. You can follow the same steps when
sending EURC EUR as well.*

## 1. Get an API key

Circle's APIs use [API keys](/circle-mint/quickstarts/getting-started) as the
mechanism to authenticate client requests. The API key must be set in the
Authorization header of the request sent from your backend server. The format of
the header is Bearer secret-key-value.

To obtain an API key for the sandbox environment, simply
[create an account](https://app.circle.com/get-started/create-account) and
generate a new key in settings - it only takes a few seconds.

[GET AN API KEY](https://app-sandbox.circle.com/)

Once you have generated your API key, record it in a secure place.

## 2. Link a bank account

To send account funds externally, you will need a bank account to send to.

You can use the
[create a wire bank account](/api-reference/circle-mint/account/create-business-wire-account)
API endpoint to link a sample bank account.

<Note>
  **Note**: The parameters listed below are slightly different for US Bank
  accounts, non-US bank accounts that are IBAN supported and non-US bank
  accounts that aren't IBAN supported. Please see the above link for details.
</Note>

**Request**

<CodeGroup>
  ```curl Bash theme={null}
  curl --request POST \\
  --url https\://api-sandbox.circle.com/v1/businessAccount/banks/wires \\
  --header 'accept: application/json' \\
  --header 'authorization: Bearer ${YOUR\_API\_KEY}' \\
  --header 'content-type: application/json' \\
  --data '
  {
    "billingDetails": {
      "name": "Satoshi Nakamoto",
      "city": "Boston",
      "country": "US",
      "line1": "100 Money Street",
      "district": "MA",
      "postalCode": "01234"
    },
    "bankAddress": {
      "bankName": "SAN FRANCISCO",
      "city": "SAN FRANCISCO",
      "country": "US",
      "line1": "100 Money Street",
      "district": "CA"
    },
    "idempotencyKey": "ba943ff1-ca16-49b2-ba55-1057e70ca5c7",
    "accountNumber": "12340010",
    "routingNumber": "121000248"
  }
  '
  ```

  ```javascript JavaScript theme={null}
  const options = {
    method: 'POST',

    headers: {
      accept: 'application/json',

      'content-type': 'application/json',

  authorization: 'Bearer ${YOUR_API_KEY}'

  }

  fetch('https\://api-sandbox.circle.com/v1/businessAccount/banks/wires', options)
    .then((response) => response.json())

    .then((response) => console.log(response))

  .then(response => console.log(response))

  .catch(err => console.error(err));
  ```
</CodeGroup>

**RESPONSE**

```json JSON theme={null}
{
  "data": {
    "id": "9d1fa351-b24d-442a-8aa5-e717db1ed636",
    "status": "pending",
    "description": "WELLS FARGO BANK, NA ****0010",
    "trackingRef": "CIR2GKYL4B",
    "fingerprint": "a9a71b77-d83d-4fbc-997f-41a33550c594",
    "virtualAccountEnabled": true,
    "billingDetails": {
      "name": "Satoshi Nakamoto",
      "line1": "100 Money Street",
      "city": "Boston",
      "postalCode": "01234",
      "district": "MA",
      "country": "US"
    },
    "bankAddress": {
      "bankName": "WELLS FARGO BANK, NA",
      "line1": "100 Money Street",
      "city": "SAN FRANCISCO",
      "district": "CA",
      "country": "US"
    },
    "createDate": "2023-11-04T20:02:21.062Z",
    "updateDate": "2023-11-04T20:02:21.062Z"
  }
}
```

## 3. Fund Your Account

If you haven't done so already, make sure you *fund your account for testing*.
You can do this by receiving an external USDC transfer from a faucet or other
source.

## 4. Send Funds

<Warning>
  **Sufficient Balance Requirement**

  You can transfer any amount you want if your account holds sufficient balance to
  cover the transfer.
</Warning>

To send funds externally, you can use the
[create a payout](/api-reference/circle-mint/account/create-business-payout) API
endpoint.

**REQUEST**

<CodeGroup>
  ```curl cURL theme={null}
  curl --request POST \\
  --url https\://api-sandbox.circle.com/v1/businessAccount/payouts \\
  --header 'accept: application/json' \\
  --header 'authorization: Bearer ${YOUR\_API\_KEY}' \\
  --header 'content-type: application/json' \\
  --data '
  {
    "destination": {
      "type": "wire",
      "id": "9d1fa351-b24d-442a-8aa5-e717db1ed636"
    },
    "amount": {
      "currency": "USD",
      "amount": "1.00"
    },
    "idempotencyKey": "ba943ff1-ca16-49b2-ba55-1057e70ca5c7"
  }
  '
  ```

  ```javascript JavaScript theme={null}
  const options = {
    method: "POST",

    headers: {
      accept: "application/json",

      "content-type": "application/json",

      authorization: "Bearer ${YOUR_API_KEY}",
    },

    body: JSON.stringify({
      destination: { type: "wire" },
      amount: { currency: "USD" },
    }),
  };

  fetch("https://api-sandbox.circle.com/v1/businessAccount/payouts", options)
    .then((response) => response.json())

    .then((response) => console.log(response))

    .then((response) => console.log(response))

    .catch((err) => console.error(err));
  ```
</CodeGroup>

**RESPONSE**

```json JSON theme={null}
{
  "data": {
    "id": "9cf38c76-cac4-40d8-a516-f46e9a610a85",
    "amount": {
      "amount": "1.00",
      "currency": "USD"
    },
    "status": "pending",
    "sourceWalletId": "1016875042",
    "destination": {
      "type": "wire",
      "id": "9d1fa351-b24d-442a-8aa5-e717db1ed636",
      "name": "WELLS FARGO BANK, NA ****0010"
    },
    "createDate": "2023-11-04T20:04:41.669Z",
    "updateDate": "2023-11-04T20:04:41.669Z"
  }
}
```

## 5. Check the Status of the Transfer

You can use the
[get a payout](/api-reference/circle-mint/account/get-business-payout) API
endpoint to retrieve details about the status of the transaction. You can use it
as in the command below.

**REQUEST**

<CodeGroup>
  ```curl Curl theme={null}
  curl --request GET \\
  --url https\://api-sandbox.circle.com/v1/businessAccount/payouts/9cf38c76-cac4-40d8-a516-f46e9a610a85 \\
  --header 'accept: application/json' \\
  --header 'authorization: Bearer ${YOUR\_API\_KEY}'
  ```

  ```javascript JavaScript theme={null}
  const options = {
    method: 'GET',

    headers: {
      accept: 'application/json',

  authorization: 'Bearer ${YOUR_API_KEY}'

  }

  fetch('https\://api-sandbox.circle.com/v1/businessAccount/payouts/id', options)
    .then((response) => response.json())

    .then((response) => console.log(response))

  .then(response => console.log(response))

  .catch(err => console.error(err));
  ```
</CodeGroup>

**RESPONSE**

```json JSON theme={null}
{
  "data": {
    "id": "9cf38c76-cac4-40d8-a516-f46e9a610a85",
    "amount": {
      "amount": "1.00",
      "currency": "USD"
    },
    "status": "pending",
    "sourceWalletId": "1016875042",
    "destination": {
      "type": "wire",
      "id": "9d1fa351-b24d-442a-8aa5-e717db1ed636",
      "name": "WELLS FARGO BANK, NA ****0010"
    },
    "createDate": "2023-11-04T20:04:41.669Z",
    "updateDate": "2023-11-04T20:04:41.778Z"
  }
}
```

<Note>
  **For Circle Mint Singapore Customers**

  You must verify all recipients of your transfers using the UI in the Circle
  Console.
</Note>

***

🎉 Congratulations. You have successfully sent fiat using Circle's APIs.

## 6. Ready for the next step?

After experimenting with our APIs, you'll want to start building test
integrations in sandbox prior to moving into production. Start by
[applying for a Circle Mint account](https://www.circle.com/en/circle-mint).
We'll be happy to walk you through the next steps.
