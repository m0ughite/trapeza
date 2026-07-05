> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Command Reference

> Complete command reference for Circle's agent command-line tool, organized by resource.

Circle CLI follows a `circle <resource> <verb> [options]` pattern. All commands
support `--help` for inline documentation.

## Global options

| Option                      | Description                            |
| :-------------------------- | :------------------------------------- |
| `--output json\|text\|yaml` | Set output format. Defaults to `text`. |
| `-q, --quiet`               | Minimal output, suitable for piping.   |
| `-h, --help`                | Show help for any command.             |
| `-v, --version`             | Print the Circle CLI version and exit. |

***

## Wallet commands

Manage your [agent wallet](/agent-stack/agent-wallets).

### `circle wallet login`

Authenticate using email OTP to create or access an agent wallet session.

**Syntax**

```bash theme={null}
circle wallet login <email> [options]
circle wallet login <email> --init
circle wallet login --request <id> --otp <code>
```

**Options**

| Option           | Description                                                                                                          |
| :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| `--type`         | Wallet type. Defaults to `agent`.                                                                                    |
| `--testnet`      | Authenticate against testnet. Sessions are stored separately from mainnet.                                           |
| `--init`         | Two-step login for scripts and AI agents. Sends the OTP and returns a request ID. Pair with `--request`.             |
| `--request <id>` | Complete a `--init` login. Combine with `--otp <code>`.                                                              |
| `--otp <code>`   | One-time password for the request ID. Required with `--request`. Codes are alphanumeric (for example, `B1X-123456`). |

**Examples**

```bash theme={null}
# Interactive login (mainnet)
circle wallet login you@example.com

# Two-step login for scripts and AI agents
circle wallet login you@example.com --init
circle wallet login --request <request-id> --otp B1X-123456
```

<Note>
  Request IDs from `--init` are stored at `~/.circle/login-requests/<id>.json`,
  expire after 10 minutes, and are deleted after a successful `--request`.
</Note>

***

### `circle wallet logout`

Clear stored credentials for the current session.

**Syntax**

```bash theme={null}
circle wallet logout [options]
```

**Options**

| Option   | Description                                                          |
| :------- | :------------------------------------------------------------------- |
| `--type` | Clear credentials for a specific wallet type (for example, `agent`). |

**Example**

```bash theme={null}
circle wallet logout --type agent
```

***

### `circle wallet status`

Show the current authentication status and session details.

**Syntax**

```bash theme={null}
circle wallet status [options]
```

**Options**

| Option   | Description                                                    |
| :------- | :------------------------------------------------------------- |
| `--type` | Show status for a specific wallet type (for example, `agent`). |

**Example**

```bash theme={null}
circle wallet status --type agent
```

***

### `circle wallet create`

Create an additional wallet, separate from the wallets provisioned during login.
Each user can have at most 5 agent wallets.

**Syntax**

```bash theme={null}
circle wallet create [options]
```

**Options**

| Option              | Description                                               |
| :------------------ | :-------------------------------------------------------- |
| `--type`            | Wallet type: `agent` (default) or `local`.                |
| `--testnet`         | Create a testnet wallet. Omit for mainnet.                |
| `--idempotency-key` | Unique key to prevent duplicate wallet creation on retry. |

**Example**

```bash theme={null}
circle wallet create --type agent --testnet
```

***

### `circle wallet list`

List wallets associated with your account.

**Syntax**

```bash theme={null}
circle wallet list --chain <chain> [options]
```

**Options**

| Option    | Description                                |
| :-------- | :----------------------------------------- |
| `--chain` | Blockchain to list wallets on.             |
| `--type`  | Filter by wallet type: `agent` or `local`. |

**Example**

```bash theme={null}
circle wallet list --chain ARC-TESTNET --type agent
```

***

### `circle wallet limit`

Show spending policy limits for an agent wallet. Mainnet only.

**Syntax**

```bash theme={null}
circle wallet limit --address <addr> --chain <chain>
```

**Options**

| Option      | Description                                       |
| :---------- | :------------------------------------------------ |
| `--address` | Agent wallet address.                             |
| `--chain`   | Mainnet blockchain. Testnet chains not supported. |

**Examples**

```bash theme={null}
circle wallet limit --address 0x... --chain BASE
circle wallet limit --address 0x... --chain BASE --output json
```

***

### `circle wallet limit set`

Set a custom spending policy for an agent wallet. Requires a second email OTP to
confirm the change. Mainnet only.

Use `--rule-type` to choose the kind of policy:

* `transfer-limit` (default): cap how much USDC the wallet can transfer per
  transaction or over a rolling time window. Set with `--per-tx`, `--daily`,
  `--weekly`, `--monthly`.
* `recipient-allowlist` / `recipient-blocklist`: allow or block transfers to
  specific recipient addresses. Set with `--targets`.
* `contract-allowlist` / `contract-blocklist`: allow or block contract
  interactions with specific addresses. Set with `--targets`.

**Syntax**

```bash theme={null}
# Transfer limit (default)
circle wallet limit set --address <addr> --chain <chain> \
  --policy-type <type> \
  [--per-tx <amount>] [--daily <amount>] [--weekly <amount>] [--monthly <amount>] \
  [options]

# Allowlist or blocklist
circle wallet limit set --address <addr> --chain <chain> \
  --policy-type <type> \
  --rule-type <recipient-allowlist|recipient-blocklist|contract-allowlist|contract-blocklist> \
  --targets "[0xAddr1,0xAddr2]" \
  [options]
```

**Options**

| Option          | Description                                                                                                                                           |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--address`     | Agent wallet address.                                                                                                                                 |
| `--chain`       | Mainnet blockchain. Testnet blockchains are not supported.                                                                                            |
| `--policy-type` | Policy category: `stablecoin` for transfer-based rules, `contract` for contract-based rules. Auto-set when `--rule-type` is a contract rule.          |
| `--rule-type`   | Rule shape: `transfer-limit` (default), `recipient-allowlist`, `recipient-blocklist`, `contract-allowlist`, or `contract-blocklist`.                  |
| `--per-tx`      | Per-transaction spending cap. Used with `--rule-type transfer-limit`.                                                                                 |
| `--daily`       | Daily rolling-window cap. Used with `--rule-type transfer-limit`.                                                                                     |
| `--weekly`      | Weekly rolling-window cap. Used with `--rule-type transfer-limit`.                                                                                    |
| `--monthly`     | Monthly rolling-window cap. Used with `--rule-type transfer-limit`.                                                                                   |
| `--targets`     | Bracketed comma-separated list of EVM addresses (for example, `"[0xA,0xB]"`). Required for allowlist and blocklist rule types. Validated client-side. |
| `--email`       | Email address for the confirmation OTP. Defaults to the agent session email.                                                                          |

<Note>
  Transfer limits must satisfy: per-transaction ≤ daily ≤ weekly ≤ monthly.
</Note>

**Examples**

```bash theme={null}
# Transfer limits
circle wallet limit set \
  --address 0x... \
  --chain BASE \
  --policy-type stablecoin \
  --per-tx 100 \
  --daily 500 \
  --weekly 2000 \
  --monthly 5000

# Recipient blocklist
circle wallet limit set \
  --address 0x... \
  --chain BASE \
  --policy-type stablecoin \
  --rule-type recipient-blocklist \
  --targets "[0xBAD1,0xBAD2]"
```

***

### `circle wallet limit reset`

Reset all custom spending policies for an agent wallet back to defaults.
Requires a second email OTP to confirm. Mainnet only.

**Syntax**

```bash theme={null}
circle wallet limit reset --address <addr> --chain <chain> [options]
```

**Options**

| Option        | Description                                       |
| :------------ | :------------------------------------------------ |
| `--address`   | Agent wallet address.                             |
| `--chain`     | Mainnet blockchain. Testnet chains not supported. |
| `--yes`, `-y` | Skip the confirmation prompt.                     |

**Example**

```bash theme={null}
circle wallet limit reset --address 0x... --chain BASE --yes
```

***

### `circle wallet limit budget`

Show remaining spending budgets for an agent wallet. Displays per-transaction
limits and rolling-window remaining amounts (daily, weekly, monthly). Budgets
are EVM-wide and not blockchain-specific. Mainnet only.

**Syntax**

```bash theme={null}
circle wallet limit budget --address <addr>
```

**Options**

| Option      | Description           |
| :---------- | :-------------------- |
| `--address` | Agent wallet address. |

**Example**

```bash theme={null}
circle wallet limit budget --address 0x...
```

***

### `circle wallet balance`

Show the token balance for a wallet address on a given blockchain.

**Syntax**

```bash theme={null}
circle wallet balance --address <addr> --chain <chain> [options]
```

**Options**

| Option      | Description                                                                     |
| :---------- | :------------------------------------------------------------------------------ |
| `--address` | Wallet address.                                                                 |
| `--chain`   | Blockchain.                                                                     |
| `--rpc-url` | RPC endpoint override. Required for local wallets without a configured default. |

**Example**

```bash theme={null}
circle wallet balance --address 0x... --chain BASE
```

***

### `circle wallet fund`

Add funds to a wallet by transfer from another wallet (crypto), through a fiat
onramp, or from the testnet faucet.

**Syntax**

```bash theme={null}
circle wallet fund --address <addr> --chain <chain> --amount <usdc> --method <crypto|fiat> [options]
```

**Options**

| Option           | Description                                                                                                                                    |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `--address`      | Wallet address to fund.                                                                                                                        |
| `--chain`        | Blockchain.                                                                                                                                    |
| `--amount`       | Amount to fund. Ignored on testnet.                                                                                                            |
| `--token`        | Token: `usdc` (default), `eth`, `native`.                                                                                                      |
| `--method`       | Funding method: `crypto` or `fiat`. Required on mainnet. Omit on testnet, where wallets auto-fund from the Circle faucet.                      |
| `--export <dir>` | With `--method crypto`, write a PNG QR code into `<dir>` instead of printing it to the terminal.                                               |
| `--open`         | Open the result in your browser. With `--method fiat`, opens the onramp provider. With `--method crypto`, opens an HTML page with the QR code. |
| `--no-open`      | Print the onramp URL without opening it. Used with `--method fiat` only.                                                                       |

**Examples**

```bash theme={null}
# Fund with crypto from another wallet
circle wallet fund --address 0x... --chain BASE --amount 10 --method crypto

# Fund with fiat through the onramp provider
circle wallet fund --address 0x... --chain BASE --amount 10 --method fiat

# Testnet auto-funded from faucet (omit --method and --amount)
circle wallet fund --address 0x... --chain ARC-TESTNET
```

***

### `circle wallet transfer`

Transfer tokens from a wallet to another address.

**Syntax**

```bash theme={null}
circle wallet transfer <toAddress> --amount <amount> --address <addr> --chain <chain> [options]
```

**Arguments**

| Argument      | Description        |
| :------------ | :----------------- |
| `<toAddress>` | Recipient address. |

**Options**

| Option       | Description                                                                     |
| :----------- | :------------------------------------------------------------------------------ |
| `--amount`   | Amount to transfer.                                                             |
| `--address`  | Source wallet address.                                                          |
| `--chain`    | Blockchain.                                                                     |
| `--token`    | Token contract address. Omit to use USDC.                                       |
| `--rpc-url`  | RPC endpoint override. Required for local wallets without a configured default. |
| `--estimate` | Show estimated fees without submitting the transfer.                            |

**Example**

```bash theme={null}
circle wallet transfer 0xRecipient --amount 5.0 --address 0x... --chain ARC-TESTNET
```

***

### `circle wallet swap`

Swap one token for another. Requires an agent wallet. Arc Testnet is the only
testnet supported.

**Syntax**

```bash theme={null}
circle wallet swap <sellToken> <sellAmount> <buyToken> [<buyAmount>] --address <addr> --chain <chain> [options]
```

**Arguments**

| Argument        | Description                                                            |
| :-------------- | :--------------------------------------------------------------------- |
| `<sellToken>`   | Token to sell. Use a symbol (for example, `EURC`) or contract address. |
| `<sellAmount>`  | Amount to sell.                                                        |
| `<buyToken>`    | Token to buy. Use a symbol (for example, `USDC`) or contract address.  |
| `[<buyAmount>]` | Minimum acceptable output (stop-limit). Omit when using `--quote`.     |

**Options**

| Option              | Description                                                                                     |
| :------------------ | :---------------------------------------------------------------------------------------------- |
| `--address`         | Agent wallet address. Optional when using `--quote`.                                            |
| `--chain`           | Blockchain.                                                                                     |
| `--quote`           | Get a price quote without executing the swap. Does not require wallet ownership or `buyAmount`. |
| `--slippage-bps`    | Maximum slippage in basis points (for example, `50` = 0.5%).                                    |
| `--idempotency-key` | Unique key to prevent duplicate swaps on retry.                                                 |

**Examples**

```bash theme={null}
circle wallet swap EURC 100 USDC 99.5 --address 0x... --chain ARC-TESTNET
circle wallet swap EURC 100 USDC --chain ARC-TESTNET --quote
```

***

### `circle wallet sign message`

Sign a plain text or hex-encoded message with your wallet.

**Syntax**

```bash theme={null}
circle wallet sign message <message> --address <addr> --chain <chain> [options]
```

**Arguments**

| Argument    | Description                          |
| :---------- | :----------------------------------- |
| `<message>` | Message to sign (plain text or hex). |

**Options**

| Option      | Description                                    |
| :---------- | :--------------------------------------------- |
| `--address` | Wallet address.                                |
| `--chain`   | Blockchain.                                    |
| `--hex`     | Message is hex-encoded (must start with `0x`). |

**Example**

```bash theme={null}
circle wallet sign message "hello world" --address 0x... --chain ARC-TESTNET
```

***

### `circle wallet sign typed-data`

Sign EIP-712 typed data with your wallet.

**Syntax**

```bash theme={null}
circle wallet sign typed-data <data> --address <addr> --chain <chain>
```

**Arguments**

| Argument | Description                          |
| :------- | :----------------------------------- |
| `<data>` | EIP-712 typed data as a JSON string. |

**Options**

| Option      | Description     |
| :---------- | :-------------- |
| `--address` | Wallet address. |
| `--chain`   | Blockchain.     |

**Example**

```bash theme={null}
circle wallet sign typed-data '{"types":{...},"primaryType":"Mail","domain":{...},"message":{...}}' \
  --address 0x... \
  --chain ARC-TESTNET
```

***

### `circle wallet execute`

Execute a smart contract write function from a wallet.

**Syntax**

```bash theme={null}
circle wallet execute <abiFunctionSignature> [<abiParameters>...] \
  --contract <addr> \
  --address <addr> \
  --chain <chain> \
  [options]
```

**Arguments**

| Argument                 | Description                                                       |
| :----------------------- | :---------------------------------------------------------------- |
| `<abiFunctionSignature>` | ABI function signature (for example, `approve(address,uint256)`). |
| `[<abiParameters>...]`   | ABI parameters, space-separated.                                  |

**Options**

| Option       | Description                                                                     |
| :----------- | :------------------------------------------------------------------------------ |
| `--contract` | Contract address.                                                               |
| `--address`  | Wallet address.                                                                 |
| `--chain`    | Blockchain.                                                                     |
| `--amount`   | Native token value to send with the call. Defaults to `0`.                      |
| `--rpc-url`  | RPC endpoint override. Required for local wallets without a configured default. |
| `--estimate` | Show estimated fees without submitting the transaction.                         |

**Example**

```bash theme={null}
circle wallet execute "approve(address,uint256)" 0xSpender 1000000 \
  --contract 0xUSDC \
  --address 0x... \
  --chain ARC-TESTNET
```

***

### `circle wallet import`

Import a local wallet from a private key or mnemonic phrase. Stored using the
Open Wallet Standard at `~/.ows/wallets/<name>`.

<Warning>
  Local wallets bypass Circle's compliance and safety controls. Spending
  policies, OFAC screening, and audit logging only apply to agent wallets.
</Warning>

**Syntax**

```bash theme={null}
circle wallet import <name> [--private-key | --mnemonic]
```

**Options**

| Option          | Description                                                              |
| :-------------- | :----------------------------------------------------------------------- |
| `--private-key` | Import from a private key. You'll be prompted to enter the key securely. |
| `--mnemonic`    | Import from a mnemonic phrase. You'll be prompted to enter it securely.  |

<Warning>
  Do not pass your private key or mnemonic as a command-line argument or
  environment variable in plain text. Enter it at the prompt or use a secrets
  manager.
</Warning>

**Example**

```bash theme={null}
circle wallet import my-wallet --private-key
```

***

## Services commands

Discover and pay for [x402](/gateway/nanopayments/concepts/x402)-compatible API
services.

### `circle services search`

Search for available services by keyword. Omit the query to list all services.

**Syntax**

```bash theme={null}
circle services search [<query>] [options]
```

**Arguments**

| Argument    | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| `[<query>]` | Optional search keyword or phrase. Omit to list all results. |

**Options**

| Option       | Description                                                                    |
| :----------- | :----------------------------------------------------------------------------- |
| `--category` | Filter by category (for example, `FINANCIAL_ANALYSIS`, `WEB_SEARCH_RESEARCH`). |
| `--type`     | Filter by service type.                                                        |
| `--limit`    | Maximum number of results to return. Defaults to `50`.                         |
| `--offset`   | Number of results to skip, for pagination. Defaults to `0`.                    |

**Example**

```bash theme={null}
circle services search "weather" --category WEB_SEARCH_RESEARCH --limit 20
```

***

### `circle services inspect`

Inspect the payment requirements for a service URL. The CLI auto-detects the
HTTP method from the service's discovery metadata and auto-generates a minimal
request body from its input schema. Override either with the flags below.

**Syntax**

```bash theme={null}
circle services inspect <url> [options]
```

**Arguments**

| Argument | Description             |
| :------- | :---------------------- |
| `<url>`  | Service URL to inspect. |

**Options**

| Option           | Description                                                              |
| :--------------- | :----------------------------------------------------------------------- |
| `--method`, `-X` | HTTP method override: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.           |
| `--data`, `-d`   | Request body as a JSON string. Overrides the auto-generated body.        |
| `--header`, `-H` | Custom request header as `Key: Value`. Repeat the flag to send multiple. |

**Example**

```bash theme={null}
circle services inspect https://api.example.com/weather -X POST -d '{"city":"SF"}'
```

***

### `circle services pay`

Pay for a service using your agent wallet.

**Syntax**

```bash theme={null}
circle services pay <url> --address <address> --chain <chain> [options]
```

**Arguments**

| Argument | Description             |
| :------- | :---------------------- |
| `<url>`  | Service URL to pay for. |

**Options**

| Option                | Description                                                              |
| :-------------------- | :----------------------------------------------------------------------- |
| `--address`           | Agent wallet address.                                                    |
| `--chain`             | Blockchain to pay from.                                                  |
| `--max-amount <usdc>` | Refuse to pay more than this amount in USDC (for example, `0.01`).       |
| `--method`, `-X`      | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`. Defaults to `GET`. |
| `--data`, `-d`        | Request body as a JSON string.                                           |
| `--header`, `-H`      | Custom request header as `Key: Value`.                                   |
| `--estimate`          | Show payment requirements without submitting payment.                    |
| `--quiet`, `-q`       | Print response body only (useful for piping).                            |
| `--timeout <seconds>` | Per-step timeout in seconds. Defaults to `30`.                           |

**Example**

```bash theme={null}
circle services pay https://api.example.com/weather --address 0x... --chain BASE
```

<Tip>
  Failed payments write debug logs to `~/.circle-cli/payments/`. Check the most
  recent file for the request, response, and stage where the failure occurred.
</Tip>

***

## Bridge commands

Bridge USDC across blockchains using [CCTP](/cctp).

### `circle bridge transfer`

Bridge USDC from one blockchain to another.

**Syntax**

```bash theme={null}
circle bridge transfer <toChain> [<recipient>] --amount <amount> --address <addr> --chain <from>
```

**Arguments**

| Argument        | Description                                                                 |
| :-------------- | :-------------------------------------------------------------------------- |
| `<toChain>`     | Destination blockchain (for example, `ARB`, `ETH`).                         |
| `[<recipient>]` | Recipient address on the destination. Defaults to the value of `--address`. |

**Options**

| Option              | Description                                         |
| :------------------ | :-------------------------------------------------- |
| `--amount`          | USDC amount the recipient will receive.             |
| `--address`         | Sender wallet address.                              |
| `--chain`           | Source blockchain.                                  |
| `--rpc-url`         | RPC endpoint override for the source blockchain.    |
| `--idempotency-key` | Unique key to prevent duplicate transfers on retry. |
| `--quiet`, `-q`     | Print transaction hash only (useful for piping).    |

**Example**

```bash theme={null}
circle bridge transfer ARB-SEPOLIA --amount 10.0 --address 0x... --chain ARC-TESTNET
```

***

### `circle bridge status`

Check the status of a bridge transfer by transaction hash.

**Syntax**

```bash theme={null}
circle bridge status <txHash> --chain <chain>
```

**Arguments**

| Argument   | Description                               |
| :--------- | :---------------------------------------- |
| `<txHash>` | Transaction hash of the burn transaction. |

**Options**

| Option    | Description        |
| :-------- | :----------------- |
| `--chain` | Source blockchain. |

**Example**

```bash theme={null}
circle bridge status 0xabc... --chain ARC-TESTNET
```

***

### `circle bridge get-fee`

Get the estimated fee for bridging from a given blockchain.

**Syntax**

```bash theme={null}
circle bridge get-fee <to> --chain <from>
```

**Arguments**

| Argument | Description                                         |
| :------- | :-------------------------------------------------- |
| `<to>`   | Destination blockchain (for example, `ARB`, `ETH`). |

**Options**

| Option    | Description        |
| :-------- | :----------------- |
| `--chain` | Source blockchain. |

**Example**

```bash theme={null}
circle bridge get-fee ETH --chain ARC-TESTNET
```

***

## Gateway commands

Interact with [Circle Gateway](/gateway).

### `circle gateway balance`

Show your Gateway balance for nanopayments.

**Syntax**

```bash theme={null}
circle gateway balance --address <addr> --chain <chain> [options]
```

**Options**

| Option      | Description                                                                                                                |
| :---------- | :------------------------------------------------------------------------------------------------------------------------- |
| `--address` | Wallet address.                                                                                                            |
| `--chain`   | Blockchain where the wallet lives. Any [Gateway-supported blockchain](/gateway/references/supported-blockchains) is valid. |
| `--all`     | Show all blockchains including those with zero balances.                                                                   |
| `--rpc-url` | RPC endpoint override. Required for local wallets without a configured default.                                            |

**Examples**

```bash theme={null}
circle gateway balance --address 0x... --chain BASE
circle gateway balance --address 0x... --chain BASE --all
```

***

### `circle gateway deposit`

Deposit USDC into Circle Gateway for nanopayments. Minimum deposit is `0.5`
USDC.

**Syntax**

```bash theme={null}
circle gateway deposit --amount <usdc> --address <addr> --chain <chain> --method <method> [options]
```

**Options**

| Option      | Description                                                                                                                                                                             |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--amount`  | Amount of USDC to deposit.                                                                                                                                                              |
| `--address` | Wallet address.                                                                                                                                                                         |
| `--chain`   | Source blockchain. With `--method direct`, any [Gateway-supported blockchain](/gateway/references/supported-blockchains) is valid. With `--method eco`, only `BASE` and `BASE-SEPOLIA`. |
| `--method`  | Deposit method: `eco` or `direct`. Eco deposits always settle on Polygon (`MATIC` mainnet, `MATIC-AMOY` testnet) regardless of source.                                                  |
| `--timeout` | Transaction poll timeout in seconds. Defaults to `120`.                                                                                                                                 |

<Note>
  Eco is a third-party fast-deposit service. Circle does not operate, endorse,
  or audit Eco. Review [Eco's
  docs](https://eco.com/docs/getting-started/programmable-addresses/gateway-deposits)
  and test the flow before using it in production.
</Note>

**Example**

```bash theme={null}
circle gateway deposit --amount 5 --address 0x... --chain BASE --method eco
```

***

### `circle gateway withdraw`

Withdraw USDC from Circle Gateway back to a wallet on the same blockchain.

**Syntax**

```bash theme={null}
circle gateway withdraw --amount <usdc> --address <addr> --chain <chain> [options]
```

**Options**

| Option        | Description                                                                                                |
| :------------ | :--------------------------------------------------------------------------------------------------------- |
| `--amount`    | Amount of USDC to withdraw.                                                                                |
| `--address`   | Source wallet address (the Gateway depositor).                                                             |
| `--chain`     | Source blockchain. Any [Gateway-supported blockchain](/gateway/references/supported-blockchains) is valid. |
| `--recipient` | Destination address to receive USDC. Defaults to `--address`.                                              |
| `--timeout`   | Mint transaction poll timeout in seconds. Defaults to `120`. Agent wallets only.                           |

<Note>
  Withdrawals are same-chain only. The withdrawn USDC is minted on `--chain`.
  Agent wallets must be Smart Contract Accounts (SCAs). Pass the SCA address as
  `--address`. JSON output includes `transferId`, `estimatedFee`, and
  `chargedFee`.
</Note>

**Examples**

```bash theme={null}
# Withdraw to your own wallet
circle gateway withdraw --amount 0.1 --address 0x... --chain BASE

# Withdraw to a different recipient
circle gateway withdraw --amount 5 --address 0x... --chain BASE --recipient 0xOTHER
```

***

## Blockchain commands

Query supported blockchain information.

### `circle blockchain list`

List all blockchains supported by Circle CLI.

**Syntax**

```bash theme={null}
circle blockchain list
```

***

### `circle blockchain config`

Show or update the RPC URL for a blockchain.

**Syntax**

```bash theme={null}
circle blockchain config --chain <chain> [options]
```

**Options**

| Option      | Description                                                    |
| :---------- | :------------------------------------------------------------- |
| `--chain`   | Blockchain to configure.                                       |
| `--rpc-url` | Set a custom RPC URL override for this blockchain.             |
| `--default` | Reset to the default RPC URL. Cannot be used with `--rpc-url`. |

**Examples**

```bash theme={null}
circle blockchain config --chain ARC-TESTNET --output json
circle blockchain config --chain ARC-TESTNET --rpc-url https://my-node.example.com
circle blockchain config --chain ARC-TESTNET --default
```

***

## Transaction commands

Manage pending and submitted transactions.

### `circle transaction list`

List transaction history for a wallet.

**Syntax**

```bash theme={null}
circle transaction list --address <addr> --chain <chain> [options]
```

**Options**

| Option           | Description                                                                                                                   |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `--address`      | Wallet address.                                                                                                               |
| `--chain`        | Blockchain.                                                                                                                   |
| `--operation`    | Filter by operation: `transfer` or `execute`.                                                                                 |
| `--state`        | Filter by state: `initiated`, `queued`, `sent`, `confirmed`, `complete`, `failed`, `cancelled`, `denied`, `cleared`, `stuck`. |
| `--tx-type`      | Filter by direction: `inbound` or `outbound`.                                                                                 |
| `--lowest-nonce` | Return only the lowest-nonce pending transaction. Ignores other filters.                                                      |
| `--cursor`       | Pagination token: return transactions after this ID.                                                                          |
| `--limit`        | Maximum number of transactions to return. Defaults to `50`.                                                                   |

**Examples**

```bash theme={null}
circle transaction list --address 0x... --chain ARC-TESTNET
circle transaction list --address 0x... --chain ARC-TESTNET --operation transfer --state confirmed
```

***

### `circle transaction cancel`

Cancel a pending transaction.

**Syntax**

```bash theme={null}
circle transaction cancel <id> --address <addr> --chain <chain>
```

**Arguments**

| Argument | Description     |
| :------- | :-------------- |
| `<id>`   | Transaction ID. |

**Options**

| Option      | Description     |
| :---------- | :-------------- |
| `--address` | Wallet address. |
| `--chain`   | Blockchain.     |

**Example**

```bash theme={null}
circle transaction cancel abc-123 --address 0x... --chain ARC-TESTNET
```

***

### `circle transaction accelerate`

Accelerate a pending transaction by increasing the gas fee.

**Syntax**

```bash theme={null}
circle transaction accelerate <id> --address <addr> --chain <chain>
```

**Arguments**

| Argument | Description     |
| :------- | :-------------- |
| `<id>`   | Transaction ID. |

**Options**

| Option      | Description     |
| :---------- | :-------------- |
| `--address` | Wallet address. |
| `--chain`   | Blockchain.     |

**Example**

```bash theme={null}
circle transaction accelerate abc-123 --address 0x... --chain ARC-TESTNET
```

***

## Contract commands

Interact with onchain contracts.

### `circle contract address`

Show Circle contract addresses, optionally filtered by category and blockchain.

**Syntax**

```bash theme={null}
circle contract address [category] [--chain <chain>]
```

**Arguments**

| Argument     | Description                                                              |
| :----------- | :----------------------------------------------------------------------- |
| `[category]` | Contract category to filter by (for example, `usdc`, `cctp`, `gateway`). |

**Options**

| Option    | Description           |
| :-------- | :-------------------- |
| `--chain` | Filter by blockchain. |

**Examples**

```bash theme={null}
circle contract address usdc --chain ARC-TESTNET
circle contract address cctp --output json
```

***

### `circle contract query`

Execute a read-only contract call.

**Syntax**

```bash theme={null}
circle contract query <abiFunctionSignature> [abiParameters...] --contract <address> --chain <chain>
```

**Arguments**

| Argument                 | Description                                                 |
| :----------------------- | :---------------------------------------------------------- |
| `<abiFunctionSignature>` | ABI function signature (for example, `balanceOf(address)`). |
| `[abiParameters...]`     | ABI parameters, space-separated (for example, `0x1234...`). |

**Options**

| Option       | Description          |
| :----------- | :------------------- |
| `--contract` | Contract address.    |
| `--chain`    | Blockchain to query. |

**Examples**

```bash theme={null}
circle contract query "balanceOf(address)" 0xWALLET --contract 0xUSDC --chain ARC-TESTNET
circle contract query "totalSupply()" --contract 0xUSDC --chain ARC-TESTNET --output json
```

***

## Skill commands

Discover and install skills from the
[`circlefin/skills`](https://github.com/circlefin/skills) catalog.

<Note>
  The `--tool` option specifies your agent framework. Common values:
  `claude-code`, `cursor`, `codex`.
</Note>

### `circle skill list`

List all available skills from the catalog.

**Syntax**

```bash theme={null}
circle skill list [--output json]
```

**Options**

| Option          | Description             |
| :-------------- | :---------------------- |
| `--output json` | Return results as JSON. |

***

### `circle skill info`

Show details and full content for a specific skill.

**Syntax**

```bash theme={null}
circle skill info --name <name>
```

**Options**

| Option   | Description                   |
| :------- | :---------------------------- |
| `--name` | Name of the skill to inspect. |

**Example**

```bash theme={null}
circle skill info --name <skill-name>
```

***

### `circle skill install`

Install a skill into your agent framework.

**Syntax**

```bash theme={null}
circle skill install --tool <tool> [--name <name>]
```

**Options**

| Option   | Description                                                                                 |
| :------- | :------------------------------------------------------------------------------------------ |
| `--tool` | Agent framework to install into. Use multiple `--tool` options for more than one framework. |
| `--name` | Skill name to install. Omit to install all available skills.                                |

**Examples**

```bash theme={null}
circle skill install --tool claude-code --name <skill-name>
circle skill install --tool cursor --tool codex --name <skill-name>
```

***

### `circle skill update`

Update installed skills for an agent framework.

**Syntax**

```bash theme={null}
circle skill update --tool <tool>
```

**Options**

| Option   | Description                           |
| :------- | :------------------------------------ |
| `--tool` | Agent framework to update skills for. |

***

## Terms commands

Inspect, accept, or reset your local Circle CLI Terms of Use acceptance record.

The first time you run any command, Circle CLI prompts you to accept the Terms
of Use and Privacy Policy. Acceptance is stored locally and reused on subsequent
runs. To handle Terms acceptance non-interactively in scripts and AI agents, use
`circle terms accept` or set `CIRCLE_ACCEPT_TERMS=1` in the environment.

### `circle terms`

Show the current acceptance status and the canonical Terms of Use and Privacy
Policy URLs. Default verb is `show`.

**Syntax**

```bash theme={null}
circle terms [show] [options]
```

**Options**

| Option   | Description                                                                                                              |
| :------- | :----------------------------------------------------------------------------------------------------------------------- |
| `--init` | Return Terms info (version, URLs, notice text) for an agent to present before calling `accept`. Implies `--output json`. |

**Examples**

```bash theme={null}
circle terms
circle terms --output json
circle terms show --init --output json
```

**JSON output**

```json theme={null}
{
  "accepted": true,
  "currentVersion": "1.0.0",
  "termsOfUseUrl": "https://www.circle.com/legal/circle-cli-terms-of-use",
  "privacyPolicyUrl": "https://www.circle.com/legal/privacy-policy",
  "acceptance": {
    "version": "1.0.0",
    "acceptedAt": "2026-05-07T12:34:56Z"
  }
}
```

***

### `circle terms accept`

Explicitly accept the Terms of Use and Privacy Policy. Use this in scripts and
AI agent workflows after the user provides explicit consent.

**Syntax**

```bash theme={null}
circle terms accept [--output json]
```

**Example**

```bash theme={null}
circle terms accept --output json
```

***

### `circle terms reset`

Clear the local acceptance record. The next command run prompts you to accept
the Terms again.

**Syntax**

```bash theme={null}
circle terms reset
```

***

## Telemetry commands

Manage CLI telemetry preferences. Telemetry collects privacy-preserving usage
data to help improve Circle CLI.

### `circle telemetry status`

Show the current telemetry preference.

**Syntax**

```bash theme={null}
circle telemetry status [options]
```

**Example**

```bash theme={null}
circle telemetry status
```

***

### `circle telemetry enable`

Enable telemetry for future commands.

**Syntax**

```bash theme={null}
circle telemetry enable
```

***

### `circle telemetry disable`

Disable telemetry for future commands.

**Syntax**

```bash theme={null}
circle telemetry disable
```
