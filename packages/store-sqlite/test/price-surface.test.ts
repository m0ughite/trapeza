import { describe, expect, it } from "vitest";
import {
  decodePriceSurface,
  encodePriceSurface,
} from "../src/price-surface.js";

describe("price-surface", () => {
  it("round-trips fixed surface", () => {
    const surface = () => "0.25";
    const { kind, params } = encodePriceSurface(surface);
    expect(kind).toBe("fixed");
    expect(decodePriceSurface(kind, params)()).toBe("0.25");
  });

  it("round-trips linear surface", () => {
    const surface = (load: number, complexity: number) =>
      (0.1 + load * 0.01 + complexity * 0.02).toFixed(6);
    const { kind, params } = encodePriceSurface(surface);
    expect(kind).toBe("linear");
    expect(decodePriceSurface(kind, params)(1, 2)).toBe("0.150000");
  });

  it("defaults missing linear coefficients to zero", () => {
    const surface = decodePriceSurface("linear", { base: "0.50" });
    expect(surface(3, 4)).toBe("0.500000");
  });
});
