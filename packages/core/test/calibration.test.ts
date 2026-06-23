import { describe, expect, it } from "vitest";
import {
  calibratedEstimate,
  defaultCalibration,
  pSuccessMean,
  pSuccessVariance,
  updateCalibration,
} from "@trapeza/core";
import type { Outcome } from "@trapeza/core";

function outcome(passed: boolean, cost: string, latency: number): Outcome {
  return {
    taskId: "t",
    providerId: "p",
    passed,
    score: passed ? 100 : 0,
    evidenceURI: "mock://e",
    realizedCostUsdc: cost,
    realizedLatencyMs: latency,
  };
}

describe("calibration ledger (Beta-Binomial)", () => {
  it("starts at a neutral Beta(1,1) prior (mean 0.5, no observations)", () => {
    const rec = defaultCalibration("p", "cap");
    expect(rec.successAlpha).toBe(1);
    expect(rec.successBeta).toBe(1);
    expect(rec.nObservations).toBe(0);
    expect(pSuccessMean(rec)).toBeCloseTo(0.5, 12);
  });

  it("updates the posterior correctly over a sequence of outcomes", () => {
    let rec = defaultCalibration("p", "cap");
    // 7 passes, 3 failures, interleaved.
    const seq = [true, true, false, true, true, false, true, true, false, true];
    let now = 0;
    for (const passed of seq) {
      rec = updateCalibration(rec, outcome(passed, "0.10", 100), ++now);
    }
    // alpha = prior(1) + 7 passes; beta = prior(1) + 3 failures.
    expect(rec.successAlpha).toBe(8);
    expect(rec.successBeta).toBe(4);
    expect(rec.nObservations).toBe(10);
    expect(rec.lastUpdate).toBe(10);
    // posterior mean = 8 / 12.
    expect(pSuccessMean(rec)).toBeCloseTo(8 / 12, 12);
  });

  it("posterior variance shrinks as observations accumulate", () => {
    let rec = defaultCalibration("p", "cap");
    const wide = pSuccessVariance(rec);
    let now = 0;
    for (let i = 0; i < 50; i++) {
      rec = updateCalibration(rec, outcome(i % 2 === 0, "0.10", 100), ++now);
    }
    const narrow = pSuccessVariance(rec);
    expect(narrow).toBeLessThan(wide);
  });

  it("tracks realized cost mean/variance via Welford", () => {
    let rec = defaultCalibration("p", "cap");
    const costs = [0.1, 0.2, 0.3, 0.4]; // mean 0.25, pop var 0.0125
    let now = 0;
    for (const c of costs) {
      rec = updateCalibration(rec, outcome(true, String(c), 100), ++now);
    }
    expect(rec.costMean).toBeCloseTo(0.25, 12);
    expect(rec.costVar).toBeCloseTo(0.0125, 12);
  });

  it("calibratedEstimate exposes p_success + cost, never a self-report", () => {
    let rec = defaultCalibration("p", "cap");
    rec = updateCalibration(rec, outcome(true, "0.50", 200), 1);
    const est = calibratedEstimate(rec);
    expect(est.pSuccess).toBeCloseTo(2 / 3, 12); // Beta(2,1)
    expect(est.costMeanUsdc).toBeCloseTo(0.5, 12);
    expect(est.latencyMeanMs).toBeCloseTo(200, 12);
    expect(est.nObservations).toBe(1);
  });
});
