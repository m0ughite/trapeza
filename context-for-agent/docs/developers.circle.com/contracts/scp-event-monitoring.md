> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Event Monitoring for Smart Contracts

In this guide you'll set up real-time push notifications for specific Events
that occur in your smart contracts. You can then use those events to trigger
important functionality in your application.

## Prerequisites

Before you begin:

* [Create an API key](/contracts/create-api-key) in the Circle Console

Perform the steps below:

1. [Step 1. Configure Your Webhook for Notifications](/contracts/scp-event-monitoring#step-1-configure-your-webhook-for-notifications)
2. [Step 2. Import Your Smart Contract](/contracts/scp-event-monitoring#step-2-import-your-smart-contract)
3. [Step 3. Create an Event Monitor](/contracts/scp-event-monitoring#step-3-create-an-event-monitor)
4. [Step 4. Fetch Event History](/contracts/scp-event-monitoring#step-4-fetch-event-history)

### Step 1. Configure Your Webhook for Notifications

To receive notifications from Circle, you must expose a publicly accessible
subscriber endpoint on your side. This endpoint should handle POST requests over
HTTPS.

For more information on setting up a webhook, refer to the
[Set Up Webhooks](/wallets/webhook-notifications), and optionally watch the
following video about Webhook Configurations.

<Accordion title="Video Tutorial: Webhook Configuration">
  <iframe src="https://circle-com.wistia.com/medias/v3z7c3d2p1" title="Video Tutorial: Webhook Configuration" width="800px" height="450px" />
</Accordion>

## Customized Webhook Notifications

Customized webhook notifications enable you to listen to a restricted set of
notifications. To create a webhook for smart contract events only select Limit
to specific events when creating your webhook in the Developer Console, then
choose contracts.EventLog.

## The Event Log Notification

When a monitored event occurs, the webhook will receive a notification via POST
with the body formatted as follows: Notification

```json JSON theme={null}
{
  // A unique identifier for the subscription that received the notification.
  "subscriptionId": "c881d120-7692-4ae6-bab0-acfa8c9596c1",

  // A unique identifier for the notification itself.
  "notificationId": "aff457c5-2649-4cdb-a51e-84b33fdfebc9",

  // The type of notification; indicates an event log from a smart contract.
  "notificationType": "contracts.eventLog",

  // An object that contains details about the event log notification.
  "notification": {
    // The address of the smart contract that emitted the event.
    "contractAddress": "0x6bc50ff08414717f000431558c0b585332c2a53d",
    // The specific blockchain network where the event occurred.
    "blockchain": "ARB-SEPOLIA",
    // A hash to identify the on-chain transaction that caused the event.
    "txHash": "0xdc8c0ac07ca02f87754e931b729d9426a5bd7f6b062fbb40e58c8a7942992a7a",
    // A hash representing the user operation that triggered the event, if applicable.
    "userOpHash": "0xbaae33f07aa4877f5a2e9f2a90c5cc5c5006281043696ebaa7f887914058ead0",
    // The name and parameter types of the emitted event.
    "eventName": "Transfer(address,address,uint256)",
    // An array containing indexed parameters of the event. Each entry is a hashed representation of the parameter.
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000009d7fb3144729fff819fc1aa812d0a261ed8c8676"
    ],
    // The raw data associated with the event, consisting of non-indexed parameters as a concatenated hexadecimal string.
    "data": "0x00000000000000000000000000000000000000000000000000005af3107a3fff"
  },
  // The UTC timestamp of when the notification was generated, formatted to ISO 8601.
  "timestamp": "2024-10-21T18:44:07.614649603Z",
  // Indicates the version of the notification format.
  "version": 2
}
```

### Step 2. Import Your Smart Contract

Before creating an event monitor, import your smart contract into the Contracts
system. This ensures the Contracts platform is aware of your contract and can
manage event monitors effectively:

```javascript javascript theme={null}
const importResponse = await circleContractSdk.importContract({
  // The address of the smart contract to be imported.
  address: "0x6bc50ff08414717f000431558c0b585332c2a53d",
  // The blockchain from which the contract is being imported.
  blockchain: "ARB-SEPOLIA",
  // A unique key provided to ensure idempotency of the request. It prevents duplicate imports for the same contract if a retry occurs.
  idempotencyKey: "50d64a5e-6b2e-47ea-aa14-13feab9376e9",
  // A human-readable name for the contract being imported.
  name: "MyToken",
  // A brief description of the smart contract.
  description: "My ERC-20 Token Contract",
});
```

If you attempt to create an event monitor on an un-imported smart contract, you
will receive the following error message:

```json JSON theme={null}
{
  "code": 175001,
  "message": "contract not found"
}
```

For more information on importing a contract, see the Import a contract API
endpoint.

## Step 3. Create an Event Monitor

Event Monitors listen for configured events on the blockchain and trigger
notifications to your webhook endpoint when those events occur. Circle will also
save all emitted events under that monitor, allowing you to retrieve historical
data later. For more details, see Step 4. Fetch Event History.

### Finding and Using the Event Signature

An event signature uniquely identifies an event within a smart contract and is
derived from the event's name and parameter types using the keccak-256 hashing
function. For readability, event monitors are created using the human-readable
event signature, not the hash.

For example, the Transfer event in the ERC-20 interface is defined as:

```javascript JavaScript theme={null}
event Transfer(address indexed from, address indexed to, uint256 value);
```

The human-readable event signature is formatted as:
'Transfer(address,address,uint256)'.

<Note>**Note:** Spaces are not allowed in the event string signature.</Note>

Create an event monitor with the following code:

```javascript JavaScript theme={null}
const monitorResponse = await circleContractSdk.createEventMonitor({
  // The specific blockchain network where the event monitor will be created.
  blockchain: "ARB-SEPOLIA",
  // The address of the smart contract for which the event monitor is being created.
  contractAddress: "0x6bc50ff08414717f000431558c0b585332c2a53d",
  // The signature of the event to monitor, defining the event type and parameters being tracked.
  eventSignature: "Transfer(address,address,uint256)",
  // A unique key provided to ensure idempotency of the request, preventing duplicate event monitors from being created.
  idempotencyKey: "f80fcf44-bbb1-4336-870a-f1802ad98e0f",
});
```

The response will include details about the event monitor:

```json JSON theme={null}
{
  "data": {
    "eventMonitor": {
      // A unique identifier for the event monitor.
      "id": "01929bc2-aab3-76a2-b3fc-c99fc94b9218",
      // The address of the smart contract being monitored.
      "contractAddress": "0x6bc50ff08414717f000431558c0b585332c2a53d",
      // The specific blockchain where the event monitor is set up.
      "blockchain": "ARB-SEPOLIA",
      // The signature of the event being monitored, indicating the type and parameters.
      "eventSignature": "Transfer(address,address,uint256)",
      // The hash of the event signature used for efficient identification.
      "eventSignatureHash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      // A boolean indicating whether the event monitor is currently enabled.
      "isEnabled": true,
      // The date and time when the event monitor was created, in ISO 8601 format.
      "createDate": "2024-10-17T18:34:39.1558Z",
      // The date and time when the event monitor was last updated, in ISO 8601 format.
      "updateDate": "2024-10-17T18:34:39.1558Z"
    }
  }
}
```

If the event signature you are creating a monitor for does not exist, you will
receive the following error message:

```json JSON theme={null}
{
  "code": 175303,
  "message": "The specified event signature does not exist"
}
```

<Note>
  **Note:** Please ensure the event signature exists if you are using an
  unverified contract as Circle cannot verify event existence for unverified
  contracts.
</Note>

After creating an event monitor, you can view, disable, and delete your
monitors. For more information, see the
[Event Monitoring APIs](/api-reference/contracts/smart-contract-platform/get-event-monitors).

### Step 4. Fetch Event History

To retrieve historical events that match your monitors, utilize the event
history feature. This functionality is essential for doing analytics, auditing,
or reconstructing the application state based on past events:

```javascript JavaScript theme={null}
const eventHistoryResponse = await circleContractSdk.getEventHistory({
  // The address of the smart contract for which event history is being fetched.
  contractAddress: "0x6bc50ff08414717f000431558c0b585332c2a53d",
  // The specific blockchain network where the contract is deployed.
  blockchain: "ARB-SEPOLIA",
  // The signature of the event to fetch historical occurrences.
  eventSignature: "Transfer(address,address,uint256)",
});
```

The data returned will mirror the information in your Webhook Logs in the
[Circle Console](https://console.circle.com/):

```json JSON theme={null}
{
  "data": {
    "eventLogs": [
      {
        // A unique identifier for the event log.
        "id": "0192b064-c71d-7642-8882-aadc8f5df01a",
        // The blockchain network where the event occurred.
        "blockchain": "ARB-SEPOLIA",
        // The transaction hash associated with the event log.
        "txHash": "0xdc8c0ac07ca02f87754e931b729d9426a5bd7f6b062fbb40e58c8a7942992a7a",
        // The index of the log entry within the transaction.
        "logIndex": "1",
        // The hash of the block containing the transaction.
        "blockHash": "0x842dfd3c9339008d311c78154368f0f11f91801d5f40d7306745576aa9c246f7",
        // The height of the block in which the event occurred.
        "blockHeight": 90526683,
        // The address of the smart contract that emitted the event.
        "contractAddress": "0x6bc50ff08414717f000431558c0b585332c2a53d",
        // The signature of the event that was emitted.
        "eventSignature": "Transfer(address,address,uint256)",
        // The hash of the event signature for efficient identification.
        "eventSignatureHash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        // An array of topics indexed within the event log for filtering.
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000009d7fb3144729fff819fc1aa812d0a261ed8c8676"
        ],
        // Raw data associated with the event, representing non-indexed parameters.
        "data": "0x00000000000000000000000000000000000000000000000000005af3107a3fff",

        // A hash representing the user operation that triggered the event, when applicable.
        "userOpHash": "0xbaae33f07aa4877f5a2e9f2a90c5cc5c5006281043696ebaa7f887914058ead0",
        // The date and time when the first confirmation of the event occurred.
        "firstConfirmDate": "2024-10-21T18:44:04Z"
      }
    ]
  }
}
```

<Note>
  **Note:**

  Event history for a monitor will always be available; however, the resource will
  stop being populated once the monitor is deleted.
</Note>

For more information, see the
[Event Monitoring APIs](/api-reference/contracts/smart-contract-platform/get-event-monitors)
and join our
[Discord - Build on Circle](https://discord.com/invite/buildoncircle) channel.
