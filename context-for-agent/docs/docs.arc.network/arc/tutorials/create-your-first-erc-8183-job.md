> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Create your first ERC-8183 job

> Create an ERC-8183 job, fund escrow with USDC, submit a deliverable hash, and complete settlement on Arc Testnet.

This quickstart guides you through the ERC-8183 job lifecycle on Arc Testnet.
You'll create developer-controlled smart contract account wallets, create a job,
fund escrow with USDC, submit a deliverable hash, and complete the job as the
evaluator. Select the tab that matches your preferred setup.

## ERC-8183 contract on Arc testnet

| Contract                                 | Address                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| AgenticCommerce reference implementation | [`0x0747EEf0706327138c69792bF28Cd525089e4583`](https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583) |

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
      mkdir erc8183-quickstart
      cd erc8183-quickstart
      npm init -y
      npm pkg set type=module
      npm pkg set scripts.start="tsx --env-file=.env index.ts"

      npm install @circle-fin/developer-controlled-wallets viem
      npm install --save-dev tsx typescript @types/node
      ```

      ```shell Python theme={null}
      mkdir erc8183-quickstart
      cd erc8183-quickstart
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

    * `CIRCLE_API_KEY` is your Circle Developer API key.
    * `CIRCLE_ENTITY_SECRET` is your registered Entity Secret.

    The `npm run start` command loads variables from `.env` using Node.js native
    env-file support. The `python index.py` command loads the same `.env` file via
    `python-dotenv`.

    <Tip>
      Prefer editing `.env` files in your IDE or editor so credentials are not
      leaked to your shell history.
    </Tip>

    ## Step 2. Create developer-controlled wallets

    In this step, you create two Arc Testnet dev-controlled wallets for the ERC-8183
    flow: a client wallet and a provider wallet. In this quickstart, the client also
    acts as the evaluator. If you already have two Arc Testnet funded dev-controlled
    wallets for this flow, skip to [Step 4](#step-4-create-the-job).

    The Step 2 through 9 sections explain the flow in smaller pieces. Not every step
    includes a code snippet, and the snippets are not cumulative. To run the full
    workflow end to end, use the [complete script](#full-job-lifecycle-script) at
    the end of this tutorial.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const walletSet = await circleClient.createWalletSet({
        name: "ERC8183 Job Wallets",
      });

      const walletsResponse = await circleClient.createWallets({
        blockchains: ["ARC-TESTNET"],
        count: 2,
        walletSetId: walletSet.data?.walletSet?.id ?? "",
        accountType: "SCA",
      });

      const clientWallet = walletsResponse.data?.wallets?.[0]!;
      const providerWallet = walletsResponse.data?.wallets?.[1]!;

      console.log(`Client:   ${clientWallet.address} (${clientWallet.id})`);
      console.log(`Provider: ${providerWallet.address} (${providerWallet.id})`);
      console.log(`Evaluator: ${clientWallet.address} (${clientWallet.id})`);
      ```

      ```python index.py theme={null}
      from circle.web3 import developer_controlled_wallets, utils
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
              "name": "ERC8183 Job Wallets",
          })
      )

      wallets_response = wallets_api.create_wallet(
          developer_controlled_wallets.CreateWalletRequest.from_dict({
              "blockchains": ["ARC-TESTNET"],
              "count": 2,
              "walletSetId": wallet_set.data.wallet_set.actual_instance.id,
              "accountType": "SCA",
          })
      )

      client_wallet = wallets_response.data.wallets[0].actual_instance
      provider_wallet = wallets_response.data.wallets[1].actual_instance

      print(f"Client:   {client_wallet.address} ({client_wallet.id})")
      print(f"Provider: {provider_wallet.address} ({provider_wallet.id})")
      print(f"Evaluator: {client_wallet.address} ({client_wallet.id})")
      ```
    </CodeGroup>

    ## Step 3. Fund the client wallet

    The script will pause to allow you to fund the client wallet with Arc Testnet
    USDC from one of these faucets:

    * [Circle Faucet](https://faucet.circle.com)
    * [Circle Console Faucet](https://console.circle.com/faucet)

    You only fund the client wallet as the script transfers starter USDC to the
    provider wallet automatically before the ERC-8183 flow begins.

    <Note>
      The public faucet is rate-limited, so this quickstart avoids requiring a
      second faucet request for the provider wallet.
    </Note>

    ## Step 4. Create the job

    Call `createJob(provider, evaluator, expiredAt, description, hook)` on the
    deployed ERC-8183 reference implementation. This creates the job in the `Open`
    state. This quickstart uses `address(0)` for `hook` so the flow stays on the
    default non-hooked path.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const createJobTx = await circleClient.createContractExecutionTransaction({
        walletAddress: clientWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: AGENTIC_COMMERCE_CONTRACT,
        abiFunctionSignature: "createJob(address,address,uint256,string,address)",
        abiParameters: [
          providerWallet.address!,
          clientWallet.address!,
          expiredAt.toString(),
          "ERC-8183 demo job on Arc Testnet",
          "0x0000000000000000000000000000000000000000",
        ],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });
      ```

      ```python index.py theme={null}
      create_job_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": client_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                  "abiFunctionSignature": "createJob(address,address,uint256,string,address)",
                  "abiParameters": [
                      provider_wallet.address,
                      client_wallet.address,
                      str(expired_at),
                      "ERC-8183 demo job on Arc Testnet",
                      "0x0000000000000000000000000000000000000000",
                  ],
                  "feeLevel": "MEDIUM",
              }
          )
      )
      ```
    </CodeGroup>

    ## Step 5. Set the budget

    In this deployed contract, the provider sets the job price by calling
    `setBudget(jobId, amount, optParams)`.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const setBudgetTx = await circleClient.createContractExecutionTransaction({
        walletAddress: providerWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: AGENTIC_COMMERCE_CONTRACT,
        abiFunctionSignature: "setBudget(uint256,uint256,bytes)",
        abiParameters: [jobId.toString(), JOB_BUDGET.toString(), "0x"],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });
      ```

      ```python index.py theme={null}
      set_budget_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": provider_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                  "abiFunctionSignature": "setBudget(uint256,uint256,bytes)",
                  "abiParameters": [str(job_id), JOB_BUDGET, "0x"],
                  "feeLevel": "MEDIUM",
              }
          )
      )
      ```
    </CodeGroup>

    ## Step 6. Approve USDC and fund escrow

    Before the client can fund the job, the USDC contract must approve the ERC-8183
    contract to transfer the escrow amount. Then the client calls
    `fund(jobId, optParams)` to move the job into the `Funded` state.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const approveTx = await circleClient.createContractExecutionTransaction({
        walletAddress: clientWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: "0x3600000000000000000000000000000000000000",
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET.toString()],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      const fundTx = await circleClient.createContractExecutionTransaction({
        walletAddress: clientWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: AGENTIC_COMMERCE_CONTRACT,
        abiFunctionSignature: "fund(uint256,bytes)",
        abiParameters: [jobId.toString(), "0x"],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });
      ```

      ```python index.py theme={null}
      approve_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": client_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": "0x3600000000000000000000000000000000000000",
                  "abiFunctionSignature": "approve(address,uint256)",
                  "abiParameters": [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET],
                  "feeLevel": "MEDIUM",
              }
          )
      )

      fund_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": client_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                  "abiFunctionSignature": "fund(uint256,bytes)",
                  "abiParameters": [str(job_id), "0x"],
                  "feeLevel": "MEDIUM",
              }
          )
      )
      ```
    </CodeGroup>

    ## Step 7. Submit the deliverable

    The provider submits a `bytes32` deliverable hash, moving the job into the
    `Submitted` state.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const deliverableHash = keccak256(toHex("arc-erc8183-demo-deliverable"));

      const submitTx = await circleClient.createContractExecutionTransaction({
        walletAddress: providerWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: AGENTIC_COMMERCE_CONTRACT,
        abiFunctionSignature: "submit(uint256,bytes32,bytes)",
        abiParameters: [jobId.toString(), deliverableHash, "0x"],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });
      ```

      ```python index.py theme={null}
      deliverable_hash = Web3.to_hex(
          Web3.keccak(text="arc-erc8183-demo-deliverable")
      )

      submit_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": provider_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                  "abiFunctionSignature": "submit(uint256,bytes32,bytes)",
                  "abiParameters": [str(job_id), deliverable_hash, "0x"],
                  "feeLevel": "MEDIUM",
              }
          )
      )
      ```
    </CodeGroup>

    ## Step 8. Complete the job

    The evaluator completes the job by calling `complete(jobId, reason, optParams)`.
    In this quickstart, the client is also the evaluator.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const reasonHash = keccak256(toHex("deliverable-approved"));

      const completeTx = await circleClient.createContractExecutionTransaction({
        walletAddress: clientWallet.address!,
        blockchain: "ARC-TESTNET",
        contractAddress: AGENTIC_COMMERCE_CONTRACT,
        abiFunctionSignature: "complete(uint256,bytes32,bytes)",
        abiParameters: [jobId.toString(), reasonHash, "0x"],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });
      ```

      ```python index.py theme={null}
      reason_hash = Web3.to_hex(Web3.keccak(text="deliverable-approved"))

      complete_request = (
          developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
              {
                  "walletAddress": client_wallet.address,
                  "blockchain": "ARC-TESTNET",
                  "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                  "abiFunctionSignature": "complete(uint256,bytes32,bytes)",
                  "abiParameters": [str(job_id), reason_hash, "0x"],
                  "feeLevel": "MEDIUM",
              }
          )
      )
      ```
    </CodeGroup>

    ## Step 9. Check the final job state

    Read the job back from the contract to confirm it reached `Completed`. This
    reference implementation does not return the deliverable in `getJob()`, so the
    script prints the submitted deliverable hash from local flow state instead.

    <CodeGroup>
      ```typescript index.ts theme={null}
      const job = await publicClient.readContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "getJob",
        args: [jobId],
      });

      console.log(`Job ID: ${jobId}`);
      console.log(`Status: ${STATUS_NAMES[Number(job.status)]}`);
      console.log(`Budget: ${formatUnits(job.budget, 6)} USDC`);
      console.log(`Hook: ${job.hook}`);
      console.log(`Deliverable hash submitted: ${deliverableHash}`);
      ```

      ```python index.py theme={null}
      contract = web3.eth.contract(
          address=Web3.to_checksum_address(AGENTIC_COMMERCE_CONTRACT),
          abi=agentic_commerce_abi,
      )
      job = contract.functions.getJob(job_id).call()

      print(f"Job ID: {job_id}")
      print(f"Status: {STATUS_NAMES[int(job[7])]}")
      print(f"Budget: {Web3.from_wei(job[5], 'mwei')} USDC")
      print(f"Hook: {job[8]}")
      print(f"Deliverable hash submitted: {deliverable_hash}")
      ```
    </CodeGroup>

    ## Full job lifecycle script

    These complete scripts below combines all the preceding steps into a single
    runnable file.

    <CodeGroup>
      ```typescript index.ts expandable theme={null}
      import { createInterface } from "node:readline/promises";
      import { setTimeout as delay } from "node:timers/promises";
      import { stdin as input, stdout as output } from "node:process";
      import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
      import {
        createPublicClient,
        decodeEventLog,
        formatUnits,
        http,
        keccak256,
        parseUnits,
        toHex,
        type Address,
        type Hex,
      } from "viem";
      import { arcTestnet } from "viem/chains";

      // To bootstrap provider wallet during setup (see Step 3)
      const PROVIDER_STARTER_BALANCE = "1";

      const AGENTIC_COMMERCE_CONTRACT =
        "0x0747EEf0706327138c69792bF28Cd525089e4583" as Address;
      const JOB_BUDGET = parseUnits("5", 6); // 5 USDC (ERC-20, 6 decimals)

      const circleClient = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
      });

      const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(),
      });

      const agenticCommerceAbi = [
        {
          type: "function",
          name: "createJob",
          stateMutability: "nonpayable",
          inputs: [
            { name: "provider", type: "address" },
            { name: "evaluator", type: "address" },
            { name: "expiredAt", type: "uint256" },
            { name: "description", type: "string" },
            { name: "hook", type: "address" },
          ],
          outputs: [{ name: "jobId", type: "uint256" }],
        },
        {
          type: "function",
          name: "setBudget",
          stateMutability: "nonpayable",
          inputs: [
            { name: "jobId", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "optParams", type: "bytes" },
          ],
          outputs: [],
        },
        {
          type: "function",
          name: "fund",
          stateMutability: "nonpayable",
          inputs: [
            { name: "jobId", type: "uint256" },
            { name: "optParams", type: "bytes" },
          ],
          outputs: [],
        },
        {
          type: "function",
          name: "submit",
          stateMutability: "nonpayable",
          inputs: [
            { name: "jobId", type: "uint256" },
            { name: "deliverable", type: "bytes32" },
            { name: "optParams", type: "bytes" },
          ],
          outputs: [],
        },
        {
          type: "function",
          name: "complete",
          stateMutability: "nonpayable",
          inputs: [
            { name: "jobId", type: "uint256" },
            { name: "reason", type: "bytes32" },
            { name: "optParams", type: "bytes" },
          ],
          outputs: [],
        },
        {
          type: "function",
          name: "getJob",
          stateMutability: "view",
          inputs: [{ name: "jobId", type: "uint256" }],
          outputs: [
            {
              type: "tuple",
              components: [
                { name: "id", type: "uint256" },
                { name: "client", type: "address" },
                { name: "provider", type: "address" },
                { name: "evaluator", type: "address" },
                { name: "description", type: "string" },
                { name: "budget", type: "uint256" },
                { name: "expiredAt", type: "uint256" },
                { name: "status", type: "uint8" },
                { name: "hook", type: "address" },
              ],
            },
          ],
        },
        {
          type: "event",
          name: "JobCreated",
          inputs: [
            { indexed: true, name: "jobId", type: "uint256" },
            { indexed: true, name: "client", type: "address" },
            { indexed: true, name: "provider", type: "address" },
            { indexed: false, name: "evaluator", type: "address" },
            { indexed: false, name: "expiredAt", type: "uint256" },
            { indexed: false, name: "hook", type: "address" },
          ],
          anonymous: false,
        },
      ] as const;

      const STATUS_NAMES = [
        "Open",
        "Funded",
        "Submitted",
        "Completed",
        "Rejected",
        "Expired",
      ];

      function extractJobId(txHash: Hex) {
        return publicClient
          .getTransactionReceipt({ hash: txHash })
          .then((receipt) => {
            for (const log of receipt.logs) {
              try {
                const decoded = decodeEventLog({
                  abi: agenticCommerceAbi,
                  data: log.data,
                  topics: log.topics,
                });
                if (decoded.eventName === "JobCreated") {
                  return decoded.args.jobId;
                }
              } catch {
                continue;
              }
            }
            throw new Error("Could not parse JobCreated event");
          });
      }

      async function waitForTransaction(txId: string, label: string) {
        process.stdout.write(`  Waiting for ${label}`);
        for (let i = 0; i < 60; i++) {
          await delay(2000);
          const tx = await circleClient.getTransaction({ id: txId });
          const data = tx.data?.transaction;

          if (data?.state === "COMPLETE" && data.txHash) {
            const txHash = data.txHash;
            console.log(
              ` ✓\n  Tx: ${arcTestnet.blockExplorers.default.url}/tx/${txHash}`,
            );
            return txHash as Hex;
          }
          if (data?.state === "FAILED") {
            throw new Error(`${label} failed onchain`);
          }
          process.stdout.write(".");
        }
        throw new Error(`${label} timed out`);
      }

      async function printBalances(
        title: string,
        wallets: Array<{ label: string; id?: string; address?: string | null }>,
      ) {
        console.log(`\n${title}:`);

        for (const wallet of wallets) {
          const balances = await circleClient.getWalletTokenBalance({
            id: wallet.id!,
          });
          const usdc = balances.data?.tokenBalances?.find(
            (b) => b.token?.symbol === "USDC",
          );
          console.log(`  ${wallet.label}: ${wallet.address}`);
          console.log(`    USDC: ${usdc?.amount ?? "0"}`);
        }
      }

      async function main() {
        console.log("── Step 1: Create wallets ──");

        const walletSet = await circleClient.createWalletSet({
          name: "ERC8183 Job Wallets",
        });

        const walletsResponse = await circleClient.createWallets({
          blockchains: ["ARC-TESTNET"],
          count: 2,
          walletSetId: walletSet.data?.walletSet?.id ?? "",
          accountType: "SCA",
        });

        const clientWallet = walletsResponse.data?.wallets?.[0]!;
        const providerWallet = walletsResponse.data?.wallets?.[1]!;

        console.log("\n── Step 2: Fund the client wallet ──");
        console.log("  Fund this wallet with Arc Testnet USDC:");
        console.log(`  Client: ${clientWallet.address}`);
        console.log(`  Wallet ID: ${clientWallet.id}`);
        console.log("  Public faucet:  https://faucet.circle.com");
        console.log("  Console faucet: https://console.circle.com/faucet");
        console.log("\n  This script will fund the provider wallet automatically.");

        const rl = createInterface({ input, output });
        await rl.question("\nPress Enter after the client wallet is funded... ");
        rl.close();

        console.log("\n── Step 3: Transfer starter USDC to provider ──");
        const transferTx = await circleClient.createTransaction({
          walletAddress: clientWallet.address!,
          blockchain: "ARC-TESTNET",
          tokenAddress: "0x3600000000000000000000000000000000000000",
          destinationAddress: providerWallet.address!,
          amount: [PROVIDER_STARTER_BALANCE],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(
          transferTx.data?.id!,
          "transfer starter USDC to provider",
        );

        console.log("\n── Step 4: Check balances ──");
        await printBalances("Balances", [
          { label: "Client", ...clientWallet },
          { label: "Provider", ...providerWallet },
        ]);

        const now = await publicClient.getBlock();
        const expiredAt = now.timestamp + 3600n;

        console.log("\n── Step 5: Create job - createJob() ──");
        const createJobTx = await circleClient.createContractExecutionTransaction({
          walletAddress: clientWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: AGENTIC_COMMERCE_CONTRACT,
          abiFunctionSignature: "createJob(address,address,uint256,string,address)",
          abiParameters: [
            providerWallet.address!,
            clientWallet.address!,
            expiredAt.toString(),
            "ERC-8183 demo job on Arc Testnet",
            "0x0000000000000000000000000000000000000000",
          ],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        const createJobTxHash = await waitForTransaction(
          createJobTx.data?.id!,
          "create job",
        );
        const jobId = await extractJobId(createJobTxHash);
        console.log(`  Job ID: ${jobId}`);

        console.log("\n── Step 6: Set budget - setBudget() ──");
        const setBudgetTx = await circleClient.createContractExecutionTransaction({
          walletAddress: providerWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: AGENTIC_COMMERCE_CONTRACT,
          abiFunctionSignature: "setBudget(uint256,uint256,bytes)",
          abiParameters: [jobId.toString(), JOB_BUDGET.toString(), "0x"],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(setBudgetTx.data?.id!, "set budget");

        console.log("\n── Step 7: Approve USDC - approve() ──");
        const approveTx = await circleClient.createContractExecutionTransaction({
          walletAddress: clientWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: "0x3600000000000000000000000000000000000000",
          abiFunctionSignature: "approve(address,uint256)",
          abiParameters: [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET.toString()],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(approveTx.data?.id!, "approve USDC");

        console.log("\n── Step 8: Fund escrow - fund() ──");
        const fundTx = await circleClient.createContractExecutionTransaction({
          walletAddress: clientWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: AGENTIC_COMMERCE_CONTRACT,
          abiFunctionSignature: "fund(uint256,bytes)",
          abiParameters: [jobId.toString(), "0x"],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(fundTx.data?.id!, "fund escrow");

        console.log("\n── Step 9: Submit deliverable - submit() ──");
        const deliverableHash = keccak256(toHex("arc-erc8183-demo-deliverable"));
        const submitTx = await circleClient.createContractExecutionTransaction({
          walletAddress: providerWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: AGENTIC_COMMERCE_CONTRACT,
          abiFunctionSignature: "submit(uint256,bytes32,bytes)",
          abiParameters: [jobId.toString(), deliverableHash, "0x"],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(submitTx.data?.id!, "submit deliverable");

        console.log("\n── Step 10: Complete job - complete() ──");
        const reasonHash = keccak256(toHex("deliverable-approved"));
        const completeTx = await circleClient.createContractExecutionTransaction({
          walletAddress: clientWallet.address!,
          blockchain: "ARC-TESTNET",
          contractAddress: AGENTIC_COMMERCE_CONTRACT,
          abiFunctionSignature: "complete(uint256,bytes32,bytes)",
          abiParameters: [jobId.toString(), reasonHash, "0x"],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        });
        await waitForTransaction(completeTx.data?.id!, "complete job");

        console.log("\n── Step 11: Check final job state ──");
        const job = await publicClient.readContract({
          address: AGENTIC_COMMERCE_CONTRACT,
          abi: agenticCommerceAbi,
          functionName: "getJob",
          args: [jobId],
        });
        console.log(`  Job ID: ${jobId}`);
        console.log(`  Status: ${STATUS_NAMES[Number(job.status)]}`);
        console.log(`  Budget: ${formatUnits(job.budget, 6)} USDC`);
        console.log(`  Hook: ${job.hook}`);
        console.log(`  Deliverable hash submitted: ${deliverableHash}`);

        console.log("\n── Step 12: Check final balances ──");
        await printBalances("Balances", [
          { label: "Client", ...clientWallet },
          { label: "Provider", ...providerWallet },
        ]);
      }

      main().catch((error) => {
        console.error("\nError:", error.message || error);
        process.exit(1);
      });
      ```

      ```python index.py expandable theme={null}
      import os
      import sys
      import time

      from circle.web3 import developer_controlled_wallets, utils
      from dotenv import load_dotenv
      from web3 import Web3

      load_dotenv()

      # Bootstrap the provider wallet from the client wallet to avoid a second faucet request.
      PROVIDER_STARTER_BALANCE = "1"

      AGENTIC_COMMERCE_CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583"
      JOB_BUDGET = "5000000" # 5 USDC (ERC-20, 6 decimals)

      circle_client = utils.init_developer_controlled_wallets_client(
          api_key=os.getenv("CIRCLE_API_KEY"),
          entity_secret=os.getenv("CIRCLE_ENTITY_SECRET"),
      )

      wallet_sets_api = developer_controlled_wallets.WalletSetsApi(circle_client)
      wallets_api = developer_controlled_wallets.WalletsApi(circle_client)
      transactions_api = developer_controlled_wallets.TransactionsApi(circle_client)

      web3 = Web3(Web3.HTTPProvider("https://rpc.testnet.arc.network"))

      agentic_commerce_abi = [
          {
              "type": "function",
              "name": "getJob",
              "stateMutability": "view",
              "inputs": [{"name": "jobId", "type": "uint256"}],
              "outputs": [
                  {
                      "type": "tuple",
                      "components": [
                          {"name": "id", "type": "uint256"},
                          {"name": "client", "type": "address"},
                          {"name": "provider", "type": "address"},
                          {"name": "evaluator", "type": "address"},
                          {"name": "description", "type": "string"},
                          {"name": "budget", "type": "uint256"},
                          {"name": "expiredAt", "type": "uint256"},
                          {"name": "status", "type": "uint8"},
                          {"name": "hook", "type": "address"},
                      ],
                  }
              ],
          },
          {
              "type": "event",
              "name": "JobCreated",
              "inputs": [
                  {"indexed": True, "name": "jobId", "type": "uint256"},
                  {"indexed": True, "name": "client", "type": "address"},
                  {"indexed": True, "name": "provider", "type": "address"},
                  {"indexed": False, "name": "evaluator", "type": "address"},
                  {"indexed": False, "name": "expiredAt", "type": "uint256"},
                  {"indexed": False, "name": "hook", "type": "address"},
              ],
              "anonymous": False,
          },
      ]

      STATUS_NAMES = [
          "Open",
          "Funded",
          "Submitted",
          "Completed",
          "Rejected",
          "Expired",
      ]


      def extract_job_id(tx_hash: str) -> int:
          contract = web3.eth.contract(
              address=Web3.to_checksum_address(AGENTIC_COMMERCE_CONTRACT),
              abi=agentic_commerce_abi,
          )
          receipt = web3.eth.get_transaction_receipt(tx_hash)
          logs = contract.events.JobCreated().process_receipt(receipt)

          if not logs:
              raise RuntimeError("Could not parse JobCreated event")

          return int(logs[0]["args"]["jobId"])


      def wait_for_transaction(tx_id: str, label: str) -> str:
          sys.stdout.write(f"  Waiting for {label}")
          sys.stdout.flush()

          for _ in range(60):
              time.sleep(2)
              tx = transactions_api.get_transaction(id=tx_id)
              transaction = tx.data.transaction

              if transaction.state == "COMPLETE" and transaction.tx_hash:
                  tx_hash = transaction.tx_hash
                  print(f" ✓\n  Tx: https://testnet.arcscan.app/tx/{tx_hash}")
                  return tx_hash
              if transaction.state == "FAILED":
                  raise RuntimeError(f"{label} failed onchain")

              sys.stdout.write(".")
              sys.stdout.flush()

          raise RuntimeError(f"{label} timed out")


      def print_balances(title: str, wallets: list[dict[str, str]]) -> None:
          print(f"\n{title}:")

          for wallet in wallets:
              balances = wallets_api.list_wallet_balance(id=wallet["id"])
              usdc_amount = "0"

              for entry in balances.data.token_balances or []:
                  balance = getattr(entry, "actual_instance", entry)
                  token = getattr(balance, "token", None)
                  token = getattr(token, "actual_instance", token)

                  if token and getattr(token, "symbol", None) == "USDC":
                      usdc_amount = getattr(balance, "amount", "0")
                      break

              print(f"  {wallet['label']}: {wallet['address']}")
              print(f"    USDC: {usdc_amount}")


      def main() -> None:
          print("── Step 1: Create wallets ──")

          wallet_set = wallet_sets_api.create_wallet_set(
              developer_controlled_wallets.CreateWalletSetRequest.from_dict({
                  "name": "ERC8183 Job Wallets",
              })
          )

          wallets_response = wallets_api.create_wallet(
              developer_controlled_wallets.CreateWalletRequest.from_dict({
                  "blockchains": ["ARC-TESTNET"],
                  "count": 2,
                  "walletSetId": wallet_set.data.wallet_set.actual_instance.id,
                  "accountType": "SCA",
              })
          )

          client_wallet = wallets_response.data.wallets[0].actual_instance
          provider_wallet = wallets_response.data.wallets[1].actual_instance

          print("\n── Step 2: Fund the client wallet ──")
          print("  Fund this wallet with Arc Testnet USDC:")
          print(f"  Client: {client_wallet.address}")
          print(f"  Wallet ID: {client_wallet.id}")
          print("  Public faucet:  https://faucet.circle.com")
          print("  Console faucet: https://console.circle.com/faucet")
          print("\n  This script will fund the provider wallet automatically.")
          input("\nPress Enter after the client wallet is funded... ")

          print("\n── Step 3: Transfer starter USDC to provider ──")
          transfer_request = (
              developer_controlled_wallets.CreateTransferTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": client_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "tokenAddress": "0x3600000000000000000000000000000000000000",
                      "destinationAddress": provider_wallet.address,
                      "amounts": [PROVIDER_STARTER_BALANCE],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          transfer_response = transactions_api.create_developer_transaction_transfer(
              create_transfer_transaction_for_developer_request=transfer_request
          )
          wait_for_transaction(
              transfer_response.data.id,
              "transfer starter USDC to provider",
          )

          print("\n── Step 4: Check balances ──")
          print_balances(
              "Balances",
              [
                  {"label": "Client", "address": client_wallet.address, "id": client_wallet.id},
                  {"label": "Provider", "address": provider_wallet.address, "id": provider_wallet.id},
              ],
          )

          expired_at = web3.eth.get_block("latest")["timestamp"] + 3600

          print("\n── Step 5: Create job - createJob() ──")
          create_job_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": client_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                      "abiFunctionSignature": "createJob(address,address,uint256,string,address)",
                      "abiParameters": [
                          provider_wallet.address,
                          client_wallet.address,
                          str(expired_at),
                          "ERC-8183 demo job on Arc Testnet",
                          "0x0000000000000000000000000000000000000000",
                      ],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          create_job_response = transactions_api.create_developer_transaction_contract_execution(
              create_job_request
          )
          create_job_tx_hash = wait_for_transaction(
              create_job_response.data.id,
              "create job",
          )
          job_id = extract_job_id(create_job_tx_hash)
          print(f"  Job ID: {job_id}")

          print("\n── Step 6: Set budget - setBudget() ──")
          set_budget_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": provider_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                      "abiFunctionSignature": "setBudget(uint256,uint256,bytes)",
                      "abiParameters": [str(job_id), JOB_BUDGET, "0x"],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          set_budget_response = transactions_api.create_developer_transaction_contract_execution(
              set_budget_request
          )
          wait_for_transaction(set_budget_response.data.id, "set budget")

          print("\n── Step 7: Approve USDC - approve() ──")
          approve_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": client_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": "0x3600000000000000000000000000000000000000",
                      "abiFunctionSignature": "approve(address,uint256)",
                      "abiParameters": [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          approve_response = transactions_api.create_developer_transaction_contract_execution(
              approve_request
          )
          wait_for_transaction(approve_response.data.id, "approve USDC")

          print("\n── Step 8: Fund escrow - fund() ──")
          fund_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": client_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                      "abiFunctionSignature": "fund(uint256,bytes)",
                      "abiParameters": [str(job_id), "0x"],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          fund_response = transactions_api.create_developer_transaction_contract_execution(
              fund_request
          )
          wait_for_transaction(fund_response.data.id, "fund escrow")

          print("\n── Step 9: Submit deliverable - submit() ──")
          deliverable_hash = Web3.to_hex(
              Web3.keccak(text="arc-erc8183-demo-deliverable")
          )
          submit_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": provider_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                      "abiFunctionSignature": "submit(uint256,bytes32,bytes)",
                      "abiParameters": [str(job_id), deliverable_hash, "0x"],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          submit_response = transactions_api.create_developer_transaction_contract_execution(
              submit_request
          )
          wait_for_transaction(submit_response.data.id, "submit deliverable")

          print("\n── Step 10: Complete job - complete() ──")
          reason_hash = Web3.to_hex(Web3.keccak(text="deliverable-approved"))
          complete_request = (
              developer_controlled_wallets.CreateContractExecutionTransactionForDeveloperRequest.from_dict(
                  {
                      "walletAddress": client_wallet.address,
                      "blockchain": "ARC-TESTNET",
                      "contractAddress": AGENTIC_COMMERCE_CONTRACT,
                      "abiFunctionSignature": "complete(uint256,bytes32,bytes)",
                      "abiParameters": [str(job_id), reason_hash, "0x"],
                      "feeLevel": "MEDIUM",
                  }
              )
          )
          complete_response = transactions_api.create_developer_transaction_contract_execution(
              complete_request
          )
          wait_for_transaction(complete_response.data.id, "complete job")

          print("\n── Step 11: Check final job state ──")
          contract = web3.eth.contract(
              address=Web3.to_checksum_address(AGENTIC_COMMERCE_CONTRACT),
              abi=agentic_commerce_abi,
          )
          job = contract.functions.getJob(job_id).call()
          print(f"  Job ID: {job_id}")
          print(f"  Status: {STATUS_NAMES[int(job[7])]}")
          print(f"  Budget: {Web3.from_wei(job[5], 'mwei')} USDC")
          print(f"  Hook: {job[8]}")
          print(f"  Deliverable hash submitted: {deliverable_hash}")

          print("\n── Step 12: Check final balances ──")
          print_balances(
              "Balances",
              [
                  {"label": "Client", "address": client_wallet.address, "id": client_wallet.id},
                  {"label": "Provider", "address": provider_wallet.address, "id": provider_wallet.id},
              ],
          )


      if __name__ == "__main__":
          try:
              main()
          except Exception as error:
              print(f"\nError: {error}")
              sys.exit(1)
      ```
    </CodeGroup>

    Run the script:

    <CodeGroup>
      ```shell Node.js theme={null}
      npm run start
      ```

      ```shell Python theme={null}
      python index.py
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Viem">
    ## Prerequisites

    Before you begin, make sure you have:

    1. Installed [Node.js v22+](https://nodejs.org/)
    2. Two self-managed EVM wallets for Arc Testnet
       * Testnet USDC in both wallets to pay for gas and for the client wallet to
         fund escrow

    ## Step 1. Set up your project

    Create a project directory, install dependencies, and configure your
    environment.

    ### 1.1. Create the project and install dependencies

    ```shell theme={null}
    mkdir erc8183-quickstart
    cd erc8183-quickstart
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

    Create a `.env` file in the project directory and add the two private keys used
    for the flow:

    ```text theme={null}
    CLIENT_PRIVATE_KEY=0xYOUR_CLIENT_PRIVATE_KEY
    PROVIDER_PRIVATE_KEY=0xYOUR_PROVIDER_PRIVATE_KEY
    ```

    * `CLIENT_PRIVATE_KEY` is the `0x`-prefixed private key for the Arc Testnet
      wallet that creates the job, approves USDC, funds escrow, and completes the
      job as the evaluator.
    * `PROVIDER_PRIVATE_KEY` is the `0x`-prefixed private key for the Arc Testnet
      wallet that sets the budget and submits the deliverable.

    The `npm run start` command loads variables from `.env` using Node.js native
    env-file support.

    <Tip>
      Prefer editing `.env` files in your IDE or editor so credentials are not
      leaked to your shell history.
    </Tip>

    ## Step 2. Prepare your wallets

    In this step, you prepare two self-managed Arc Testnet wallets for the ERC-8183
    flow. One wallet acts as the client and evaluator, and the other acts as the
    provider. If you already have two funded Arc Testnet wallets for this flow, skip
    to [Step 3](#step-3-create-the-job).

    The Step 3 through 8 code snippets explain the flow in smaller pieces. They are
    not cumulative and will not run if pasted together. To run the full workflow end
    to end, use the [complete script](#full-job-lifecycle-script-2) at the end of
    this tab.

    ### 2.1. Create or fund your wallets

    Create two self-managed EVM wallets if you do not already have them. For
    example, you can generate throwaway wallets with Foundry:

    ```shell theme={null}
    cast wallet new --json
    ```

    Run it twice, once for the client wallet and once for the provider wallet, then
    fund both wallets with Arc Testnet USDC so they can submit transactions. Fund
    the client wallet with Arc Testnet USDC so it can escrow the job budget.

    ### 2.2. Confirm wallet roles

    * the client wallet creates the job, approves USDC, funds escrow, and completes
      the job as the evaluator
    * the provider wallet sets the budget and submits the deliverable

    ## Step 3. Create the job

    Call `createJob(provider, evaluator, expiredAt, description, hook)` on the
    deployed ERC-8183 reference implementation. This creates the job in the `Open`
    state. This quickstart uses `address(0)` for `hook` so the flow stays on the
    default non-hooked path.

    ```typescript index.ts theme={null}
    const block = await publicClient.getBlock();
    const expiredAt = block.timestamp + 3600n;

    const createJobHash = await clientWalletClient.writeContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "createJob",
      args: [
        providerAccount.address,
        clientAccount.address,
        expiredAt,
        "ERC-8183 demo job on Arc Testnet",
        "0x0000000000000000000000000000000000000000",
      ],
    });
    ```

    ## Step 4. Set the budget

    In this deployed contract, the provider sets the job price by calling
    `setBudget(jobId, amount, optParams)`.

    ```typescript index.ts theme={null}
    const setBudgetHash = await providerWalletClient.writeContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "setBudget",
      args: [jobId, JOB_BUDGET, "0x"],
    });
    ```

    ## Step 5. Approve USDC and fund escrow

    Before the client can fund the job, the USDC contract must approve the ERC-8183
    contract to transfer the escrow amount. Then the client calls
    `fund(jobId, optParams)` to move the job into the `Funded` state.

    ```typescript index.ts theme={null}
    const approveHash = await clientWalletClient.writeContract({
      address: USDC_CONTRACT,
      abi: erc20Abi,
      functionName: "approve",
      args: [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET],
    });

    const fundHash = await clientWalletClient.writeContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "fund",
      args: [jobId, "0x"],
    });
    ```

    ## Step 6. Submit the deliverable

    The provider submits a `bytes32` deliverable hash, moving the job into the
    `Submitted` state.

    ```typescript index.ts theme={null}
    const deliverableHash = keccak256(toHex("arc-erc8183-demo-deliverable"));

    const submitHash = await providerWalletClient.writeContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "submit",
      args: [jobId, deliverableHash, "0x"],
    });
    ```

    ## Step 7. Complete the job

    The evaluator completes the job by calling `complete(jobId, reason, optParams)`.
    In this quickstart, the client is also the evaluator.

    ```typescript index.ts theme={null}
    const reasonHash = keccak256(toHex("work-delivered-and-approved"));

    const completeHash = await clientWalletClient.writeContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "complete",
      args: [jobId, reasonHash, "0x"],
    });
    ```

    ## Step 8. Check the final job state

    Read the job back from the contract to confirm it reached `Completed`. This
    reference implementation does not return the deliverable in `getJob()`, so the
    script prints the submitted deliverable hash from local flow state instead.

    ```typescript index.ts theme={null}
    const job = await publicClient.readContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "getJob",
      args: [jobId],
    });

    console.log(`Job ID: ${job.id}`);
    console.log(`Status: ${STATUS_NAMES[Number(job.status)]}`);
    console.log(`Budget: ${formatUnits(job.budget, 6)} USDC`);
    console.log(`Hook: ${job.hook}`);
    console.log(`Deliverable hash submitted: ${deliverableHash}`);
    ```

    This complete script combines the preceding steps into a single runnable file.

    ## Full job lifecycle script

    ```typescript index.ts expandable theme={null}
    import {
      createPublicClient,
      createWalletClient,
      decodeEventLog,
      formatUnits,
      http,
      keccak256,
      toHex,
    } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { arcTestnet } from "viem/chains";

    const AGENTIC_COMMERCE_CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583";
    const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";
    const JOB_BUDGET = 1_000_000n;

    const clientAccount = privateKeyToAccount(
      process.env.CLIENT_PRIVATE_KEY as `0x${string}`,
    );
    const providerAccount = privateKeyToAccount(
      process.env.PROVIDER_PRIVATE_KEY as `0x${string}`,
    );

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const clientWalletClient = createWalletClient({
      account: clientAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const providerWalletClient = createWalletClient({
      account: providerAccount,
      chain: arcTestnet,
      transport: http(),
    });

    const agenticCommerceAbi = [
      {
        name: "createJob",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "provider", type: "address" },
          { name: "evaluator", type: "address" },
          { name: "expiredAt", type: "uint256" },
          { name: "description", type: "string" },
          { name: "hook", type: "address" },
        ],
        outputs: [{ name: "jobId", type: "uint256" }],
      },
      {
        name: "setBudget",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "jobId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "optParams", type: "bytes" },
        ],
        outputs: [],
      },
      {
        name: "fund",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "jobId", type: "uint256" },
          { name: "optParams", type: "bytes" },
        ],
        outputs: [],
      },
      {
        name: "submit",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "jobId", type: "uint256" },
          { name: "deliverable", type: "bytes32" },
          { name: "optParams", type: "bytes" },
        ],
        outputs: [],
      },
      {
        name: "complete",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "jobId", type: "uint256" },
          { name: "reason", type: "bytes32" },
          { name: "optParams", type: "bytes" },
        ],
        outputs: [],
      },
      {
        name: "getJob",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "jobId", type: "uint256" }],
        outputs: [
          {
            type: "tuple",
            components: [
              { name: "id", type: "uint256" },
              { name: "client", type: "address" },
              { name: "provider", type: "address" },
              { name: "evaluator", type: "address" },
              { name: "description", type: "string" },
              { name: "budget", type: "uint256" },
              { name: "expiredAt", type: "uint256" },
              { name: "status", type: "uint8" },
              { name: "hook", type: "address" },
            ],
          },
        ],
      },
      {
        name: "JobCreated",
        type: "event",
        anonymous: false,
        inputs: [
          { indexed: true, name: "jobId", type: "uint256" },
          { indexed: true, name: "client", type: "address" },
          { indexed: true, name: "provider", type: "address" },
          { indexed: false, name: "evaluator", type: "address" },
          { indexed: false, name: "expiredAt", type: "uint256" },
          { indexed: false, name: "hook", type: "address" },
        ],
      },
    ] as const;

    const erc20Abi = [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ] as const;

    const STATUS_NAMES = [
      "Open",
      "Funded",
      "Submitted",
      "Completed",
      "Rejected",
      "Expired",
    ];

    async function waitForTransaction(hash: `0x${string}`, label: string) {
      process.stdout.write(`  Waiting for ${label}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(` ✓\n  Tx: ${arcTestnet.blockExplorers.default.url}/tx/${hash}`);
      return receipt;
    }

    async function printBalances(title: string) {
      console.log(`\n${title}:`);

      const clientBalance = await publicClient.readContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [clientAccount.address],
      });
      const providerBalance = await publicClient.readContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [providerAccount.address],
      });

      console.log(`  Client: ${clientAccount.address}`);
      console.log(`    USDC: ${formatUnits(clientBalance, 6)}`);
      console.log(`  Provider: ${providerAccount.address}`);
      console.log(`    USDC: ${formatUnits(providerBalance, 6)}`);
    }

    async function main(): Promise<void> {
      console.log("── Step 1: Prepare accounts ──");
      console.log(`  Client: ${clientAccount.address}`);
      console.log(`  Provider: ${providerAccount.address}`);
      console.log(`  Evaluator: ${clientAccount.address}`);

      console.log("\n── Step 2: Check balances ──");
      await printBalances("Balances");

      const block = await publicClient.getBlock();
      const expiredAt = block.timestamp + 3600n;

      console.log("\n── Step 3: Create job - createJob() ──");
      const createJobHash = await clientWalletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "createJob",
        args: [
          providerAccount.address,
          clientAccount.address,
          expiredAt,
          "ERC-8183 demo job on Arc Testnet",
          "0x0000000000000000000000000000000000000000",
        ],
      });
      const createJobReceipt = await waitForTransaction(
        createJobHash,
        "create job",
      );

      let jobId: bigint | undefined;
      for (const log of createJobReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: agenticCommerceAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "JobCreated") {
            jobId = decoded.args.jobId;
            break;
          }
        } catch {
          continue;
        }
      }

      if (jobId == null) {
        throw new Error("Could not parse JobCreated event");
      }

      console.log(`  Job ID: ${jobId}`);

      console.log("\n── Step 4: Set budget - setBudget() ──");
      const setBudgetHash = await providerWalletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "setBudget",
        args: [jobId, JOB_BUDGET, "0x"],
      });
      await waitForTransaction(setBudgetHash, "set budget");

      console.log("\n── Step 5: Approve USDC - approve() ──");
      const approveHash = await clientWalletClient.writeContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: "approve",
        args: [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET],
      });
      await waitForTransaction(approveHash, "approve USDC");

      console.log("\n── Step 6: Fund escrow - fund() ──");
      const fundHash = await clientWalletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "fund",
        args: [jobId, "0x"],
      });
      await waitForTransaction(fundHash, "fund escrow");

      console.log("\n── Step 7: Submit deliverable - submit() ──");
      const deliverableHash = keccak256(toHex("arc-erc8183-demo-deliverable"));
      const submitHash = await providerWalletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "submit",
        args: [jobId, deliverableHash, "0x"],
      });
      await waitForTransaction(submitHash, "submit deliverable");

      console.log("\n── Step 8: Complete job - complete() ──");
      const reasonHash = keccak256(toHex("work-delivered-and-approved"));
      const completeHash = await clientWalletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "complete",
        args: [jobId, reasonHash, "0x"],
      });
      await waitForTransaction(completeHash, "complete job");

      console.log("\n── Step 9: Check final job state ──");
      const job = await publicClient.readContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "getJob",
        args: [jobId],
      });

      console.log(`  Job ID: ${job.id}`);
      console.log(`  Status: ${STATUS_NAMES[Number(job.status)]}`);
      console.log(`  Budget: ${formatUnits(job.budget, 6)} USDC`);
      console.log(`  Hook: ${job.hook}`);
      console.log(`  Deliverable hash submitted: ${deliverableHash}`);

      console.log("\n── Step 10: Check final balances ──");
      await printBalances("Balances");
    }

    void main().catch((error) => {
      console.error("\nError:", error);
      process.exit(1);
    });
    ```

    Run the script:

    ```shell theme={null}
    npm run start
    ```
  </Tab>
</Tabs>

## Verify the result

If the flow succeeds, the output should show:

* a created job ID
* a completed final status
* the client balance reduced by the funded escrow amount
* the provider balance increased after completion

<Note>
  If platform or evaluator fees are configured on the deployed contract, the
  provider receives the net amount after fees rather than the full job budget.
</Note>

You can also inspect the transaction links in the terminal output on
[Arcscan Testnet](https://testnet.arcscan.app).

## Summary

After completing this quickstart, you've successfully:

* Set up a project for running an ERC-8183 job flow on Arc Testnet
* Prepared client and provider wallets for the client, provider, and evaluator
  roles
* Walked through an example ERC-8183 job lifecycle
* Confirmed balances and job state in the script output and reviewed
  transactions on Arcscan Testnet
