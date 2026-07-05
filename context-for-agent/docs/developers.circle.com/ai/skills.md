> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# AI Skills for Building with Circle

Use Circle's open source AI skills to accelerate development with AI-assisted
IDEs. Skills provide specialized knowledge for building with Circle's products,
including wallets, crosschain transfers, and smart contracts.

Skills are available in the
[circlefin/skills](https://github.com/circlefin/skills) repository.

## Installation

Use the following commands to install Circle Skills with the command-line.

<CodeGroup>
  ```shell Claude Code icon="https://mintcdn.com/circle-167b8d39/5X_H2DLmIxVDSWCs/images/claude-logo.png?fit=max&auto=format&n=5X_H2DLmIxVDSWCs&q=85&s=2711bd5dc795308c62570a011248ef2d" theme={null}
  /plugin marketplace add circlefin/skills
  /plugin install circle-skills@circle
  ```

  ```shell Vercel Skills CLI icon="https://mintcdn.com/circle-167b8d39/kF52uen9TY9sspam/images/vercel_logo.png?fit=max&auto=format&n=kF52uen9TY9sspam&q=85&s=20d2a3e59acc98f14fe41854458cfcd5" theme={null}
  npx skills add circlefin/skills
  ```
</CodeGroup>

## Available skills

The following skills are available to help you build with Circle's products.

### `bridge-stablecoin`

Build apps that bridge USDC between chains using Circle's
[Cross-Chain Transfer Protocol (CCTP)](/cctp). Includes UX patterns, progress
tracking, destination chain linking, and
[Bridge Kit](https://docs.arc.network/app-kit/bridge) SDK implementation
patterns for EVM and Solana chains.

### `use-arc`

Build on Arc, Circle's blockchain where USDC is the native gas token. Covers
chain configuration, [smart contract](/contracts) deployment with Foundry or
Hardhat, frontend integration with viem/wagmi, and bridging USDC to Arc via
[CCTP](/cctp).

### `use-circle-wallets`

Choose the right [Circle wallet](/wallets) type for your application. Compares
[developer-controlled](/wallets/dev-controlled),
[user-controlled](/wallets/user-controlled), and [modular](/wallets/modular)
(passkey) wallets across custody model, key management, account types, and
blockchain support.

### `use-developer-controlled-wallets`

[Developer-controlled wallets](/wallets/dev-controlled) where developers manage
wallet creation, storage, and key management. Use for custodial or operational
flows like payouts, treasury movements, subscriptions, and automation.

### `use-gateway`

Implement [Circle Gateway](/gateway) unified balance for crosschain USDC
transfers. Supports instant transfers (under 500ms) across EVM and Solana chains
with deposit, balance query, and transfer workflows.

### `use-modular-wallets`

Build [modular wallets](/wallets/modular) with passkey authentication, gasless
transactions, and modular architecture. Supports ERC-4337 account abstraction
and ERC-6900 modular framework.

### `use-smart-contract-platform`

Deploy, import, interact with, and monitor smart contracts using
[Circle's Smart Contract Platform](/contracts). Supports bytecode deployment,
template contracts (ERC-20/721/1155), ABI-based read/write calls, and event
monitoring.

### `use-user-controlled-wallets`

Build embedded [user-controlled wallets](/wallets/user-controlled) where users
control their own assets. Supports Web2-like login experiences (Google,
Facebook, Apple, email OTP, PIN) without seed phrases.
