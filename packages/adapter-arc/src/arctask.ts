/**
 * Typed ArcTask marketplace client — escrow + agent registry on Arc testnet.
 */

import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  keccak256,
  parseAbiItem,
  parseEther,
  parseUnits,
  toHex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import type { TaskSpec } from "@trapeza/core";
import {
  arcTestnet,
  ARC_TESTNET_RPC_URL,
  ARC_TESTNET_USDC,
  readArctaskApiBase,
  readArctaskEscrowAddress,
  readArctaskRegistryAddress,
  readArctaskUsdcMode,
  type ArcTaskUsdcMode,
} from "./constants.js";
import {
  arctaskAgentRegistryAbi,
  arctaskEscrowAbi,
  ArcTaskJobStatus,
  erc20Abi,
} from "./arctask-abis.js";

export interface ArcTaskJob {
  jobId: bigint;
  client: `0x${string}`;
  agentId: bigint;
  agentOwner: `0x${string}`;
  evaluator: `0x${string}`;
  rewardAmount: bigint;
  deadline: bigint;
  jobURI: string;
  deliverableHash: `0x${string}`;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface ArcTaskAgent {
  agentId: bigint;
  owner: `0x${string}`;
  metadataURI: string;
  createdAt: bigint;
  active: boolean;
}

export interface ArcTaskClientConfig {
  rpcUrl?: string;
  escrowAddress?: `0x${string}`;
  registryAddress?: `0x${string}`;
  usdcMode?: ArcTaskUsdcMode;
}

export interface CreateJobParams {
  agentId: bigint;
  rewardAmountWei: bigint;
  deadline: bigint;
  evaluator: `0x${string}`;
  jobURI: string;
}

/** Decode ArcTask `data:application/json,...` jobURI payloads. */
export function decodeJobPayloadUri(jobURI: string): Record<string, unknown> | null {
  const prefix = "data:application/json,";
  if (!jobURI.startsWith(prefix)) return null;
  try {
    const encoded = jobURI.slice(prefix.length);
    const json = decodeURIComponent(encoded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Build a Trapeza-compatible data-URI job payload. */
export function encodeJobPayloadUri(payload: Record<string, unknown>): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(payload))}`;
}

/** Map an ArcTask job + payload to a Trapeza TaskSpec. */
export function jobToTaskSpec(
  job: ArcTaskJob,
  opts: { capability?: string } = {},
): TaskSpec {
  const payload = decodeJobPayloadUri(job.jobURI);
  const title = typeof payload?.title === "string" ? payload.title : `job-${job.jobId}`;
  const description =
    typeof payload?.description === "string" ? payload.description : "";
  const rewardUsdc =
    readArctaskUsdcMode() === "native"
      ? formatNativeUsdc(job.rewardAmount)
      : formatErc20Usdc(job.rewardAmount);

  return {
    id: `arctask:job:${job.jobId}`,
    capability: opts.capability ?? "arctask.general.v1",
    input: { title, description, payload, jobId: job.jobId.toString() },
    oracleSpec: {
      schema: { type: "object", required: ["summary"] },
      groundTruth: {},
    },
    valueUsdc: rewardUsdc,
    budgetUsdc: rewardUsdc,
    preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
    deadlineMs: Number(job.deadline) * 1000,
  };
}

export function formatNativeUsdc(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function formatErc20Usdc(amount: bigint): string {
  const whole = amount / 1_000_000n;
  const frac = amount % 1_000_000n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function parseUsdcToWei(amountUsdc: string, mode: ArcTaskUsdcMode): bigint {
  if (mode === "native") return parseEther(amountUsdc);
  return parseUnits(amountUsdc, 6);
}

export function taskIdToJobId(taskId: string): bigint {
  const m = taskId.match(/^arctask:job:(\d+)$/);
  if (m) return BigInt(m[1]!);
  if (/^\d+$/.test(taskId)) return BigInt(taskId);
  throw new Error(`taskId is not an ArcTask job id: ${taskId}`);
}

export class ArcTaskClient {
  readonly publicClient: PublicClient;
  readonly escrowAddress: `0x${string}`;
  readonly registryAddress: `0x${string}`;
  readonly usdcMode: ArcTaskUsdcMode;

  constructor(cfg: ArcTaskClientConfig = {}) {
    const transport = http(cfg.rpcUrl ?? ARC_TESTNET_RPC_URL);
    this.publicClient = createPublicClient({ chain: arcTestnet, transport });
    this.escrowAddress = cfg.escrowAddress ?? readArctaskEscrowAddress();
    this.registryAddress = cfg.registryAddress ?? readArctaskRegistryAddress();
    this.usdcMode = cfg.usdcMode ?? readArctaskUsdcMode();
  }

  async getJob(jobId: bigint): Promise<ArcTaskJob> {
    const escrow = getContract({
      address: this.escrowAddress,
      abi: arctaskEscrowAbi,
      client: this.publicClient,
    });
    const row = await escrow.read.jobs([jobId]);
    return {
      jobId,
      client: row[0],
      agentId: row[1],
      agentOwner: row[2],
      evaluator: row[3],
      rewardAmount: row[4],
      deadline: row[5],
      jobURI: row[6],
      deliverableHash: row[7],
      status: row[8],
      createdAt: row[9],
      updatedAt: row[10],
    };
  }

  async getAgent(agentId: bigint): Promise<ArcTaskAgent> {
    const registry = getContract({
      address: this.registryAddress,
      abi: arctaskAgentRegistryAbi,
      client: this.publicClient,
    });
    const row = await registry.read.agents([agentId]);
    return {
      agentId,
      owner: row[0],
      metadataURI: row[1],
      createdAt: row[2],
      active: row[3],
    };
  }

  async listAgents(maxId?: bigint): Promise<ArcTaskAgent[]> {
    const registry = getContract({
      address: this.registryAddress,
      abi: arctaskAgentRegistryAbi,
      client: this.publicClient,
    });
    const next = await registry.read.nextAgentId();
    const limit = maxId ?? next;
    const agents: ArcTaskAgent[] = [];
    for (let id = 1n; id < limit; id++) {
      try {
        agents.push(await this.getAgent(id));
      } catch {
        // skip missing
      }
    }
    return agents;
  }

  async registerAgent(
    account: PrivateKeyAccount,
    wallet: WalletClient,
    metadataURI: string,
  ): Promise<{ agentId: bigint; txHash: `0x${string}` }> {
    const txHash = await wallet.writeContract({
      address: this.registryAddress,
      abi: arctaskAgentRegistryAbi,
      functionName: "registerAgent",
      args: [account.address, metadataURI],
      account,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const registry = getContract({
      address: this.registryAddress,
      abi: arctaskAgentRegistryAbi,
      client: this.publicClient,
    });
    const next = await registry.read.nextAgentId();
    return { agentId: next - 1n, txHash };
  }

  async createJob(
    clientAccount: PrivateKeyAccount,
    clientWallet: WalletClient,
    params: CreateJobParams,
  ): Promise<{ jobId: bigint; txHash: `0x${string}` }> {
    let txHash: `0x${string}`;

    if (this.usdcMode === "native") {
      txHash = await clientWallet.writeContract({
        address: this.escrowAddress,
        abi: arctaskEscrowAbi,
        functionName: "createJob",
        args: [
          params.agentId,
          params.rewardAmountWei,
          params.deadline,
          params.evaluator,
          params.jobURI,
        ],
        value: params.rewardAmountWei,
        account: clientAccount,
        chain: arcTestnet,
      });
    } else {
      const approveHash = await clientWallet.writeContract({
        address: ARC_TESTNET_USDC,
        abi: erc20Abi,
        functionName: "approve",
        args: [this.escrowAddress, params.rewardAmountWei],
        account: clientAccount,
        chain: arcTestnet,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

      txHash = await clientWallet.writeContract({
        address: this.escrowAddress,
        abi: [
          ...arctaskEscrowAbi,
          {
            type: "function",
            name: "createJob",
            stateMutability: "nonpayable",
            inputs: [
              { name: "agentId", type: "uint256" },
              { name: "rewardAmount", type: "uint256" },
              { name: "deadline", type: "uint64" },
              { name: "evaluator", type: "address" },
              { name: "jobURI", type: "string" },
            ],
            outputs: [{ name: "jobId", type: "uint256" }],
          },
        ] as const,
        functionName: "createJob",
        args: [
          params.agentId,
          params.rewardAmountWei,
          params.deadline,
          params.evaluator,
          params.jobURI,
        ],
        account: clientAccount,
        chain: arcTestnet,
      });
    }

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const logs = await this.publicClient.getLogs({
      address: this.escrowAddress,
      event: parseAbiItem(
        "event JobCreated(uint256 indexed jobId, uint256 indexed agentId, address indexed client, address evaluator, uint256 rewardAmount, uint64 deadline, string jobURI)",
      ),
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });
    const last = logs[logs.length - 1];
    if (!last?.args.jobId) throw new Error("JobCreated event not found");
    return { jobId: last.args.jobId, txHash };
  }

  async submitDeliverable(
    agentAccount: PrivateKeyAccount,
    agentWallet: WalletClient,
    jobId: bigint,
    deliverableHash: `0x${string}`,
  ): Promise<`0x${string}`> {
    const txHash = await agentWallet.writeContract({
      address: this.escrowAddress,
      abi: arctaskEscrowAbi,
      functionName: "submitDeliverable",
      args: [jobId, deliverableHash],
      account: agentAccount,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async acceptWork(
    evaluatorAccount: PrivateKeyAccount,
    evaluatorWallet: WalletClient,
    jobId: bigint,
  ): Promise<`0x${string}`> {
    const txHash = await evaluatorWallet.writeContract({
      address: this.escrowAddress,
      abi: arctaskEscrowAbi,
      functionName: "acceptWork",
      args: [jobId],
      account: evaluatorAccount,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async rejectWork(
    evaluatorAccount: PrivateKeyAccount,
    evaluatorWallet: WalletClient,
    jobId: bigint,
  ): Promise<`0x${string}`> {
    const txHash = await evaluatorWallet.writeContract({
      address: this.escrowAddress,
      abi: arctaskEscrowAbi,
      functionName: "rejectWork",
      args: [jobId],
      account: evaluatorAccount,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  hashDeliverable(content: string): `0x${string}` {
    return keccak256(toHex(content));
  }

  isSubmitted(job: ArcTaskJob): boolean {
    return job.status === ArcTaskJobStatus.Submitted;
  }

  /** Poll until job reaches target status or timeout. */
  async waitForJobStatus(
    jobId: bigint,
    targetStatus: number,
    timeoutMs = 120_000,
    pollMs = 2_000,
  ): Promise<ArcTaskJob> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const job = await this.getJob(jobId);
      if (job.status === targetStatus) return job;
      if (job.status > targetStatus && targetStatus <= ArcTaskJobStatus.Submitted) {
        return job;
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error(
      `job ${jobId} did not reach status ${targetStatus} within ${timeoutMs}ms — is the ArcTask worker running with LLM_* configured?`,
    );
  }

  /**
   * Fetch deliverable JSON via ArcTask REST (creator-signed nonce).
   * Live path only; simulated client overrides with in-memory store.
   */
  async fetchDeliverable(
    jobId: bigint,
    clientAccount: PrivateKeyAccount,
    clientWallet: WalletClient,
    apiBase?: string,
  ): Promise<unknown> {
    const base = (apiBase ?? readArctaskApiBase()).replace(/\/$/, "");
    const url = `${base}/api/deliverables/${jobId.toString()}`;
    const jobIdStr = jobId.toString();

    const deadline = Date.now() + 30_000;
    let lastError = `deliverable file not ready for job ${jobIdStr}`;

    while (Date.now() < deadline) {
      const nonceRes = await fetch(url, { method: "GET" });
      if (!nonceRes.ok) {
        throw new Error(`ArcTask deliverables challenge ${nonceRes.status}: ${await nonceRes.text()}`);
      }
      const challenge = (await nonceRes.json()) as { nonce?: string; issuedAt?: string };
      if (!challenge.nonce || !challenge.issuedAt) {
        throw new Error("ArcTask deliverables API returned an invalid access challenge");
      }

      const message = [
        "ArcTask deliverable access",
        `Onchain job ID: ${jobIdStr}`,
        `Wallet: ${clientAccount.address}`,
        `Issued at: ${challenge.issuedAt}`,
        `Nonce: ${challenge.nonce}`,
        "Purpose: view private worker deliverable",
      ].join("\n");

      const signature = await clientWallet.signMessage({
        account: clientAccount,
        message,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: clientAccount.address,
          issuedAt: challenge.issuedAt,
          nonce: challenge.nonce,
          signature,
        }),
      });

      if (res.ok) {
        const payload = (await res.json()) as { deliverable?: unknown; content?: unknown };
        return payload.deliverable ?? payload.content ?? payload;
      }

      lastError = await res.text();
      if (res.status !== 404 && res.status !== 401) {
        throw new Error(`ArcTask deliverables API ${res.status}: ${lastError}`);
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    throw new Error(`ArcTask deliverables API: ${lastError}`);
  }
}

export function makeWallet(
  privateKey: `0x${string}`,
  rpcUrl?: string,
): { account: PrivateKeyAccount; wallet: WalletClient } {
  const account = privateKeyToAccount(privateKey);
  const wallet = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(rpcUrl ?? ARC_TESTNET_RPC_URL),
  });
  return { account, wallet };
}

/** Simulated ArcTask client for harness dry-runs (no chain I/O). */
export class SimulatedArcTaskClient extends ArcTaskClient {
  private jobs = new Map<bigint, ArcTaskJob>();
  private agents = new Map<bigint, ArcTaskAgent>();
  private deliverableBodies = new Map<bigint, unknown>();
  private nextJobId = 1n;
  private nextAgentId = 1n;

  constructor() {
    super({ rpcUrl: ARC_TESTNET_RPC_URL });
  }

  override async getJob(jobId: bigint): Promise<ArcTaskJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`simulated job ${jobId} not found`);
    return job;
  }

  override async getAgent(agentId: bigint): Promise<ArcTaskAgent> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`simulated agent ${agentId} not found`);
    return agent;
  }

  override async listAgents(): Promise<ArcTaskAgent[]> {
    return [...this.agents.values()];
  }

  override async registerAgent(
    account: PrivateKeyAccount,
    _wallet?: WalletClient,
    metadataURI?: string,
  ): Promise<{ agentId: bigint; txHash: `0x${string}` }> {
    const agentId = this.nextAgentId++;
    this.agents.set(agentId, {
      agentId,
      owner: account.address,
      metadataURI: metadataURI ?? "sim://agent",
      createdAt: BigInt(Date.now()),
      active: true,
    });
    return { agentId, txHash: `0xsim${agentId.toString(16).padStart(56, "0")}` as `0x${string}` };
  }

  override async createJob(
    clientAccount: PrivateKeyAccount,
    _clientWallet: WalletClient,
    params: CreateJobParams,
  ): Promise<{ jobId: bigint; txHash: `0x${string}` }> {
    const jobId = this.nextJobId++;
    const agent = this.agents.get(params.agentId);
    if (!agent) throw new Error(`agent ${params.agentId} not registered`);
    this.jobs.set(jobId, {
      jobId,
      client: clientAccount.address,
      agentId: params.agentId,
      agentOwner: agent.owner,
      evaluator: params.evaluator,
      rewardAmount: params.rewardAmountWei,
      deadline: params.deadline,
      jobURI: params.jobURI,
      deliverableHash: `0x${"0".repeat(64)}` as `0x${string}`,
      status: ArcTaskJobStatus.Funded,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    });
    return { jobId, txHash: `0xjob${jobId.toString(16).padStart(56, "0")}` as `0x${string}` };
  }

  override async submitDeliverable(
    agentAccount: PrivateKeyAccount,
    _agentWallet: WalletClient,
    jobId: bigint,
    deliverableHash: `0x${string}`,
    deliverableBody?: unknown,
  ): Promise<`0x${string}`> {
    const job = await this.getJob(jobId);
    if (job.agentOwner !== agentAccount.address) throw new Error("not agent owner");
    job.deliverableHash = deliverableHash;
    job.status = ArcTaskJobStatus.Submitted;
    if (deliverableBody !== undefined) {
      this.deliverableBodies.set(jobId, deliverableBody);
    }
    return `0xsub${jobId.toString(16).padStart(56, "0")}` as `0x${string}`;
  }

  override async waitForJobStatus(
    jobId: bigint,
    targetStatus: number,
    timeoutMs = 120_000,
    pollMs = 2_000,
  ): Promise<ArcTaskJob> {
    void timeoutMs;
    void pollMs;
    const job = await this.getJob(jobId);
    if (job.status < targetStatus) {
      throw new Error(
        `simulated job ${jobId} at status ${job.status}, expected ${targetStatus} — call submitDeliverable in tests`,
      );
    }
    return job;
  }

  override async fetchDeliverable(
    jobId: bigint,
    _clientAccount?: PrivateKeyAccount,
    _clientWallet?: WalletClient,
    _apiBase?: string,
  ): Promise<unknown> {
    const body = this.deliverableBodies.get(jobId);
    if (body !== undefined) return body;
    return { summary: `simulated deliverable for job ${jobId.toString()}` };
  }

  override async acceptWork(
    evaluatorAccount: PrivateKeyAccount,
    _evaluatorWallet: WalletClient,
    jobId: bigint,
  ): Promise<`0x${string}`> {
    const job = await this.getJob(jobId);
    if (job.evaluator !== evaluatorAccount.address) throw new Error("not evaluator");
    job.status = ArcTaskJobStatus.Accepted;
    return `0xacc${jobId.toString(16).padStart(56, "0")}` as `0x${string}`;
  }

  override async rejectWork(
    evaluatorAccount: PrivateKeyAccount,
    _evaluatorWallet: WalletClient,
    jobId: bigint,
  ): Promise<`0x${string}`> {
    const job = await this.getJob(jobId);
    if (job.evaluator !== evaluatorAccount.address) throw new Error("not evaluator");
    job.status = ArcTaskJobStatus.Rejected;
    return `0xrej${jobId.toString(16).padStart(56, "0")}` as `0x${string}`;
  }
}
