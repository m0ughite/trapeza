/**
 * @trapeza/adapter-gateway — Circle Gateway / x402 settlement adapter.
 * Client side (`GatewaySettlementAdapter`) wraps `GatewayClient`; provider side
 * (`startX402Seller`, `buildPaymentRequirements`) wraps `BatchFacilitatorClient`.
 */

export * from "./constants.js";
export * from "./settlement.js";
export * from "./x402.js";
export { LiveStateSnapshotSource } from "./live-snapshot.js";
export { loadEnv } from "./env.js";
