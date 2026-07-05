> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Fast Transfer Allowance

> Understanding Circle's Fast Transfer allowance mechanism

The Fast Transfer allowance is Circle's mechanism for providing
faster-than-finality USDC transfers. It limits the total value of USDC that can
be minted through Fast Transfer before related burns reach hard finality.

## How it works

Circle maintains a Fast Transfer allowance pool that backs all in-process CCTP
Fast Transfers. The following steps describe how the allowance works:

1. **Initial state**: Circle maintains a Fast Transfer allowance pool (for
   example, 10 million USDC).

2. **Fast Transfer initiated**: When you burn USDC on the source blockchain with
   Fast Transfer:
   * The burn amount temporarily debits the allowance
   * Circle's Attestation Service issues an attestation after
     [soft finality](/cctp/concepts/finality-and-block-confirmations)
   * You can immediately mint USDC on the destination blockchain

3. **Allowance depleted**: If the allowance reaches zero, Fast Transfers are
   temporarily unavailable until the allowance replenishes.

4. **Allowance replenished**: Once burns reach hard finality on source
   blockchains, the corresponding amounts are credited back to the allowance.

<Note>
  **Note:** The Fast Transfer allowance is global across all supported
  blockchains. It's not specific to a particular source or destination blockchain,
  but rather tracks the total value of in-process Fast Transfers.
</Note>

## Check the current allowance

To check the remaining Fast Transfer allowance, call the
[`GET /v2/fastBurn/USDC/allowance`](/api-reference/cctp/all/get-fast-burn-usdc-allowance)
endpoint. For a detailed guide on checking the allowance, see
[Get the Fast Transfer allowance](/cctp/howtos/get-fast-transfer-allowance).

## When allowance is insufficient

If the Fast Transfer allowance is insufficient for your transfer, you have two
options:

### Option 1: Wait for replenishment

The allowance automatically replenishes as pending Fast Transfers reach hard
finality.

Monitor the allowance until sufficient capacity is available:

```ts TypeScript theme={null}
async function waitForAllowance(requiredAmount: bigint, timeoutMs = 1200000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(
      "https://iris-api-sandbox.circle.com/v2/fastBurn/USDC/allowance",
    );
    const { allowance } = await response.json();

    // Convert USDC string to 6-decimal subunits without float precision loss
    const [whole, frac = ""] = String(allowance).split(".");
    const allowanceSubunits =
      BigInt(whole) * 1_000_000n + BigInt((frac + "000000").slice(0, 6));

    if (allowanceSubunits >= requiredAmount) {
      console.log("Sufficient allowance available");
      return true;
    }

    console.log(`Current allowance: ${allowance} USDC, waiting...`);
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Check every 30 seconds
  }

  throw new Error("Timeout waiting for allowance replenishment");
}
```

### Option 2: Use Standard Transfer

Change `minFinalityThreshold` to 2000 or higher to use
[Standard Transfer](/cctp/concepts/finality-and-block-confirmations#standard-transfer-attestation-times),
which doesn't consume the Fast Transfer allowance.

## Allowance lifecycle

Understanding what happens during each phase of the allowance lifecycle helps
you build more robust applications:

<Steps>
  <Step title="Burn initiated">
    The user calls `depositForBurn` with `minFinalityThreshold` ≤ 1000. The
    transaction confirms on the source blockchain, and the allowance is debited by
    the burn amount.
  </Step>

  <Step title="Soft finality reached">
    Circle's Attestation Service issues an attestation, and the attestation becomes
    available through the API. The user can now mint USDC on the destination
    blockchain.
  </Step>

  <Step title="Hard finality reached">
    The burn transaction reaches hard finality on the source blockchain. The
    allowance is credited back by the burn amount, and capacity is restored for new
    Fast Transfers.
  </Step>
</Steps>
