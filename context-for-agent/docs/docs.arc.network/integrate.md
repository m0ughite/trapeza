> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrate with Arc

> Connect wallets, exchanges, and infrastructure to the Arc network.

Arc is a developer platform with a fully
[EVM-compatible](/arc/references/evm-compatibility) network layer — meaning it
supports the same bytecode, RPC methods, and tooling as Ethereum. Ethereum
developer tools, wallets, and infrastructure work without modification.

## Connect to Arc

<CardGroup cols={2}>
  <Card title="Network details" icon="plug" href="/integrate/connect-to-arc">
    RPC endpoints, chain ID, WebSocket URLs, and explorer links for Arc testnet.
  </Card>

  <Card title="Deploy on Arc" icon="rocket" href="/integrate/deploy-on-arc">
    Deploy, test, and interact with a Solidity smart contract on Arc.
  </Card>
</CardGroup>

## EVM differences

Arc has a few key differences from Ethereum:

* **USDC as gas**: Transaction fees are paid in USDC (a stablecoin pegged to the
  US dollar) instead of a native token, which affects gas estimation and fee
  display. See [Gas and fees](/arc/references/gas-and-fees) for details.
* **Deterministic finality**: Transactions finalize in under one second with no
  risk of reorganization, so a single confirmation is sufficient.
* **Standard tooling**: [Hardhat](https://hardhat.org/),
  [Foundry](https://github.com/foundry-rs/foundry), [Viem](https://viem.sh/),
  and other Ethereum development tools work without modification.

## Run a node

Operate your own Arc node for independent transaction verification, direct RPC
access, or data indexing. Anyone can run a node without permission.

<CardGroup cols={2}>
  <Card title="Running a node" icon="circle-info" href="/arc/concepts/running-a-node">
    What a node does, how it fits into Arc's architecture, and why you might run
    one.
  </Card>

  <Card title="Node requirements" icon="list-check" href="/arc/references/node-requirements">
    Hardware, software, network endpoints, and ports needed to run a node.
  </Card>

  <Card title="Run an Arc node" icon="terminal" href="/arc/tutorials/run-an-arc-node">
    Step-by-step setup for both the execution and consensus layers.
  </Card>

  <Card title="Deploy as a service" icon="gear" href="/arc/tutorials/deploy-node-as-service">
    Configure `systemd` services that auto-restart and survive reboots.
  </Card>

  <Card title="Monitor a node" icon="chart-line" href="/arc/tutorials/monitor-a-node">
    Verify sync status, view logs, and scrape Prometheus metrics.
  </Card>
</CardGroup>
