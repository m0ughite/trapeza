/**
 * EV-based router (CASTER-style) + value-tiered mechanism shell (AEX-style).
 *
 * The router scores every candidate provider for a task by calibrated expected
 * net value and selects the argmax. The load-bearing rule (DESIGN.md §2):
 *
 *     score = p_success · value − price − risk_premium
 *
 * where, with CALIBRATION ON, `p_success` comes from the realized-outcome
 * ledger (`@trapeza/core/calibration`) and NEVER from the quote. With
 * CALIBRATION OFF, `p_success` is the provider's self-reported claim — this is
 * the one-line switch that powers the lemons-collapse contrast.
 *
 * Pure functions only: no chain, no storage, no I/O. The pipeline feeds it
 * resolved calibration records; the router decides.
 */

import type { TrapezaConfig } from "./config.js";
import {
  calibratedEstimate,
  pSuccessStdDev,
  type CalibratedEstimate,
} from "./calibration.js";
import type {
  Allocation,
  CalibrationRecord,
  MechanismId,
  Quote,
  TaskSpec,
} from "./models.js";

/** One candidate the router scores: a quote paired with its ledger record. */
export interface RouteCandidate {
  quote: Quote;
  /** The provider's calibration record for this task's capability. */
  calibration: CalibrationRecord;
}

export interface ScoredCandidate {
  providerId: string;
  score: number;
  /** The p_success actually used for scoring (calibrated or claimed). */
  pSuccessUsed: number;
  priceUsdc: number;
  riskPremium: number;
  source: "calibrated" | "self-reported";
}

export interface RouteResult {
  allocation: Allocation;
  /** All candidates, scored and sorted desc — useful for routing logs / demo. */
  ranked: ScoredCandidate[];
}

/**
 * Score a single candidate.
 * @param useCalibration when true, `p_success` and its uncertainty come from the
 *   ledger; when false, from the self-reported quote (and uncertainty is 0 —
 *   we're choosing to trust the claim, warts and all).
 */
export function scoreCandidate(
  spec: TaskSpec,
  candidate: RouteCandidate,
  useCalibration: boolean,
  config: TrapezaConfig,
): ScoredCandidate {
  const value = toNum(spec.budgetUsdc);
  const price = toNum(candidate.quote.priceUsdc);
  const bondOffered = toNum(candidate.quote.bondOfferedUsdc);

  let pSuccess: number;
  let pStdDev: number;
  let source: ScoredCandidate["source"];

  if (useCalibration) {
    const est: CalibratedEstimate = calibratedEstimate(candidate.calibration);
    pSuccess = est.pSuccess;
    pStdDev = est.pSuccessStdDev;
    source = "calibrated";
  } else {
    // CALIBRATION OFF: trust the bid. This is the only place a self-report is
    // allowed to influence allocation, and it exists purely for the demo
    // contrast — never use this path when you care about allocation quality.
    pSuccess = clamp01(candidate.quote.claimedSuccessProb);
    pStdDev = 0;
    source = "self-reported";
  }

  const riskPremium = computeRiskPremium({
    spec,
    value,
    pSuccess,
    pStdDev,
    bondOffered,
    config,
  });

  const score = pSuccess * value - price - riskPremium;

  return {
    providerId: candidate.quote.providerId,
    score,
    pSuccessUsed: pSuccess,
    priceUsdc: price,
    riskPremium,
    source,
  };
}

/**
 * risk_premium(bond, variance) — two grounded components scaled by the
 * requester's risk preference and the global risk-aversion ρ:
 *
 *   1. Expected UNRECOVERED loss on failure: (1 − p) · max(0, value − bond).
 *      A bond that fully covers the value drives this to 0, because an
 *      oracle-verified failure slashes the bond and makes the requester whole.
 *      This is exactly how "skin in the game" earns a routing advantage.
 *   2. Posterior-uncertainty penalty: stddev(p) · value. Thin/uncertain ledgers
 *      cost a provider until they accumulate observations. Zero when calibration
 *      is off (we've chosen to trust the claim).
 */
export function computeRiskPremium(args: {
  spec: TaskSpec;
  value: number;
  pSuccess: number;
  pStdDev: number;
  bondOffered: number;
  config: TrapezaConfig;
}): number {
  const { spec, value, pSuccess, pStdDev, bondOffered, config } = args;
  const w = spec.preference.risk * config.riskAversion;
  const expectedUnrecoveredLoss =
    (1 - pSuccess) * Math.max(0, value - bondOffered);
  const uncertaintyPenalty = pStdDev * value;
  return w * (expectedUnrecoveredLoss + uncertaintyPenalty);
}

/**
 * Value-tiered mechanism selection (DESIGN.md §2). A pragmatic shell:
 *   - time-critical (tight latency budget)            → Dutch (descending clock)
 *   - cheap / commoditized (value ≤ postedPriceMax)   → posted price + FCFS
 *   - mid-value with ≥2 live candidates               → score-adjusted 2nd-price
 *   - otherwise (single candidate)                    → posted price
 *
 * In every tier the WINNER is the argmax-score provider; the mechanism only
 * governs the pricing narrative (which the settlement adapter realizes). The
 * second-price clearing price is computed as the price that would equalize the
 * winner's and runner-up's scores — a score-adjusted Vickrey — but the
 * allocation choice itself is mechanism-independent.
 */
export function selectMechanism(
  spec: TaskSpec,
  nCandidates: number,
  config: TrapezaConfig,
): MechanismId {
  const value = toNum(spec.budgetUsdc);
  if (spec.deadlineMs > 0 && spec.deadlineMs <= config.dutchDeadlineMs) {
    return "dutch";
  }
  if (value <= config.postedPriceMaxUsdc) return "posted";
  if (nCandidates >= 2) return "second_price";
  return "posted";
}

/**
 * Route a task: score all candidates, pick the highest EV, and tag the chosen
 * mechanism. Returns the `Allocation` plus the full ranked list.
 *
 * Ties are broken deterministically by lower price, then by providerId, so the
 * routing is reproducible (important for the calibration ON/OFF demo).
 */
export function route(
  spec: TaskSpec,
  candidates: RouteCandidate[],
  useCalibration: boolean,
  config: TrapezaConfig,
): RouteResult {
  if (candidates.length === 0) {
    throw new Error(`route: no candidates for task ${spec.id}`);
  }

  const ranked = candidates
    .map((c) => scoreCandidate(spec, c, useCalibration, config))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.priceUsdc - b.priceUsdc ||
        a.providerId.localeCompare(b.providerId),
    );

  const winner = ranked[0]!;
  const mechanism = selectMechanism(spec, candidates.length, config);

  const allocation: Allocation = {
    taskId: spec.id,
    providerId: winner.providerId,
    mechanism,
    score: winner.score,
  };

  return { allocation, ranked };
}

/** Re-export for convenience so the pipeline can compute std dev if needed. */
export { pSuccessStdDev };

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
