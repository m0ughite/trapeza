/**
 * Arc testnet constants. Sourced from DESIGN.md §5 and cross-checked against the
 * bundled docs (`docs.arc.network/.../register-your-first-ai-agent.md`,
 * `circlefin-skills/use-gateway.md`) and the reference repo
 * `arc-nanopayments/lib/x402.ts` / `agent.mts`.
 *
 * We define the chain locally with viem's `defineChain` rather than importing
 * `arcTestnet` from `viem/chains`, so the adapter is independent of viem
 * version drift (the reference repos pin viem ^2.47.1, where `arcTestnet`
 * exists, but defining it here removes that coupling).
 */

import { defineChain } from "viem";

/** CAIP-2 network id used by the x402/Gateway batching SDK. */
export const ARC_TESTNET_CAIP2 = "eip155:5042002" as const;
export const ARC_TESTNET_CHAIN_ID = 5042002 as const;

export const ARC_TESTNET_RPC_URL =
  process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";

export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";

/** Native USDC on Arc testnet (gas is paid in USDC; native uses 18 decimals). */
export const ARC_TESTNET_USDC =
  "0x3600000000000000000000000000000000000000" as const;

/** ERC-8004 registries deployed on Arc testnet. */
export const IDENTITY_REGISTRY =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
export const REPUTATION_REGISTRY =
  "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const;
export const VALIDATION_REGISTRY =
  "0x8004Cb1BF31DAf7788923b405b754f57acEB4272" as const;

/**
 * viem chain definition for Arc testnet. Native currency is USDC with 18
 * decimals (Arc gas is denominated in USDC) — see arc-nanopayments/agent.mts,
 * which funds gas with `parseEther`.
 */
export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: ARC_TESTNET_EXPLORER },
  },
  testnet: true,
});

/** Default ERC-8004 metadata URI from the Arc quickstart (skip IPFS upload). */
export const DEFAULT_METADATA_URI =
  "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

// ── ArcTask marketplace (live external provider) ────────────────────────────
//
// ArcTask (github.com/VadymManiuk/ArcTask) is an Arc-native agent job
// marketplace: USDC escrow + ERC-8183-style job lifecycle + an ERC-8004-style
// agent registry, deployed on Arc testnet. Trapeza plugs in as the clearing +
// evaluator brain, settling escrow via accept/reject. These addresses point at
// the live deployment; override via env after a self-hosted fork/redeploy.
//
// NOTE: these values are read lazily via the `readArctask*` helpers below (not
// at module load) so a caller that runs `loadEnv()` at startup still wins.

/** ArcTask live testnet deployment (native-USDC escrow). */
export const ARCTASK_LIVE_REGISTRY =
  "0x4ab5791a689b15126fcc7a549f8e4c7e16c5e0b8" as const;
export const ARCTASK_LIVE_ESCROW =
  "0x58ca473df727301bce771d6087f883364c83a3b6" as const;

/** Override with env after fork redeploy. Defaults to the live addresses. */
export const ARCTASK_REGISTRY_ADDRESS = (process.env.ARCTASK_REGISTRY_ADDRESS ??
  ARCTASK_LIVE_REGISTRY) as `0x${string}`;
export const ARCTASK_ESCROW_ADDRESS = (process.env.ARCTASK_ESCROW_ADDRESS ??
  ARCTASK_LIVE_ESCROW) as `0x${string}`;

/**
 * USDC rail for ArcTask escrow integration.
 * - `erc20`: forked ArcTaskEscrowErc20 (aligns with Trapeza Gateway/x402 rail).
 * - `native` (live deployment default): escrow via `msg.value`.
 */
export type ArcTaskUsdcMode = "native" | "erc20";

/** Read env at call time (a dev server may load `.env` after module import). */
export function readArctaskRegistryAddress(): `0x${string}` {
  return (process.env.ARCTASK_REGISTRY_ADDRESS ?? ARCTASK_LIVE_REGISTRY) as `0x${string}`;
}

export function readArctaskEscrowAddress(): `0x${string}` {
  return (process.env.ARCTASK_ESCROW_ADDRESS ?? ARCTASK_LIVE_ESCROW) as `0x${string}`;
}

export function readArctaskApiBase(): string {
  return process.env.ARCTASK_API_BASE ?? "https://arctask.xyz";
}

export function readArctaskUsdcMode(): ArcTaskUsdcMode {
  return process.env.ARCTASK_USDC_MODE === "native" ? "native" : "erc20";
}

export function readArctaskSimulated(): boolean {
  return process.env.ARCTASK_SIMULATED === "true";
}

/**
 * Module-level snapshots for defaults. These are evaluated at import time, so
 * pass an explicit value (or set the env var at process start) when it matters;
 * the `readArctask*` helpers above are the lazy, always-current path.
 */
export const ARCTASK_USDC_MODE: ArcTaskUsdcMode =
  process.env.ARCTASK_USDC_MODE === "native" ? "native" : "erc20";

/** ArcTask app base for the REST job-discovery fallback (`/api/network/jobs`). */
export const ARCTASK_API_BASE =
  process.env.ARCTASK_API_BASE ?? "https://arctask.xyz";

/** Simulated harness — no live chain calls when true. */
export const ARCTASK_SIMULATED = process.env.ARCTASK_SIMULATED === "true";
