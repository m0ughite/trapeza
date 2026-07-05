> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Send a Gasless Transaction

This step-by-step guide lays out the process for sending gasless transactions
from your wallet on <Tooltip tip="A blockchain Testnet is a separate and independent network designed for testing and development purposes. It allows blockchain developers and users to experiment, validate, and refine their applications, smart contracts, and functionalities without using real or valuable assets on the main blockchain network.">Testnet</Tooltip>. Gasless transactions are no
different than any other Programmable Wallet transaction. As long as a
<Tooltip tip="A Gas Station Policy refers to the configuration set on a blockchain network to utilize Circle's managed Paymaster, known as Gas Station. It allows you to define what transactions you are willing to sponsor on behalf of your users. When a transaction meets the specified configuration, Circle's Paymaster covers the associated gas fees. Note a policy is required to enable the Gas Station functionality on the Mainnet.">Gas Station policy</Tooltip> is configured, and you use a supported
wallet, <Tooltip tip="Gas fees represent the cost of executing transactions on the blockchain network. These fees vary based on factors such as network congestion and transaction complexity.">gas fees</Tooltip> will be sponsored automatically.

<Note>
  For **Testnet**, a preconfigured policy is already in place. Therefore, you
  are not required to create a Gas Station policy for this quickstart guide.
</Note>

Before you begin, it's important to understand which blockchains support gasless
transactions and the wallet types supported on each.

* The following **EVM chains** support smart contract accounts (SCAs) for
  gasless transactions:
  * **Arbitrum**: Mainnet, Sepolia testnet
  * **Arc**: Testnet
  * **Avalanche**: Mainnet, Fuji testnet
  * **Base**: Mainnet, Sepolia testnet
  * **Ethereum**: Mainnet, Sepolia testnet
  * **Monad**: Mainnet, Testnet
  * **Optimism**: Mainnet, Sepolia testnet
  * **Polygon**: Mainnet, Amoy testnet
  * **Unichain**: Mainnet, Sepolia testnet

* **Aptos** supports externally owned accounts (EOAs)

* **Solana** supports externally owned accounts (EOAs)

To learn more, see [Gas Station overview](/wallets/gas-station).

## 1. Create a Wallet

To create a wallet, follow our comprehensive quickstart guide on
[creating your first developer-controlled wallet](/wallets/dev-controlled/create-your-first-wallet).
Remember, you must create an SCA wallet for EVM chains to perform gasless
transactions while you must create an EOA wallet on Solana. Once the wallet is
successfully created, note down the wallet's address from step 3.

Alternatively, if you prefer to use user-controlled wallets, follow the
[Create Your First Wallet](/wallets/user-controlled/react-native-sdk-ui-customization-api)
guide.

## 2. Fund the Wallet

Next, you will fund your wallet with a token to provide an asset for conducting
transactions. In this guide, we will transfer USDC into the wallet using the
[USDC faucet](https://faucet.circle.com/). While on the
<Tooltip tip="A blockchain faucet is a website or online platform that provides small amounts of cryptocurrency for free or in exchange for simple tasks. These faucets are primarily used on testnets, which simulate the live environment without real tokens or money. Blockchain faucets are used to test and develop applications, ensuring a safe and controlled environment for experimentation without the need for actual funds.">faucet</Tooltip>, provide your wallet's address to complete the
process.

Alternatively, if you prefer to deposit a native token, you can visit the
[ETH](https://www.alchemy.com/faucets/ethereum-sepolia) or
[MATIC](https://faucet.polygon.technology/) faucets.

## 3. Send a Transfer

Follow the instructions in the quick start guide
[Transfer Tokens from Wallet to Wallet](/wallets/dev-controlled/transfer-tokens-across-wallets).
This guide will walk you through sending a transaction without requiring gas.
Once completed, you can head to the
[developer dashboard policies page](https://console.circle.com/gas-station/policies)
and view the sponsored transaction within the respective policy.

For those using user-controlled wallets, follow the
[Send an Outbound Transfer](/wallets/user-controlled/send-outbound-transfer)
instead.

***

Congratulations on successfully sending a gasless transaction! With Circle
taking care of the complexities, you can fully concentrate on providing a
delightful user experience without the hassle of intricate setup.

To expand your knowledge and explore further, please visit the following
resources:

1. [**Gas Station Overview:**](/wallets/gas-station) Get familiar with Gas
   Station, its functions, and how it can be used in your app.
2. [**Policy Management:**](/wallets/gas-station/policy-management) Understand
   how to manage Gas Station policies effectively and view gas-sponsored
   transactions.
3. [**Billing for Sponsored Gas Fees:**](/wallets/gas-station/billing)
   Understand how you will be billed for sponsored gas fees.
4. [**Paymaster & Fee-Payer:**](/wallets/gas-station/contract-addresses) Dive
   deeper into the concept of Paymaster and its role in gasless transactions.

By leveraging these resources, you can enhance your understanding and maximize
the potential of gasless transactions. Stay tuned for exciting updates and
features as we strive to streamline the gasless transaction experience.
