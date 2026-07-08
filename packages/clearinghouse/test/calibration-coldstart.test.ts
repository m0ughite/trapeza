import { describe, expect, it } from "vitest";
import {
  greedyAssign,
  pHat,
  solveGreedyOnly,
} from "@trapeza/clearinghouse";
import { pSuccessMean, PRIOR_ALPHA, PRIOR_BETA } from "@trapeza/core";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("calibration cold-start policy", () => {
  const braggart = makeSolverProvider("braggart", {
    capability: "cap.a",
    priceUsdc: "0.10",
    claimedSuccessProb: 0.99,
  });
  const honest = makeSolverProvider("honest", {
    capability: "cap.a",
    priceUsdc: "0.09",
    claimedSuccessProb: 0.6,
  });

  it("pHat ON uses posterior mean (0.5) at cold-start, not the claim", () => {
    expect(braggart.calibration.nObservations).toBe(0);
    expect(braggart.calibration.successAlpha).toBe(PRIOR_ALPHA);
    expect(braggart.calibration.successBeta).toBe(PRIOR_BETA);
    expect(pHat(braggart, true)).toBe(0.5);
    expect(pHat(honest, true)).toBe(0.5);
    expect(pHat(braggart, true)).toBe(pSuccessMean(braggart.calibration));
  });

  it("pHat OFF trusts the self-reported claim", () => {
    expect(pHat(braggart, false)).toBe(0.99);
    expect(pHat(honest, false)).toBe(0.6);
  });

  it("ON path: cold-start braggart does not win on inflated claim alone", () => {
    const graph = makeGraph(
      [makeNode("n", { capability: "cap.a", valueUsdc: "1.00" })],
      [],
      { globalBudgetUsdc: "5.00" },
    );
    const inputOn = {
      graph,
      providers: [braggart, honest],
      riskAversion: 1,
      useCalibration: true,
    };
    const [assignment] = greedyAssign(inputOn);
    expect(assignment!.providerId).toBe("honest");
  });

  it("OFF path: cold-start braggart wins on inflated claim", () => {
    const graph = makeGraph(
      [makeNode("n", { capability: "cap.a", valueUsdc: "1.00" })],
      [],
      { globalBudgetUsdc: "5.00" },
    );
    const inputOff = {
      graph,
      providers: [braggart, honest],
      riskAversion: 1,
      useCalibration: false,
    };
    const [assignment] = greedyAssign(inputOff);
    expect(assignment!.providerId).toBe("braggart");
  });

  it("budget bottleneck: greedy busts only when calibration OFF trusts claims", () => {
    const graph = makeGraph(
      [
        makeNode("easy", {
          capability: "cap.easy",
          valueUsdc: "2.00",
          budgetUsdc: "2.00",
          bondRatio: 0.05,
        }),
        makeNode("bottleneck", {
          capability: "cap.hard",
          valueUsdc: "1.50",
          budgetUsdc: "1.50",
          bondRatio: 0.05,
        }),
      ],
      [{ from: "easy", to: "bottleneck" }],
      { globalBudgetUsdc: "1.00" },
    );
    const providers = [
      makeSolverProvider("premium-easy", {
        capability: "cap.easy",
        priceUsdc: "0.65",
        claimedSuccessProb: 0.98,
      }),
      makeSolverProvider("cheap-easy", {
        capability: "cap.easy",
        priceUsdc: "0.15",
        claimedSuccessProb: 0.55,
      }),
      makeSolverProvider("mid-bn", {
        capability: "cap.hard",
        priceUsdc: "0.50",
        claimedSuccessProb: 0.9,
      }),
    ];

    expect(() =>
      solveGreedyOnly({
        graph,
        providers,
        riskAversion: 1,
        useCalibration: false,
      }),
    ).toThrow(/no feasible provider/);

    const on = solveGreedyOnly({
      graph,
      providers,
      riskAversion: 1,
      useCalibration: true,
    });
    expect(on.assignments).toHaveLength(2);
    expect(on.assignments.find((a) => a.nodeId === "easy")!.providerId).toBe(
      "cheap-easy",
    );
  });
});
