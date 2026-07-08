/**
 * ArcTaskChainAdapter — ChainAdapter backed by ArcTask escrow + agent registry.
 *
 * Implements openEscrow/resolveEscrow against ArcTaskEscrow (native or ERC-20
 * rail). Identity minting uses ArcTaskAgentRegistry; reputation feedback uses
 * the canonical ERC-8004 reputation registry (ArcTask registry has no feedback).
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import type { ChainAdapter } from "@trapeza/core";
import {
  arcTestnet,
  ARC_TESTNET_RPC_URL,
  REPUTATION_REGISTRY,
} from "./constants.js";
import { reputationRegistryAbi } from "./abis.js";
import {
  ArcTaskClient,
  encodeJobPayloadUri,
  makeWallet,
  parseUsdcToWei,
  SimulatedArcTaskClient,
} from "./arctask.js";
import {
  EscrowIntentRegistry,
  type EscrowIntent,
} from "./settlement.js";
import { ARCTASK_SIMULATED, ARCTASK_USDC_MODE } from "./constants.js";

export interface ArcTaskChainAdapterConfig {
  /** Client / job creator wallet. */
  clientPrivateKey: `0x${string}`;
  /** Evaluator wallet — accept/reject on escrow. */
  evaluatorPrivateKey: `0x${string}`;
  /** Optional validator for canonical ERC-8004 giveFeedback. */
  validatorPrivateKey?: `0x${string}`;
  rpcUrl?: string;
  simulated?: boolean;
  escrowAddress?: `0x${string}`;
  registryAddress?: `0x${string}`;
  /** Inject a shared ArcTaskClient (e.g. SimulatedArcTaskClient for tests). */
  arctaskClient?: ArcTaskClient;
}

export class ArcTaskChainAdapter implements ChainAdapter {
  private readonly publicClient: PublicClient;
  private readonly clientAccount: PrivateKeyAccount;
  private readonly clientWallet: WalletClient;
  private readonly evaluatorAccount: PrivateKeyAccount;
  private readonly evaluatorWallet: WalletClient;
  private readonly validatorAccount?: PrivateKeyAccount;
  private readonly validatorWallet?: WalletClient;
  private readonly arctask: ArcTaskClient;
  readonly intents = new EscrowIntentRegistry();
  private agentIdSeq = 0n;

  constructor(cfg: ArcTaskChainAdapterConfig) {
    const transport = http(cfg.rpcUrl ?? ARC_TESTNET_RPC_URL);
    this.publicClient = createPublicClient({ chain: arcTestnet, transport });

    const client = makeWallet(cfg.clientPrivateKey, cfg.rpcUrl);
    this.clientAccount = client.account;
    this.clientWallet = client.wallet;

    const evaluator = makeWallet(cfg.evaluatorPrivateKey, cfg.rpcUrl);
    this.evaluatorAccount = evaluator.account;
    this.evaluatorWallet = evaluator.wallet;

    if (cfg.validatorPrivateKey) {
      this.validatorAccount = privateKeyToAccount(cfg.validatorPrivateKey);
      this.validatorWallet = createWalletClient({
        account: this.validatorAccount,
        chain: arcTestnet,
        transport,
      });
    }

    const simulated = cfg.simulated ?? ARCTASK_SIMULATED;
    this.arctask =
      cfg.arctaskClient ??
      (simulated
        ? new SimulatedArcTaskClient()
        : new ArcTaskClient({
            rpcUrl: cfg.rpcUrl,
            escrowAddress: cfg.escrowAddress,
            registryAddress: cfg.registryAddress,
          }));
  }

  get evaluatorAddress(): `0x${string}` {
    return this.evaluatorAccount.address;
  }

  /** Register escrow intent before openEscrow (agentId, jobURI, deadline). */
  registerEscrowIntent(taskId: string, intent: EscrowIntent): void {
    this.intents.register(taskId, intent);
  }

  async mintIdentity(meta: object): Promise<bigint> {
    const metadataURI =
      typeof (meta as { metadataURI?: unknown }).metadataURI === "string"
        ? (meta as { metadataURI: string }).metadataURI
        : encodeJobPayloadUri({ name: "trapeza-agent", ...(meta as object) });

    if (this.arctask instanceof SimulatedArcTaskClient) {
      const { agentId } = await this.arctask.registerAgent(this.clientAccount);
      return agentId;
    }

    const { agentId } = await this.arctask.registerAgent(
      this.clientAccount,
      this.clientWallet,
      metadataURI,
    );
    return agentId;
  }

  async giveFeedback(
    agentId: bigint,
    score: number,
    tag: string,
    evidenceURI: string,
  ): Promise<string> {
    if (!this.validatorWallet || !this.validatorAccount) {
      // Simulated feedback tx when no validator configured
      return `0xsimfb${agentId.toString(16).padStart(56, "0")}`;
    }
    const feedbackHash = keccak256(toHex(tag));
    const txHash = await this.validatorWallet.writeContract({
      address: REPUTATION_REGISTRY,
      abi: reputationRegistryAbi,
      functionName: "giveFeedback",
      args: [
        agentId,
        BigInt(score),
        0,
        tag,
        "",
        evidenceURI,
        "",
        feedbackHash,
      ],
      account: this.validatorAccount,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async openEscrow(
    taskId: string,
    _providerWallet: `0x${string}`,
    amountUsdc: string,
  ): Promise<string> {
    const existing = this.intents.getJobId(taskId);
    if (existing !== undefined) {
      return `0xlinked${existing.toString(16).padStart(56, "0")}` as `0x${string}`;
    }

    const intent = this.intents.getIntent(taskId);
    const rewardWei = intent?.rewardAmountWei ?? parseUsdcToWei(amountUsdc, ARCTASK_USDC_MODE);
    const deadline =
      intent?.deadline ??
      BigInt(Math.floor(Date.now() / 1000) + 86_400);
    const agentId = intent?.agentId ?? ++this.agentIdSeq;
    const evaluator = intent?.evaluator ?? this.evaluatorAccount.address;
    const jobURI =
      intent?.jobURI ??
      encodeJobPayloadUri({
        title: `Trapeza task ${taskId}`,
        description: "Cleared via Trapeza harness",
      });

    const { jobId, txHash } = await this.arctask.createJob(
      this.clientAccount,
      this.clientWallet,
      {
        agentId,
        rewardAmountWei: rewardWei,
        deadline,
        evaluator,
        jobURI,
      },
    );

    this.intents.linkJob(taskId, jobId);
    this.intents.linkJob(`arctask:job:${jobId}`, jobId);
    return txHash;
  }

  async resolveEscrow(
    taskId: string,
    action: "release" | "slash",
  ): Promise<string> {
    const jobId = this.intents.resolveTaskId(taskId);
    if (action === "release") {
      return this.arctask.acceptWork(
        this.evaluatorAccount,
        this.evaluatorWallet,
        jobId,
      );
    }
    return this.arctask.rejectWork(
      this.evaluatorAccount,
      this.evaluatorWallet,
      jobId,
    );
  }
}
