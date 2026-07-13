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

export type TracePhase =
  | "validate-dag"
  | "score-candidates"
  | "assign"
  | "schedule"
  | "deadline-check"
  | "preflight"
  | "shadow-prices"
  | "bake-off"
  | "calibration"
  | "twin"
  | "settlement";

export type TraceLevel = "info" | "warn" | "error";

export interface TraceStep {
  seq: number;
  phase: TracePhase;
  nodeId?: string;
  level: TraceLevel;
  message: string;
  data?: Record<string, unknown>;
}

export type RunStatus = "cleared" | "rejected" | "degraded";

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

/**
 * Public "run your own" input contract.
 *
 * - `graph` and `providers` define the workflow market.
 * - `run` defines execution-time levers (budget/deadline/risk/calibration).
 * - The live endpoint accepts this payload directly.
 */
export interface LiveRunInput {
  graph: GraphView;
  providers: ProviderView[];
  run: LiveRunOptions;
}

export interface LiveRunOptions {
  budgetUsdc: string;
  deadlineMs: number;
  riskAversion: number;
  calibration: "on" | "off";
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
  /** Outcome of the headline clearing run. */
  status?: RunStatus;
  /** Present when status is rejected or degraded. */
  error?: { code: string; message: string };
  graph: GraphView;
  providers: ProviderView[];
  clearing: ClearingView;
  calibration: CalibrationContrast;
  bakeOff: BakeOff;
  twin: TwinMonteCarlo | null;
  preflight: PreflightView;
  traction: TractionMetrics;
  /** Step-by-step execution trace from engine + driver enrichment. */
  trace?: TraceStep[];
}

/** Rich manifest entry for the Scenario Explorer. */
export interface ManifestRun {
  runId: string;
  label: string;
  description: string;
  proves: string;
  tags: string[];
  headline: string;
  nodeCount: number;
  providerCount: number;
  capabilities: string[];
  tier: "tier1" | "tier2";
  status: RunStatus;
}

export interface FixtureManifest {
  schemaVersion: typeof DEMO_RUN_SCHEMA_VERSION;
  runs: ManifestRun[];
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

// ─────────────────────────────────────────────────────────────────────────────
// arctask-clearing.json — Trapeza as clearing + evaluator brain over ArcTask
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The ArcTask integration in the approved "brain" model: Trapeza reads the
 * ArcTask agent registry, ranks the registered agents by calibrated expected
 * net value, PICKS the winner (the routing decision — Trapeza's core value),
 * assigns the job on-chain, lets ArcTask's OWN worker execute, then verifies as
 * the registered evaluator and settles escrow (acceptWork / rejectWork). Trapeza
 * is NEVER the worker; it never submits a deliverable.
 *
 * This file is emitted by `scripts/arc-integration-harness.ts`. In `simulated`
 * mode the ranking is representative and the on-chain refs are non-linkable
 * placeholders (never rendered as explorer links); any real 0x+64-hex hashes
 * carried over from a proven prior live run are labeled as such and are the only
 * refs that link out.
 */
export type ArcTaskMode = "simulated" | "live";

/** One provider in the ArcTask registry directory, with its calibrated score. */
export interface ArcRegistryAgentView {
  agentId: string;
  providerId: string;
  wallet: string;
  capabilities: string[];
  status: "active" | "suspended";
  /** Self-reported (bid) success probability — a PRIOR, never the signal. */
  claimedSuccessProb: number;
  /** Bayesian posterior mean of realized success (α/(α+β)) from the ledger. */
  calibratedSuccessProb: number;
  nObservations: number;
  priceUsdc: string;
  bondUsdc: string;
  archetype: "workhorse" | "braggart" | "neutral";
}

/** One scored candidate in the clearing decision (from @trapeza/core router). */
export interface ArcRankedCandidate {
  rank: number;
  providerId: string;
  agentId: string;
  /** score = p_success·value − price − risk_premium (decimal USDC of net value). */
  score: number;
  /** The p_success actually used to score (calibrated posterior, ON path). */
  pSuccessUsed: number;
  source: "calibrated" | "self-reported";
  priceUsdc: number;
  riskPremium: number;
  /** True for the argmax-score agent that the clearing hired. */
  hired: boolean;
}

/**
 * One step of the on-chain lifecycle, each anchored by a ref. `key` names the
 * marketplace action; only "evm-tx" refs that are real 0x+64-hex hashes link out.
 */
export interface ArcTaskStep {
  key: "createJob" | "submitDeliverable" | "settle" | "reputation";
  label: string;
  detail: string;
  ref: OnchainRef;
}

export interface ArcTaskClearingReceipt {
  schemaVersion: typeof ONCHAIN_RECEIPTS_SCHEMA_VERSION;
  meta: {
    generatedAt: string;
    network: string;
    caip2: string;
    explorer: string;
    mode: ArcTaskMode;
    /** Which marketplace this integrates with. */
    provider: string;
    registryAddress: string;
    escrowAddress: string;
    usdcRail: "native" | "erc20";
    /** Trapeza's registered evaluator wallet (accept/reject authority). */
    evaluator: string;
    /** True when the job was seeded by a demo client (ARCTASK_SEED_JOB). */
    seededJob: boolean;
    note: string;
  };
  job: {
    jobId: string;
    title: string;
    description: string;
    budgetUsdc: string;
    deadlineIso: string;
    /** "seeded" (posted by the demo client) vs "organic" (JobCreated ingestion). */
    source: "seeded" | "organic";
  };
  /** The calibrated agent directory read from the ArcTask registry. */
  registry: ArcRegistryAgentView[];
  /** The differentiator: ranked agents + the pick, with calibrated-EV rationale. */
  clearing: {
    useCalibration: boolean;
    winnerProviderId: string;
    winnerAgentId: string;
    mechanism: string;
    ranked: ArcRankedCandidate[];
    /** Whom calibration ON hires vs. whom trusting the bids (OFF) would hire. */
    calibratedWinner: string;
    claimedWinner: string;
    rationale: string;
  };
  /** Execution is ArcTask's OWN worker — Trapeza never submits deliverables. */
  execution: {
    /** "arctask-agent-worker" (live) or "simulated-external-worker" (offline). */
    worker: string;
    submittedByTrapeza: false;
    submitted: boolean;
    deliverable: OnchainRef | null;
    note: string;
  };
  /** Trapeza as registered evaluator: oracle verdict → accept/reject → reputation. */
  evaluation: {
    passed: boolean;
    score: number;
    settlement: "release" | "refund";
    verdictNote: string;
    steps: ArcTaskStep[];
    reputation: OnchainRef | null;
  };
  /**
   * Proven-prior on-chain lifecycle: REAL Arc-testnet transactions from an
   * earlier live ArcTask escrow run against the deployed contracts. These are
   * the only refs that link to the explorer (real 0x+64-hex). They prove the
   * chain seam end-to-end while the clearing above is the current decision.
   */
  provenLive: {
    note: string;
    registryAddress: string;
    escrowAddress: string;
    agentId: string;
    jobId: string;
    steps: ArcTaskStep[];
  } | null;
}
