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
import { loadEnv } from "./env.js";

loadEnv();

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

// ── ArcTask marketplace (fork / live deployment) ────────────────────────────

/** ArcTask live testnet deployment (native-USDC escrow). */
export const ARCTASK_LIVE_REGISTRY =
  "0x4ab5791a689b15126fcc7a549f8e4c7e16c5e0b8" as const;
export const ARCTASK_LIVE_ESCROW =
  "0x58ca473df727301bce771d6087f883364c83a3b6" as const;

/** Override with env after fork redeploy. Defaults to live addresses. */
export const ARCTASK_REGISTRY_ADDRESS = (process.env.ARCTASK_REGISTRY_ADDRESS ??
  ARCTASK_LIVE_REGISTRY) as `0x${string}`;
export const ARCTASK_ESCROW_ADDRESS = (process.env.ARCTASK_ESCROW_ADDRESS ??
  ARCTASK_LIVE_ESCROW) as `0x${string}`;

/**
 * USDC rail for ArcTask escrow integration.
 * - `erc20` (default): forked ArcTaskEscrowErc20 + Trapeza Gateway/x402 alignment.
 * - `native`: live ArcTask deployment (`msg.value`).
 */
export type ArcTaskUsdcMode = "native" | "erc20";

/** Read env at call time (dashboard dev may load .env after module import). */
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

export const ARCTASK_USDC_MODE: ArcTaskUsdcMode =
  process.env.ARCTASK_USDC_MODE === "native" ? "native" : "erc20";

/** ArcTask Next.js app base for REST fallback (`/api/network/jobs`). */
export const ARCTASK_API_BASE =
  process.env.ARCTASK_API_BASE ?? "https://arctask.xyz";

/** Simulated harness — no live chain calls when true. */
export const ARCTASK_SIMULATED = process.env.ARCTASK_SIMULATED === "true";
