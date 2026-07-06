/**
 * Pluggable nanopayment settlement path.
 *
 * The clearinghouse produces a cleared allocation; THIS is the seam that turns a
 * cleared node into a real on-chain settlement. It is an interface so we can
 * later point it at a live external x402 provider (e.g. agentcash.dev's service
 * catalog) without touching the engine or the driver — just implement
 * `NanoSettlementProvider` and swap it in.
 *
 * The bundled implementation drives the repo's PROVEN buyer → x402 / Circle
 * Gateway path (a local x402 seller + the buyer's GatewayClient), the same code
 * the P0'' spike proved on Arc testnet.
 */

import {
  GatewaySettlementAdapter,
  startX402Seller,
  type X402Seller,
} from "@trapeza/adapter-gateway";

export interface SettleNodeRequest {
  nodeId: string;
  providerId: string;
  /** Tiny capped amount, e.g. "$0.001". */
  price: string;
}

export interface SettleNodeResult {
  nodeId: string;
  providerId: string;
  amountUsdc: string;
  payer: string;
  seller: string;
  /** Circle Gateway settlement/batch UUID (NOT an EVM tx hash). */
  gatewaySettlementId: string | null;
  /** Real 0x+64hex settlement tx, only if the SDK surfaces one. */
  settlementTxHash: string | null;
  latencyMs: number;
  live: true;
}

export interface NanoSettlementProvider {
  readonly name: string;
  /** Real on-chain Gateway deposit tx captured during init (if one happened). */
  readonly depositTxHash: string | null;
  init(): Promise<void>;
  settleNode(req: SettleNodeRequest): Promise<SettleNodeResult>;
  close(): Promise<void>;
}

export interface GatewayX402Config {
  buyerPrivateKey: `0x${string}`;
  sellerAddress: `0x${string}`;
  /** USDC to top the Gateway balance up to, if it's low. Default "0.1". */
  depositAmount?: string;
}

/**
 * The proven Gateway/x402 settlement provider. Stands up a local x402 seller and
 * pays it from the buyer's Gateway balance — one accepted settlement per node.
 */
export class GatewayX402SettlementProvider implements NanoSettlementProvider {
  readonly name = "circle-gateway-x402";
  depositTxHash: string | null = null;

  private readonly cfg: GatewayX402Config;
  private adapter: GatewaySettlementAdapter | null = null;
  private seller: X402Seller | null = null;
  private lastSettlement: { txHash?: string; payer: string } | null = null;
  private buyerAddress = "";

  constructor(cfg: GatewayX402Config) {
    this.cfg = cfg;
  }

  async init(): Promise<void> {
    const { privateKeyToAccount } = await import("viem/accounts");
    this.buyerAddress = privateKeyToAccount(this.cfg.buyerPrivateKey).address;

    this.adapter = new GatewaySettlementAdapter({ privateKey: this.cfg.buyerPrivateKey });
    const balances = await this.adapter.getBalances();
    // Top up the Gateway balance only if it's low, capturing the real deposit tx.
    if (balances.gateway.available < 100_000n) {
      const dep = await this.adapter.deposit(this.cfg.depositAmount ?? "0.1");
      this.depositTxHash = dep.depositTxHash;
    }

    this.seller = await startX402Seller({
      price: "$0.001",
      payTo: this.cfg.sellerAddress,
      path: "/paid",
      body: { ok: true, message: "Trapeza cleared-node settlement" },
      onSettled: (info) => {
        this.lastSettlement = info;
      },
    });
  }

  async settleNode(req: SettleNodeRequest): Promise<SettleNodeResult> {
    if (!this.adapter || !this.seller) throw new Error("provider not initialized");
    this.lastSettlement = null;
    const start = Date.now();
    const result = await this.adapter.pay(this.seller.url);
    const latencyMs = Date.now() - start;

    const surfaced = result.txHash || this.lastSettlement?.txHash || "";
    const isEvmTx = /^0x[0-9a-fA-F]{64}$/.test(surfaced);
    return {
      nodeId: req.nodeId,
      providerId: req.providerId,
      amountUsdc: result.amountUsdc,
      payer: this.buyerAddress,
      seller: this.cfg.sellerAddress,
      gatewaySettlementId: isEvmTx ? null : surfaced || null,
      settlementTxHash: isEvmTx ? surfaced : null,
      latencyMs,
      live: true,
    };
  }

  async close(): Promise<void> {
    await this.seller?.close();
  }
}
