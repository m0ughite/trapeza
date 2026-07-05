> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# User-Controlled Wallets

> Understand how user-controlled wallets work, when to use them, and how Circle enables user-owned keys with social or email authentication, or PIN validation.

User-controlled wallets allow you to create wallets for your users that give
them full control of their keys with a Web2-like experience. Users onboard with
popular authentication mechanisms (social login, email OTP, or PIN with security
questions), then approve transactions and signatures from their device. For a
comparison of all wallet products, see
[Choose your wallet product and account types](/wallets/account-types).

## Key features

<CardGroup cols={3}>
  <Card title="User retains custody" icon="key">
    Users have full control of their private keys secured with
    <Tooltip tip="Multi-party computation (MPC) splits key material so no single party holds it. In a 2-of-2 setup, both parties must participate to sign; neither can sign alone.">2-of-2 MPC</Tooltip>
    . Your app or backend never holds user keys. See [Key
    management](/wallets/key-management) for more details.
  </Card>

  <Card title="Seamless onboarding" icon="fingerprint">
    Choose from social login (Google, Apple, Facebook), email OTP, or PIN with
    security questions to authenticate your users. Optional biometrics with PIN.
  </Card>

  <Card title="Customizable UIs" icon="display">
    For social login and email OTP, Circle provides confirmation UIs for
    transfers and signing that you can customize or turn off to build and match
    your own branding.
  </Card>
</CardGroup>

## What you can build

<CardGroup cols={2}>
  <AccordionGroup>
    <Accordion title="Payments and P2P apps" icon="arrow-right-arrow-left">
      Build payment or remittance apps with USDC, with faster settlement and low
      fees versus traditional rails, no custody or key management for you. Users
      approve transfers in your app; you execute using Circle APIs.
    </Accordion>

    <Accordion title="Commerce and checkout" icon="cart-shopping">
      Build marketplaces and subscriptions with in-app crypto checkout. One-tap
      approval, higher conversion, no external wallets or seed phrases. Users
      approve; you run checkout and complete the transfer using Circle APIs.
    </Accordion>

    <Accordion title="DeFi and onchain apps" icon="cube">
      Build lending, swapping, yield/earn, or other DeFi flows with user
      custody. Users sign (for example,
      <Tooltip tip="Standard for signed messages (with personal_sign). See Ethereum Improvement Proposal 191.">EIP-191</Tooltip>
      ,
      <Tooltip tip="Structured typed data signing. See Ethereum Improvement Proposal 712.">EIP-712</Tooltip>
      ) from your app, with no key export or separate wallet; optional gas
      sponsorship hides gas complexity. You orchestrate the flow and never hold
      keys.
    </Accordion>
  </AccordionGroup>

  <AccordionGroup>
    <Accordion title="Social and creator apps" icon="users">
      Enable tipping, creator payouts, and in-app rewards in USDC. You provide
      the social or content layer; users hold the wallet. SDK creates wallets
      and runs transfers with user approval.
    </Accordion>

    <Accordion title="Gaming and rewards" icon="gamepad">
      Build games or loyalty apps where users earn, hold, or spend USDC or
      in-game assets. Keep engagement in-app, with no external wallets or seed
      phrases. Users approve (rewards, purchases); you create wallets and run
      transfers using the SDK and APIs.
    </Accordion>

    <Accordion title="Fintech and embedded finance" icon="building-columns">
      Embed USDC into savings, payroll, B2B payments, or remittance. Users keep
      custody; you avoid holding assets. Social, email, or PIN for familiar
      onboarding. Users approve from your UI; you execute using Circle APIs.
    </Accordion>
  </AccordionGroup>
</CardGroup>

## Account types

On EVM chains, a user-controlled wallet is created as either an externally owned
account (EOA) or a smart contract account (SCA). Pick one based on your needs.
For non-EVM chains such as Aptos or Solana, see
[Choose your wallet product and account types](/wallets/account-types) for a
full breakdown by blockchain.

<CardGroup cols={2}>
  <Card title="EOA (Externally Owned Account)" icon="wallet">
    Select when the source wallet can hold native token for gas, you want simple
    key-controlled accounts, and you don't need multiple operations in one
    transaction (batch execution).
  </Card>

  <Card title="SCA (Smart Contract Account)" icon="cube">
    Select when you need gas paid by a relayer or platform (gas sponsorship),
    batch execution, or other programmable behavior. For details on gas
    sponsorship, see [Gas Station](/wallets/gas-station).
  </Card>
</CardGroup>

## Get started

Choose how users authenticate, then follow a quickstart to create wallets and
see the full flow:

<Card title="Authentication types" icon="fingerprint" href="/wallets/user-controlled/authentication-methods">
  Compare social logins, email OTP, and PIN: onboarding UX and signing UX so you
  can pick the right type for your app.
</Card>

<CardGroup cols={3}>
  <Card title="Create user wallets with social login" icon="wallet" href="/wallets/user-controlled/create-user-wallets-with-social-login">
    Build a web app that allows users to sign in with Google and get a
    user-controlled wallet with USDC balance.
  </Card>

  <Card title="Create user wallets with email" icon="envelope" href="/wallets/user-controlled/create-user-wallets-with-email">
    Authenticate users with an OTP sent by email and create a user-owned wallet
    linked to your app.
  </Card>

  <Card title="Create user wallets with PIN" icon="key" href="/wallets/user-controlled/create-user-wallets-with-pin">
    Allow users to set a PIN (and optional biometrics) to create and authorize a
    user-controlled wallet from your app.
  </Card>
</CardGroup>
