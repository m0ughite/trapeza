import { describe, expect, it } from "vitest";
import {
  addMicro,
  compareMicro,
  formatMicroToUsdc,
  MICRO_USDC_PER_USDC,
  numberUsdcToMicro,
  parseUsdcToMicro,
  scaleLogProbability,
  scaleProbability,
} from "@trapeza/core";

describe("micro-USDC money", () => {
  it("round-trips parse and format", () => {
    expect(formatMicroToUsdc(parseUsdcToMicro("1.234567"))).toBe("1.234567");
    expect(formatMicroToUsdc(parseUsdcToMicro("0.000001"))).toBe("0.000001");
    expect(formatMicroToUsdc(parseUsdcToMicro("100"))).toBe("100.000000");
  });

  it("adds and compares without float drift", () => {
    const a = parseUsdcToMicro("0.10");
    const b = parseUsdcToMicro("0.20");
    expect(addMicro(a, b)).toBe(parseUsdcToMicro("0.30"));
    expect(compareMicro(a, b)).toBe(-1);
    expect(compareMicro(b, a)).toBe(1);
    expect(compareMicro(a, a)).toBe(0);
  });

  it("converts JS number USDC to micro bigint", () => {
    expect(numberUsdcToMicro(1.5)).toBe(1_500_000n);
    expect(MICRO_USDC_PER_USDC).toBe(1_000_000n);
  });

  it("scales probabilities for MILP coefficients", () => {
    expect(scaleProbability(0.5)).toBe(500_000);
    expect(scaleLogProbability(1)).toBe(0);
    expect(scaleLogProbability(0.5)).toBeLessThan(0);
  });
});
