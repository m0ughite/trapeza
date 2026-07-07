import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, route, scoreCandidate, taskValueUsdc } from "@trapeza/core";
import { defaultCalibration } from "@trapeza/core";
import { makeQuote, makeTask } from "./helpers.js";

describe("router valueUsdc", () => {
  it("scores on valueUsdc not budgetUsdc", () => {
    const task = makeTask({
      valueUsdc: "0.05",
      budgetUsdc: "10.00",
    });
    expect(taskValueUsdc(task)).toBe(0.05);

    const cal = defaultCalibration("p", task.capability);
    const scored = scoreCandidate(
      task,
      { quote: makeQuote("p", { priceUsdc: "0.01" }), calibration: cal },
      true,
      DEFAULT_CONFIG,
    );
    // score ≈ p * value - price; with uniform prior p≈0.5 → ~0.025 - 0.01
    expect(scored.score).toBeLessThan(0.5);
    expect(scored.score).toBeGreaterThan(0);
  });

  it("high budget does not inflate EV when value is low", () => {
    const cheapValue = makeTask({
      valueUsdc: "0.01",
      budgetUsdc: "100.00",
    });
    const highValue = makeTask({
      valueUsdc: "5.00",
      budgetUsdc: "5.00",
    });
    const cal = defaultCalibration("p", "extract.invoice.v1");
    const q = makeQuote("p", { priceUsdc: "0.10", claimedSuccessProb: 0.9 });

    const cheap = route(
      cheapValue,
      [{ quote: q, calibration: cal }],
      false,
      DEFAULT_CONFIG,
    );
    const rich = route(
      highValue,
      [{ quote: q, calibration: cal }],
      false,
      DEFAULT_CONFIG,
    );
    expect(rich.allocation.score).toBeGreaterThan(cheap.allocation.score);
  });
});
