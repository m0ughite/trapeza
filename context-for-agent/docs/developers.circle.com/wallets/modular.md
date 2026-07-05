> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Modular Wallets

> Understand how modular wallets work, when to use them, and how Circle enables passkey-based smart accounts with gasless transactions, batch execution, and optional modules.

Modular wallets are user-controlled smart accounts built on
[Modular Smart Contract Accounts (MSCA)](/wallets/account-types#modular-smart-contract-accounts-msca).
Users sign with
<Tooltip tip="A cryptographic key pair stored on the user's device (phone, laptop, or password manager). Signing uses biometrics or device unlock; no seed phrase or password required.">passkeys</Tooltip>
, and you integrate via Circle SDKs for web, iOS, and Android. You can sponsor
gas, run batch or parallel transactions, and extend behavior with modules. For a
comparison of all wallet products, see
[Choose your wallet product and account types](/wallets/account-types).

## Key features

<CardGroup cols={2}>
  <Card title="User retains custody" icon="key">
    Users control their keys via passkeys (WebAuthn). Keys stay on the user's
    device; your app never holds them. Optional
    [recovery](/wallets/modular/recover-passkey) lets users restore access with
    a recovery key.
  </Card>

  <Card title="Gasless transactions" icon="gas-pump">
    Use [Gas Station](/wallets/gas-station) to sponsor network fees so users
    don't need native tokens. Set paymaster policies in the Circle Console and
    pass `paymaster: true` when sending user operations.
  </Card>

  <Card title="Batch and parallel execution" icon="layer-group">
    Send multiple operations in one user op for better UX and efficiency. Use 2D
    nonces to run independent transactions in parallel. See [Modular Wallet
    Operations](/wallets/modular/key-features) for details.
  </Card>

  <Card title="Modules and SDKs" icon="cube">
    Extend accounts with [modules](/wallets/modular/modules) (for example
    allowlists, automation). Build with the [Web](/wallets/modular/web-sdk),
    [iOS](/wallets/modular/ios-sdk), or [Android](/wallets/modular/android-sdk)
    SDK.
  </Card>
</CardGroup>

## What you can build

Use modular wallets when you want user-owned keys with a simple onboarding flow.
Common use cases:

<AccordionGroup>
  <Accordion title="Consumer apps with passkeys" icon="fingerprint">
    Onboard users with biometrics or device unlock, with no seed phrases or
    passwords. Users sign transactions from your app; you orchestrate flows with
    the modular wallets SDK and never hold keys.
  </Accordion>

  <Accordion title="Gasless and batch flows" icon="arrow-right-arrow-left">
    Sponsor gas so users don't need native tokens. Combine multiple actions (for
    example approve and transfer) in one user operation, or run independent
    operations in parallel with 2D nonces.
  </Accordion>

  <Accordion title="Programmability through modules" icon="puzzle-piece">
    Add [modules](/wallets/modular/modules) to smart accounts for allowlisted
    transfers or custom logic.
  </Accordion>

  <Accordion title="Third-party wallet connection" icon="link">
    Expose modular wallets as an EIP-1193 provider so other Web3 SDKs (for
    example Web3.js) can connect to Circle Smart Accounts. See [Modular Wallet
    Operations](/wallets/modular/key-features#use-the-eip-1193-provider) for the
    pattern.
  </Accordion>
</AccordionGroup>

## Get started

<CardGroup cols={2}>
  <Card title="Passkey and Smart Account" icon="circle-info" href="/wallets/modular/passkey-and-smart-account">
    Understand passkey as signer and the Circle Smart Account flow before you
    run the quickstart.
  </Card>

  <Card title="Create a Modular Wallet" icon="wallet" href="/wallets/modular/create-a-wallet-and-send-gasless-txn">
    Set up the SDK, register with a passkey, create a smart account, and send a
    gasless user operation.
  </Card>
</CardGroup>
