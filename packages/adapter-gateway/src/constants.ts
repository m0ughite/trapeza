/**
 * Arc testnet x402 / Gateway constants. From DESIGN.md §5, cross-checked against
 * `arc-nanopayments/lib/x402.ts` and `circlefin-skills/use-gateway.md`.
 */

import { defineChain } from "viem";

/** CAIP-2 network id the x402-batching SDK expects. */
export const ARC_TESTNET_NETWORK = "eip155:5042002" as const;

/** Native USDC on Arc testnet (6-decimal ERC-20 for x402 amounts). */
export const ARC_TESTNET_USDC =
  "0x3600000000000000000000000000000000000000" as const;

/** Gateway Wallet (testnet, all EVM chains) — the x402 `verifyingContract`. */
export const ARC_TESTNET_GATEWAY_WALLET =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as const;

/** GatewayClient `chain` identifier string (NOT a viem chain object). */
export const GATEWAY_CHAIN_ID = "arcTestnet" as const;

export const ARC_TESTNET_RPC_URL =
  process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";

export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";

/** Gateway REST base (testnet) — for reference / direct API use. */
export const GATEWAY_API_TESTNET = "https://gateway-api-testnet.circle.com/v1/";

/** viem chain for Arc testnet (native USDC = gas, 18 decimals). */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_TESTNET_RPC_URL] } },
  blockExplorers: {
    default: { name: "Arcscan", url: ARC_TESTNET_EXPLORER },
  },
  testnet: true,
});
