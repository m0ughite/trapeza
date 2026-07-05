> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# How to: Sign a Message

> Sign a plain text message or EIP-712 typed data with your agent wallet.

Sign messages or EIP-712 typed data with your agent wallet. Signing is commonly
used to prove wallet ownership or authorize offchain actions.

## Prerequisites

Before you begin, ensure you have:

* Installed [Node.js v20.18.2 or later](https://nodejs.org/).

* Installed Circle CLI:

  ```bash theme={null}
  npm install -g @circle-fin/cli
  ```

* [Authenticated](/agent-stack/agent-wallets/wallet-operations/authenticate)
  your agent wallet.

## Sign a message

Run `circle wallet sign` with your message and wallet details. Each command
returns a signature (`0xabcdef1234...`):

```bash theme={null}
# Sign a plain text message
circle wallet sign message "hello world" --address 0xYourWalletAddress --chain BASE

# Sign a hex-encoded message
circle wallet sign message "0xdeadbeef" --hex --address 0xYourWalletAddress --chain BASE

# Sign EIP-712 typed data (EVM only)
circle wallet sign typed-data \
  '{"types":{...},"primaryType":"Mail","domain":{...},"message":{...}}' \
  --address 0xYourWalletAddress \
  --chain BASE
```

<Note>Typed data signing is supported on EVM blockchains only.</Note>

See the [CLI Command Reference](/agent-stack/circle-cli/command-reference) for
full syntax and options.
