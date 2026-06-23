/**
 * Bayesian calibration ledger — the MarketBench moat.
 *
 * Per (provider, capability) we maintain a Beta(α, β) posterior over the
 * provider's realized success probability, plus running mean/variance estimates
 * of realized cost and latency. The ledger is updated ONLY from realized
 * `Outcome`s (see `updateCalibration`); provider self-reports / bids never touch
 * it. That separation is the whole point: the router's allocation signal comes
 * from this ledger, not from what providers claim about themselves.
 *
 * Math is deliberately simple and defensible (DESIGN.md §5):
 *   - p_success: Beta-Binomial. Prior Beta(1,1) (uniform) by default. A pass
 *     increments α, a failure increments β. Posterior mean = α / (α + β).
 *   - cost / latency: Welford online mean + (population) variance.
 *
 * No chain, no storage, no UI here — pure functions over `CalibrationRecord`.
 */

import type { Capability, CalibrationRecord, Outcome } from "./models.js";

/**
 * The neutral cold-start prior. Beta(1,1) is uniform on [0,1] (mean 0.5) so a
 * brand-new provider is treated as a coin flip until it earns a reputation from
 * realized outcomes. We intentionally do NOT seed this from the provider's
 * self-reported success probability — that would let a bid leak into the
 * allocation signal, which DESIGN.md forbids. See README / report notes.
 */
export const PRIOR_ALPHA = 1;
export const PRIOR_BETA = 1;

/** A fresh, observation-free calibration record for a (provider, capability). */
export function defaultCalibration(
  providerId: string,
  capability: Capability,
): CalibrationRecord {
  return {
    providerId,
    capability,
    successAlpha: PRIOR_ALPHA,
    successBeta: PRIOR_BETA,
    costMean: 0,
    costVar: 0,
    latencyMean: 0,
    latencyVar: 0,
    nObservations: 0,
    lastUpdate: 0,
  };
}

/** Posterior mean of p_success = α / (α + β). */
export function pSuccessMean(record: CalibrationRecord): number {
  return record.successAlpha / (record.successAlpha + record.successBeta);
}

/**
 * Posterior variance of the Beta(α, β): αβ / ((α+β)² (α+β+1)).
 * Shrinks toward 0 as observations accumulate — this is the uncertainty the
 * router prices into its risk premium.
 */
export function pSuccessVariance(record: CalibrationRecord): number {
  const a = record.successAlpha;
  const b = record.successBeta;
  const s = a + b;
  return (a * b) / (s * s * (s + 1));
}

/** Posterior standard deviation of p_success. */
export function pSuccessStdDev(record: CalibrationRecord): number {
  return Math.sqrt(pSuccessVariance(record));
}

/**
 * Fold one realized `Outcome` into a calibration record, returning a NEW record
 * (pure — does not mutate the input). This is the only writer of the ledger.
 *
 * @param now timestamp to stamp `lastUpdate` with (injected for determinism in
 *   tests). Defaults to `Date.now()`.
 */
export function updateCalibration(
  prev: CalibrationRecord,
  outcome: Outcome,
  now: number = Date.now(),
): CalibrationRecord {
  const successAlpha = prev.successAlpha + (outcome.passed ? 1 : 0);
  const successBeta = prev.successBeta + (outcome.passed ? 0 : 1);

  const n = prev.nObservations + 1;
  const cost = Number(outcome.realizedCostUsdc);
  const latency = outcome.realizedLatencyMs;

  const [costMean, costVar] = welford(
    prev.costMean,
    prev.costVar,
    prev.nObservations,
    Number.isFinite(cost) ? cost : 0,
  );
  const [latencyMean, latencyVar] = welford(
    prev.latencyMean,
    prev.latencyVar,
    prev.nObservations,
    Number.isFinite(latency) ? latency : 0,
  );

  return {
    providerId: prev.providerId,
    capability: prev.capability,
    successAlpha,
    successBeta,
    costMean,
    costVar,
    latencyMean,
    latencyVar,
    nObservations: n,
    lastUpdate: now,
  };
}

/**
 * Welford online update returning the new (mean, populationVariance).
 * `prevVar` is the population variance over `prevN` samples; we reconstruct the
 * sum-of-squared-deviations (M2 = var · n) to stay numerically stable without
 * needing to store M2 separately on the record.
 */
function welford(
  prevMean: number,
  prevVar: number,
  prevN: number,
  x: number,
): [number, number] {
  const n = prevN + 1;
  const m2Prev = prevVar * prevN;
  const delta = x - prevMean;
  const mean = prevMean + delta / n;
  const delta2 = x - mean;
  const m2 = m2Prev + delta * delta2;
  return [mean, m2 / n];
}

/**
 * A read-friendly snapshot of what the router consumes from the ledger: the
 * calibrated success probability and the realized cost estimate (plus the
 * uncertainty the risk premium uses). Self-reports are never part of this.
 */
export interface CalibratedEstimate {
  pSuccess: number;
  pSuccessStdDev: number;
  costMeanUsdc: number;
  latencyMeanMs: number;
  nObservations: number;
}

export function calibratedEstimate(
  record: CalibrationRecord,
): CalibratedEstimate {
  return {
    pSuccess: pSuccessMean(record),
    pSuccessStdDev: pSuccessStdDev(record),
    costMeanUsdc: record.costMean,
    latencyMeanMs: record.latencyMean,
    nObservations: record.nObservations,
  };
}
