import { describe, expect, it } from "vitest";
import {
  ClearingError,
  solveGreedyOnly,
  solveGreedyLns,
  solveMilp,
} from "@trapeza/clearinghouse";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("budget-vs-bottleneck benchmark", () => {
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
    makeSolverProvider("premium-bn", {
      capability: "cap.hard",
      priceUsdc: "0.80",
      claimedSuccessProb: 0.95,
    }),
  ];

  const input = { graph, providers, riskAversion: 1, seed: 42 };

  it("MILP finds feasible clearing where greedy fails", async () => {
    const milp = await solveMilp(input);
    expect(milp.assignments).toHaveLength(2);
    const easy = milp.assignments.find((a) => a.nodeId === "easy")!;
    expect(easy.providerId).toBe("cheap-easy");
    expect(() => solveGreedyOnly(input)).toThrow(/no feasible provider/);
  });

  it("throws NO_PROVIDER when capability has no provider", async () => {
    const bad = makeGraph(
      [makeNode("x", { capability: "cap.missing" })],
      [],
      { globalBudgetUsdc: "10.00" },
    );
    await expect(
      solveMilp({ graph: bad, providers, riskAversion: 1 }),
    ).rejects.toMatchObject({ code: "NO_PROVIDER" });
  });

  it("greedy throws ClearingError NO_PROVIDER when capability has no provider", () => {
    const bad = makeGraph(
      [makeNode("x", { capability: "cap.missing" })],
      [],
      { globalBudgetUsdc: "10.00" },
    );
    expect(() =>
      solveGreedyOnly({ graph: bad, providers, riskAversion: 1 }),
    ).toThrow(expect.objectContaining({ code: "NO_PROVIDER" }));
  });

  it("quality floor binds — low-p provider excluded", async () => {
    const g = makeGraph(
      [makeNode("n", { capability: "cap.q", qualityFloor: 0.8 })],
      [],
      { globalBudgetUsdc: "5.00" },
    );
    const ps = [
      makeSolverProvider("low", {
        capability: "cap.q",
        priceUsdc: "0.01",
        claimedSuccessProb: 0.5,
      }),
      makeSolverProvider("high", {
        capability: "cap.q",
        priceUsdc: "0.50",
        claimedSuccessProb: 0.95,
      }),
    ];
    const milp = await solveMilp({ graph: g, providers: ps, riskAversion: 1 });
    expect(milp.assignments[0]!.providerId).toBe("high");
  });

  it("greedy+LNS is reproducible under fixed seed", () => {
    const simple = makeGraph(
      [
        makeNode("a", { capability: "cap.easy", bondRatio: 0.05 }),
        makeNode("b", { capability: "cap.hard", bondRatio: 0.05 }),
      ],
      [{ from: "a", to: "b" }],
      { globalBudgetUsdc: "5.00" },
    );
    const ps = [
      makeSolverProvider("cheap-easy", {
        capability: "cap.easy",
        priceUsdc: "0.20",
      }),
      makeSolverProvider("mid-bn", {
        capability: "cap.hard",
        priceUsdc: "0.50",
      }),
    ];
    const a = solveGreedyLns({
      graph: simple,
      providers: ps,
      riskAversion: 1,
      seed: 7,
    });
    const b = solveGreedyLns({
      graph: simple,
      providers: ps,
      riskAversion: 1,
      seed: 7,
    });
    expect(a.assignments).toEqual(b.assignments);
  });
});

describe("MILP infeasible", () => {
  it("throws INFEASIBLE when budget too tight for any assignment", async () => {
    const g = makeGraph([makeNode("n", { capability: "cap.a" })], [], {
      globalBudgetUsdc: "0.01",
    });
    const ps = [
      makeSolverProvider("p", {
        capability: "cap.a",
        priceUsdc: "1.00",
        bondOfferedUsdc: "1.00",
      }),
    ];
    await expect(
      solveMilp({ graph: g, providers: ps, riskAversion: 1 }),
    ).rejects.toBeInstanceOf(ClearingError);
  });
});
