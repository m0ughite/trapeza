/**
 * Trapeza primitive interfaces (DESIGN.md §4.2).
 *
 * `TrapezaCore` is the one canonical clearing pipeline; the app never
 * re-implements it, it only calls it. Everything chain-/storage-specific is
 * injected through `Oracle`, `SettlementAdapter`, `ChainAdapter`, and `Store`,
 * which the adapter packages (`@trapeza/adapter-arc`, `@trapeza/adapter-gateway`)
 * implement.
 *
 * HARD RULE: no implementation in this file beyond type signatures. No chain
 * SDK imports. This is the forkable boundary.
 */

import type {
  Allocation,
  Bond,
  CalibrationRecord,
  Capability,
  Outcome,
  ProviderProfile,
  Quote,
  TaskSpec,
} from "./models.js";

/**
 * The canonical clearing loop:
 *   submitTask → collectQuotes → route → postBond → execute
 *     → verify(Oracle) → settle → recordOutcome
 *
 * The CALIBRATION ON/OFF demo toggle is a single flag on `route()` (use
 * calibrated p_success vs. trust the quote), which makes the lemons-collapse
 * contrast a one-line switch.
 */
export interface TrapezaCore {
  // discovery & registration
  /** Registers a provider and mints its ERC-8004 identity via the ChainAdapter. */
  registerProvider(
    p: Omit<ProviderProfile, "id" | "agentId">,
  ): Promise<ProviderProfile>;
  listProviders(capability: Capability): Promise<ProviderProfile[]>;
  getCalibration(
    providerId: string,
    capability: Capability,
  ): Promise<CalibrationRecord>;

  // the core clearing loop
  submitTask(spec: TaskSpec): Promise<string>;
  collectQuotes(taskId: string): Promise<Quote[]>;
  /**
   * Calibrated EV routing + mechanism selection.
   * @param useCalibration when false, trusts the quote's self-reported
   *   p_success (the CALIBRATION OFF path). Defaults to true.
   */
  route(
    taskId: string,
    quotes: Quote[],
    useCalibration?: boolean,
  ): Promise<Allocation>;
  postBond(allocation: Allocation): Promise<Bond>;
  /** x402-pay the provider endpoint and return its result. */
  execute(allocation: Allocation): Promise<unknown>;
  /**
   * The `verify(Oracle)` step of the canonical pipeline: run the injected
   * `Oracle` over the executed result and return the realized `Outcome` that
   * `settle()` / `recordOutcome()` consume.
   *
   * Exposed on the core (rather than letting the app call the `Oracle`
   * directly) so the app never re-implements the pipeline — it only calls it.
   * This method is NOT in DESIGN.md §4.2's interface listing; it was added
   * during P1–P3 to give the §4.2 pipeline's explicit `verify(Oracle)` step a
   * home on the core surface. See report.
   */
  oracleVerify(spec: TaskSpec, result: unknown): Promise<Outcome>;
  settle(
    taskId: string,
    outcome: Outcome,
  ): Promise<{ action: "release" | "slash"; txHash: string }>;
  /** Updates the calibration ledger + ERC-8004 reputation. */
  recordOutcome(outcome: Outcome): Promise<void>;
}

// ── Pluggable boundaries (implemented by adapter packages) ──────────────────

export interface Oracle {
  verify(spec: TaskSpec, result: unknown): Promise<Outcome>;
}

export interface SettlementAdapter {
  /** Pay an x402-protected endpoint; returns the settled amount + tx hash. */
  pay(
    endpoint: string,
    body?: unknown,
  ): Promise<{ amountUsdc: string; txHash: string }>;
}

/**
 * Source of provider self-reports for a task (the RFQ step). In production this
 * is a network call to each provider's x402 endpoint, which is why it is an
 * injected boundary rather than inline core logic — keeping `@trapeza/core`
 * free of network/chain calls. Quotes returned here are PRIORS only; the router
 * never uses `claimedSuccessProb` as the allocation signal when calibration is
 * on. (Interface added during P1–P3 — see report; not in DESIGN.md §4.2's
 * original list, but required to keep `collectQuotes` network-free.)
 */
export interface QuoteSource {
  quotesFor(spec: TaskSpec, providers: ProviderProfile[]): Promise<Quote[]>;
}

/** Arc / ERC-8004 / bonded-escrow operations. Implemented by `@trapeza/adapter-arc`. */
export interface ChainAdapter {
  /** Mints an ERC-8004 identity, returns the tokenId (agentId). */
  mintIdentity(meta: object): Promise<bigint>;
  /**
   * Records ERC-8004 reputation feedback.
   * NOTE: the on-chain ABI is wider than these args
   * (`giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)`);
   * the adapter maps these four semantic args onto the full signature.
   */
  giveFeedback(
    agentId: bigint,
    score: number,
    tag: string,
    evidenceURI: string,
  ): Promise<string>;
  openEscrow(
    taskId: string,
    providerWallet: `0x${string}`,
    amountUsdc: string,
  ): Promise<string>;
  resolveEscrow(
    taskId: string,
    action: "release" | "slash",
  ): Promise<string>;
}

/**
 * Persistence boundary: providers, calibration, bonds, outcomes, events.
 * Left intentionally open in P0 — the concrete shape is locked in P1 once the
 * storage schema is proven (DESIGN.md phase table).
 */
export interface Store {
  getProvider(id: string): Promise<ProviderProfile | null>;
  putProvider(p: ProviderProfile): Promise<void>;
  listProviders(capability: Capability): Promise<ProviderProfile[]>;

  getCalibration(
    providerId: string,
    capability: Capability,
  ): Promise<CalibrationRecord | null>;
  putCalibration(record: CalibrationRecord): Promise<void>;

  getTask(id: string): Promise<TaskSpec | null>;
  putTask(spec: TaskSpec): Promise<void>;

  putBond(bond: Bond): Promise<void>;
  putOutcome(outcome: Outcome): Promise<void>;
}
