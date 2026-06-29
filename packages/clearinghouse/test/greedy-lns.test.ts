import { describe, expect, it } from "vitest";
import { greedyAssign, lnsImprove } from "@trapeza/clearinghouse";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("greedy + LNS", () => {
  it("greedy assigns all nodes on a simple chain", () => {
    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a" }),
        makeNode("b", { capability: "cap.b" }),
      ],
      [{ from: "a", to: "b" }],
      { globalBudgetUsdc: "5.00" },
    );
    const providers = [
      makeSolverProvider("p1", { capability: "cap.a", priceUsdc: "0.10" }),
      makeSolverProvider("p2", { capability: "cap.b", priceUsdc: "0.10" }),
    ];
    const input = { graph, providers, riskAversion: 1 };
    const a = greedyAssign(input);
    expect(a).toHaveLength(2);
  });

  it("LNS does not worsen greedy seed objective", () => {
    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a", valueUsdc: "1.00" }),
        makeNode("b", { capability: "cap.b", valueUsdc: "1.00" }),
        makeNode("c", { capability: "cap.c", valueUsdc: "1.00" }),
      ],
      [
        { from: "a", to: "c" },
        { from: "b", to: "c" },
      ],
      { globalBudgetUsdc: "3.00" },
    );
    const providers = [
      makeSolverProvider("a-cheap", { capability: "cap.a", priceUsdc: "0.20" }),
      makeSolverProvider("a-prem", { capability: "cap.a", priceUsdc: "0.50" }),
      makeSolverProvider("b-cheap", { capability: "cap.b", priceUsdc: "0.20" }),
      makeSolverProvider("b-prem", { capability: "cap.b", priceUsdc: "0.50" }),
      makeSolverProvider("c1", { capability: "cap.c", priceUsdc: "0.30" }),
      makeSolverProvider("c2", { capability: "cap.c", priceUsdc: "0.40" }),
    ];
    const input = { graph, providers, riskAversion: 1, seed: 1 };
    const seedObj = greedyAssign(input).reduce((s, x) => s + x.score, 0);
    const lns = lnsImprove(input, 1, 50);
    const lnsObj = lns.reduce((s, x) => s + x.score, 0);
    expect(lnsObj).toBeGreaterThanOrEqual(seedObj);
  });
});
