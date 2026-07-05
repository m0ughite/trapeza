> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Set Up Your Account and API Key

> Create a sandbox account, generate an API key, and make your first Circle Mint API request.

This guide walks you through creating a sandbox account, generating an API key,
and verifying that you can connect to the Circle Mint API.

## Prerequisites

Before you begin, ensure you have:

* A valid email address to register for a Circle Mint sandbox account
* [curl](https://curl.se/) or another tool for making HTTP requests

## Step 1: Create a sandbox account

The sandbox environment lets you test API integrations without processing real
transactions. For more details on sandbox versus production environments, see
[Sandbox to Production](/circle-mint/references/sandbox-and-testing).

<Steps>
  <Step title="Sign up for a sandbox account">
    Go to [app-sandbox.circle.com/signup](https://app-sandbox.circle.com/signup)
    and complete the registration form.
  </Step>

  <Step title="Verify your email address">
    Check your inbox and confirm your email to activate your account.
  </Step>

  <Step title="Log in to the sandbox">
    After activation, log in at `https://app-sandbox.circle.com`.
  </Step>
</Steps>

## Step 2: Generate an API key

Circle Mint uses API keys to authenticate all requests. Create and manage keys
in the [Mint Console](https://app-sandbox.circle.com/developer).

<Steps>
  <Step title="Open the Mint Console">
    Go to
    [app-sandbox.circle.com/developer](https://app-sandbox.circle.com/developer).
  </Step>

  <Step title="Select the API Keys tab" />

  <Step title="Click Create an API key" />

  <Step title="Enter a name for your key" />

  <Step title="(Optional) Add IP addresses to the allowlist">
    Restrict where the key can be used from.
  </Step>

  <Step title="Click Create API key" />

  <Step title="Copy the key and store it securely" />
</Steps>

<Warning>
  API keys grant access to privileged operations on Circle APIs. Store your API
  key securely and never expose it in client-side code, public repositories, or
  other publicly accessible locations. All API requests must be made over HTTPS.
  You can create a maximum of 10 API keys per environment.
</Warning>

## Step 3: Test connectivity

Test raw connectivity by calling the `/ping` endpoint. This endpoint does not
require authentication, so it confirms that your application can reach the API.

```bash theme={null}
curl -s https://api-sandbox.circle.com/ping
```

If your application reached the API, you see the following response:

```json theme={null}
{ "message": "pong" }
```

## Step 4: Verify your API key

Circle Mint uses Bearer token authentication. Include your API key in the
`Authorization` header of every request using the format `Bearer YOUR_API_KEY`.

Call the `/v1/configuration` endpoint to confirm that your API key is valid and
properly configured:

```bash theme={null}
curl -s https://api-sandbox.circle.com/v1/configuration \
  -H "Authorization: Bearer ${YOUR_API_KEY}"
```

A successful response returns your account configuration, including your
`masterWalletId`. The `masterWalletId` is the identifier for the primary wallet
associated with your Circle Mint account, used as the source or destination in
transfer and payout operations.

```json theme={null}
{ "data": { "payments": { "masterWalletId": "1234567890" } } }
```

If the API key is missing or malformed, you receive a `401 Unauthorized` error:

```json theme={null}
{
  "code": 401,
  "message": "Malformed authorization. Are the credentials properly encoded?"
}
```

If you see this error, verify that your `Authorization` header uses the `Bearer`
prefix and that you copied the full API key from the Mint Console.
