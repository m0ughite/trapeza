import { describe, expect, it } from "vitest";
import { computeShadowPrices, solveMilp } from "@trapeza/clearinghouse";
import { parseUsdcToMicro } from "@trapeza/core";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("shadow prices (LP duals)", () => {
  it("budget marginal value > 0 when relaxing a binding budget", async () => {
    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a", bondRatio: 0, valueUsdc: "2.00" }),
        makeNode("b", { capability: "cap.b", bondRatio: 0, valueUsdc: "1.00" }),
      ],
      [{ from: "a", to: "b" }],
      { globalBudgetUsdc: "0.49" },
    );

    const providers = [
      makeSolverProvider("cheap-a", {
        capability: "cap.a",
        priceUsdc: "0.15",
        bondOfferedUsdc: "0.05",
        claimedSuccessProb: 0.6,
      }),
      makeSolverProvider("prem-a", {
        capability: "cap.a",
        priceUsdc: "0.25",
        bondOfferedUsdc: "0.05",
        claimedSuccessProb: 0.98,
      }),
      makeSolverProvider("cheap-b", {
        capability: "cap.b",
        priceUsdc: "0.15",
        bondOfferedUsdc: "0.05",
        claimedSuccessProb: 0.6,
      }),
      makeSolverProvider("prem-b", {
        capability: "cap.b",
        priceUsdc: "0.25",
        bondOfferedUsdc: "0.05",
        claimedSuccessProb: 0.98,
      }),
    ];

    const tight = await solveMilp({
      graph,
      providers,
      riskAversion: 1,
      useCalibration: false,
    });
    const looseGraph = { ...graph, globalBudgetUsdc: "0.55" };
    const loose = await solveMilp({
      graph: looseGraph,
      providers,
      riskAversion: 1,
      useCalibration: false,
    });
    expect(loose.objectiveValue).toBeGreaterThan(tight.objectiveValue);

    const sp = await computeShadowPrices(
      graph,
      providers,
      parseUsdcToMicro("0.49"),
      false,
    );
    expect(sp.budgetDual).toBeGreaterThan(0);
  });

  it("budget dual is 0 when budget is slack", async () => {
    const loose = makeGraph([makeNode("n", { capability: "cap.a" })], [], {
      globalBudgetUsdc: "100.00",
    });
    const providers = [
      makeSolverProvider("cheap", {
        capability: "cap.a",
        priceUsdc: "0.20",
      }),
      makeSolverProvider("premium", {
        capability: "cap.a",
        priceUsdc: "0.80",
      }),
    ];
    const sp = await computeShadowPrices(
      loose,
      providers,
      parseUsdcToMicro("100.00"),
    );
    expect(sp.budgetDual).toBe(0);
  });
});
