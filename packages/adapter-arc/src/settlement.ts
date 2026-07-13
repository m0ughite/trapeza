/**
 * ArcTask escrow settlement — bridges cleared allocations to on-chain accept/reject.
 */

import type { Outcome } from "@trapeza/core";
import type { PrivateKeyAccount, WalletClient } from "viem";
import {
  ArcTaskClient,
  makeWallet,
  SimulatedArcTaskClient,
  taskIdToJobId,
  type ArcTaskJob,
} from "./arctask.js";
import { ARCTASK_SIMULATED } from "./constants.js";

export interface ArcTaskSettlementConfig {
  evaluatorPrivateKey: `0x${string}`;
  rpcUrl?: string;
  simulated?: boolean;
  /** Share a client instance with the harness / chain adapter. */
  arctaskClient?: ArcTaskClient;
}

export interface SettleJobRequest {
  taskId: string;
  outcome: Outcome;
}

export interface SettleJobResult {
  taskId: string;
  action: "release" | "slash";
  txHash: string;
  jobId: bigint;
}

/**
 * Settles an ArcTask job after oracle verification.
 * release → acceptWork (pay agent); slash → rejectWork (refund client).
 */
export class ArcTaskSettlementProvider {
  readonly name = "arctask-escrow";
  private readonly client: ArcTaskClient;
  private readonly evaluatorAccount: PrivateKeyAccount;
  private readonly evaluatorWallet: WalletClient;

  constructor(cfg: ArcTaskSettlementConfig) {
    this.client =
      cfg.arctaskClient ??
      ((cfg.simulated ?? ARCTASK_SIMULATED)
        ? new SimulatedArcTaskClient()
        : new ArcTaskClient({ rpcUrl: cfg.rpcUrl }));
    const w = makeWallet(cfg.evaluatorPrivateKey, cfg.rpcUrl);
    this.evaluatorAccount = w.account;
    this.evaluatorWallet = w.wallet;
  }

  async settleJob(req: SettleJobRequest): Promise<SettleJobResult> {
    const jobId = taskIdToJobId(req.taskId);
    const action: "release" | "slash" = req.outcome.passed ? "release" : "slash";
    const txHash =
      action === "release"
        ? await this.client.acceptWork(
            this.evaluatorAccount,
            this.evaluatorWallet,
            jobId,
          )
        : await this.client.rejectWork(
            this.evaluatorAccount,
            this.evaluatorWallet,
            jobId,
          );
    return { taskId: req.taskId, action, txHash, jobId };
  }

  async getJob(taskId: string): Promise<ArcTaskJob> {
    return this.client.getJob(taskIdToJobId(taskId));
  }
}

export interface EscrowIntent {
  agentId: bigint;
  evaluator: `0x${string}`;
  jobURI: string;
  deadline: bigint;
  rewardAmountWei: bigint;
}

/** Tracks pending escrow intents keyed by Trapeza taskId before openEscrow. */
export class EscrowIntentRegistry {
  private readonly intents = new Map<string, EscrowIntent>();
  private readonly taskToJob = new Map<string, bigint>();

  register(taskId: string, intent: EscrowIntent): void {
    this.intents.set(taskId, intent);
  }

  linkJob(taskId: string, jobId: bigint): void {
    this.taskToJob.set(taskId, jobId);
  }

  getIntent(taskId: string): EscrowIntent | undefined {
    return this.intents.get(taskId);
  }

  getJobId(taskId: string): bigint | undefined {
    return this.taskToJob.get(taskId);
  }

  resolveTaskId(taskId: string): bigint {
    const linked = this.taskToJob.get(taskId);
    if (linked !== undefined) return linked;
    return taskIdToJobId(taskId);
  }
}
