/**
 * ArcChainAdapter — the Arc/ERC-8004 implementation of `@trapeza/core`'s
 * `ChainAdapter`. This is where chain SDK calls live (the core forbids them
 * inline). Uses the self-managed `viem` path against the already-deployed
 * ERC-8004 registries on Arc testnet.
 *
 * P0 scope:
 *   - `mintIdentity` / `registerIdentity` — IMPLEMENTED (proven by the spike).
 *   - `giveFeedback`                       — IMPLEMENTED (needs a validator key).
 *   - `openEscrow` / `resolveEscrow`       — NOT IMPLEMENTED (RefundProtocol.sol
 *     fork + deploy is P3 per DESIGN.md §6). Throws so the seam is explicit.
 */

import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  keccak256,
  parseAbiItem,
  parseUnits,
  toHex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import type { ChainAdapter } from "@trapeza/core";
import { parseUsdcToMicro } from "@trapeza/core";
import {
  arcTestnet,
  ARC_TESTNET_RPC_URL,
  ARC_TESTNET_USDC,
  DEFAULT_METADATA_URI,
  ESCROW_CONTRACT,
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  USDC_DECIMALS,
} from "./constants.js";
import {
  erc20Abi,
  identityRegistryAbi,
  refundProtocolAbi,
  reputationRegistryAbi,
} from "./abis.js";

export interface ArcChainAdapterConfig {
  /** Owner wallet: registers the identity / requests validation. */
  ownerPrivateKey: `0x${string}`;
  /**
   * Validator wallet: records reputation. Per ERC-8004, an agent owner cannot
   * record reputation for its own agent. Optional in P0 (only needed for
   * `giveFeedback`).
   */
  validatorPrivateKey?: `0x${string}`;
  rpcUrl?: string;
}

export interface RegisterIdentityResult {
  agentId: bigint;
  txHash: `0x${string}`;
  owner: `0x${string}`;
  tokenURI: string;
}

export class ArcChainAdapter implements ChainAdapter {
  private readonly publicClient: PublicClient;
  private readonly ownerAccount: PrivateKeyAccount;
  private readonly ownerWallet: WalletClient;
  private readonly validatorAccount?: PrivateKeyAccount;
  private readonly validatorWallet?: WalletClient;
  /** taskId → RefundProtocol paymentID */
  private readonly escrowPayments = new Map<string, bigint>();

  constructor(cfg: ArcChainAdapterConfig) {
    const transport = http(cfg.rpcUrl ?? ARC_TESTNET_RPC_URL);
    this.publicClient = createPublicClient({ chain: arcTestnet, transport });

    this.ownerAccount = privateKeyToAccount(cfg.ownerPrivateKey);
    this.ownerWallet = createWalletClient({
      account: this.ownerAccount,
      chain: arcTestnet,
      transport,
    });

    if (cfg.validatorPrivateKey) {
      this.validatorAccount = privateKeyToAccount(cfg.validatorPrivateKey);
      this.validatorWallet = createWalletClient({
        account: this.validatorAccount,
        chain: arcTestnet,
        transport,
      });
    }
  }

  get ownerAddress(): `0x${string}` {
    return this.ownerAccount.address;
  }

  /**
   * Register an ERC-8004 identity and resolve its tokenId from the mint
   * `Transfer` event. Returns rich detail for spike/observability use.
   */
  async registerIdentity(
    meta: { metadataURI?: string } = {},
  ): Promise<RegisterIdentityResult> {
    const metadataURI = meta.metadataURI ?? DEFAULT_METADATA_URI;

    const txHash = await this.ownerWallet.writeContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "register",
      args: [metadataURI],
      account: this.ownerAccount,
      chain: arcTestnet,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const transferLogs = await this.publicClient.getLogs({
      address: IDENTITY_REGISTRY,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ),
      args: { to: this.ownerAccount.address },
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    const last = transferLogs[transferLogs.length - 1];
    if (!last || last.args.tokenId === undefined) {
      throw new Error(
        "No Transfer event found in the registration block — registration may have failed",
      );
    }
    const agentId = last.args.tokenId;

    const identity = getContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      client: this.publicClient,
    });
    const owner = await identity.read.ownerOf([agentId]);
    const tokenURI = await identity.read.tokenURI([agentId]);

    return { agentId, txHash, owner, tokenURI };
  }

  async mintIdentity(meta: object): Promise<bigint> {
    const metadataURI =
      typeof (meta as { metadataURI?: unknown }).metadataURI === "string"
        ? (meta as { metadataURI: string }).metadataURI
        : undefined;
    const result = await this.registerIdentity({ metadataURI });
    return result.agentId;
  }

  /**
   * Maps the four semantic args from `ChainAdapter.giveFeedback` onto the full
   * on-chain ERC-8004 signature
   * `giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)`.
   */
  async giveFeedback(
    agentId: bigint,
    score: number,
    tag: string,
    evidenceURI: string,
  ): Promise<string> {
    if (!this.validatorWallet || !this.validatorAccount) {
      throw new Error(
        "giveFeedback requires a validator wallet (set validatorPrivateKey). " +
          "Per ERC-8004 the agent owner cannot record reputation for its own agent.",
      );
    }
    const feedbackHash = keccak256(toHex(tag));
    const txHash = await this.validatorWallet.writeContract({
      address: REPUTATION_REGISTRY,
      abi: reputationRegistryAbi,
      functionName: "giveFeedback",
      args: [
        agentId,
        BigInt(score),
        0, // feedbackType
        tag,
        "", // metadataURI
        evidenceURI,
        "", // comment
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
    providerWallet: `0x${string}`,
    amountUsdc: string,
  ): Promise<string> {
    if (!ESCROW_CONTRACT) {
      throw new Error(
        "openEscrow requires TRAPEZA_ESCROW_ADDRESS (deploy RefundProtocol.sol from arc-escrow sample)",
      );
    }
    const amountMicro = parseUsdcToMicro(amountUsdc);
    const amount = parseUnits(
      (Number(amountMicro) / 1_000_000).toFixed(USDC_DECIMALS),
      USDC_DECIMALS,
    );

    const approveHash = await this.ownerWallet.writeContract({
      address: ARC_TESTNET_USDC,
      abi: erc20Abi,
      functionName: "approve",
      args: [ESCROW_CONTRACT, amount],
      account: this.ownerAccount,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

    const txHash = await this.ownerWallet.writeContract({
      address: ESCROW_CONTRACT,
      abi: refundProtocolAbi,
      functionName: "pay",
      args: [providerWallet, amount, this.ownerAccount.address],
      account: this.ownerAccount,
      chain: arcTestnet,
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const logs = await this.publicClient.getLogs({
      address: ESCROW_CONTRACT,
      event: parseAbiItem(
        "event PaymentCreated(uint256 indexed paymentID, address indexed to, uint256 amount, uint256 releaseTimestamp, address indexed refundTo)",
      ),
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });
    const paymentId = logs[0]?.args.paymentID;
    if (paymentId === undefined) {
      throw new Error("PaymentCreated event not found after escrow pay()");
    }
    this.escrowPayments.set(taskId, paymentId);
    return txHash;
  }

  async resolveEscrow(
    taskId: string,
    action: "release" | "slash",
  ): Promise<string> {
    if (!ESCROW_CONTRACT) {
      throw new Error(
        "resolveEscrow requires TRAPEZA_ESCROW_ADDRESS (deploy RefundProtocol.sol)",
      );
    }
    const paymentId = this.escrowPayments.get(taskId);
    if (paymentId === undefined) {
      throw new Error(`no escrow payment recorded for task ${taskId}`);
    }

    if (action === "slash") {
      const txHash = await this.ownerWallet.writeContract({
        address: ESCROW_CONTRACT,
        abi: refundProtocolAbi,
        functionName: "refundByArbiter",
        args: [paymentId],
        account: this.ownerAccount,
        chain: arcTestnet,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    }

    // Release path: provider withdraws via RefundProtocol.withdraw() off-band.
    // Return a sentinel so the pipeline can continue; production wires provider keys.
    return `0xrelease_pending_${taskId}`;
  }
}
