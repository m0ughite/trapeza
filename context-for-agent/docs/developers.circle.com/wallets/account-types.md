> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Choose Your Wallet Product and Account Types

> Choose the right Circle Wallets product and account type for your use case.

Before you build, you need to choose a wallet product. Your wallet product
determines which account types are available to you. If you choose Modular
Wallets, your account type is always a
[Modular Smart Contract Account (MSCA)](#smart-contract-accounts-sca-and-msca).

If you choose developer-controlled or user-controlled wallets, you need to pick
between an [Externally Owned Account (EOA)](#externally-owned-accounts-eoa) and
a [Smart Contract Account (SCA)](#smart-contract-accounts-sca-and-msca). EOAs
are controlled by a private key and work across all supported blockchains. SCAs
are smart contracts that support gas sponsorship, batch operations, and flexible
ownership. See the [account type comparison](#account-type-comparison) for a
full breakdown.

## Wallet product comparison

The following table maps common use cases to the recommended wallet product and
account type:

| If you want                                                              | Wallet product       | Account type       |
| ------------------------------------------------------------------------ | -------------------- | ------------------ |
| Full backend control (for example, payouts, automation, custodial flows) | Developer-controlled | EOA or SCA         |
| Users to own and approve their transactions                              | User-controlled      | EOA or SCA         |
| Passkeys, modules, or a fully customized wallet experience               | Modular              | MSCA (only option) |

### Developer-controlled wallets

Your backend creates and manages wallets on behalf of users. You control when
wallets are created, how transactions are signed, and how funds move without
your users managing keys or interacting with the blockchain directly.

**Use when:** You need fine-grained control over wallets and transactions
without exposing blockchain complexity to your users.

**Example use cases**: Payouts, automation, deposit collection, AI agent wallets

[Account type](#account-type-comparison): EOA or SCA

### User-controlled wallets

Users own and control their wallets inside your app. They authenticate with
familiar methods
([social login](/wallets/user-controlled/create-user-wallets-with-social-login),
[email OTP](/wallets/user-controlled/create-user-wallets-with-email), or
[PIN](/wallets/user-controlled/create-user-wallets-with-pin)) and approve every
transaction. Your app handles the interface while Circle handles key management
and recovery.

**Use when:** You want your users to fully control their funds and approve every
transaction.

**Example use cases**: Consumer apps, fintech platforms, reward wallets

[Account type](#account-type-comparison): EOA or SCA

### Modular wallets

You design the wallet experience while Circle handles signing and
infrastructure. Modular wallets are smart contract wallets built on open
composable standards, extendable with pre-built audited modules, for example,
passkey authentication, batch transactions, and parallel execution.

**Use when:** You need a customized wallet experience that developer-controlled
or user-controlled wallets don't cover.

**Example use cases**: Passkey signing, multisig, subscriptions, custom
transaction logic

[Account type](#account-type-comparison): MSCA only

## Account type comparison

The following table compares EOA and smart contract account capabilities:

|                         | EOA                                                         | Smart contract account (SCA / MSCA)                                         |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Wallet product**      | Developer-controlled, user-controlled                       | SCA: Developer-controlled, user-controlled <br /> MSCA: Modular only        |
| **Control**             | Private key                                                 | Smart contract (owner can be a single key, passkey, or multiple signers)    |
| **Blockchains**         | All [supported blockchains](/wallets/supported-blockchains) | EVM only                                                                    |
| **Creation fee**        | None                                                        | Gas charged on first outbound transaction                                   |
| **Gas per transaction** | Lower                                                       | Higher (contract validation overhead)                                       |
| **Gas sponsorship**     | Solana only, using [`feePayer`](/wallets/wallets-on-solana) | Yes, using [Gas Station](/wallets/gas-station) or a [paymaster](/paymaster) |
| **Batch operations**    | No                                                          | Yes                                                                         |
| **Modules**             | No                                                          | MSCA only                                                                   |

<Tip>
  For Ethereum mainnet, use EOA. SCA deployment gas on Ethereum mainnet can be
  high.
</Tip>

### Externally owned accounts (EOA)

An EOA is an account controlled by a private key. On EVM, EOAs require native
tokens for gas. EOAs work on all
[supported blockchains](/wallets/supported-blockchains) and are the only option
on Solana, Aptos, and NEAR.

**Use EOA when:**

* You are building on Solana, Aptos, or NEAR.
* You are building on Ethereum mainnet and want to avoid high SCA deployment
  costs.
* You need high transaction throughput. For example, airdrops or mass payouts.
* You do not need gas sponsorship, batching, or custom account logic.

### Smart contract accounts (SCA and MSCA)

SCAs are available with developer-controlled and user-controlled wallets. MSCAs
are available with Modular Wallets only.

A Smart Contract Account (SCA) and a Modular Smart Contract Account (MSCA) share
the same foundation: both follow [ERC-4337](https://www.erc4337.io/docs) and
[ERC-6900](https://www.erc6900.io/), both support gas abstraction and batch
operations, and both use lazy deployment. Deployment gas is charged on the first
outbound transaction, not at wallet creation. Both also carry higher
per-transaction gas than EOAs due to contract validation overhead.

SCA and MSCA wallets use versioned proxy contracts. For contract versions,
addresses, and upgrade instructions, see
[Upgrade your SCA wallet](/wallets/wallet-upgrades).

**Use SCA or MSCA when:**

* You want to sponsor gas for users (gasless transactions)
* You need to batch multiple operations into one transaction
* You are building on EVM L2s or other supported EVM networks

<Note>
  If you chose Modular Wallets, your smart contract account is an MSCA. The key
  difference from an SCA is that MSCAs support
  [modules](/wallets/modular/modules), pre-built audited smart contracts that
  extend account behavior with features like passkey authentication, multisig, or
  subscription logic. Everything else, gas abstraction, batching, and lazy
  deployment, works the same way. For a full explanation of how MSCAs work with
  the Modular Wallet SDK, see [Modular Wallets](/wallets/modular).
</Note>
