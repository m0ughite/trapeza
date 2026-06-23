import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  defaultCalibration,
  route,
  scoreCandidate,
  selectMechanism,
  updateCalibration,
  type CalibrationRecord,
  type Outcome,
  type RouteCandidate,
} from "@trapeza/core";
import { makeQuote, makeTask } from "./helpers.js";

function calWith(passes: number, fails: number): CalibrationRecord {
  let rec = defaultCalibration("p", "extract.invoice.v1");
  let now = 0;
  const o = (passed: boolean): Outcome => ({
    taskId: "t",
    providerId: "p",
    passed,
    score: passed ? 100 : 0,
    evidenceURI: "mock://e",
    realizedCostUsdc: "0.10",
    realizedLatencyMs: 100,
  });
  for (let i = 0; i < passes; i++) rec = updateCalibration(rec, o(true), ++now);
  for (let i = 0; i < fails; i++) rec = updateCalibration(rec, o(false), ++now);
  return rec;
}

describe("EV router", () => {
  it("picks the higher calibrated-EV provider", () => {
    const task = makeTask();
    // A: cheaper but only ~50% calibrated; B: same price, ~90% calibrated.
    const candidates: RouteCandidate[] = [
      { quote: makeQuote("A", { priceUsdc: "0.10" }), calibration: calWith(5, 5) },
      { quote: makeQuote("B", { priceUsdc: "0.10" }), calibration: calWith(9, 1) },
    ];
    const { allocation, ranked } = route(task, candidates, true, DEFAULT_CONFIG);
    expect(allocation.providerId).toBe("B");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    expect(ranked.every((r) => r.source === "calibrated")).toBe(true);
  });

  it("a sufficiently lower price can flip the choice (real EV tradeoff)", () => {
    const task = makeTask();
    const candidates: RouteCandidate[] = [
      { quote: makeQuote("A", { priceUsdc: "0.05" }), calibration: calWith(8, 2) },
      { quote: makeQuote("B", { priceUsdc: "0.80" }), calibration: calWith(9, 1) },
    ];
    const { allocation } = route(task, candidates, true, DEFAULT_CONFIG);
    expect(allocation.providerId).toBe("A");
  });

  it("CALIBRATION ON ignores the self-reported claim; OFF trusts it", () => {
    const task = makeTask();
    // Liar: claims 0.99 but ledger says ~0.1. Honest: claims 0.8, ledger ~0.9.
    const liar: RouteCandidate = {
      quote: makeQuote("liar", { claimedSuccessProb: 0.99, priceUsdc: "0.10" }),
      calibration: calWith(1, 9),
    };
    const honest: RouteCandidate = {
      quote: makeQuote("honest", { claimedSuccessProb: 0.8, priceUsdc: "0.10" }),
      calibration: calWith(9, 1),
    };

    const off = route(task, [liar, honest], false, DEFAULT_CONFIG);
    const on = route(task, [liar, honest], true, DEFAULT_CONFIG);

    expect(off.allocation.providerId).toBe("liar"); // lemons win when bids trusted
    expect(on.allocation.providerId).toBe("honest"); // calibration re-sorts them
    expect(off.allocation.providerId).not.toBe(on.allocation.providerId);
  });

  it("value-tiered mechanism shell selects by value / latency", () => {
    const cheap = makeTask({ budgetUsdc: "0.005" });
    const mid = makeTask({ budgetUsdc: "1.00" });
    const urgent = makeTask({ budgetUsdc: "1.00", deadlineMs: 100 });

    expect(selectMechanism(cheap, 3, DEFAULT_CONFIG)).toBe("posted");
    expect(selectMechanism(mid, 3, DEFAULT_CONFIG)).toBe("second_price");
    expect(selectMechanism(mid, 1, DEFAULT_CONFIG)).toBe("posted");
    expect(selectMechanism(urgent, 3, DEFAULT_CONFIG)).toBe("dutch");
  });

  it("a full bond drives the failure risk premium toward zero", () => {
    const task = makeTask();
    const noBond = scoreCandidate(
      task,
      { quote: makeQuote("p", { bondOfferedUsdc: "0" }), calibration: calWith(3, 7) },
      true,
      DEFAULT_CONFIG,
    );
    const fullBond = scoreCandidate(
      task,
      { quote: makeQuote("p", { bondOfferedUsdc: "1.00" }), calibration: calWith(3, 7) },
      true,
      DEFAULT_CONFIG,
    );
    // Same p_success, but the bonded provider carries a smaller risk premium.
    expect(fullBond.riskPremium).toBeLessThan(noBond.riskPremium);
    expect(fullBond.score).toBeGreaterThan(noBond.score);
  });
});
