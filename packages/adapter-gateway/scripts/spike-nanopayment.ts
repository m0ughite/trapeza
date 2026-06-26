/**
 * P0 SPIKE — perform ONE x402 / Circle Gateway USDC nanopayment on Arc testnet.
 *
 * De-risks DESIGN.md P0 deliverable: "one real x402 nanopayment on Arc" →
 * a settled testnet-USDC tx on arcscan. Self-contained: it stands up a local
 * x402-protected seller (provider side, `BatchFacilitatorClient`) and pays it
 * once with the buyer's `GatewayClient` (client side), proving the full
 * verify → settle loop end-to-end without a separate Next.js app.
 *
 * Required env (see .env.example):
 *   BUYER_PRIVATE_KEY   0x… key for an Arc-testnet wallet funded with BOTH
 *                       native USDC (gas) and ERC-20 USDC at 0x3600… (payments)
 *   SELLER_ADDRESS      0x… address that receives the nanopayment
 * Optional:
 *   PRICE               default "$0.001"
 *   DEPOSIT_AMOUNT      USDC to deposit into Gateway if balance low, default "0.1"
 *   ARC_RPC_URL         default https://rpc.testnet.arc.network
 *
 * Run:  npm run spike:nanopayment   (from repo root)
 *
 * Performs REAL on-chain settlement. Prints only observed receipts/results;
 * never fabricates a tx hash.
 */

import { createPublicClient, erc20Abi, formatEther, formatUnits, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv } from "../src/env.js";
import { GatewaySettlementAdapter } from "../src/settlement.js";
import { startX402Seller } from "../src/x402.js";
import {
  arcTestnet,
  ARC_TESTNET_EXPLORER,
  ARC_TESTNET_RPC_URL,
  ARC_TESTNET_USDC,
} from "../src/constants.js";

loadEnv();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(
      `\n[BLOCKED] Missing required env var: ${name}\n` +
        `  This spike performs a real on-chain settlement and cannot run ` +
        `without it.\n  See SETUP.md for how to obtain it, then add it to .env.\n`,
    );
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  console.log("── Trapeza P0 spike: x402 / Gateway USDC nanopayment ──\n");

  const buyerPrivateKey = requireEnv("BUYER_PRIVATE_KEY") as `0x${string}`;
  const sellerAddress = requireEnv("SELLER_ADDRESS") as `0x${string}`;
  const price = process.env.PRICE?.trim() || "$0.001";
  const depositAmount = process.env.DEPOSIT_AMOUNT?.trim() || "0.1";

  const buyer = privateKeyToAccount(buyerPrivateKey);
  console.log(`  RPC:    ${ARC_TESTNET_RPC_URL}`);
  console.log(`  Buyer:  ${buyer.address}`);
  console.log(`  Seller: ${sellerAddress}`);
  console.log(`  Price:  ${price}\n`);

  // ── Preflight: buyer must have native gas + ERC-20 USDC ──────────────────
  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(ARC_TESTNET_RPC_URL),
  });

  const nativeBalance = await publicClient.getBalance({
    address: buyer.address,
  });
  const usdcBalance = await publicClient.readContract({
    address: ARC_TESTNET_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer.address],
  });

  console.log(`  Buyer native (gas) balance: ${formatEther(nativeBalance)} USDC`);
  console.log(`  Buyer ERC-20 USDC balance:  ${formatUnits(usdcBalance, 6)} USDC`);

  if (nativeBalance === 0n) {
    console.error(
      `\n[BLOCKED] Buyer has 0 native balance — cannot pay gas for the ` +
        `Gateway deposit.\n  Fund ${buyer.address} with Arc-testnet USDC via ` +
        `https://faucet.circle.com/ (Arc Testnet), then re-run.\n`,
    );
    process.exit(1);
  }
  if (usdcBalance === 0n) {
    console.error(
      `\n[BLOCKED] Buyer has 0 ERC-20 USDC (0x3600…) — nothing to deposit ` +
        `into Gateway.\n  Fund ${buyer.address} from https://faucet.circle.com/ ` +
        `(Arc Testnet), then re-run.\n`,
    );
    process.exit(1);
  }

  // ── Stand up the local x402 seller ───────────────────────────────────────
  let observedSettlement: { txHash?: string; payer: string } | null = null;
  const seller = await startX402Seller({
    price,
    payTo: sellerAddress,
    path: "/paid",
    body: { ok: true, message: "Trapeza P0 nanopayment spike resource" },
    onSettled: (info) => {
      observedSettlement = info;
    },
  });
  console.log(`\n  Local x402 seller listening at ${seller.url}`);

  try {
    const settlement = new GatewaySettlementAdapter({
      privateKey: buyerPrivateKey,
    });

    // ── Ensure Gateway balance, depositing if needed ───────────────────────
    let balances = await settlement.getBalances();
    console.log(
      `  Gateway available balance: ${balances.gateway.formattedAvailable}`,
    );
    if (balances.gateway.available < 100_000n) {
      console.log(`  Depositing ${depositAmount} USDC into Gateway Wallet…`);
      const dep = await settlement.deposit(depositAmount);
      console.log(`    Deposit tx: ${ARC_TESTNET_EXPLORER}/tx/${dep.depositTxHash}`);
      balances = await settlement.getBalances();
      console.log(
        `    Gateway available now: ${balances.gateway.formattedAvailable}`,
      );
    }

    // ── The single nanopayment ─────────────────────────────────────────────
    console.log(`\n  Paying ${seller.url} once…`);
    const start = Date.now();
    const result = await settlement.pay(seller.url);
    const ms = Date.now() - start;

    console.log(`\n  ✓ Nanopayment accepted by Gateway facilitator (${ms}ms)`);
    console.log(`    Amount:  ${result.amountUsdc} USDC`);

    const settleId =
      result.txHash ||
      (observedSettlement && (observedSettlement as { txHash?: string }).txHash) ||
      "";
    // Circle Gateway batches settlements: verify+settle returning success means
    // the authorization was accepted into a batch. The on-chain USDC transfer to
    // the seller lands when the batch flushes (asynchronously), NOT immediately.
    // A real EVM tx hash is 0x + 64 hex; anything else (e.g. a UUID) is Circle's
    // settlement/batch id, which must NOT be linked as an /tx/ — that would
    // misrepresent it as a confirmed on-chain transaction.
    const isEvmTxHash = /^0x[0-9a-fA-F]{64}$/.test(settleId);
    if (isEvmTxHash) {
      console.log(`    On-chain tx: ${ARC_TESTNET_EXPLORER}/tx/${settleId}`);
    } else if (settleId) {
      console.log(`    Gateway settlement id: ${settleId}`);
      console.log(
        `    (batched — the on-chain transfer to the seller settles ` +
          `asynchronously; this id is NOT an EVM tx hash)`,
      );
    } else {
      console.log(
        `    (facilitator returned success but no id surfaced by the SDK)`,
      );
    }
    console.log(
      `    Watch seller for the settled transfer: ` +
        `${ARC_TESTNET_EXPLORER}/address/${sellerAddress}`,
    );
  } finally {
    await seller.close();
  }

  console.log("\n── Done ──");
}

main().catch((err) => {
  console.error("\n[FAILED]", err?.message ?? err);
  process.exit(1);
});
