/**
 * Canonical data models for the Trapeza primitive.
 *
 * These types are the contract every app, adapter, and future fork builds
 * against. They are storage- and chain-agnostic: nothing here imports a chain
 * SDK, a database client, or a UI framework. All on-chain / off-chain specifics
 * are injected through the adapter interfaces in `./interfaces.ts`.
 *
 * Mirrors DESIGN.md §4.1 verbatim (with light doc additions). Do not add
 * Circle/Arc-specific fields here — put them in the adapters.
 */

/** A capability identifier, e.g. "extract.invoice.v1", "code.fix.v1". */
export type Capability = string;

export type MechanismId = "posted" | "second_price" | "dutch";

/**
 * Dynamic price surface (RFB-2): a pure function from observed load and task
 * complexity to a USDC price string. Kept as a function type so providers can
 * price dynamically without leaking how they do it.
 */
export type PriceSurface = (load: number, complexity: number) => string;

export interface ProviderProfile {
  id: string;
  /** ERC-8004 IdentityRegistry tokenId; null until the identity is minted. */
  agentId: bigint | null;
  wallet: `0x${string}`;
  capabilities: Capability[];
  /** x402-protected URL the broker calls to execute work. */
  endpoint: string;
  priceSurface: PriceSurface;
  bondBalanceUsdc: string;
  status: "active" | "suspended";
}

export interface TaskSpec {
  id: string;
  capability: Capability;
  input: unknown;
  /** JSON Schema + ground-truth ref (v1) | hidden test ref (v2). */
  oracleSpec: unknown;
  budgetUsdc: string;
  /** Preference weights, Σ = 1. */
  preference: { price: number; latency: number; quality: number; risk: number };
  deadlineMs: number;
}

/**
 * A provider self-report. Treated as a PRIOR, never trusted directly — the EV
 * router scores on the calibration ledger's realized outcomes, not this.
 */
export interface Quote {
  providerId: string;
  priceUsdc: string;
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  bondOfferedUsdc: string;
}

/** The MarketBench core object: per-(provider, capability) realized posteriors. */
export interface CalibrationRecord {
  providerId: string;
  capability: Capability;
  /** Beta posterior on p_success. */
  successAlpha: number;
  successBeta: number;
  /** Realized USDC cost. */
  costMean: number;
  costVar: number;
  latencyMean: number;
  latencyVar: number;
  nObservations: number;
  lastUpdate: number;
}

export interface Bond {
  id: string;
  providerId: string;
  taskId: string;
  amountUsdc: string;
  state: "posted" | "released" | "slashed";
  escrowTxHash?: string;
}

export interface Outcome {
  taskId: string;
  providerId: string;
  passed: boolean;
  /** 0..100. */
  score: number;
  evidenceURI: string;
  realizedCostUsdc: string;
  realizedLatencyMs: number;
}

export interface Allocation {
  taskId: string;
  providerId: string;
  mechanism: MechanismId;
  /** score = calibrated_p_success × value − price − risk_premium(bond, variance). */
  score: number;
}
