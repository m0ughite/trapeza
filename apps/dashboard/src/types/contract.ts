/**
 * Trapeza dashboard data contract — THE SINGLE SOURCE OF TRUTH for the two
 * artifacts the dashboard consumes:
 *
 *   - `demo-run.json`        (one per historical run; emitted by demo/emit-run.ts)
 *   - `onchain-receipts.json`(real Arc-testnet settlement receipts; emitted by
 *                             demo/emit-onchain.ts)
 *
 * This file is intentionally dependency-free (pure types + two version consts) so
 * it can be imported from BOTH the Node engine→JSON driver and the browser
 * bundle without dragging in any runtime. The offline driver reaches into this
 * file by relative path; the dashboard is self-contained around it (nothing in
 * the deployed build imports outside `apps/dashboard/`).
 *
 * Money crosses this boundary as decimal-USDC strings (e.g. "0.150000") to match
 * the engine's `formatMicroToUsdc` output; probabilities/scores are numbers.
 */

export const DEMO_RUN_SCHEMA_VERSION = "1.0.0" as const;
export const ONCHAIN_RECEIPTS_SCHEMA_VERSION = "1.0.0" as const;

// ─────────────────────────────────────────────────────────────────────────────
// demo-run.json
// ─────────────────────────────────────────────────────────────────────────────

export interface RunMeta {
  /** Stable id, e.g. "invoice-workflow". Used as the fixture key + URL slug. */
  runId: string;
  /** Human title for the run picker. */
  label: string;
  /** One-line story of what this graph exercises. */
  description: string;
  /** Longer narrative shown in the clearing view. */
  narrative: string;
  /** ISO timestamp the fixture was generated. */
  generatedAt: string;
  seed: number;
  /** Was the Python CP-SAT service reachable when this run was emitted? */
  solverServiceUp: boolean;
  /** Solver that produced the headline clearing. */
  headlineSolver: SolverKind;
}

export type SolverKind = "cp_sat" | "highs_milp" | "greedy_lns";

export interface GraphNodeView {
  nodeId: string;
  capability: string;
  valueUsdc: string;
  budgetUsdc: string;
  bondRatio: number;
  qualityFloor: number | null;
  /** True when this node is the deliberate budget/quality bottleneck. */
  bottleneck: boolean;
}

export interface GraphEdgeView {
  from: string;
  to: string;
}

export interface GraphView {
  id: string;
  globalBudgetUsdc: string;
  globalDeadlineMs: number;
  globalQualityFloor: number | null;
  riskAversion: number;
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
}

/** One provider's calibration ledger row — the MarketBench moat, made visible. */
export interface ProviderView {
  id: string;
  capabilities: string[];
  priceUsdc: string;
  bondOfferedUsdc: string;
  /** Self-reported (bid) success probability — a PRIOR, never trusted directly. */
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  /** Bayesian posterior mean of realized success (α/(α+β)). */
  calibratedSuccessProb: number;
  pSuccessStdDev: number;
  successAlpha: number;
  successBeta: number;
  costMeanUsdc: number;
  latencyMeanMs: number;
  nObservations: number;
  /** "workhorse" (claims low, delivers) vs "braggart" (claims high, fails). */
  archetype: "workhorse" | "braggart" | "neutral";
}

export interface AllocationView {
  nodeId: string;
  taskId: string;
  providerId: string;
  score: number;
}

export interface ScheduleEntryView {
  nodeId: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

/** The headline clearing (calibration ON, primary solver). */
export interface ClearingView {
  solver: SolverKind;
  degraded: boolean;
  objectiveValue: number;
  makespanMs: number;
  preflightPassed: boolean;
  allocations: AllocationView[];
  schedule: ScheduleEntryView[];
  /** nodeId → settlement price (min(ask, reserve)), decimal USDC. */
  settlementPricesUsdc: Record<string, string>;
  totalClearedUsdc: string;
  /** LP-dual clearing prices keyed by constraint (display only). */
  shadowPricesUsdc: Record<string, string>;
}

/** One side of the calibration ON-vs-OFF contrast. */
export interface CalibrationModeResult {
  /** "on" trusts realized-outcome posteriors; "off" trusts self-reported bids. */
  mode: "on" | "off";
  solver: SolverKind;
  objectiveValue: number;
  allocations: AllocationView[];
  /** Π realized pHat over the chosen providers — the true end-to-end success. */
  realizedEndToEndSuccess: number;
  /** Π claimed pHat — what the bids promised. */
  claimedEndToEndSuccess: number;
  /** Expected realized spend over the chosen providers (decimal USDC). */
  expectedSpendUsdc: string;
}

/**
 * Calibration ledger contrast — the moat. Same market, one flag: OFF trusts
 * bids and buys lemons; ON prices realized outcomes and quality re-emerges.
 */
export interface CalibrationContrast {
  on: CalibrationModeResult;
  off: CalibrationModeResult;
  /** Node ids whose provider changed between OFF and ON. */
  divergentNodes: string[];
  /** realizedEndToEndSuccess(on) − realizedEndToEndSuccess(off). */
  successLift: number;
}

export interface BakeOffSolverResult {
  solverLabel: string;
  kind: SolverKind;
  status: "cleared" | "failed";
  objectiveValue: number | null;
  /** Present when status === "failed": the ClearingError code + message. */
  errorCode: string | null;
  errorMessage: string | null;
  assignments: AllocationView[];
}

/**
 * CoW-style 2-solver bake-off on the same DAG: the graph-aware CP-SAT clearing
 * vs the naive greedy per-node router. The money shot: greedy overspends early
 * and can't afford the bottleneck.
 */
export interface BakeOff {
  greedy: BakeOffSolverResult;
  optimal: BakeOffSolverResult;
  winner: SolverKind;
  narrative: string;
}

export interface TwinMonteCarlo {
  engine: "python" | "ts";
  iterations: number;
  deadlineMs: number;
  failureProbability: number;
  budgetOverrunProbability: number;
  deadlineBreachProbability: number;
  expectedNetCostUsdc: number;
}

export interface PreflightView {
  fundedPassed: boolean;
  underFunded: {
    passed: boolean;
    summary: string;
    errors: string[];
  };
}

/** RFB-3 named metrics, derived from the clearing. */
export interface TractionMetrics {
  nodesCleared: number;
  totalClearedUsdc: string;
  /** cleared value delivered per USDC spent. */
  resultPerUsdc: number;
  makespanMs: number;
  /** longest dependency chain length (payment-chain depth). */
  paymentChainDepth: number;
  /** |E| / |V| — how connected the workflow is. */
  graphDensity: number;
  providerCount: number;
}

export interface DemoRun {
  schemaVersion: typeof DEMO_RUN_SCHEMA_VERSION;
  meta: RunMeta;
  graph: GraphView;
  providers: ProviderView[];
  clearing: ClearingView;
  calibration: CalibrationContrast;
  bakeOff: BakeOff;
  twin: TwinMonteCarlo | null;
  preflight: PreflightView;
  traction: TractionMetrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// onchain-receipts.json
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single on-chain artifact. `kind` decides linkability: only "evm-tx" (a real
 * 0x+64hex hash) is ever rendered as an arcscan /tx/ link. A Gateway settlement
 * UUID is "gateway-settlement-id" and MUST NOT be linked as a tx — that is the
 * repo's honesty rule.
 */
export interface OnchainRef {
  kind: "evm-tx" | "gateway-settlement-id" | "address";
  value: string;
  /** arcscan URL when linkable (evm-tx / address); null for UUIDs. */
  url: string | null;
  linkable: boolean;
  label: string;
}

export interface SettlementReceipt {
  nodeId: string;
  providerId: string;
  amountUsdc: string;
  /** Whether this settlement was executed live in this emit, or is a proven prior. */
  live: boolean;
  latencyMs: number | null;
  payer: string;
  seller: string;
  /** The Gateway deposit (real on-chain tx into the unified balance). */
  depositTx: OnchainRef | null;
  /** Circle Gateway settlement/batch UUID (NOT an EVM tx). */
  gatewaySettlementId: OnchainRef | null;
  /** Only set if a real 0x+64hex settlement tx actually surfaced. */
  settlementTx: OnchainRef | null;
  note: string;
}

export interface IdentityReceipt {
  agentId: string;
  register: OnchainRef;
  reputation: OnchainRef | null;
}

export interface OnchainReceipts {
  schemaVersion: typeof ONCHAIN_RECEIPTS_SCHEMA_VERSION;
  meta: {
    generatedAt: string;
    network: string;
    caip2: string;
    explorer: string;
    /** live = executed now; fallback-proven = reused proven spike hashes; mixed. */
    mode: "live" | "fallback-proven" | "mixed";
    /** Which demo-run this settlement batch corresponds to. */
    runId: string;
    honestyNote: string;
  };
  identity: IdentityReceipt | null;
  settlements: SettlementReceipt[];
}
