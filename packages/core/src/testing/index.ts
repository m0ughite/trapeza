/**
 * `@trapeza/core/testing` — in-memory mock implementations of every injected
 * dependency, so the primitive (and the app) can run end-to-end with no chain
 * access and no credentials. These are deliberately swappable for the real
 * `@trapeza/adapter-arc` / `@trapeza/adapter-gateway`.
 */

export { InMemoryStore } from "./store.js";
export {
  MockSettlementAdapter,
  MockChainAdapter,
  MockOracle,
  MockQuoteSource,
  type RecordedPayment,
  type RecordedFeedback,
  type RecordedEscrow,
  type OracleVerdict,
  type QuoteFn,
} from "./adapters.js";
