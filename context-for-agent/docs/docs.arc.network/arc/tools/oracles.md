> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Oracles

> Oracle providers for bringing external market data and offchain signals into Arc smart contracts.

Connect your Arc smart contracts to real-world data using the oracle providers
listed below. They offer price feeds and related infrastructure for DeFi,
trading, lending, and other financial applications.

If your application also needs to query historical onchain data, see
[Data indexers](/arc/tools/data-indexers).

## Providers

### [Chainlink](https://chain.link)

Decentralized oracle network for bringing market data and other offchain
information onchain. Chainlink Data Feeds aggregate multiple data sources and
publish secure, widely used feeds for lending, trading, stablecoins, and
tokenized assets.

* [**Data Feeds**](https://docs.chain.link/data-feeds): Access decentralized
  price feeds for smart contract integrations.
* [**Data Streams**](https://docs.chain.link/data-streams): Retrieve low-latency
  market data delivered through a pull-based model.
* [**Feed Explorer**](https://data.chain.link): Browse available feeds and
  contract addresses across supported networks.
* [**Contract Addresses**](https://docs.chain.link/data-feeds/price-feeds/addresses):
  Find deployed price feed contract addresses across supported networks.

### [Pyth](https://www.pyth.network)

Real-time, first-party market data oracle for onchain applications. Pyth
provides price feeds across crypto, equities, FX, metals, and more, with pull
and push delivery models for different latency and cost requirements.

* [**Price Feeds**](https://docs.pyth.network/price-feeds): Integrate real-time
  price data into Arc smart contracts.
* [**EVM Contract Addresses**](https://docs.pyth.network/price-feeds/core/contract-addresses/evm):
  Find deployed contract addresses for EVM-compatible chains.

### [RedStone](https://www.redstone.finance)

Modular oracle network for secure, real-time price feeds and specialized market
data. RedStone supports push, pull, and hybrid delivery models, with coverage
across crypto assets, LSTs, LRTs, RWAs, tokenized funds, FX, and other custom
data feeds for DeFi and institutional applications.

* [**Docs**](https://docs.redstone.finance/docs/introduction/): Learn about
  RedStone's oracle architecture and supported integration models.
* [**Pull Model**](https://docs.redstone.finance/docs/dapps/redstone-pull/):
  Inject signed oracle data directly into user transactions for low-latency,
  gas-efficient integrations.
* [**Push Feeds**](https://app.redstone.finance/push-feeds): View deployed push
  feed contract addresses.
* [**Pull Feeds**](https://app.redstone.finance/pull-feeds): Browse available
  pull feed configurations and supported assets.
* [**Price Feeds**](https://www.redstone.finance/price-feeds): Browse RedStone's
  supported asset coverage and feed types.

### [Stork](https://www.stork.network)

Ultra-low-latency oracle protocol for real-time market data. Stork provides
fast, pull-based delivery with cryptographic verifiability for DeFi applications
that require sub-second pricing.

* [**Docs**](https://docs.stork.network/): Get started with Stork's oracle
  integration guides.
* [**EVM Contract Addresses**](https://docs.stork.network/resources/contract-addresses/evm#arc):
  Find Stork's deployed contracts on Arc.
