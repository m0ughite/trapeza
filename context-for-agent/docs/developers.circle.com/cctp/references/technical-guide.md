> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# CCTP Technical Guide

> Technical explainer for CCTP

## Message passing

Cross-Chain Transfer Protocol (CCTP) uses generalized message passing to
facilitate the native burning and minting of USDC across supported blockchains,
also known as
[domains](/cctp/cctp-supported-blockchains#cctp-supported-domains). Message
passing is a three-step process:

1. An onchain component on the source domain emits a message.
2. Circle's offchain attestation service signs the message.
3. The onchain component at the destination domain receives the message, and
   forwards the message body to the specified recipient.

Onchain components serve the same purpose across all domains, but their
implementations differ between EVM-compatible and non-EVM domains. Moreover,
there are both implementation and naming differences between CCTP V2 and
previous versions due to the addition of Fast Transfer and other improvements.

### For EVM chains

The relationship between CCTP's onchain components and Circle's offchain
Attestation Service is illustrated below for a burn-and-mint of USDC between
EVM-compatible domains:

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/seRr6PsQqoTXTFfs/cctp/images/cctp-gmp-archdomains01.png?fit=max&auto=format&n=seRr6PsQqoTXTFfs&q=85&s=b957a52434f3df526c2cbba9095c19b0" width="1480" height="1282" data-path="cctp/images/cctp-gmp-archdomains01.png" />
</Frame>

On EVM domains, the onchain component for crosschain burning and minting is
called **TokenMessengerV2**, which is built on top of **MessageTransmitterV2**,
an onchain component for generalized message passing.

In the diagram, a token depositor calls the
[TokenMessengerV2#depositForBurn](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/v2/TokenMessengerV2.sol#L158)
function to deposit a native token (such as USDC), which delegates to the
TokenMinterV2 contract to burn the token. The **TokenMessengerV2** contract then
sends a message via the
[MessageTransmitterV2#sendMessage](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/v2/MessageTransmitterV2.sol#L143)
function. After
[sufficient block confirmations](/cctp/required-block-confirmations), Circle's
offchain attestation service, Iris, signs the message. An API consumer must
query this attestation and submits it onchain to the destination domain's
[MessageTransmitterV2#receiveMessage](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/v2/MessageTransmitterV2.sol#L206)
function.

To send an arbitrary message, directly call
[MessageTransmitterV2#sendMessage](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/v2/MessageTransmitterV2.sol#L143).
The message recipient must implement the following methods to handle messages
based on their finality threshold:

* Implement
  [IMessageHandlerV2#handleReceiveFinalizedMessage](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/interfaces/v2/IMessageHandlerV2.sol#L35)
  to receive messages with `finalityThresholdExecuted` ≥ 2000.
* Implement
  [IMessageHandlerV2#handleReceiveUnfinalizedMessage](https://github.com/circlefin/evm-cctp-contracts/blob/63ab1f0ac06ce0793c0bbfbb8d09816bc211386d/src/interfaces/v2/IMessageHandlerV2.sol#L51)
  to receive messages with `finalityThresholdExecuted` \< 2000.

This distinction allows the recipient to control the level of finality it
requires before accepting a message.

### For non-EVM chains

CCTP is also available on several non-EVM blockchains where USDC is natively
issued, extending crosschain capabilities to the broader ecosystem.

<Note>
  On Stellar, USDC precision and address encoding differ from other CCTP-supported
  blockchains. For inbound transfers, use
  [`CctpForwarder`](/cctp/references/stellar#use-cctpforwarder-for-stellar-recipients)
  so funds reach the correct recipient. See
  [CCTP on Stellar](/cctp/references/stellar).
</Note>

## Message format

### Message header

The top-level message header format is standard for all messages passing through
CCTP.

| Field                       | Offset | Solidity Type | Length (bytes) | Description                                                                                                                   |
| --------------------------- | ------ | ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `version`                   | 0      | `uint32`      | 4              | Version identifier - use 1 for CCTP                                                                                           |
| `sourceDomain`              | 4      | `uint32`      | 4              | Source domain ID                                                                                                              |
| `destinationDomain`         | 8      | `uint32`      | 4              | Destination domain ID                                                                                                         |
| `nonce`                     | 12     | `bytes32`     | 32             | Unique message nonce (see [CCTP V2 Nonces](#cctp-v2-nonces))                                                                  |
| `sender`                    | 44     | `bytes32`     | 32             | Address of MessageTransmitterV2 caller on source domain                                                                       |
| `recipient`                 | 76     | `bytes32`     | 32             | Address to handle message body on destination domain                                                                          |
| `destinationCaller`         | 108    | `bytes32`     | 32             | Address permitted to call MessageTransmitterV2 on destination domain, or bytes32(0) if message can be received by any address |
| `minFinalityThreshold`      | 140    | `uint32`      | 4              | Minimum finality threshold before allowed to attest (see [CCTP V2 Finality Thresholds](#cctp-v2-finality-thresholds))         |
| `finalityThresholdExecuted` | 144    | `uint32`      | 4              | Actual finality threshold executed from source chain (see [CCTP V2 Finality Thresholds](#cctp-v2-finality-thresholds))        |
| `messageBody`               | 148    | `bytes`       | dynamic        | App-specific message to be handled by recipient                                                                               |

#### Nonces

A CCTP nonce is a unique identifier for a message that can only be used once on
the destination domain. Circle assigns CCTP nonces offchain. The nonce for each
message in a transaction can be queried through the
[`GET /v2/messages`](/api-reference/cctp/all/get-messages-v2) endpoint, using
the transaction hash as a query parameter.

<Note>
  **Why `bytes32` type for addresses**

  CCTP is built to support EVM chains, which use 20 byte addresses, and non-EVM
  chains, many of which use 32 byte addresses. Circle provides a
  [`Message.sol` library](https://github.com/circlefin/evm-cctp-contracts/blob/40111601620071988e94e39274c8f48d6f406d6d/src/messages/Message.sol#L145-L157)
  as a reference implementation for converting between address and `bytes32` in
  Solidity.
</Note>

### Message body

The message format includes a dynamically sized `messageBody` field, used for
application-specific messages. For example, `TokenMessengerV2` defines a
[BurnMessageV2](https://github.com/circlefin/evm-cctp-contracts/blob/master/src/messages/v2/BurnMessageV2.sol)
with data related to crosschain transfers.

| Field             | Offset | Solidity Type | Length (bytes) | Description                                                                                                                                                                                                                                                                                            |
| ----------------- | ------ | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `version`         | 0      | `uint32`      | 4              | Version identifier - use 1 for CCTP                                                                                                                                                                                                                                                                    |
| `burnToken`       | 4      | `bytes32`     | 32             | Address of burned token on source domain                                                                                                                                                                                                                                                               |
| `mintRecipient`   | 36     | `bytes32`     | 32             | Address to receive minted tokens on destination domain                                                                                                                                                                                                                                                 |
| `amount`          | 68     | `uint256`     | 32             | Amount of burned tokens                                                                                                                                                                                                                                                                                |
| `messageSender`   | 100    | `bytes32`     | 32             | Address of caller of `depositForBurn` (or `depositForBurnWithCaller`) on source domain                                                                                                                                                                                                                 |
| `maxFee`          | 132    | `uint256`     | 32             | Maximum fee to pay on the destination domain, specified in units of `burnToken`                                                                                                                                                                                                                        |
| `feeExecuted`     | 164    | `uint256`     | 32             | Actual fee charged on the destination domain, specified in units of `burnToken` (capped by `maxFee`)                                                                                                                                                                                                   |
| `expirationBlock` | 196    | `uint256`     | 32             | An expiration block 24 hours in the future is encoded in the message before signing by attestation service, and is respected on the destination chain. If the burn expires, it must be re-signed. Expiration acts as a safety mechanism against problems with finalization, such as a stuck sequencer. |
| `hookData`        | 228    | `bytes`       | dynamic        | Arbitrary data to be included in the `depositForBurn` on source domain and to be executed on destination domain                                                                                                                                                                                        |

<Note>
  **`expirationBlock` on ARB-stack blockchains**

  For ARB-stack destination blockchains (Arbitrum, EDGE, and Plume), the
  `expirationBlock` is an Ethereum (L1) block number, not the L2 block number.
  ARB-stack blockchains track blocks internally using the parent blockchain
  (Ethereum). When validating expiration for these blockchains, compare the
  `expirationBlock` value against the current Ethereum block number, not the L2
  block number.
</Note>

## API hosts and endpoints

CCTP provides a set of API hosts and endpoints to manage messages, attestations,
and transaction details for your crosschain USDC transfers.

### API service hosts

| Environment | URL                                   |
| :---------- | :------------------------------------ |
| **Testnet** | `https://iris-api-sandbox.circle.com` |
| **Mainnet** | `https://iris-api.circle.com`         |

<Note>
  **API Service Rate Limit**

  The CCTP API service rate limit is 35 requests per second. If you exceed 35
  requests per second, the service blocks all API requests for the next 5 minutes
  and returns an HTTP 429 response.
</Note>

### API endpoints

CCTP endpoints enable advanced capabilities such as fetching attestations for
**Standard Transfer** or **Fast Transfer** burn events, verifying public keys
across versions, accessing transaction details, querying fast transfer
allowances and fees, and initiating re-attestation processes. Below is an
overview of the CCTP public endpoints. Click on any endpoint for its API
reference.

| Endpoint                                                                                  | Description                                                                                                                                                                                                                                                                                                                                                  | Use Case                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`GET /v2/publicKeys`](/api-reference/cctp/all/get-public-keys-v2)                        | Returns public keys for validating attestations across all supported CCTP versions.                                                                                                                                                                                                                                                                          | Retrieve public keys to verify attestation authenticity for crosschain transactions.           |
| [`GET /v2/messages`](/api-reference/cctp/all/get-messages-v2)                             | Retrieves messages and attestations for a given transaction or nonce, supporting messages for all CCTP versions.                                                                                                                                                                                                                                             | Fetch attestation status and transaction details.                                              |
| [`POST /v2/reattest`](/api-reference/cctp/all/reattest-message)                           | Re-attests a <Tooltip tip="The point at which a transaction is considered sufficiently secure for attestation, even though it has not yet reached hard finality. This allows for faster message processing while balancing the risk of chain reorganizations.">soft finality</Tooltip> V2 message to achieve finality or revive expired Fast Transfer burns. | Handle edge cases requiring updated attestations or finalize transactions with stricter rules. |
| [`GET /v2/fastBurn/USDC/allowance`](/api-reference/cctp/all/get-fast-burn-usdc-allowance) | Retrieves the current USDC Fast Transfer allowance remaining.                                                                                                                                                                                                                                                                                                | Monitor available allowance for Fast Transfer burns in real-time.                              |
| [`GET /v2/burn/USDC/fees`](/api-reference/cctp/all/get-burn-usdc-fees)                    | Returns the fees for USDC transfers between specified source and destination domains.                                                                                                                                                                                                                                                                        | Calculate transaction costs before initiating a Fast or Standard Transfer.                     |

<Note>
  **Deprecated endpoint**

  The endpoint `/v2/fastBurn/USDC/fees` is deprecated. Use
  [`/v2/burn/USDC/fees`](/api-reference/cctp/all/get-burn-usdc-fees) instead to
  retrieve both Fast and Standard Transfer fees.

  **Note:** This deprecation does **not** affect
  [`/v2/fastBurn/USDC/allowance`](/api-reference/cctp/all/get-fast-burn-usdc-allowance)
  (see preceding table), which remains active and valid.
</Note>

## Finality thresholds

CCTP has the concept of a finality threshold, which is a chain-agnostic
representation of the confirmation level required before an attestation is
issued. This allows integrators to specify how many confirmations are needed
based on their risk tolerance or use case.

In CCTP, each message specifies a `minFinalityThreshold`. This threshold
indicates the minimum level of confirmation required for Circle's attestation
service (Iris) to attest to the message. Iris will not attest to a message at a
confirmation level below the specified minimum threshold. This allows
applications to enforce a desired level of finality before acting on an
attestation on the destination chain.

### Defined finality thresholds

CCTP V2 defines the following finality thresholds:

| Finality Threshold | Value |
| ------------------ | ----- |
| **Confirmed**      | 1000  |
| **Finalized**      | 2000  |

### Messages and finality

* Messages with a `minFinalityThreshold` of **1000** or lower are considered
  **Fast** messages. These messages are eligible for fast attestation at the
  *confirmed* level by Iris.
* Messages with a `minFinalityThreshold` of **2000** are considered **Standard**
  messages. These messages are attested to at the *finalized* level by Iris.

<Note>
  Only two finality thresholds are supported. Any `minFinalityThreshold` value
  below **1000** is treated as **1000**, and any value above **1000** is treated
  as **2000**.
</Note>

## Fees

For information about CCTP transfer fees, including fee tables by blockchain,
the `maxFee` parameter, and Standard Transfer fee switch support, see
[CCTP Fees](/cctp/concepts/fees).

## Hooks

Hooks in CCTP V2 are metadata that can be attached to a burn message, allowing
integrators to execute custom logic at the destination chain. Hook execution is
left entirely to the integrator, offering maximum flexibility and enabling
broader crosschain compatibility without altering the core CCTP protocol.

### Design overview

CCTP does not implement hook execution in the core protocol. Instead, hooks are
treated as opaque metadata passed along with the burn message. This design
allows integrators to define and control how hooks are processed on the
destination chain, based on their own infrastructure and trust model.

### Key benefits

* **Maximum flexibility for integrators**
  * Determine execution timing: pre-mint or post-mint
  * Implement custom recovery or error-handling strategies if hook execution
    fails
  * Choose any execution environment (EVM or non-EVM); even non-EVM chains can
    support Hooks as data passed into a function call.

* **Improved Compliance and Security Separation**
  * **Compliance**: By delegating hook execution to the integrator, the protocol
    maintains a clear boundary between CCTP's core message-passing capabilities
    and application-specific logic. This modular approach helps integrators meet
    their own compliance requirements with greater flexibility.
  * **Security**: By keeping hook execution outside the core protocol, CCTP
    maintains a smaller and more focused security surface, while allowing
    integrators to manage their own execution environments independently.

## Security audit

The CCTP smart contracts have been independently audited by two third-party
security firms:

* CCTP was audited by
  [ChainSecurity (PDF)](https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/PDFs/ChainSecurity_Circle_CCTP_V2_audit%20\(1\).pdf)
  and
  [OtterSec (PDF)](https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/PDFs/public_evm_cctp_audit_final%20\(2\).pdf)
* CCTP (with Standard Transfer fee switch) was audited by
  [ChainSecurity (PDF)](https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/CCTP/ChainSecurity_Circle_CCTP_audit_2025-07.pdf)
