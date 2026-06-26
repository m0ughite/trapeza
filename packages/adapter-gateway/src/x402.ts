/**
 * Framework-agnostic x402 / Circle Gateway seller, ported from
 * `arc-nanopayments/lib/x402.ts` (which is Next.js + Supabase coupled). The
 * payment-requirement shape, the `extra` Gateway-batching field, the
 * verify→settle flow, and the exact header contract
 * (`PAYMENT-REQUIRED` / `payment-signature` / `PAYMENT-RESPONSE`) are preserved
 * so the reference `GatewayClient` (client side) interoperates unchanged.
 *
 * Used by the P0 nanopayment spike to stand up a self-contained x402 endpoint
 * on `node:http`, so the spike proves the full verify+settle loop end-to-end
 * without needing a separate Next.js server running.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import {
  ARC_TESTNET_GATEWAY_WALLET,
  ARC_TESTNET_NETWORK,
  ARC_TESTNET_USDC,
} from "./constants.js";

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: { name: string; version: string; verifyingContract: string };
}

/**
 * The SDK hardcodes `maxTimeoutSeconds: 345600` (4 days), but Arc's facilitator
 * requires a *longer* minimum authorization validity. The required value is
 * advertised per-network at `/v1/x402/supported` as `extra.minValiditySeconds`
 * (604800 = 7 days for Arc testnet as of Jun 2026). Signing for less yields
 * `authorization_validity_too_short`. We read it dynamically and fall back to
 * this constant if the field is ever absent.
 */
const ARC_MIN_VALIDITY_FALLBACK_SECONDS = 604800;
/**
 * Headroom added on top of the facilitator minimum. The client signs
 * `validBefore = signTime + maxTimeoutSeconds`, but the facilitator checks
 * `validBefore >= verifyTime + minValiditySeconds`; this buffer absorbs the
 * sign→verify→settle latency so the window doesn't fall short by a few seconds.
 */
const VALIDITY_BUFFER_SECONDS = 3600;

/**
 * Resolve the `maxTimeoutSeconds` to sign with by reading the facilitator's
 * advertised `minValiditySeconds` for Arc, plus a latency buffer.
 */
export async function resolveMaxTimeoutSeconds(
  facilitator: BatchFacilitatorClient,
): Promise<number> {
  try {
    const supported = (await facilitator.getSupported()) as {
      kinds?: Array<{
        network?: string;
        extra?: { name?: string; minValiditySeconds?: number | string };
      }>;
    };
    const kind = supported.kinds?.find(
      (k) =>
        k.network === ARC_TESTNET_NETWORK &&
        k.extra?.name === "GatewayWalletBatched",
    );
    const min = Number(kind?.extra?.minValiditySeconds);
    if (Number.isFinite(min) && min > 0) return min + VALIDITY_BUFFER_SECONDS;
  } catch {
    // fall through to the fallback below
  }
  return ARC_MIN_VALIDITY_FALLBACK_SECONDS + VALIDITY_BUFFER_SECONDS;
}

/** Parse a `$0.001`-style price into USDC atomic units (6 decimals). */
export function buildPaymentRequirements(
  price: string,
  payTo: `0x${string}`,
  maxTimeoutSeconds: number = ARC_MIN_VALIDITY_FALLBACK_SECONDS +
    VALIDITY_BUFFER_SECONDS,
): PaymentRequirements {
  const amount = Math.round(parseFloat(price.replace("$", "")) * 1_000_000);
  return {
    scheme: "exact",
    network: ARC_TESTNET_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: amount.toString(),
    payTo,
    maxTimeoutSeconds,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
    },
  };
}

interface PaymentPayload {
  x402Version: number;
  resource?: { url: string; description: string; mimeType: string };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface X402SellerOptions {
  /** Price string, e.g. "$0.001". */
  price: string;
  /** Address that receives the USDC. */
  payTo: `0x${string}`;
  /** Path the resource is served at (default "/paid"). */
  path?: string;
  /** Port (default 0 = an ephemeral OS-assigned port). */
  port?: number;
  /** Body returned to the buyer after a successful settlement. */
  body?: unknown;
  /** Called with the settlement tx hash when a payment settles. */
  onSettled?: (info: { txHash: string | undefined; payer: string }) => void;
}

export interface X402Seller {
  url: string;
  close: () => Promise<void>;
}

/**
 * Start a minimal x402-protected seller. Returns once the server is listening,
 * with the resolved URL and a close() helper. Mirrors the reference seller's
 * 402 / verify / settle behavior.
 */
export async function startX402Seller(
  opts: X402SellerOptions,
): Promise<X402Seller> {
  const path = opts.path ?? "/paid";
  const facilitator = new BatchFacilitatorClient();
  // Sign for the facilitator-advertised minimum validity (+ buffer), not the
  // SDK's stale 4-day default — otherwise verify fails too_short on Arc.
  const maxTimeoutSeconds = await resolveMaxTimeoutSeconds(facilitator);
  const requirements = buildPaymentRequirements(
    opts.price,
    opts.payTo,
    maxTimeoutSeconds,
  );
  const responseBody = opts.body ?? { ok: true, resource: path };

  const listener = async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || new URL(req.url, "http://localhost").pathname !== path) {
      res.writeHead(404).end();
      return;
    }

    const paymentSignature = req.headers["payment-signature"] as
      | string
      | undefined;

    // No payment — respond 402 with Gateway-batching requirements.
    if (!paymentSignature) {
      const paymentRequired = {
        x402Version: 2,
        resource: {
          url: `http://localhost${path}`,
          description: `Paid resource (${opts.price} USDC)`,
          mimeType: "application/json",
        },
        accepts: [requirements],
      };
      res.writeHead(402, {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": Buffer.from(
          JSON.stringify(paymentRequired),
        ).toString("base64"),
      });
      res.end(JSON.stringify({}));
      return;
    }

    try {
      const paymentPayload: PaymentPayload = JSON.parse(
        Buffer.from(paymentSignature, "base64").toString("utf-8"),
      );

      const verifyResult = await facilitator.verify(
        paymentPayload,
        requirements,
      );
      if (!verifyResult.isValid) {
        console.error(
          `[x402 seller] verify failed: ${verifyResult.invalidReason}`,
        );
        res.writeHead(402, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Payment verification failed",
            reason: verifyResult.invalidReason,
          }),
        );
        return;
      }

      const settleResult = await facilitator.settle(
        paymentPayload,
        requirements,
      );
      if (!settleResult.success) {
        console.error(
          `[x402 seller] settle failed: ${settleResult.errorReason}`,
        );
        res.writeHead(402, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Payment settlement failed",
            reason: settleResult.errorReason,
          }),
        );
        return;
      }

      const payer = settleResult.payer ?? verifyResult.payer ?? "unknown";
      opts.onSettled?.({ txHash: settleResult.transaction, payer });

      const settleResponseHeader = Buffer.from(
        JSON.stringify({
          success: true,
          transaction: settleResult.transaction,
          network: requirements.network,
          payer,
        }),
      ).toString("base64");

      res.writeHead(200, {
        "Content-Type": "application/json",
        "PAYMENT-RESPONSE": settleResponseHeader,
      });
      res.end(JSON.stringify(responseBody));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payment processing error", message }));
    }
  };

  const server = createServer((req, res) => {
    void listener(req, res);
  });

  return new Promise<X402Seller>((resolve) => {
    server.listen(opts.port ?? 0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : opts.port;
      resolve({
        url: `http://localhost:${port}${path}`,
        close: () =>
          new Promise<void>((res2) => server.close(() => res2())),
      });
    });
  });
}
