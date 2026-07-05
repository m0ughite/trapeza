> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Wallet Operations

> Tasks you can perform with an agent wallet using Circle CLI, including transfers, bridging, payments, and more.

Wallet operations are tasks you can perform with an agent wallet using
[Circle CLI](/agent-stack/circle-cli). Full command syntax is in the
[CLI Command Reference](/agent-stack/circle-cli/command-reference).

The following table describes common wallet operations and the CLI commands to
perform them.

| Operation                                                                         | What it does                                                                                         | Command                   |
| :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------ |
| [Authenticate](/agent-stack/agent-wallets/wallet-operations/authenticate)         | Sign up or log in to your agent wallet using email OTP. Creates a session valid for 7 days.          | `circle wallet login`     |
| [Fund wallet](/agent-stack/agent-wallets/wallet-operations/fund)                  | Add funds to your agent wallet using a wallet transfer or fiat onramp.                               | `circle wallet fund`      |
| [Transfer USDC](/agent-stack/agent-wallets/wallet-operations/transfer)            | Send USDC and other tokens to a designated wallet address.                                           | `circle wallet transfer`  |
| [Bridge USDC](/agent-stack/agent-wallets/wallet-operations/bridge)                | Move USDC from one blockchain to another using CCTP.                                                 | `circle bridge transfer`  |
| [Swap tokens](/agent-stack/agent-wallets/wallet-operations/swap)                  | Swap one token for another directly from your agent wallet.                                          | `circle wallet swap`      |
| [Deposit for nanopayments](/agent-stack/agent-wallets/wallet-operations/nanopay)  | Deposit USDC into [Gateway](/gateway/nanopayments) for gas-free USDC payments at sub-cent scale.     | `circle gateway deposit`  |
| [Pay for service](/agent-stack/agent-wallets/wallet-operations/pay-for-service)   | Discover and pay for [x402](/gateway/nanopayments/concepts/x402)-compatible API services using USDC. | `circle services pay`     |
| [Execute contract](/agent-stack/agent-wallets/wallet-operations/execute-contract) | Interact with a smart contract by calling a write function.                                          | `circle wallet execute`   |
| [Sign messages](/agent-stack/agent-wallets/wallet-operations/sign)                | Sign a message or EIP-712 typed data with your wallet.                                               | `circle wallet sign`      |
| [Set policies](/agent-stack/agent-wallets/wallet-operations/custom-policies)      | Set USDC transfer limits or allow/block specific recipient or contract addresses.                    | `circle wallet limit set` |
