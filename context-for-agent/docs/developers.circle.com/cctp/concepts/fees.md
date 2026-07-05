> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# CCTP Fees

> Understanding CCTP transfer fees for Fast and Standard transfers

CCTP charges fees on Fast Transfers only. Standard Transfers are free.

[Fast Transfer](/cctp/concepts/finality-and-block-confirmations#fast-transfer-attestation-times)
enables USDC transfers at faster-than-finality speeds by leveraging Circle's
[Fast Transfer allowance](/cctp/concepts/fast-transfer-allowance). These
transfers incur a fee that varies by route.

* **Fee range**: 0-14 basis points depending on source blockchain, for example
  \$0–\$1.40 per \$1,000 transferred
* **When and how the fee is collected**: The fee is deducted from the
  transferred amount when USDC is minted on the destination blockchain

## Get the current fee

To retrieve the current Fast Transfer fee for your route, call the
[`GET /v2/burn/USDC/fees`](/api-reference/cctp/all/get-burn-usdc-fees) endpoint.
For more details, see
[Get the fee for your transfer](/cctp/howtos/get-transfer-fee).

## Maximum fee parameter

When calling
[`depositForBurn`](/cctp/references/contract-interfaces#depositforburn), you
specify a `maxFee` parameter that sets the maximum fee you're willing to pay:

```ts TypeScript theme={null}
await tokenMessenger.depositForBurn(
  amount,
  destinationDomain,
  mintRecipient,
  burnToken,
  destinationCaller,
  500n, // maxFee: 500 subunits (0.0005 USDC)
  1000, // minFinalityThreshold: Fast Transfer
);
```

If the actual fee exceeds your specified `maxFee`, the transaction will revert
on the source blockchain, and no USDC will be burned.

To avoid transaction failures:

1. Retrieve the current fee before initiating a transfer
2. Add a small buffer (for example, 10-20%) to account for potential fee
   fluctuations
3. Set `maxFee` to this buffered amount

Example:

```ts TypeScript theme={null}
async function calculateMaxFee(
  sourceDomain: number,
  destDomain: number,
  transferAmountUSDC: string, // USDC amount like "1" or "10.5"
) {
  // Convert USDC to subunits (6 decimals)
  const [whole, decimal = ""] = transferAmountUSDC.split(".");
  const decimal6 = (decimal + "000000").slice(0, 6);
  const transferAmount = BigInt(whole + decimal6);

  // Get current fee
  const response = await fetch(
    `https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/${sourceDomain}/${destDomain}`,
  );
  const fees = await response.json();

  // Extract minimumFee for Fast Transfer (finalityThreshold 1000)
  const minimumFee = fees[0].minimumFee; // Fee in basis points

  // Calculate fee as percentage of transfer amount
  const protocolFee =
    (transferAmount * BigInt(Math.round(minimumFee * 100))) / 1_000_000n;

  // Add 20% buffer to protocol fee (protocolFee × 1.2) - result in subunits
  const maxFee = (protocolFee * 120n) / 100n;

  return maxFee; // denominated in USDC subunits (6 decimals)
}

// Use in your burn call
const maxFee = await calculateMaxFee(0, 1, "10.5");
```

## Fee tables

The following tables show the current fee rates by source blockchain for Fast
and Standard Transfers. Fees are subject to change at any time.

<Warning>
  **Do not hardcode fee values.** Fees can change at any time. Always retrieve the
  current fee by calling the [fee API](/api-reference/cctp/all/get-burn-usdc-fees)
  at least once per week. Hardcoding fees can cause:

  * **Insufficient fees**: If fees increase, your Fast Transfers may be degraded
    to Standard Transfers when the provided `maxFee` is below the required
    threshold.
  * **Overstated fees**: If fees decrease, users may see higher fees than
    necessary in your UI, even though the excess is refunded during minting.
</Warning>

<Tabs>
  <Tab title="Fast Transfer fee">
    | Source blockchain | Fee              |
    | ----------------- | ---------------- |
    | Arbitrum          | 1.3 bps (0.013%) |
    | Base              | 1.3 bps (0.013%) |
    | Codex             | 1.5 bps (0.015%) |
    | EDGE              | 1.5 bps (0.015%) |
    | Ethereum          | 1 bps (0.01%)    |
    | Ink               | 2 bps (0.02%)    |
    | Linea             | 11 bps (0.11%)   |
    | Morph             | 4 bps (0.04%)    |
    | OP Mainnet        | 1.3 bps (0.013%) |
    | Plume             | 2 bps (0.02%)    |
    | Solana            | 1 bps (0.01%)    |
    | Starknet          | 14 bps (0.14%)   |
    | Unichain          | 1.5 bps (0.015%) |
    | World Chain       | 1.3 bps (0.013%) |

    <Note>
      **Blockchains without Fast Transfer fees**

      Some blockchains don't appear in the Fast Transfer fee table because their
      standard attestation times are already fast enough. Consequently, Fast Transfer
      is not applicable when these blockchains are used as the source blockchain for
      burns. For affected blockchains, see
      [CCTP supported blockchains](/cctp/concepts/supported-chains-and-domains).
    </Note>
  </Tab>

  <Tab title="Standard Transfer fee">
    | Source blockchain | Fee        |
    | ----------------- | ---------- |
    | Arbitrum          | 0 bps (0%) |
    | Arc Testnet       | 0 bps (0%) |
    | Avalanche         | 0 bps (0%) |
    | Base              | 0 bps (0%) |
    | Codex             | 0 bps (0%) |
    | EDGE              | 0 bps (0%) |
    | Ethereum          | 0 bps (0%) |
    | HyperEVM          | 0 bps (0%) |
    | Injective         | 0 bps (0%) |
    | Ink               | 0 bps (0%) |
    | Linea             | 0 bps (0%) |
    | Monad             | 0 bps (0%) |
    | Morph             | 0 bps (0%) |
    | OP Mainnet        | 0 bps (0%) |
    | Pharos            | 0 bps (0%) |
    | Plume             | 0 bps (0%) |
    | Polygon PoS       | 0 bps (0%) |
    | Sei               | 0 bps (0%) |
    | Solana            | 0 bps (0%) |
    | Sonic             | 0 bps (0%) |
    | Starknet          | 0 bps (0%) |
    | Unichain          | 0 bps (0%) |
    | World Chain       | 0 bps (0%) |
    | XDC               | 0 bps (0%) |
  </Tab>
</Tabs>

## Standard Transfer fee switch

Some blockchains support a Standard Transfer fee switch, which enables enforcing
a minimum fee during a CCTP Standard Transfer.

* Some deployments of the `TokenMessengerV2` contract include a fee switch that
  enforces a minimum onchain fee. This fee is collected during USDC minting in a
  Standard Transfer. See tables below for supported blockchains.
* `TokenMessengerV2` contracts with fee switch support include the
  `getMinFeeAmount` function, which calculates and returns the minimum fee
  required for a given burn amount, in units of the `burnToken`.

<Note>
  **Important:** Calling `getMinFeeAmount` on a blockchain that uses an older
  `TokenMessengerV2` contract (without fee switch support) results in an error.
  Refer to the tables below to determine which contract version is deployed on
  each EVM blockchain.
</Note>

### `TokenMessenger` contracts without fee switch support

| Source blockchain | Contract source code                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Arbitrum          | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Avalanche         | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Base              | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Codex             | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Ethereum          | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Linea             | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| OP Mainnet        | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Polygon PoS       | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Sonic             | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| Unichain          | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |
| World Chain       | [`7d70310`](https://github.com/circlefin/evm-cctp-contracts/pull/57/commits/7d703109a2cfcb3f76375fef5f1a97f03c447b94) |

### `TokenMessenger` contracts with fee switch support

| Source blockchain | Contract source code                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Sei               | [`2f9a2ba`](https://github.com/circlefin/evm-cctp-contracts/commit/2f9a2ba993b96a442c75bf21b3cb6d6292d81439) |

## Fee optimization strategies

To minimize fees while maximizing transfer speed:

* **Choose the right method**: Use Fast Transfer when speed is critical and
  Standard Transfer when cost optimization is the priority.
* **Monitor allowance**: For high-volume applications, monitor the
  [Fast Transfer allowance](/cctp/concepts/fast-transfer-allowance) and switch
  to Standard Transfer when it's low.
* **Batch transfers**: If you're making multiple transfers, consider batching
  them during periods when Fast Transfer allowance is high.
* **Set appropriate `maxFee`**: Always retrieve the current fee before
  initiating a transfer and set `maxFee` with a buffer to account for minor
  fluctuations.
