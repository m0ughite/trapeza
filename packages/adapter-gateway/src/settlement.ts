/**
 * GatewaySettlementAdapter — the Circle Gateway / x402 implementation of
 * `@trapeza/core`'s `SettlementAdapter`. Wraps the reference `GatewayClient`
 * (client side; copied calling conventions from `arc-nanopayments/agent.mts`).
 *
 * The chain SDK lives here, never in core. P0 implements the client/pay path;
 * the provider side (`withGateway` / `BatchFacilitatorClient`) lives in
 * `./x402.ts`.
 */

import { GatewayClient } from "@circle-fin/x402-batching/client";
import type { SettlementAdapter } from "@trapeza/core";
import { GATEWAY_CHAIN_ID } from "./constants.js";

/**
 * Loose shape of `GatewayClient.pay()`'s result. The reference only reads
 * `formattedAmount`; the settlement tx hash is carried back via the decoded
 * PAYMENT-RESPONSE, exposed here under best-effort field names.
 */
interface GatewayPayResult {
  formattedAmount: string;
  transaction?: string;
  paymentResponse?: { transaction?: string };
}

interface GatewayBalances {
  gateway: { available: bigint; formattedAvailable: string };
  wallet: { balance: bigint; formattedBalance?: string };
}

/** The exact `chain` literal union the GatewayClient constructor accepts. */
type GatewayChain = ConstructorParameters<typeof GatewayClient>[0]["chain"];

export interface GatewaySettlementConfig {
  /** Buyer wallet private key, funded with Arc-testnet USDC. */
  privateKey: `0x${string}`;
  /** GatewayClient chain id (default "arcTestnet"). */
  chain?: GatewayChain;
}

export class GatewaySettlementAdapter implements SettlementAdapter {
  private readonly client: GatewayClient;

  constructor(cfg: GatewaySettlementConfig) {
    this.client = new GatewayClient({
      chain: cfg.chain ?? GATEWAY_CHAIN_ID,
      privateKey: cfg.privateKey,
    });
  }

  /** Deposit USDC from the wallet into the Gateway Wallet (unified balance). */
  async deposit(amountUsdc: string): Promise<{ depositTxHash: string }> {
    return (await this.client.deposit(amountUsdc)) as {
      depositTxHash: string;
    };
  }

  async getBalances(): Promise<GatewayBalances> {
    return (await this.client.getBalances()) as unknown as GatewayBalances;
  }

  /**
   * Pay an x402-protected endpoint. Returns the settled amount and the on-chain
   * settlement tx hash (when the seller forwards it via PAYMENT-RESPONSE).
   */
  async pay(
    endpoint: string,
    body?: unknown,
  ): Promise<{ amountUsdc: string; txHash: string }> {
    const method = body === undefined ? "GET" : "POST";
    const result = (await this.client.pay(endpoint, {
      method,
      body,
    })) as unknown as GatewayPayResult;

    const txHash =
      result.transaction ?? result.paymentResponse?.transaction ?? "";
    return { amountUsdc: result.formattedAmount, txHash };
  }
}
