> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Contracts

Circle Contracts empowers developers to utilize smart contracts within their
applications. Contracts facilitates the creation, deployment, and execution of
smart contracts through an intuitive Developer Console or APIs, ensuring
flexibility and ease of integration. The goal is to simplify the process of
leveraging smart contracts for real-world use cases in applications.

Some examples of what developers can do using Contracts:

1. **Deploying Custom Contracts:** Bring your custom contracts to life by
   efficiently deploying them onto the blockchain, expanding the functionality
   and capabilities of your application.
2. **Deploying NFT Contracts:** Easily deploy NFT contracts and programmatically
   mint unique tokens for end-users, enabling the creation of digital assets and
   collectibles.
3. **Creating On-Chain Loyalty Programs:** Establish on-chain loyalty programs
   within your applications, allowing users to earn and redeem rewards
   seamlessly.
4. **Interacting with DeFi Projects:** Effortlessly integrate with popular DeFi
   projects like Uniswap, enabling users to interact with decentralized
   exchanges and other financial services with just a few clicks.
5. **Integrating Circle Contracts:** Seamlessly incorporate Circle contracts,
   such as [CCTP](/cctp/evm-smart-contracts)'s, into your application, providing
   secure and efficient transfer functionalities.
6. **Monitor Your Smart Contracts:** Set up push notifications for any events
   occurring in your smart contracts.

<Note>
  **No-code & API support** Contracts can be accessed in two ways by developers:

  1. **Console:** You can explore, interact and manage smart contracts without
     writing any code. This is ideal for non-technical users, or any low frequency
     use. The console supports exploring contracts (view functions, events,
     transactions), deploying contracts (via templates) and managing the contract
     (any read/write function on the contract).
  2. **SDK/API:** You can also receive the benefits of Contracts programmatically!
     Combining with developer-controlled wallets and Gas Station, you can deploy,
     interact and manage smart contracts at scale via simple APIs - in a gasless
     fashion! The APIs that we provide include deploying contracts (via bytecode
     or templates), read or write contract executions.
</Note>

## Explore smart contracts

The Developer Services console allows developers to view the details of any
smart contract. Developers can import a smart contract by adding its address and
blockchain. Once imported, developers can explore the contract, view the ABI
functions, read the source code, see all transactions, subscribe to events, or
execute function calls.

## Deploy smart contracts

Developers can deploy smart contracts using Circle Contracts by writing their
contracts or using pre-vetted templates provided by Circle. To deploy a
contract, developers need to create a Developer-controlled wallet using Circle
Wallets and use it to deploy the contract across any supported chains.
Deployment can be done through the console in a no-code way or programmatically
using APIs.

### Deploy a custom contract

If you have already written a smart contract on an IDE, you can deploy it by
providing the compiled bytecode and ABI. For console deployment, create a
console wallet (a smart contract wallet) and use it to deploy the contract on
the desired chain. Include the source code, ABI, and bytecode for API deployment
in the request parameters.

### Deploy contracts with templates

For developers unfamiliar with smart contract engineering, Templates provide
code snippets to deploy contracts without writing any solidity code. These
templates, curated by the Circle team and audited by third-party auditors, cover
popular onchain use cases. Fill in the required properties and deploy the
contract. Templates can be deployed through the console or APIs.

Some templates that we support include:

* Token (ERC-20) contract, by Thirdweb
* NFT (ERC-721) contract, by Thirdweb
* Multi-Token (ERC-1155) contract, by Thirdweb
* Airdrop contract, by Thirdweb

## Manage smart contracts

Once deployed, you can use the console to manage your smart contracts. This
includes viewing analytics, calling contract admin functions (e.g. changing
ownership, updating configs) or subscribing to events. The console provides an
easy way to update and manage contracts post-deployment. Developers can access
analytics such as transactions and events for contracts deployed using Contracts
via APIs.

## Interact with smart contracts

Interacting with smart contracts allows you to integrate existing onchain
contracts into your applications. Import the contract and explore its various
functions. You can add parameters and generate API resources to interact with
the contract in a straightforward manner.

## Event Monitoring

Event Monitoring allows developers to track onchain events emitted by their
smart contracts in real time. By setting up event monitors, you can receive
instant notifications whenever specified events occur. This capability enables
developers to respond programmatically to important actions within their
applications, making it easier to implement automation and enhance user
experiences.
