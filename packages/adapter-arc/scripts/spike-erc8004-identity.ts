/**
 * P0 SPIKE — register ONE ERC-8004 identity on Arc testnet.
 *
 * De-risks DESIGN.md P0 deliverable: "register one ERC-8004 identity" →
 * an identity NFT visible on arcscan. Uses the self-managed viem path against
 * the already-deployed IdentityRegistry (fewest credentials: just one funded
 * private key). The Circle Dev-Controlled-Wallets + Gas Station path (DESIGN.md
 * §5, for the agent fleet) is documented in SETUP.md but not required here.
 *
 * Required env (see .env.example):
 *   OWNER_PRIVATE_KEY   0x… key for an Arc-testnet wallet funded with USDC (gas)
 * Optional:
 *   METADATA_URI        defaults to the Arc quickstart example IPFS URI
 *   VALIDATOR_PRIVATE_KEY  if set, also records ONE reputation feedback event
 *   ARC_RPC_URL         defaults to https://rpc.testnet.arc.network
 *
 * Run:  npm run spike:erc8004   (from repo root)
 *
 * This script performs a REAL on-chain transaction. It prints only what it
 * actually observes from receipts/reads — it never fabricates a tx hash.
 */

import { createPublicClient, formatEther, http } from "viem";
import { loadEnv } from "../src/env.js";
import {
  ArcChainAdapter,
  type ArcChainAdapterConfig,
} from "../src/chain.js";
import {
  arcTestnet,
  ARC_TESTNET_EXPLORER,
  ARC_TESTNET_RPC_URL,
  DEFAULT_METADATA_URI,
} from "../src/constants.js";

loadEnv();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(
      `\n[BLOCKED] Missing required env var: ${name}\n` +
        `  This spike performs a real on-chain registration and cannot run ` +
        `without it.\n  See SETUP.md for how to obtain it, then add it to .env.\n`,
    );
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  console.log("── Trapeza P0 spike: ERC-8004 identity registration ──\n");

  const ownerPrivateKey = requireEnv("OWNER_PRIVATE_KEY") as `0x${string}`;
  const validatorPrivateKey = process.env.VALIDATOR_PRIVATE_KEY?.trim() as
    | `0x${string}`
    | undefined;
  const metadataURI = process.env.METADATA_URI?.trim() || DEFAULT_METADATA_URI;

  const cfg: ArcChainAdapterConfig = {
    ownerPrivateKey,
    validatorPrivateKey: validatorPrivateKey || undefined,
    rpcUrl: ARC_TESTNET_RPC_URL,
  };
  const adapter = new ArcChainAdapter(cfg);

  console.log(`  RPC:        ${ARC_TESTNET_RPC_URL}`);
  console.log(`  Owner:      ${adapter.ownerAddress}`);
  console.log(`  MetadataURI ${metadataURI}\n`);

  // Preflight: confirm the owner has gas (Arc gas is native USDC, 18 decimals).
  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(ARC_TESTNET_RPC_URL),
  });
  const balance = await publicClient.getBalance({
    address: adapter.ownerAddress,
  });
  console.log(`  Owner native balance: ${formatEther(balance)} USDC`);
  if (balance === 0n) {
    console.error(
      `\n[BLOCKED] Owner wallet has 0 native balance — it cannot pay gas.\n` +
        `  Fund ${adapter.ownerAddress} with Arc-testnet USDC via ` +
        `https://faucet.circle.com/ (select Arc Testnet), then re-run.\n`,
    );
    process.exit(1);
  }

  console.log("\n  Submitting register(metadataURI)…");
  const result = await adapter.registerIdentity({ metadataURI });

  console.log("\n  ✓ Identity registered");
  console.log(`    Agent ID:   ${result.agentId}`);
  console.log(`    Owner:      ${result.owner}`);
  console.log(`    Metadata:   ${result.tokenURI}`);
  console.log(`    Tx:         ${ARC_TESTNET_EXPLORER}/tx/${result.txHash}`);
  console.log(
    `    Identity:   ${ARC_TESTNET_EXPLORER}/address/${adapter.ownerAddress}`,
  );

  if (validatorPrivateKey) {
    console.log("\n  Validator key present — recording ONE reputation event…");
    const repTx = await adapter.giveFeedback(
      result.agentId,
      95,
      "spike_ok",
      "",
    );
    console.log(`    ✓ Reputation tx: ${ARC_TESTNET_EXPLORER}/tx/${repTx}`);
  } else {
    console.log(
      "\n  (No VALIDATOR_PRIVATE_KEY set — skipping the optional reputation " +
        "step. Identity registration alone satisfies the P0 proof.)",
    );
  }

  console.log("\n── Done ──");
}

main().catch((err) => {
  console.error("\n[FAILED]", err?.message ?? err);
  process.exit(1);
});
