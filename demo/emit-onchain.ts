/**
 * On-chain settlement driver.
 *
 * Loads a cleared allocation (the invoice-workflow fixture) and drives a REAL
 * testnet settlement per cleared node through the pluggable Gateway/x402 path,
 * then writes `apps/dashboard/src/fixtures/onchain-receipts.json`.
 *
 * HARD TIMEBOX + HONEST FALLBACK: every node settlement is wrapped in try/catch.
 * If the live path is unavailable (no keys) or overruns, the driver keeps the
 * repo's already-PROVEN spike hashes (IMPLEMENTATION-LOG P0'') as clearly
 * labeled receipts. It never fabricates a tx hash, and never renders a Gateway
 * settlement UUID as an /tx/ link.
 *
 * Run:  npm run demo:onchain            (attempts live; falls back if it can't)
 *       LIVE=0 npm run demo:onchain     (skip live, write proven fallback)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadEnv } from "@trapeza/adapter-gateway";
import {
  ARC_TESTNET_CAIP2,
  ARC_TESTNET_EXPLORER,
} from "@trapeza/adapter-arc";
import {
  ONCHAIN_RECEIPTS_SCHEMA_VERSION,
  type OnchainRef,
  type OnchainReceipts,
  type SettlementReceipt,
} from "../apps/dashboard/src/types/contract.js";
import {
  GatewayX402SettlementProvider,
  type NanoSettlementProvider,
  type SettleNodeResult,
} from "./onchain.js";

loadEnv();

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, "..", "apps", "dashboard", "src", "fixtures");
const RUN_ID = "invoice-processing";

// ── Already-proven on-chain artifacts (real, confirmed; P0''). ────────────────
const PROVEN = {
  agentId: "842573",
  registerTx: "0x3cc07a9310283fddc7c6c1de1aede992985fe7e89ea0de32b1cbbb40489e1735",
  reputationTx: "0x7b0d7d3a2d8574483b10ecfd5c4072274eb0ce697811ace8c5b2f16186f7f982",
  depositTx: "0xb64a686acb4951a394f797d7439f1c9afc88e02655377f31240e5d2cd4fff6e0",
  settlementUuid: "05f9f115-9837-4926-8f46-5009eb7660d7",
  buyer: "0x3ec80Bb34f7b617D2E90efcd62a4A72C08b4d3bd",
  seller: "0x609b04C59525C2BD2f5C640FaE934d4AC4D3f101",
} as const;

const txRef = (hash: string, label: string): OnchainRef => ({
  kind: "evm-tx",
  value: hash,
  url: `${ARC_TESTNET_EXPLORER}/tx/${hash}`,
  linkable: true,
  label,
});

const uuidRef = (uuid: string): OnchainRef => ({
  kind: "gateway-settlement-id",
  value: uuid,
  url: null,
  linkable: false,
  label:
    "Circle Gateway settlement/batch UUID (not an EVM tx; on-chain transfer settles when the batch flushes)",
});

function identityReceipt(): OnchainReceipts["identity"] {
  return {
    agentId: PROVEN.agentId,
    register: txRef(PROVEN.registerTx, "ERC-8004 identity register (OWNER)"),
    reputation: txRef(PROVEN.reputationTx, "ERC-8004 reputation feedback (VALIDATOR)"),
  };
}

interface Allocation {
  nodeId: string;
  providerId: string;
}

function loadAllocations(): Allocation[] {
  const run = JSON.parse(readFileSync(join(FIXTURE_DIR, `${RUN_ID}.json`), "utf8")) as {
    clearing: { allocations: Allocation[] };
  };
  return run.clearing.allocations.map((a) => ({ nodeId: a.nodeId, providerId: a.providerId }));
}

function liveReceipt(r: SettleNodeResult, depositHash: string | null): SettlementReceipt {
  return {
    nodeId: r.nodeId,
    providerId: r.providerId,
    amountUsdc: r.amountUsdc,
    live: true,
    latencyMs: r.latencyMs,
    payer: r.payer,
    seller: r.seller,
    depositTx: depositHash
      ? txRef(depositHash, "Gateway deposit (real on-chain tx into the unified balance)")
      : txRef(PROVEN.depositTx, "Prior Gateway deposit (real on-chain tx; balance already funded)"),
    gatewaySettlementId: r.gatewaySettlementId ? uuidRef(r.gatewaySettlementId) : null,
    settlementTx: r.settlementTxHash
      ? txRef(r.settlementTxHash, "x402 settlement tx")
      : null,
    note:
      "Live settlement: authorization accepted by the Circle Gateway facilitator; buyer Gateway balance debited. The batched on-chain transfer to the seller settles asynchronously.",
  };
}

function fallbackSettlements(allocations: Allocation[]): SettlementReceipt[] {
  const rep = allocations[0] ?? { nodeId: "parse", providerId: "sonnet-parser" };
  return [
    {
      nodeId: rep.nodeId,
      providerId: rep.providerId,
      amountUsdc: "0.001",
      live: false,
      latencyMs: 437,
      payer: PROVEN.buyer,
      seller: PROVEN.seller,
      depositTx: txRef(PROVEN.depositTx, "Gateway deposit (real on-chain tx into the unified balance)"),
      gatewaySettlementId: uuidRef(PROVEN.settlementUuid),
      settlementTx: null,
      note:
        "Proven prior spike (IMPLEMENTATION-LOG P0''): buyer Gateway available balance debited exactly 0.001 USDC. Shown as a labeled representative settlement for the cleared allocation; run `npm run demo:onchain` with funded BUYER/SELLER env to produce per-node live receipts.",
    },
  ];
}

function write(receipts: OnchainReceipts): void {
  writeFileSync(
    join(FIXTURE_DIR, "onchain-receipts.json"),
    `${JSON.stringify(receipts, null, 2)}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  const allocations = loadAllocations();
  const base: Omit<OnchainReceipts, "settlements" | "meta"> & {
    meta: Omit<OnchainReceipts["meta"], "mode">;
  } = {
    schemaVersion: ONCHAIN_RECEIPTS_SCHEMA_VERSION,
    meta: {
      generatedAt: new Date().toISOString(),
      network: "Arc Testnet",
      caip2: ARC_TESTNET_CAIP2,
      explorer: ARC_TESTNET_EXPLORER,
      runId: RUN_ID,
      honestyNote:
        "A Circle Gateway settlement id is a batch UUID, NOT an EVM tx hash — it is never rendered as a /tx/ link. Only real 0x+64hex hashes (the Gateway deposit and the ERC-8004 identity/reputation writes) are linked to arcscan.",
    },
    identity: identityReceipt(),
  };

  const buyerKey = process.env.BUYER_PRIVATE_KEY?.trim();
  const sellerAddr = process.env.SELLER_ADDRESS?.trim();
  const wantLive = process.env.LIVE !== "0" && !!buyerKey && !!sellerAddr;
  const maxNodes = Number(process.env.SETTLE_NODES ?? allocations.length);

  if (!wantLive) {
    console.log(
      wantLive === false && (!buyerKey || !sellerAddr)
        ? "  No BUYER_PRIVATE_KEY / SELLER_ADDRESS — writing proven-fallback receipts."
        : "  LIVE=0 — writing proven-fallback receipts.",
    );
    write({ ...base, meta: { ...base.meta, mode: "fallback-proven" }, settlements: fallbackSettlements(allocations) });
    console.log("  wrote onchain-receipts.json (fallback-proven)");
    return;
  }

  console.log(`  Attempting live settlement of ${Math.min(maxNodes, allocations.length)} cleared node(s)…`);
  const provider: NanoSettlementProvider = new GatewayX402SettlementProvider({
    buyerPrivateKey: buyerKey as `0x${string}`,
    sellerAddress: sellerAddr as `0x${string}`,
  });

  const settlements: SettlementReceipt[] = [];
  try {
    await provider.init();
    for (const a of allocations.slice(0, maxNodes)) {
      try {
        const r = await provider.settleNode({ nodeId: a.nodeId, providerId: a.providerId, price: "$0.001" });
        settlements.push(liveReceipt(r, provider.depositTxHash));
        console.log(`    ✓ ${a.nodeId} → ${a.providerId}  (${r.latencyMs}ms, id=${r.gatewaySettlementId ?? "n/a"})`);
      } catch (e) {
        console.log(`    ✗ ${a.nodeId}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    console.log(`  live init failed: ${(e as Error).message}`);
  } finally {
    await provider.close();
  }

  if (settlements.length === 0) {
    console.log("  No live settlement succeeded — writing proven-fallback receipts.");
    write({ ...base, meta: { ...base.meta, mode: "fallback-proven" }, settlements: fallbackSettlements(allocations) });
    return;
  }

  const mode = settlements.length === Math.min(maxNodes, allocations.length) ? "live" : "mixed";
  write({ ...base, meta: { ...base.meta, mode }, settlements });
  console.log(`  wrote onchain-receipts.json (${mode}, ${settlements.length} live settlement(s))`);
}

main().catch((e) => {
  console.error("\n[FAILED]", e?.message ?? e);
  process.exit(1);
});
