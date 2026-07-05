> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrate from CCTP V1 (Legacy) to V2

> Complete migration guide for developers upgrading CCTP integrations

This guide provides a summary of the breaking changes when migrating from
Cross-Chain Transfer Protocol (CCTP) V1 to V2. CCTP V2 introduces enhancements
including Fast Transfer, Hooks features, and improved API endpoints, but
requires updating your integration due to breaking changes.

<Important>
  **Important**: CCTP V2 isn't backward compatible with V1. It uses separate
  contracts, APIs, and transfer speeds. It also introduces new blockchain support,
  while deprecating some chains. Plan for a complete integration update rather
  than incremental changes.

  Failure to migrate will eventually result in loss of crosschain capabilities for
  your integration.
</Important>

Arc App Kit's [Bridge](https://docs.arc.network/app-kit/bridge) capability can
help simplify your migration to CCTP V2. See the
[Migrating with App Kit](#migrating-with-app-kit) section for more information.

## V1 deprecation

Circle is deprecating CCTP V1 to focus on the newer version, which is upgradable
and provides a faster, more secure, and more robust crosschain experience across
a wider network of blockchains.

### Naming changes

CCTP V2 is now referred to as CCTP (except in this document). The V1 version of
CCTP is now CCTP V1 (Legacy).

### Deprecation timeline

CCTP V1 will be phased out over the course of 10 months beginning in July 2026.
CCTP V2 contracts are available on all CCTP V1 chains except for Aptos, Noble,
and Sui. Aptos and Sui will be supported by V2 before the phase out begins.
Circle is working with Noble and Cosmos ecosystem teams on an intermediate
solution to route USDC flows to and from Noble.

### Access to funds

You will not lose access to funds during the V1 phase out. All pending
redemptions will remain available as CCTP V1 (legacy) begins its phase out.
Circle will maintain minter allowances greater than the total of pending
attestations, ensuring every redemption can be processed before V1 contracts are
fully paused.

The deprecation process is designed to wind down activity gradually, message
limits will tighten over time until no new burns can be initiated, bringing
transfer volume to zero before contracts are fully paused.

### Additional resources

In addition to this guide and [Arc App Kit](https://docs.arc.network/app-kit),
you can contact the Circle team on the
[BuildOnCircle Discord](https://discord.com/invite/buildoncircle) for questions
and migration support.

## Summary of breaking changes

The latest version of CCTP introduces architectural changes that make it
incompatible with V1 integrations. You must update your implementation to use
the new contracts, APIs, and transfer speeds. Additionally, the overall flow of
the protocol has been streamlined, which means you need to update your
integration to use the new functions.

* Contracts are deployed at
  [different addresses](/cctp/references/contract-addresses) than V1 contracts.
  You should update your integration to point to the new contract addresses.
* [Contract interfaces](/cctp/references/contract-interfaces) have changed.
  Importantly, the
  [`depositForBurn` function](/cctp/references/contract-interfaces#depositforburn)
  now takes additional parameters. You should update your integration to use the
  new ABIs and contract calls.
* CCTP now allows you to specify a transfer speed. The `finalityThreshold`
  parameter specifies whether the transfer should be a
  [Fast Transfer](/cctp/concepts/finality-and-block-confirmations#fast-transfer-attestation-times)
  or a
  [Standard Transfer](/cctp/concepts/finality-and-block-confirmations#standard-transfer-attestation-times).
* You no longer need to extract the message from the onchain transaction to
  fetch an attestation. Instead, you can call the new
  `/v2/messages/{sourceDomainId}` endpoint with the transaction hash to get the
  message and attestation in a single call.
* API endpoints have changed. The new `/v2/` endpoints have different functions
  than the old `/v1/` endpoints. You should update your integration to use the
  new endpoints. Review the
  [CCTP API reference](/api-reference/cctp/all/get-public-keys-v2) for details
  on the changes to the CCTP offchain API.
* [Fees](/cctp/concepts/fees) have been introduced. Fast Transfer has a variable
  fee based on the source chain. You should update your integration to account
  for the new fees.

## Migrating with App Kit

[Arc App Kit](https://docs.arc.network/app-kit) provides a simplified migration
path by abstracting routine setup steps and standardizing bridging flows. This
enables you to integrate bridging operations with minimal code.

### Benefits of using App Kit to bridge

* **No contract management**: App Kit handles contract addresses, ABIs, and
  function calls for you.
* **No attestation polling**: Automatically retrieves attestations without
  manual API calls.
* **Built-in CCTP features**: Access Fast Transfer and other capabilities
  through simple configuration.
* **Type-safe interface**: Compatible with `viem` and `ethers` for safer
  development.
* **Fee collection**: Optionally collect fees from transfers to monetize your
  application.

### Example migration

Replace manual contract calls and API polling with a single method:

```typescript theme={null}
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

// Initialize App Kit
const kit = new AppKit();

// Create adapter for your wallet
const adapter = createAdapterFromPrivateKey({
  privateKey: process.env.PRIVATE_KEY as string,
});

// Transfer USDC with Fast Transfer
const result = await kit.bridge({
  from: { adapter, chain: "Ethereum" },
  to: { adapter, chain: "Base" },
  amount: "100",
  config: {
    transferSpeed: "FAST", // Use Fast Transfer
    maxFee: "5000000", // Max 5 USDC fee (optional)
  },
});

// Result includes transaction details and explorer URLs
console.log("Transfer complete:", result.steps);
```

For more information, see Arc App Kit's
[Bridge](https://docs.arc.network/app-kit/bridge) capability.

## Changes to smart contracts

CCTP uses new smart contracts with different names, addresses, and interfaces.
You must update your integration to use the new contracts and their new function
signatures.

### Contract name and address changes

All legacy contracts have V2 equivalents deployed at new addresses:

| Legacy contract      | V2 contract            | Documentation                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------------- |
| `TokenMessenger`     | `TokenMessengerV2`     | [V2 Interface](/cctp/evm-smart-contracts#tokenmessengerv2)      |
| `MessageTransmitter` | `MessageTransmitterV2` | [V2 Interface](/cctp/evm-smart-contracts#messagetransmitterv2)  |
| `TokenMinter`        | `TokenMinterV2`        | [V2 Addresses](/cctp/evm-smart-contracts#tokenminterv2-mainnet) |
| `Message`            | `MessageV2`            | [V2 Addresses](/cctp/evm-smart-contracts#messagev2-mainnet)     |

<Important>
  **Important**: V2 contracts are deployed at different addresses than V1
  contracts. See the
  [CCTP Contract Addresses](/cctp/evm-smart-contracts#mainnet-contract-addresses)
  for the complete list of mainnet and testnet addresses.
</Important>

### TokenMessengerV2 changes

**Modified functions:**

* `depositForBurn()` now requires three additional parameters:
  * `destinationCaller` (bytes32) - Address that can call `receiveMessage` on
    destination
  * `maxFee` (uint256) - Maximum fee for Fast Transfer in units of burn token
  * `minFinalityThreshold` (uint32) - Minimum finality level (1000 for Fast,
    2000 for Standard)

**New functions:**

* `depositForBurnWithHook()` - Enables custom logic execution on destination
  chain via hook data
* `getMinFeeAmount()` - Calculates minimum fee for Standard Transfer (on
  supported chains only)

**Removed functions:**

* `depositForBurnWithCaller()` - Use `destinationCaller` parameter in
  `depositForBurn()` instead
* `replaceDepositForBurn()` - No V2 equivalent available

### Contract source code

Full contract source code is available on GitHub:

* [CCTP EVM Contracts](https://github.com/circlefin/evm-cctp-contracts) - Main
  repository
* [Contract ABIs](https://github.com/circlefin/evm-cctp-contracts/tree/master/docs/abis/cctp/v2) -
  Interface definitions

## API migration guide

CCTP streamlines the API workflow by combining message retrieval and attestation
into single calls, while introducing new endpoints for features like Fast
Transfer monitoring and re-attestation.

### Workflow changes

The API eliminates the need to extract the message emitted by the onchain
transaction:

**Legacy workflow:**

1. Get the transaction receipt from the onchain transaction
2. Find the MessageSent event in the transaction receipt
3. Hash the message bytes emitted by the MessageSent event
4. Call `/v1/attestations/{messageHash}` to get an attestation

**V2 workflow:**

1. Call `/v2/messages/{sourceDomainId}` with transaction hash or nonce to get
   message, attestation, and decoded data

#### Legacy workflow example

```javascript theme={null}
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// V1 requires multiple steps to extract message and get attestation
const burnTxHash = "0x1234..."; // Transaction hash from depositForBurn

// Step 1: Get the transaction receipt from the onchain transaction
const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});
const transactionReceipt = await client.getTransactionReceipt({
  hash: burnTxHash,
});

// Step 2: Find the MessageSent event in the transaction receipt
const eventTopic = keccak256(toBytes("MessageSent(bytes)"));
const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic);
const messageBytes = decodeAbiParameters([{ type: "bytes" }], log.data)[0];

// Step 3: Hash the message bytes emitted by the MessageSent event
const messageHash = keccak256(messageBytes);

// Step 4: Call attestation API with the message hash
let attestationResponse = { status: "pending" };
while (attestationResponse.status !== "complete") {
  const response = await fetch(
    `https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
  );
  attestationResponse = await response.json();
  await new Promise((r) => setTimeout(r, 2000));
}

const attestation = attestationResponse.attestation;

// Now you can use messageBytes and attestation to call receiveMessage
```

#### V2 workflow example

```javascript theme={null}
// V2 gets message and attestation in a single call
const sourceDomainId = 0; // Ethereum mainnet
const transactionHash = "0x1234...";

// Single step: Get message, attestation, and decoded data
const response = await fetch(
  `https://iris-api.circle.com/v2/messages/${sourceDomainId}?transactionHash=${transactionHash}`,
);
const data = await response.json();

// All data available in single response
const message = data.messages[0].message;
const attestation = data.messages[0].attestation;
const decodedMessage = data.messages[0].decodedMessage;

// Now you can use message and attestation to call receiveMessage
// You can also access decoded fields without manual parsing
console.log(`Amount: ${decodedMessage.decodedMessageBody.amount}`);
console.log(`Recipient: ${decodedMessage.decodedMessageBody.mintRecipient}`);
```

### Endpoint migration mapping

| Legacy endpoint                                       | V2 replacement                                             | Migration notes                                        |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `GET /v1/attestations/{messageHash}`                  | `GET /v2/messages/{sourceDomainId}?transactionHash={hash}` | Combined into messages endpoint with enhanced response |
| `GET /v1/messages/{sourceDomainId}/{transactionHash}` | `GET /v2/messages/{sourceDomainId}?transactionHash={hash}` | Enhanced with decoded data and attestation             |
| `GET /v1/publicKeys`                                  | `GET /v2/publicKeys`                                       | Multi-version support, backward compatible             |

### New V2-only endpoints

V2 introduces additional endpoints for advanced features:

| Endpoint                                                 | Purpose                           | Use case                                               |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `POST /v2/reattest/{nonce}`                              | Re-attest messages for edge cases | Handle expired Fast Transfer burns or finality changes |
| `GET /v2/fastBurn/USDC/allowance`                        | Monitor Fast Transfer allowance   | Check remaining Fast Transfer capacity in real-time    |
| `GET /v2/burn/USDC/fees/{sourceDomainId}/{destDomainId}` | Get current transfer fees         | Calculate fees before initiating transfers             |

### Message data changes

V2 message responses now include the decoded message data and attestation:

#### V1 messages response

```json theme={null}
{
  "messages": [
    {
      "attestation": "0xdc485fb2f9a8f68c871f4ca7386dee9086ff9d4387756990c9c4b9280338325252866861f9495dce3128cd524d525c44e8e7b731dedd3098a618dcc19c45be1e1c",
      "message": "0x00000000000000050000000300000000000194c2...",
      "eventNonce": "9682"
    }
  ]
}
```

#### V2 messages response

```json theme={null}
{
  "messages": [
    {
      "message": "0x00000000000000050000000300000000000194c2...",
      "eventNonce": "9682",
      "attestation": "0x6edd90f4a0ad0212fd9fbbd5058a25aa8ee10ce77e4fc143567bbe73fb6e164f384a3e14d350c8a4fc50b781177297e03c16b304e8d7656391df0f59a75a271f1b",
      "decodedMessage": {
        "sourceDomain": "7",
        "destinationDomain": "5",
        "nonce": "569",
        "sender": "0xca9142d0b9804ef5e239d3bc1c7aa0d1c74e7350",
        "recipient": "0xb7317b4EFEa194a22bEB42506065D3772C2E95EF",
        "destinationCaller": "0xf2Edb1Ad445C6abb1260049AcDDCA9E84D7D8aaA",
        "messageBody": "0x00000000000000050000000300000000000194c2...",
        "decodedMessageBody": {
          "burnToken": "0x4Bc078D75390C0f5CCc3e7f59Ae2159557C5eb85",
          "mintRecipient": "0xb7317b4EFEa194a22bEB42506065D3772C2E95EF",
          "amount": "5000",
          "messageSender": "0xca9142d0b9804ef5e239d3bc1c7aa0d1c74e7350"
        }
      },
      "cctpVersion": 2,
      "status": "complete"
    }
  ]
}
```

<Note>
  On Stellar, USDC precision and address encoding differ from other CCTP-supported
  blockchains. For inbound transfers, use
  [`CctpForwarder`](/cctp/references/stellar#use-cctpforwarder-for-stellar-recipients)
  so funds reach the correct recipient. See
  [CCTP on Stellar](/cctp/references/stellar).
</Note>
