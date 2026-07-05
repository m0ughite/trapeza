/**
 * Spike: bond slash on Arc testnet via RefundProtocol (requires TRAPEZA_ESCROW_ADDRESS).
 *
 * Run: TRAPEZA_ESCROW_ADDRESS=0x... npm run spike:bond-slash
 */

import { loadEnv } from "../src/env.js";
import { ArcChainAdapter } from "../src/chain.js";
import { ARC_TESTNET_EXPLORER } from "../src/constants.js";

loadEnv();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`[BLOCKED] Missing ${name}`);
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const ownerKey = requireEnv("OWNER_PRIVATE_KEY") as `0x${string}`;
  const escrow = requireEnv("TRAPEZA_ESCROW_ADDRESS") as `0x${string}`;
  process.env.TRAPEZA_ESCROW_ADDRESS = escrow;

  const provider = (process.env.PROVIDER_WALLET ??
    "0x2222222222222222222222222222222222222222") as `0x${string}`;
  const adapter = new ArcChainAdapter({ ownerPrivateKey: ownerKey });

  console.log("── Trapeza spike: bond slash via RefundProtocol ──");
  const openTx = await adapter.openEscrow("spike-slash-1", provider, "0.01");
  console.log(`openEscrow tx: ${ARC_TESTNET_EXPLORER}/tx/${openTx}`);

  const slashTx = await adapter.resolveEscrow("spike-slash-1", "slash");
  console.log(`slash tx: ${ARC_TESTNET_EXPLORER}/tx/${slashTx}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
