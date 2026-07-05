> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Run an Arc node

> Set up and run an Arc node to independently verify the blockchain and serve a local RPC endpoint.

<Info>
  Arc is currently in its testnet phase. During this period, the network may
  experience instability or unplanned downtime. Throughout this page, all
  references to Arc refer specifically to the Arc Testnet.
</Info>

An Arc node syncs blocks from the network and serves a local JSON-RPC endpoint,
letting you independently verify every block and transaction. The node runs two
processes: the Execution Layer (EL) and the Consensus Layer (CL).

## Background

An Arc node runs two processes that communicate through local IPC sockets. The
Execution Layer executes transactions and maintains blockchain state. The
Consensus Layer fetches blocks from relay endpoints, verifies their
cryptographic signatures, and passes them to the Execution Layer for execution.
For a deeper explanation of how these components work together, see
[Running a Node](/arc/concepts/running-a-node).

## Prerequisites

Before you begin, confirm that you have:

* Reviewed the [Node Requirements](/arc/references/node-requirements) for
  hardware specs, software, and network endpoints
* Prepared a Linux machine that meets the minimum system requirements
* Installed [Foundry](https://book.getfoundry.sh/getting-started/installation)
  (provides the `cast` command used to verify your node is syncing)

## Step 1: Install the node binaries

Build `arc-node-execution`, `arc-node-consensus`, and `arc-snapshots` from
source.

### 1.1. Install Rust

Make sure you have [Rust](https://rust-lang.org/tools/install/) installed. If
not, install it with the following commands:

```shell theme={null}
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 1.2. Clone the repository

Clone the [`arc-node`](https://github.com/circlefin/arc-node) repository and
check out the version for your target network. See
[Node Requirements](/arc/references/node-requirements#versions) for the current
version.

```shell theme={null}
git clone https://github.com/circlefin/arc-node.git
cd arc-node
git checkout v0.6.0
git submodule update --init --recursive
```

### 1.3. Build and install

The following commands build three Arc node binaries: `arc-node-execution`,
`arc-node-consensus`, and `arc-snapshots`.

```shell theme={null}
cargo install --path crates/node
cargo install --path crates/malachite-app
cargo install --path crates/snapshots
```

`cargo install` places compiled binaries into `~/.cargo/bin`, which is added to
`PATH` by loading `~/.cargo/env`. Include the parameter `--root $BASE_DIR` to
install the compiled binaries into `$BASE_DIR/bin` instead (for instance,
`--root /usr/local`).

### 1.4. Verify the installation

```shell theme={null}
arc-snapshots --version
arc-node-execution --version
arc-node-consensus --version
```

Each command prints a version string. Example output:

```text theme={null}
arc-snapshots 0.6.0
arc-node-execution 0.6.0
arc-node-consensus 0.6.0
```

## Step 2: Create data directories

Create the directories where the EL and CL store their data, and set up the
runtime directory for IPC sockets:

```shell theme={null}
mkdir -p ~/.arc/execution ~/.arc/consensus
sudo install -d -o $USER /run/arc
```

<Note>
  When running as a systemd service, the `RuntimeDirectory=arc` directive creates
  `/run/arc` automatically. You can skip the second command in that case.
</Note>

## Step 3: Download blockchain snapshots

Download snapshots to start syncing from a recent block height rather than from
genesis. This significantly reduces initial sync time.

```shell theme={null}
arc-snapshots download --chain=arc-testnet
```

This command fetches the latest snapshot URLs from
`https://snapshots.arc.network`, downloads the snapshots, and extracts them into
`~/.arc/execution` and `~/.arc/consensus` respectively.

<Warning>
  Snapshots are large files (approximately 60 GB download, 120+ GB extracted).
  This process is CPU and disk-intensive. Before downloading, ensure you have:

  * At least 150 GB of free disk space
  * A stable network connection
  * Available CPU resources (the process uses 40-70% CPU during extraction)

  The download and extraction can take 1-2 hours. The terminal stops producing
  output during extraction. This is expected behavior.
</Warning>

## Step 4: Start the execution layer

Start the Execution Layer process. This creates the IPC sockets that the
Consensus Layer connects to.

```shell theme={null}
arc-node-execution node \
  --chain arc-testnet \
  --datadir ~/.arc/execution \
  --disable-discovery \
  --ipcpath /run/arc/reth.ipc \
  --auth-ipc \
  --auth-ipc.path /run/arc/auth.ipc \
  --http \
  --http.addr 127.0.0.1 \
  --http.port 8545 \
  --http.api eth,net,web3,txpool,trace,debug \
  --metrics 127.0.0.1:9001 \
  --enable-arc-rpc \
  --rpc.forwarder https://rpc.quicknode.testnet.arc.network/
```

The EL starts and begins waiting for blocks. Log output confirms the process is
running and shows that the IPC sockets exist at `/run/arc/reth.ipc` and
`/run/arc/auth.ipc`.

| Flag                       | Required       | Description                                                         |
| :------------------------- | :------------- | :------------------------------------------------------------------ |
| `--chain arc-testnet`      | Yes            | Selects the Arc Testnet genesis configuration bundled in the binary |
| `--datadir`                | Yes            | Path to the EL data directory                                       |
| `--disable-discovery`      | Yes            | Disables P2P peer discovery (Arc uses relay endpoints instead)      |
| `--ipcpath` / `--auth-ipc` | Yes (IPC mode) | Paths for the IPC sockets the CL connects to                        |
| `--http` / `--http.addr`   | Yes            | Enables the JSON-RPC endpoint on the specified address and port     |
| `--http.api`               | Recommended    | RPC namespaces to expose                                            |
| `--metrics`                | Recommended    | Enables Prometheus metrics on the specified address and port        |
| `--enable-arc-rpc`         | Yes            | Enables Arc-specific RPC methods                                    |
| `--rpc.forwarder`          | Recommended    | Routes submitted transactions to an RPC node for broadcast          |

<Note>
  `--chain arc-testnet` uses the genesis configuration bundled in the binary. If
  you have a custom genesis file, replace with `--chain /path/to/genesis.json`.

  See [reth node](https://reth.rs/cli/reth/node/) for additional flags.
</Note>

## Step 5: Initialize the consensus layer

Generate the private key file used for P2P network identity. This is a one-time
setup step:

```shell theme={null}
arc-node-consensus init --home ~/.arc/consensus
```

## Step 6: Start the consensus layer

Open a separate terminal and start the Consensus Layer. The CL connects to the
EL through the IPC sockets and begins fetching blocks from the network.

```shell theme={null}
arc-node-consensus start \
  --home ~/.arc/consensus \
  --eth-socket /run/arc/reth.ipc \
  --execution-socket /run/arc/auth.ipc \
  --rpc.addr 127.0.0.1:31000 \
  --follow \
  --follow.endpoint https://rpc.drpc.testnet.arc.network,wss=rpc.drpc.testnet.arc.network \
  --follow.endpoint https://rpc.quicknode.testnet.arc.network,wss=rpc.quicknode.testnet.arc.network \
  --follow.endpoint https://rpc.blockdaemon.testnet.arc.network,wss=rpc.blockdaemon.testnet.arc.network \
  --metrics 127.0.0.1:29000
```

| Flag                 | Required       | Description                                                                           |
| :------------------- | :------------- | :------------------------------------------------------------------------------------ |
| `--home`             | Yes            | Path to the CL data directory (contains keys and state)                               |
| `--eth-socket`       | Yes (IPC mode) | Path to the Execution Layer ETH RPC IPC socket                                        |
| `--execution-socket` | Yes (IPC mode) | Path to the Execution Layer Engine API IPC socket                                     |
| `--rpc.addr`         | Recommended    | CL RPC listen address and port                                                        |
| `--follow`           | Yes            | Enables block-following mode through relay endpoints                                  |
| `--follow.endpoint`  | Yes            | Relay endpoint URLs. Specify multiple for redundancy. Format: `https://host,wss=host` |
| `--metrics`          | Recommended    | Enables Prometheus metrics on the specified address and port                          |

<Note>
  Start the Execution Layer first. The Consensus Layer connects to it on startup
  and fails if the EL is not running.
</Note>

## Step 7: Verify the node is syncing

Check that your node is syncing blocks by querying the local RPC endpoint:

```shell theme={null}
cast block-number --rpc-url http://localhost:8545
```

Run this command several times over a few seconds. The block number increases
steadily, confirming your node is receiving and executing new blocks:

```text theme={null}
# First run:
1234567

# Second run (a few seconds later):
1234572
```

To inspect the latest block:

```shell theme={null}
cast block --rpc-url http://localhost:8545
```

Example output:

```text theme={null}
baseFeePerGas        7
difficulty           0
gasLimit             30000000
gasUsed              21000
hash                 0xabc123...
number               1234572
timestamp            1711234567
transactions:        [0xdef456...]
```

Once your node syncs steadily, you can
[deploy it as a systemd service](/arc/tutorials/deploy-node-as-service) for
production use or [add monitoring](/arc/tutorials/monitor-a-node) to observe
sync status and metrics. For more on how the EL and CL interact, see
[node architecture](/arc/concepts/running-a-node#node-architecture).

## Execution and consensus layer communication

The preceding steps use IPC sockets, which require the EL and CL to run on the
same host. If they are on separate hosts, use RPC instead.

### Generate a JWT secret (one-time setup)

The EL and CL use this secret to authenticate with each other:

```shell theme={null}
openssl rand -hex 32 | tr -d "\n" > ~/.arc/jwtsecret
chmod 600 ~/.arc/jwtsecret
```

### Execution layer flags for RPC mode

Remove the IPC flags (`--ipcpath`, `--auth-ipc`, `--auth-ipc.path`) and add:

```shell theme={null}
--authrpc.addr 0.0.0.0 \
--authrpc.port 8551 \
--authrpc.jwtsecret ~/.arc/jwtsecret
```

<Warning>
  When using `--authrpc.addr 0.0.0.0`, restrict access to the Engine API port
  (8551) using firewall rules or a private network. The Engine API controls block
  production and must not be exposed to the public internet.
</Warning>

### Consensus layer flags for RPC mode

Remove `--eth-socket` and `--execution-socket`, and add:

```shell theme={null}
--eth-rpc-endpoint http://<EL_HOST>:8545 \
--execution-endpoint http://<EL_HOST>:8551 \
--execution-jwt ~/.arc/jwtsecret
```

<Note>
  IPC and RPC are mutually exclusive. Use one or the other, not both.
</Note>

## Enabling backpressure

During startup or extended sync when the node is far behind, Execution Layer
memory usage surges on some hardware. Backpressure, a mechanism that throttles
execution to match the speed of disk writes, constrains this memory growth.

To enable backpressure, add the `reth` namespace to the Execution Layer HTTP API
flags:

```shell theme={null}
--http.api eth,net,web3,txpool,trace,debug,reth
```

Then add the following flags to the Consensus Layer:

```shell theme={null}
--execution-persistence-backpressure \
--execution-persistence-backpressure-threshold=10
```

<Note>
  Arc node is alpha software. The team is actively working on this performance
  issue.
</Note>
