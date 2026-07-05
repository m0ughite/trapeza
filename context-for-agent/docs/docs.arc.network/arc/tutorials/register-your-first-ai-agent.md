> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Register your first AI agent

> Register AI agents with onchain identity, build reputation, and verify credentials using ERC-8004 on Arc Testnet.

This quickstart guides you through registering an AI agent using the
[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) standard on Arc Testnet.
You'll create developer-controlled wallets, register your agent's identity,
record reputation events, and verify credentials. Select the tab that matches
your preferred setup.

## ERC-8004 contracts on Arc testnet

| Contract           | Address                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| IdentityRegistry   | [`0x8004A818BFB912233c491871b3d84c89A494BD9e`](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |
| ReputationRegistry | [`0x8004B663056A597Dffe9eCcC1965A193B7388713`](https://testnet.arcscan.app/address/0x8004B663056A597Dffe9eCcC1965A193B7388713) |
| ValidationRegistry | [`0x8004Cb1BF31DAf7788923b405b754f57acEB4272`](https://testnet.arcscan.app/address/0x8004Cb1BF31DAf7788923b405b754f57acEB4272) |

<Tabs>
  <Tab title="Circle Wallets">
    ## Prerequisites

    Before you begin, make sure you have:

    1. A [Circle Developer Console](https://console.circle.com) account
    2. An API key created in the Console: **Keys → Create a key → API key → Standard
       Key**
    3. Your
       [Entity Secret registered](https://developers.circle.com/wallets/dev-controlled/register-entity-secret)

    ## Step 1. Set up your project

    Create a project directory, install dependencies, and configure your
    environment.

    ### 1.1. Create the project and install dependencies

    <CodeGroup>
      ```shell Node.js theme={null}
      mkdir erc8004-quickstart
      cd erc8004-quickstart
      npm init -y
      npm pkg set type=module
      npm pkg set scripts.start="tsx --env-file=.env index.ts"

      npm install @circle-fin/developer-controlled-wallets viem
      npm install --save-dev tsx typescript @types/node
      ```

      ```shell Python theme={null}
      mkdir erc8004-quickstart
      cd erc8004-quickstart
      python3 -m venv .venv
      source .venv/bin/activate

      pip install circle-developer-controlled-wallets web3 python-dotenv
      ```
    </CodeGroup>

    ### 1.2. Configure TypeScript (optional)

    <Tip>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Tip>

    Create a `tsconfig.json` file:

    ```shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```shell theme={null}
    cat <<'EOF' > tsconfig.json
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "types": ["node"]
      }
    }
    EOF
    ```

    ### 1.3. Set environment variables

    Create a `.env` file in the project directory and add your Circle credentials:

    ```text theme={null}
    CIRCLE_API_KEY=YOUR_API_KEY
    CIRCLE_ENTITY_SECRET=YOUR_ENTITY_SECRET
    ```

    Where `YOUR_API_KEY` is your Circle Developer API key and `YOUR_ENTITY_SECRET`
    is your registered Entity Secret.

    The `npm run start` command loads these variables from `.env` using Node.js
    native env-file support.

    <Tip>
      Prefer editing `.env` files in your IDE or editor so credentials are not
      leaked to your shell history.
    </Tip>

    ## Step 2. Create developer-controlled wallets

    In this step, you create two Arc Testnet dev-controlled wallets for the ERC-8004
    flow. One wallet owns the agent and the other records reputation. If you already
    have two Arc Testnet dev-controlled wallets for this flow, skip to
    [Step 3](#step-3-prepare-agent-metadata). Per ERC-8004, agent owners cannot
    record reputation for their own agents to prevent self-dealing.

    The Step 2 through 7 code snippets explain the flow in smaller pieces. They are
    not cumulative and will not run if pasted together. To run the full workflow end
    to end, use the [complete script](#full-agent-registration-script) at the end of
    this tutorial.

    <CodeGroup>
      ```typescript index.ts theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

      const circleClient = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
      });

      const walletSet = await circleClient.createWalletSet({
        name: "ERC8004 Agent Wallets",
      });

      const walletsResponse = await circleClient.createWallets({
        blockchains: ["ARC-TESTNET"],
        count: 2,
        walletSetId: walletSet.data?.walletSet?.id ?? "",
        accountType: "SCA",
      });

      const ownerWallet = walletsResponse.data?.wallets?.[0]!;
      const validatorWallet = walletsResponse.data?.wallets?.[1]!;

      console.log(`Owner:     ${ownerWallet.address}`);
      console.log(`Validator: ${validatorWallet.address}`);
      ```

      ```python index.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      import os
      from dotenv import load_dotenv

      load_dotenv()

      circle_client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET"),
      )

      wallet_sets_api = developer_controlled_wallets.WalletSetsApi(circle_client)
      wallets_api = developer_controlled_wallets.WalletsApi(circle_client)

      wallet_set = wallet_sets_api.create_wallet_set(
          developer_controlled_wallets.CreateWalletSetRequest.from_dict({
              "name": "ERC8004 Agent Wallets",
          })
      )
      wallet_set_id = wallet_set.data.wallet_set.actual_instance.id

      wallets_response = wallets_api.create_wallet(
          developer_controlled_wallets.CreateWalletRequest.from_dict({
              "blockchains": ["ARC-TESTNET"],
              "count": 2,
              "walletSetId": wallet_set_id,
              "accountType": "SCA",
          })
      )

      owner_wallet = wallets_response.data.wallets[0].actual_instance
      validator_wallet = wallets_response.data.wallets[1].actual_instance

      print(f"Owner:     {owner_wallet.address}")
      print(f"Validator: {validator_wallet.address}")
      ```
    </CodeGroup>

    ## Step 3. Prepare agent metadata

    Create a JSON file with metadata for your agent. The structure below is an
    example you can adapt for your use case. ERC-8004 registration stores a metadata
    URI, but the JSON fields at that URI are application-defined unless your
    integration follows a separate metadata convention.

    ```json agent-metadata.json theme={null}
    {
      "name": "DeFi Arbitrage Agent v1.0",
      "description": "Autonomous trading agent for cross-DEX arbitrage on Arc",
      "image": "ipfs://QmAgentAvatarHash...",
      "agent_type": "trading",
      "capabilities": [
        "arbitrage_detection",
        "liquidity_monitoring",
        "automated_execution"
      ],
      "version": "1.0.0"
    }
    ```

    Upload to IPFS using [Pinata](https://pinata.cloud),
    [NFT.Storage](https://nft.storage), [Web3.Storage](https://web3.storage) or your
    preferred IPFS tool. You'll receive an IPFS URI like `ipfs://QmYourHash...`.

    <Note>
      For this quickstart, you can skip uploading and use the example URI:
      `ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei`
    </Note>

    ## Step 4. Register your agent identity

    Call `register(metadataURI)` on the IdentityRegistry to mint an identity NFT for
    your agent.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

      const METADATA_URI =
        process.env.METADATA_URI ||
        "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

      const registerTx = await circleClient.createContractExecutionTransaction({
        walletAddress: ownerWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: IDENTITY_REGISTRY,
        abiFunctionSignature: "register(string)",
        abiParameters: [METADATA_URI],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      // Poll until confirmed
      let txHash: string | undefined;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const { data } = await circleClient.getTransaction({
          id: registerTx.data?.id!,
        });
        if (data?.transaction?.state === "COMPLETE") {
          txHash = data.transaction.txHash;
          break;
        }
        if (data?.transaction?.state === "FAILED")
          throw new Error("Registration failed");
      }

      console.log(`Registered: https://testnet.arcscan.app/tx/${txHash}`);
      ```

      ```python index.py theme={null}
      import time

      IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"

      METADATA_URI = os.getenv("METADATA_URI") or \
          "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"

      transactions_api = developer_controlled_wallets.TransactionsApi(circle_client)

      request = developer_controlled_wallets \
          .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
              "walletAddress": owner_wallet.address,
              "blockchain": "ARC-TESTNET",
              "contractAddress": IDENTITY_REGISTRY,
              "abiFunctionSignature": "register(string)",
              "abiParameters": [METADATA_URI],
              "feeLevel": "MEDIUM",
          })

      response = transactions_api.create_developer_transaction_contract_execution(request)

      # Poll until confirmed
      tx_hash = None
      for _ in range(30):
          time.sleep(2)
          tx = transactions_api.get_transaction(id=response.data.id)
          if tx.data.transaction.state == "COMPLETE":
              tx_hash = tx.data.transaction.tx_hash
              break
          if tx.data.transaction.state == "FAILED":
              raise Exception("Registration failed")

      print(f"Registered: https://testnet.arcscan.app/tx/{tx_hash}")
      ```
    </CodeGroup>

    <Note>
      With Circle Gas Station, your application sponsors the transaction fees. On
      Arc, gas is approximately 0.006 USDC-TESTNET per transaction.
    </Note>

    ## Step 5. Retrieve your agent ID

    Query the `Transfer` event from the IdentityRegistry to find the token ID minted
    for your agent.

    <CodeGroup>
      ```typescript index.ts theme={null}
      import { createPublicClient, http, parseAbiItem, getContract } from "viem";
      import { arcTestnet } from "viem/chains";

      const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(),
      });

      const latestBlock = await publicClient.getBlockNumber();
      const blockRange = 10000n; // RPC limit: eth_getLogs is often capped at 10,000 blocks
      const fromBlock = latestBlock > blockRange ? latestBlock - blockRange : 0n;

      const transferLogs = await publicClient.getLogs({
        address: IDENTITY_REGISTRY,
        event: parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        ),
        args: { to: ownerWallet.address as `0x${string}` },
        fromBlock,
        toBlock: latestBlock,
      });

      if (transferLogs.length === 0) {
        throw new Error("No Transfer events found — registration may have failed");
      }

      const agentId = transferLogs[transferLogs.length - 1].args.tokenId!.toString();

      const identityContract = getContract({
        address: IDENTITY_REGISTRY,
        abi: [
          {
            name: "ownerOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "tokenId", type: "uint256" }],
            outputs: [{ name: "", type: "address" }],
          },
          {
            name: "tokenURI",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "tokenId", type: "uint256" }],
            outputs: [{ name: "", type: "string" }],
          },
        ],
        client: publicClient,
      });

      const owner = await identityContract.read.ownerOf([BigInt(agentId)]);
      const tokenURI = await identityContract.read.tokenURI([BigInt(agentId)]);

      console.log(`Agent ID: ${agentId}`);
      console.log(`Owner: ${owner}`);
      console.log(`Metadata: ${tokenURI}`);
      ```

      ```python index.py theme={null}
      from web3 import Web3

      RPC_URL = "https://rpc.testnet.arc.network/"
      w3 = Web3(Web3.HTTPProvider(RPC_URL))

      identity_abi = [
          {
              "anonymous": False,
              "inputs": [
                  {"indexed": True, "name": "from", "type": "address"},
                  {"indexed": True, "name": "to", "type": "address"},
                  {"indexed": True, "name": "tokenId", "type": "uint256"},
              ],
              "name": "Transfer",
              "type": "event",
          },
          {
              "inputs": [{"name": "tokenId", "type": "uint256"}],
              "name": "ownerOf",
              "outputs": [{"name": "", "type": "address"}],
              "stateMutability": "view",
              "type": "function",
          },
          {
              "inputs": [{"name": "tokenId", "type": "uint256"}],
              "name": "tokenURI",
              "outputs": [{"name": "", "type": "string"}],
              "stateMutability": "view",
              "type": "function",
          },
      ]

      identity_contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=identity_abi)

      latest_block = w3.eth.block_number
      from_block = max(0, latest_block - 10000)
      events = identity_contract.events.Transfer.create_filter(
          from_block=from_block,
          to_block=latest_block,
          argument_filters={"to": owner_wallet.address},
      ).get_all_entries()

      agent_id = events[-1]["args"]["tokenId"]
      on_chain_owner = identity_contract.functions.ownerOf(agent_id).call()
      token_uri = identity_contract.functions.tokenURI(agent_id).call()

      print(f"Agent ID: {agent_id}")
      print(f"Owner: {on_chain_owner}")
      print(f"Metadata: {token_uri}")
      ```
    </CodeGroup>

    Your AI agent now has a unique onchain identity.

    ## Step 6. Record reputation

    Build your agent's reputation by recording feedback. Use the **validator
    wallet** — per ERC-8004, agent owners cannot record reputation for their own
    agents.

    <CodeGroup>
      ```typescript index.ts theme={null}
      import { keccak256, toHex } from "viem";

      const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

      const tag = "successful_trade";
      const feedbackHash = keccak256(toHex(tag));

      const reputationTx = await circleClient.createContractExecutionTransaction({
        walletAddress: validatorWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: REPUTATION_REGISTRY,
        abiFunctionSignature:
          "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
        abiParameters: [agentId, "95", "0", tag, "", "", "", feedbackHash],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      // Poll until confirmed (same pattern as Step 4)
      ```

      ```python index.py theme={null}
      REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713"

      tag = "successful_trade"
      feedback_hash = "0x" + w3.keccak(text=tag).hex()

      request = developer_controlled_wallets \
          .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
              "walletAddress": validator_wallet.address,
              "blockchain": "ARC-TESTNET",
              "contractAddress": REPUTATION_REGISTRY,
              "abiFunctionSignature":
                  "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
              "abiParameters": [
                  str(agent_id), "95", "0", tag, "", "", "", feedback_hash
              ],
              "feeLevel": "MEDIUM",
          })

      response = transactions_api.create_developer_transaction_contract_execution(request)

      # Poll until confirmed (same pattern as Step 4)
      ```
    </CodeGroup>

    <Note>
      **Production scoring**: This quickstart hardcodes `score: 95` for demonstration. In production, calculate scores dynamically based on agent behavior. For example, `score = loanRepaidOnTime ? 100 : 20` for lending protocols, or `score = slippagePct < 1 ? 95 : 60` for trading platforms.

      The ReputationRegistry stores attestations from external observers who witnessed
      the agent's actions. Your application logic calculates scores based on outcomes,
      then records them onchain.
    </Note>

    ## Step 7. Request and verify validation

    The ERC-8004 ValidationRegistry uses a two-step request/response flow. The
    **agent owner** requests validation from a validator, then the **validator**
    submits a response.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

      const requestURI = "ipfs://bafkreiexamplevalidationrequest";
      const requestHash = keccak256(
        toHex(`kyc_verification_request_agent_${agentId}`),
      );

      // Owner requests validation
      const validationReqTx = await circleClient.createContractExecutionTransaction({
        walletAddress: ownerWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: VALIDATION_REGISTRY,
        abiFunctionSignature: "validationRequest(address,uint256,string,bytes32)",
        abiParameters: [validatorWallet.address!, agentId, requestURI, requestHash],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      // Poll until confirmed (same pattern as Step 4)

      // Validator responds (100 = passed, 0 = failed)
      const validationResTx = await circleClient.createContractExecutionTransaction({
        walletAddress: validatorWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: VALIDATION_REGISTRY,
        abiFunctionSignature:
          "validationResponse(bytes32,uint8,string,bytes32,string)",
        abiParameters: [
          requestHash,
          "100",
          "",
          "0x" + "0".repeat(64),
          "kyc_verified",
        ],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      // Poll until confirmed, then verify:
      const validationContract = getContract({
        address: VALIDATION_REGISTRY,
        abi: [
          {
            name: "getValidationStatus",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "requestHash", type: "bytes32" }],
            outputs: [
              { name: "validatorAddress", type: "address" },
              { name: "agentId", type: "uint256" },
              { name: "response", type: "uint8" },
              { name: "responseHash", type: "bytes32" },
              { name: "tag", type: "string" },
              { name: "lastUpdate", type: "uint256" },
            ],
          },
        ],
        client: publicClient,
      });

      type ValidationStatus = readonly [
        `0x${string}`,
        bigint,
        number,
        `0x${string}`,
        string,
        bigint,
      ];

      const [valAddr, , response, , tag] =
        (await validationContract.read.getValidationStatus([
          requestHash,
        ])) as ValidationStatus;

      console.log(`Validator: ${valAddr}`);
      console.log(`Response: ${response} (100 = passed)`);
      console.log(`Tag: ${tag}`);
      ```

      ```python index.py theme={null}
      VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272"

      request_uri = "ipfs://bafkreiexamplevalidationrequest"
      request_hash = "0x" + w3.keccak(text=f"kyc_verification_request_agent_{agent_id}").hex()

      # Owner requests validation
      request = developer_controlled_wallets \
          .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
              "walletAddress": owner_wallet.address,
              "blockchain": "ARC-TESTNET",
              "contractAddress": VALIDATION_REGISTRY,
              "abiFunctionSignature": "validationRequest(address,uint256,string,bytes32)",
              "abiParameters": [validator_wallet.address, str(agent_id), request_uri, request_hash],
              "feeLevel": "MEDIUM",
          })

      response = transactions_api.create_developer_transaction_contract_execution(request)

      # Poll until confirmed (same pattern as Step 4)

      # Validator responds (100 = passed, 0 = failed)
      request = developer_controlled_wallets \
          .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
              "walletAddress": validator_wallet.address,
              "blockchain": "ARC-TESTNET",
              "contractAddress": VALIDATION_REGISTRY,
              "abiFunctionSignature": "validationResponse(bytes32,uint8,string,bytes32,string)",
              "abiParameters": [request_hash, "100", "", "0x" + "0" * 64, "kyc_verified"],
              "feeLevel": "MEDIUM",
          })

      response = transactions_api.create_developer_transaction_contract_execution(request)

      # Poll until confirmed, then verify:
      validation_abi = [{
          "inputs": [{"name": "requestHash", "type": "bytes32"}],
          "name": "getValidationStatus",
          "outputs": [
              {"name": "validatorAddress", "type": "address"},
              {"name": "agentId", "type": "uint256"},
              {"name": "response", "type": "uint8"},
              {"name": "responseHash", "type": "bytes32"},
              {"name": "tag", "type": "string"},
              {"name": "lastUpdate", "type": "uint256"},
          ],
          "stateMutability": "view",
          "type": "function",
      }]

      validation_contract = w3.eth.contract(address=VALIDATION_REGISTRY, abi=validation_abi)

      val_addr, _, val_response, _, val_tag, _ = \
          validation_contract.functions.getValidationStatus(
              bytes.fromhex(request_hash[2:])
          ).call()

      print(f"Validator: {val_addr}")
      print(f"Response: {val_response} (100 = passed)")
      print(f"Tag: {val_tag}")
      ```
    </CodeGroup>

    ## Full agent registration script

    The complete script below combines all the preceding steps into a single
    runnable file.

    <CodeGroup>
      ```typescript index.ts expandable theme={null}
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
      import {
        createPublicClient,
        http,
        parseAbiItem,
        getContract,
        keccak256,
        toHex,
      } from "viem";
      import { arcTestnet } from "viem/chains";

      const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
      const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
      const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

      const METADATA_URI =
        process.env.METADATA_URI ||
        "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

      const circleClient = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
      });

      const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(),
      });

      // Helper functions
      async function waitForTransaction(txId: string, label: string) {
        process.stdout.write(`  Waiting for ${label}`);
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data } = await circleClient.getTransaction({ id: txId });
          if (data?.transaction?.state === "COMPLETE") {
            const txHash = data.transaction.txHash;
            console.log(` ✓\n  Tx: https://testnet.arcscan.app/tx/${txHash}`);
            return txHash;
          }
          if (data?.transaction?.state === "FAILED") {
            throw new Error(`${label} failed onchain`);
          }
          process.stdout.write(".");
        }
        throw new Error(`${label} timed out`);
      }

      // Main invocation
      async function main() {
        console.log("\n── Step 1: Create wallets ──");

        const walletSet = await circleClient.createWalletSet({
          name: "ERC8004 Agent Wallets",
        });

        const walletsResponse = await circleClient.createWallets({
          blockchains: ["ARC-TESTNET"],
          count: 2,
          walletSetId: walletSet.data?.walletSet?.id ?? "",
          accountType: "SCA",
        });

        const ownerWallet = walletsResponse.data?.wallets?.[0]!;
        const validatorWallet = walletsResponse.data?.wallets?.[1]!;

        console.log(`  Owner:     ${ownerWallet.address} (${ownerWallet.id})`);
        console.log(
          `  Validator: ${validatorWallet.address} (${validatorWallet.id})`,
        );

        console.log("\n── Step 2: Register agent identity ──");
        console.log(`  Metadata URI: ${METADATA_URI}`);

        const registerTx = await circleClient.createContractExecutionTransaction({
          walletAddress: ownerWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: IDENTITY_REGISTRY,
          abiFunctionSignature: "register(string)",
          abiParameters: [METADATA_URI],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });

        await waitForTransaction(registerTx.data?.id!, "registration");

        console.log("\n── Step 3: Retrieve agent ID ──");

        const latestBlock = await publicClient.getBlockNumber();
        const blockRange = 10000n; // RPC limit: eth_getLogs is often capped at 10,000 blocks
        const fromBlock = latestBlock > blockRange ? latestBlock - blockRange : 0n;

        const transferLogs = await publicClient.getLogs({
          address: IDENTITY_REGISTRY,
          event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
          ),
          args: { to: ownerWallet.address as `0x${string}` },
          fromBlock,
          toBlock: latestBlock,
        });

        if (transferLogs.length === 0) {
          throw new Error("No Transfer events found — registration may have failed");
        }

        const agentId =
          transferLogs[transferLogs.length - 1].args.tokenId!.toString();

        const identityContract = getContract({
          address: IDENTITY_REGISTRY,
          abi: [
            {
              name: "ownerOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ name: "", type: "address" }],
            },
            {
              name: "tokenURI",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ name: "", type: "string" }],
            },
          ],
          client: publicClient,
        });

        const owner = await identityContract.read.ownerOf([BigInt(agentId)]);
        const tokenURI = await identityContract.read.tokenURI([BigInt(agentId)]);

        console.log(`  Agent ID:     ${agentId}`);
        console.log(`  Owner:        ${owner}`);
        console.log(`  Metadata URI: ${tokenURI}`);

        console.log("\n── Step 4: Record reputation ──");

        const tag = "successful_trade";
        const feedbackHash = keccak256(toHex(tag));

        const reputationTx = await circleClient.createContractExecutionTransaction({
          walletAddress: validatorWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: REPUTATION_REGISTRY,
          abiFunctionSignature:
            "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
          abiParameters: [agentId, "95", "0", tag, "", "", "", feedbackHash],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });

        await waitForTransaction(reputationTx.data?.id!, "reputation");

        console.log("\n── Step 5: Verify reputation ──");

        const reputationLogs = await publicClient.getLogs({
          address: REPUTATION_REGISTRY,
          fromBlock: latestBlock - 1000n,
          toBlock: "latest",
        });

        console.log(`  Found ${reputationLogs.length} feedback event(s)`);

        // Owner requests; validator responds per ERC-8004
        console.log("\n── Step 6: Request validation ──");

        const requestURI = "ipfs://bafkreiexamplevalidationrequest";
        const requestHash = keccak256(
          toHex(`kyc_verification_request_agent_${agentId}`),
        );

        const validationReqTx = await circleClient.createContractExecutionTransaction(
          {
            walletAddress: ownerWallet.address!,
            blockchain: "ARC-TESTNET",
            contractAddress: VALIDATION_REGISTRY,
            abiFunctionSignature: "validationRequest(address,uint256,string,bytes32)",
            abiParameters: [
              validatorWallet.address!,
              agentId,
              requestURI,
              requestHash,
            ],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          },
        );

        await waitForTransaction(validationReqTx.data?.id!, "validation request");

        // Validator responds; 100 = passed, 0 = failed
        console.log("\n── Step 7: Validation response ──");

        const validationResTx = await circleClient.createContractExecutionTransaction(
          {
            walletAddress: validatorWallet.address!,
            blockchain: "ARC-TESTNET",
            contractAddress: VALIDATION_REGISTRY,
            abiFunctionSignature:
              "validationResponse(bytes32,uint8,string,bytes32,string)",
            abiParameters: [
              requestHash,
              "100",
              "",
              "0x" + "0".repeat(64),
              "kyc_verified",
            ],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          },
        );

        await waitForTransaction(validationResTx.data?.id!, "validation response");

        console.log("\n── Step 8: Check validation ──");

        const validationContract = getContract({
          address: VALIDATION_REGISTRY,
          abi: [
            {
              name: "getValidationStatus",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "requestHash", type: "bytes32" }],
              outputs: [
                { name: "validatorAddress", type: "address" },
                { name: "agentId", type: "uint256" },
                { name: "response", type: "uint8" },
                { name: "responseHash", type: "bytes32" },
                { name: "tag", type: "string" },
                { name: "lastUpdate", type: "uint256" },
              ],
            },
          ],
          client: publicClient,
        });

        type ValidationStatus = readonly [
          `0x${string}`,
          bigint,
          number,
          `0x${string}`,
          string,
          bigint,
        ];

        const [valAddr, , valResponse, , valTag] =
          (await validationContract.read.getValidationStatus([
            requestHash,
          ])) as ValidationStatus;

        console.log(`  Validator:  ${valAddr}`);
        console.log(`  Response:   ${valResponse} (100 = passed)`);
        console.log(`  Tag:        ${valTag}`);

        console.log("\n── Complete ──");
        console.log("  ✓ Identity registered");
        console.log("  ✓ Reputation recorded");
        console.log("  ✓ Validation requested and verified");
        console.log(
          `\n  Explorer: https://testnet.arcscan.app/address/${ownerWallet.address}\n`,
        );
      }

      main().catch((error) => {
        console.error("\nError:", error.message ?? error);
        process.exit(1);
      });
      ```

      ```python index.py theme={null}
      from circle.web3 import utils, developer_controlled_wallets
      from web3 import Web3
      import os
      import time
      from dotenv import load_dotenv

      load_dotenv()

      IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
      REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713"
      VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272"
      RPC_URL = "https://rpc.testnet.arc.network/"

      METADATA_URI = os.getenv("METADATA_URI") or \
          "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei"

      circle_client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET"),
      )

      wallet_sets_api = developer_controlled_wallets.WalletSetsApi(circle_client)
      wallets_api = developer_controlled_wallets.WalletsApi(circle_client)
      transactions_api = developer_controlled_wallets.TransactionsApi(circle_client)

      w3 = Web3(Web3.HTTPProvider(RPC_URL))


      def wait_for_transaction(tx_id: str, label: str) -> str:
          print(f"  Waiting for {label}", end="", flush=True)
          for _ in range(30):
              time.sleep(2)
              tx = transactions_api.get_transaction(id=tx_id)
              state = tx.data.transaction.state
              if state == "COMPLETE":
                  tx_hash = tx.data.transaction.tx_hash
                  print(f" ✓\n  Tx: https://testnet.arcscan.app/tx/{tx_hash}")
                  return tx_hash
              if state == "FAILED":
                  raise Exception(f"{label} failed onchain")
              print(".", end="", flush=True)
          raise Exception(f"{label} timed out")


      def send_contract_tx(wallet_address, address, sig, params, label):
          request = developer_controlled_wallets \
              .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
                  "walletAddress": wallet_address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": address,
                  "abiFunctionSignature": sig,
                  "abiParameters": params,
                  "feeLevel": "MEDIUM",
              })
          response = transactions_api.create_developer_transaction_contract_execution(request)
          return wait_for_transaction(response.data.id, label)


      def main():
          # Step 1: Create wallets
          print("\n── Step 1: Create wallets ──")

          wallet_set = wallet_sets_api.create_wallet_set(
              developer_controlled_wallets.CreateWalletSetRequest.from_dict({
                  "name": "ERC8004 Agent Wallets",
              })
          )
          wallet_set_id = wallet_set.data.wallet_set.actual_instance.id

          wallets_response = wallets_api.create_wallet(
              developer_controlled_wallets.CreateWalletRequest.from_dict({
                  "blockchains": ["ARC-TESTNET"],
                  "count": 2,
                  "walletSetId": wallet_set_id,
                  "accountType": "SCA",
              })
          )

          owner_wallet = wallets_response.data.wallets[0].actual_instance
          validator_wallet = wallets_response.data.wallets[1].actual_instance

          print(f"  Owner:     {owner_wallet.address} ({owner_wallet.id})")
          print(f"  Validator: {validator_wallet.address} ({validator_wallet.id})")

          # Step 2: Register agent identity
          print("\n── Step 2: Register agent identity ──")
          print(f"  Metadata URI: {METADATA_URI}")

          send_contract_tx(
              owner_wallet.address, IDENTITY_REGISTRY,
              "register(string)", [METADATA_URI], "registration",
          )

          # Step 3: Retrieve agent ID
          print("\n── Step 3: Retrieve agent ID ──")

          identity_abi = [
              {
                  "anonymous": False,
                  "inputs": [
                      {"indexed": True, "name": "from", "type": "address"},
                      {"indexed": True, "name": "to", "type": "address"},
                      {"indexed": True, "name": "tokenId", "type": "uint256"},
                  ],
                  "name": "Transfer",
                  "type": "event",
              },
              {
                  "inputs": [{"name": "tokenId", "type": "uint256"}],
                  "name": "ownerOf",
                  "outputs": [{"name": "", "type": "address"}],
                  "stateMutability": "view",
                  "type": "function",
              },
              {
                  "inputs": [{"name": "tokenId", "type": "uint256"}],
                  "name": "tokenURI",
                  "outputs": [{"name": "", "type": "string"}],
                  "stateMutability": "view",
                  "type": "function",
              },
          ]

          identity_contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=identity_abi)

          latest_block = w3.eth.block_number
          from_block = max(0, latest_block - 10000)
          events = identity_contract.events.Transfer.create_filter(
              from_block=from_block,
              to_block=latest_block,
              argument_filters={"to": owner_wallet.address},
          ).get_all_entries()

          if not events:
              raise Exception("No Transfer events found — registration may have failed")

          agent_id = events[-1]["args"]["tokenId"]
          on_chain_owner = identity_contract.functions.ownerOf(agent_id).call()
          token_uri = identity_contract.functions.tokenURI(agent_id).call()

          print(f"  Agent ID:     {agent_id}")
          print(f"  Owner:        {on_chain_owner}")
          print(f"  Metadata URI: {token_uri}")

          # Step 4: Record reputation
          print("\n── Step 4: Record reputation ──")

          tag = "successful_trade"
          feedback_hash = "0x" + w3.keccak(text=tag).hex()

          send_contract_tx(
              validator_wallet.address, REPUTATION_REGISTRY,
              "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
              [str(agent_id), "95", "0", tag, "", "", "", feedback_hash],
              "reputation",
          )

          # Step 5: Verify reputation
          print("\n── Step 5: Verify reputation ──")

          reputation_logs = w3.eth.get_logs({
              "address": REPUTATION_REGISTRY,
              "fromBlock": max(0, latest_block - 1000),
              "toBlock": "latest",
          })

          print(f"  Found {len(reputation_logs)} feedback event(s)")

          # Step 6: Request validation (owner requests; validator responds per ERC-8004)
          print("\n── Step 6: Request validation ──")

          request_uri = "ipfs://bafkreiexamplevalidationrequest"
          request_hash = "0x" + w3.keccak(text=f"kyc_verification_request_agent_{agent_id}").hex()

          send_contract_tx(
              owner_wallet.address, VALIDATION_REGISTRY,
              "validationRequest(address,uint256,string,bytes32)",
              [validator_wallet.address, str(agent_id), request_uri, request_hash],
              "validation request",
          )

          # Step 7: Validation response (validator responds; 100 = passed, 0 = failed)
          print("\n── Step 7: Validation response ──")

          send_contract_tx(
              validator_wallet.address, VALIDATION_REGISTRY,
              "validationResponse(bytes32,uint8,string,bytes32,string)",
              [request_hash, "100", "", "0x" + "0" * 64, "kyc_verified"],
              "validation response",
          )

          # Step 8: Check validation status
          print("\n── Step 8: Check validation ──")

          validation_abi = [{
              "inputs": [{"name": "requestHash", "type": "bytes32"}],
              "name": "getValidationStatus",
              "outputs": [
                  {"name": "validatorAddress", "type": "address"},
                  {"name": "agentId", "type": "uint256"},
                  {"name": "response", "type": "uint8"},
                  {"name": "responseHash", "type": "bytes32"},
                  {"name": "tag", "type": "string"},
                  {"name": "lastUpdate", "type": "uint256"},
              ],
              "stateMutability": "view",
              "type": "function",
          }]

          validation_contract = w3.eth.contract(
              address=VALIDATION_REGISTRY, abi=validation_abi
          )

          val_addr, _, val_response, _, val_tag, _ = \
              validation_contract.functions.getValidationStatus(
                  bytes.fromhex(request_hash[2:])
              ).call()

          print(f"  Validator:  {val_addr}")
          print(f"  Response:   {val_response} (100 = passed)")
          print(f"  Tag:        {val_tag}")

          print("\n── Complete ──")
          print("  ✓ Identity registered")
          print("  ✓ Reputation recorded")
          print("  ✓ Validation requested and verified")
          print(f"\n  Explorer: https://testnet.arcscan.app/address/{owner_wallet.address}\n")


      if __name__ == "__main__":
          try:
              main()
          except Exception as error:
              print(f"\nError: {error}")
              exit(1)
      ```
    </CodeGroup>

    Save it, then run:

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run start
      ```

      ```shell Python theme={null}
      python index.py
      ```
    </CodeGroup>

    <Note>
      If you followed the Python workflow, run `deactivate` when you're done to exit
      the virtual environment.
    </Note>
  </Tab>

  <Tab title="Viem">
    ## Prerequisites

    Before you begin, make sure you have:

    1. Installed [Node.js v22+](https://nodejs.org/)
    2. Two self-managed EVM wallets for Arc Testnet
       * Testnet USDC in both wallets to pay for gas

    ## Step 1. Set up your project

    Create a project directory, install dependencies, and configure your
    environment.

    ### 1.1. Create the project and install dependencies

    ```shell theme={null}
    mkdir erc8004-quickstart
    cd erc8004-quickstart
    npm init -y
    npm pkg set type=module
    npm pkg set scripts.start="tsx --env-file=.env index.ts"

    npm install viem
    npm install --save-dev tsx typescript @types/node
    ```

    ### 1.2. Configure TypeScript (optional)

    <Tip>
      This step is optional. It helps prevent missing types in your IDE or editor.
    </Tip>

    Create a `tsconfig.json` file:

    ```shell theme={null}
    npx tsc --init
    ```

    Then, update the `tsconfig.json` file:

    ```shell theme={null}
    cat <<'EOF' > tsconfig.json
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "types": ["node"]
      }
    }
    EOF
    ```

    ### 1.3. Set environment variables

    Create a `.env` file in the project directory:

    ```text .env theme={null}
    OWNER_PRIVATE_KEY=0xYOUR_OWNER_PRIVATE_KEY
    VALIDATOR_PRIVATE_KEY=0xYOUR_VALIDATOR_PRIVATE_KEY
    ```

    * `OWNER_PRIVATE_KEY` is the `0x`-prefixed private key for the Arc Testnet
      wallet that owns the agent and requests validation.
    * `VALIDATOR_PRIVATE_KEY` is the `0x`-prefixed private key for the Arc Testnet
      wallet that records reputation and submits the validation response.

    The `npm run start` command loads variables from `.env` using Node.js native
    env-file support.

    <Tip>
      Prefer editing `.env` files in your IDE or editor so credentials are not
      leaked to your shell history.
    </Tip>

    ## Step 2. Prepare your wallets

    In this step, you prepare two self-managed Arc Testnet wallets for the ERC-8004
    flow. One wallet owns the agent and the other records reputation. If you already
    have two funded Arc Testnet wallets for this flow, skip to
    [Step 3](#step-3-prepare-agent-metadata-2). Per ERC-8004, agent owners cannot
    record reputation for their own agents to prevent self-dealing.

    The Step 2 through 7 code snippets explain the flow in smaller pieces. They are
    not cumulative and will not run if pasted together. To run the full workflow end
    to end, use the [complete script](#full-agent-registration-script-2) at the end
    of this tutorial.

    ### 2.1. Create or fund your wallets

    Create two self-managed EVM wallets if you do not already have them. For
    example, you can generate throwaway wallets with Foundry:

    ```shell theme={null}
    cast wallet new --json
    ```

    Run it twice, once for the owner wallet and once for the validator wallet, then
    fund both wallets with Arc Testnet USDC so they can submit transactions.

    ### 2.2. Confirm wallet roles

    * the owner wallet registers the agent identity and requests validation
    * the validator wallet records reputation and submits the validation response

    ## Step 3. Prepare agent metadata

    Create a JSON file with metadata for your agent. The structure below is an
    example you can adapt for your use case. ERC-8004 registration stores a metadata
    URI, but the JSON fields at that URI are application-defined unless your
    integration follows a separate metadata convention.

    ```json agent-metadata.json theme={null}
    {
      "name": "DeFi Arbitrage Agent v1.0",
      "description": "Autonomous trading agent for cross-DEX arbitrage on Arc",
      "image": "ipfs://QmAgentAvatarHash...",
      "agent_type": "trading",
      "capabilities": [
        "arbitrage_detection",
        "liquidity_monitoring",
        "automated_execution"
      ],
      "version": "1.0.0"
    }
    ```

    Upload to IPFS using [Pinata](https://pinata.cloud),
    [NFT.Storage](https://nft.storage), [Web3.Storage](https://web3.storage) or your
    preferred IPFS tool. You'll receive an IPFS URI like `ipfs://QmYourHash...`.

    <Note>
      For this quickstart, you can skip uploading and use the example URI:
      `ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei`
    </Note>

    ## Step 4. Register your agent identity

    Call `register(metadataURI)` on the IdentityRegistry to mint an identity NFT for
    your agent.

    ```typescript index.ts theme={null}
    import {
      createPublicClient,
      createWalletClient,
      http,
      getContract,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { arcTestnet } from "viem/chains";

    const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
    const METADATA_URI =
      process.env.METADATA_URI ||
      "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

    const ownerAccount = privateKeyToAccount(
      process.env.OWNER_PRIVATE_KEY as `0x${string}`,
    );

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const ownerWalletClient = createWalletClient({
      account: ownerAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const identityContract = getContract({
      address: IDENTITY_REGISTRY,
      abi: [
        {
          name: "register",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "metadataURI", type: "string" }],
          outputs: [],
        },
      ],
      client: { public: publicClient, wallet: ownerWalletClient },
    });

    const registerTx = await identityContract.write.register([METADATA_URI], {
      account: ownerAccount,
    });

    await publicClient.waitForTransactionReceipt({ hash: registerTx });
    console.log(`Registered: https://testnet.arcscan.app/tx/${registerTx}`);
    ```

    ## Step 5. Retrieve your agent ID

    Query the `Transfer` event from the IdentityRegistry to find the token ID minted
    for your agent.

    ```typescript index.ts theme={null}
    import { parseAbiItem } from "viem";

    const latestBlock = await publicClient.getBlockNumber();
    const blockRange = 10000n;
    const fromBlock = latestBlock > blockRange ? latestBlock - blockRange : 0n;

    const transferLogs = await publicClient.getLogs({
      address: IDENTITY_REGISTRY,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ),
      args: { to: ownerAccount.address },
      fromBlock,
      toBlock: latestBlock,
    });

    if (transferLogs.length === 0) {
      throw new Error("No Transfer events found — registration may have failed");
    }

    const agentId = transferLogs[transferLogs.length - 1].args.tokenId!;

    const identityReadContract = getContract({
      address: IDENTITY_REGISTRY,
      abi: [
        {
          name: "ownerOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "tokenId", type: "uint256" }],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "tokenURI",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "tokenId", type: "uint256" }],
          outputs: [{ name: "", type: "string" }],
        },
      ],
      client: publicClient,
    });

    const owner = await identityReadContract.read.ownerOf([agentId]);
    const tokenURI = await identityReadContract.read.tokenURI([agentId]);

    console.log(`Agent ID: ${agentId}`);
    console.log(`Owner: ${owner}`);
    console.log(`Metadata URI: ${tokenURI}`);
    ```

    Your AI agent now has a unique onchain identity.

    ## Step 6. Record reputation

    Build your agent's reputation by recording feedback. Use the **validator
    wallet** — per ERC-8004, agent owners cannot record reputation for their own
    agents.

    ```typescript index.ts theme={null}
    import { keccak256, toHex } from "viem";

    const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

    const validatorAccount = privateKeyToAccount(
      process.env.VALIDATOR_PRIVATE_KEY as `0x${string}`,
    );

    const validatorWalletClient = createWalletClient({
      account: validatorAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const tag = "successful_trade";
    const feedbackHash = keccak256(toHex(tag));

    const reputationContract = getContract({
      address: REPUTATION_REGISTRY,
      abi: [
        {
          name: "giveFeedback",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "agentId", type: "uint256" },
            { name: "score", type: "int128" },
            { name: "feedbackType", type: "uint8" },
            { name: "tag", type: "string" },
            { name: "metadataURI", type: "string" },
            { name: "evidenceURI", type: "string" },
            { name: "comment", type: "string" },
            { name: "feedbackHash", type: "bytes32" },
          ],
          outputs: [],
        },
      ],
      client: { public: publicClient, wallet: validatorWalletClient },
    });

    const reputationTx = await reputationContract.write.giveFeedback(
      [agentId, 95n, 0, tag, "", "", "", feedbackHash],
      { account: validatorAccount },
    );

    await publicClient.waitForTransactionReceipt({ hash: reputationTx });
    console.log(`Reputation: https://testnet.arcscan.app/tx/${reputationTx}`);
    ```

    <Note>
      **Production scoring**: This quickstart hardcodes `score: 95` for demonstration.
      In production, calculate scores dynamically based on agent behavior. For
      example, `score = loanRepaidOnTime ? 100 : 20` for lending protocols, or
      `score = slippagePct < 1 ? 95 : 60` for trading platforms.

      The ReputationRegistry stores attestations from external observers who witnessed
      the agent's actions. Your application logic calculates scores based on outcomes,
      then records them onchain.
    </Note>

    ## Step 7. Request and verify validation

    The ERC-8004 ValidationRegistry uses a two-step request/response flow. The
    **agent owner** requests validation from a validator, then the **validator**
    submits a response.

    ```typescript index.ts theme={null}
    const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

    const requestURI = "ipfs://bafkreiexamplevalidationrequest";
    const requestHash = keccak256(
      toHex(`kyc_verification_request_agent_${agentId}`),
    );

    const validationContract = getContract({
      address: VALIDATION_REGISTRY,
      abi: [
        {
          name: "validationRequest",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "validator", type: "address" },
            { name: "agentId", type: "uint256" },
            { name: "requestURI", type: "string" },
            { name: "requestHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "validationResponse",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "requestHash", type: "bytes32" },
            { name: "response", type: "uint8" },
            { name: "responseURI", type: "string" },
            { name: "responseHash", type: "bytes32" },
            { name: "tag", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "getValidationStatus",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "requestHash", type: "bytes32" }],
          outputs: [
            { name: "validatorAddress", type: "address" },
            { name: "agentId", type: "uint256" },
            { name: "response", type: "uint8" },
            { name: "responseHash", type: "bytes32" },
            { name: "tag", type: "string" },
            { name: "lastUpdate", type: "uint256" },
          ],
        },
      ],
      client: publicClient,
    });

    const validationRequestTx = await ownerWalletClient.writeContract({
      address: VALIDATION_REGISTRY,
      abi: validationContract.abi,
      functionName: "validationRequest",
      args: [validatorAccount.address, agentId, requestURI, requestHash],
      account: ownerAccount,
    });

    await publicClient.waitForTransactionReceipt({ hash: validationRequestTx });

    const validationResponseTx = await validatorWalletClient.writeContract({
      address: VALIDATION_REGISTRY,
      abi: validationContract.abi,
      functionName: "validationResponse",
      args: [requestHash, 100, "", `0x${"0".repeat(64)}`, "kyc_verified"],
      account: validatorAccount,
    });

    await publicClient.waitForTransactionReceipt({ hash: validationResponseTx });

    type ValidationStatus = readonly [
      `0x${string}`,
      bigint,
      number,
      `0x${string}`,
      string,
      bigint,
    ];

    const [valAddr, , response, , tag] =
      (await validationContract.read.getValidationStatus([
        requestHash,
      ])) as ValidationStatus;

    console.log(`Validator: ${valAddr}`);
    console.log(`Response: ${response} (100 = passed)`);
    console.log(`Tag: ${tag}`);
    ```

    ## Full agent registration script

    The complete script below combines all the preceding steps into a single
    runnable file.

    ```typescript index.ts expandable theme={null}
    import {
      createPublicClient,
      createWalletClient,
      getContract,
      http,
      keccak256,
      parseAbiItem,
      toHex,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { arcTestnet } from "viem/chains";

    const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
    const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
    const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

    const METADATA_URI =
      process.env.METADATA_URI ||
      "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

    const ownerAccount = privateKeyToAccount(
      process.env.OWNER_PRIVATE_KEY as `0x${string}`,
    );
    const validatorAccount = privateKeyToAccount(
      process.env.VALIDATOR_PRIVATE_KEY as `0x${string}`,
    );

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const ownerWalletClient = createWalletClient({
      account: ownerAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const validatorWalletClient = createWalletClient({
      account: validatorAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const identityAbi = [
      {
        name: "register",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "metadataURI", type: "string" }],
        outputs: [],
      },
      {
        name: "ownerOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
      },
      {
        name: "tokenURI",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
      },
    ] as const;

    const reputationAbi = [
      {
        name: "giveFeedback",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "agentId", type: "uint256" },
          { name: "score", type: "int128" },
          { name: "feedbackType", type: "uint8" },
          { name: "tag", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "evidenceURI", type: "string" },
          { name: "comment", type: "string" },
          { name: "feedbackHash", type: "bytes32" },
        ],
        outputs: [],
      },
    ] as const;

    const validationAbi = [
      {
        name: "validationRequest",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "validator", type: "address" },
          { name: "agentId", type: "uint256" },
          { name: "requestURI", type: "string" },
          { name: "requestHash", type: "bytes32" },
        ],
        outputs: [],
      },
      {
        name: "validationResponse",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "requestHash", type: "bytes32" },
          { name: "response", type: "uint8" },
          { name: "responseURI", type: "string" },
          { name: "responseHash", type: "bytes32" },
          { name: "tag", type: "string" },
        ],
        outputs: [],
      },
      {
        name: "getValidationStatus",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "requestHash", type: "bytes32" }],
        outputs: [
          { name: "validatorAddress", type: "address" },
          { name: "agentId", type: "uint256" },
          { name: "response", type: "uint8" },
          { name: "responseHash", type: "bytes32" },
          { name: "tag", type: "string" },
          { name: "lastUpdate", type: "uint256" },
        ],
      },
    ] as const;

    type ValidationStatus = readonly [
      `0x${string}`,
      bigint,
      number,
      `0x${string}`,
      string,
      bigint,
    ];

    async function waitForReceipt(hash: `0x${string}`, label: string) {
      console.log(`  Waiting for ${label}: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ${label} confirmed in block ${receipt.blockNumber}`);
      console.log(`  Explorer: https://testnet.arcscan.app/tx/${hash}`);
      return receipt;
    }

    async function main() {
      console.log("\n── Step 1: Prepare wallets ──");
      console.log(`  Owner: ${ownerAccount.address}`);
      console.log(`  Validator: ${validatorAccount.address}`);

      console.log("\n── Step 2: Register agent identity ──");
      console.log(`  Metadata URI: ${METADATA_URI}`);

      const registerTx = await ownerWalletClient.writeContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: "register",
        args: [METADATA_URI],
        account: ownerAccount,
      });

      const receipt = await waitForReceipt(registerTx, "Registration");

      console.log("\n── Step 3: Retrieve agent ID ──");

      const transferLogs = await publicClient.getLogs({
        address: IDENTITY_REGISTRY,
        event: parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        ),
        args: { to: ownerAccount.address },
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      if (transferLogs.length === 0) {
        throw new Error("No Transfer events found in the registration block");
      }

      const agentId = transferLogs[transferLogs.length - 1].args.tokenId;
      if (agentId == null) {
        throw new Error("Registration event did not include a tokenId");
      }

      const identityContract = getContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        client: publicClient,
      });

      const owner = await identityContract.read.ownerOf([agentId]);
      const tokenURI = await identityContract.read.tokenURI([agentId]);

      console.log(`  Agent ID: ${agentId}`);
      console.log(`  Owner: ${owner}`);
      console.log(`  Metadata URI: ${tokenURI}`);

      console.log("\n── Step 4: Record reputation ──");

      const tag = "successful_trade";
      const feedbackHash = keccak256(toHex(tag));

      const reputationContract = getContract({
        address: REPUTATION_REGISTRY,
        abi: reputationAbi,
        client: { public: publicClient, wallet: validatorWalletClient },
      });

      const reputationTx = await reputationContract.write.giveFeedback(
        [agentId, 95n, 0, tag, "", "", "", feedbackHash],
        { account: validatorAccount },
      );

      const reputationReceipt = await waitForReceipt(reputationTx, "Reputation");

      console.log("\n── Step 5: Verify reputation ──");

      const fromBlock =
        reputationReceipt.blockNumber > 1000n
          ? reputationReceipt.blockNumber - 1000n
          : 0n;

      const reputationLogs = await publicClient.getLogs({
        address: REPUTATION_REGISTRY,
        fromBlock,
        toBlock: "latest",
      });

      console.log(`  Found ${reputationLogs.length} feedback event(s)`);

      console.log("\n── Step 6: Request validation ──");
      const requestURI = "ipfs://bafkreiexamplevalidationrequest";
      const requestHash = keccak256(
        toHex(`kyc_verification_request_agent_${agentId}`),
      );

      const validationRequestContract = getContract({
        address: VALIDATION_REGISTRY,
        abi: validationAbi,
        client: { public: publicClient, wallet: ownerWalletClient },
      });

      const validationRequestTx =
        await validationRequestContract.write.validationRequest(
          [validatorAccount.address, agentId, requestURI, requestHash],
          { account: ownerAccount },
        );

      await waitForReceipt(validationRequestTx, "Validation request");

      console.log("\n── Step 7: Validation response ──");

      const validationResponseContract = getContract({
        address: VALIDATION_REGISTRY,
        abi: validationAbi,
        client: { public: publicClient, wallet: validatorWalletClient },
      });

      const validationResponseTx =
        await validationResponseContract.write.validationResponse(
          [
            requestHash,
            100,
            "",
            `0x${"0".repeat(64)}` as `0x${string}`,
            "kyc_verified",
          ],
          { account: validatorAccount },
        );

      await waitForReceipt(validationResponseTx, "Validation response");

      console.log("\n── Step 8: Check validation ──");

      const validationReadContract = getContract({
        address: VALIDATION_REGISTRY,
        abi: validationAbi,
        client: publicClient,
      });

      const [valAddr, , response, , validationTag] =
        (await validationReadContract.read.getValidationStatus([
          requestHash,
        ])) as ValidationStatus;

      console.log(`  Validator: ${valAddr}`);
      console.log(`  Response: ${response} (100 = passed)`);
      console.log(`  Tag: ${validationTag}`);

      console.log("\n── Complete ──");
      console.log("  ✓ Identity registered");
      console.log("  ✓ Reputation recorded");
      console.log("  ✓ Validation requested and verified");
    }

    main().catch((error) => {
      console.error("\nError:", error.message ?? error);
      process.exit(1);
    });
    ```

    Save it, then run:

    ```shell theme={null}
    npm run start
    ```
  </Tab>
</Tabs>

## Summary

After completing this quickstart, you've successfully:

* Created or prepared two Arc Testnet wallets for the ERC-8004 flow
* Registered an AI agent with a unique onchain identity (ERC-721 token)
* Recorded reputation feedback from an external validator
* Requested validation from a validator and verified the response onchain
