import { describe, expect, it } from "vitest";
import { betaSample, gammaSample, runMonteCarlo } from "@trapeza/clearinghouse";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("Monte Carlo twin", () => {
  it("same seed yields same output", () => {
    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a" }),
        makeNode("b", { capability: "cap.b" }),
      ],
      [{ from: "a", to: "b" }],
    );
    const providers = [
      makeSolverProvider("p1", { capability: "cap.a" }),
      makeSolverProvider("p2", { capability: "cap.b" }),
    ];
    const assignments = [
      { nodeId: "a", providerId: "p1", score: 1 },
      { nodeId: "b", providerId: "p2", score: 1 },
    ];
    const input = { graph, providers, riskAversion: 1, seed: 99 };
    const a = runMonteCarlo(input, assignments, 100, 99);
    const b = runMonteCarlo(input, assignments, 100, 99);
    expect(a).toEqual(b);
  });

  it("transitive failure propagation on 3-deep chain", () => {
    const rng = () => 0.001;
    const p = betaSample(rng, 10, 1);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);

    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a" }),
        makeNode("b", { capability: "cap.b" }),
        makeNode("c", { capability: "cap.c" }),
      ],
      [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    );
    const providers = [
      makeSolverProvider("p1", {
        capability: "cap.a",
        cal: { successAlpha: 100, successBeta: 1 },
      }),
      makeSolverProvider("p2", {
        capability: "cap.b",
        cal: { successAlpha: 1, successBeta: 100 },
      }),
      makeSolverProvider("p3", {
        capability: "cap.c",
        cal: { successAlpha: 100, successBeta: 1 },
      }),
    ];
    const assignments = [
      { nodeId: "a", providerId: "p1", score: 1 },
      { nodeId: "b", providerId: "p2", score: 1 },
      { nodeId: "c", providerId: "p3", score: 1 },
    ];
    const r = runMonteCarlo(
      { graph, providers, riskAversion: 1 },
      assignments,
      200,
      123,
    );
    expect(r.failureProbability).toBeGreaterThan(0.5);
  });

  it("gamma and beta samples are non-negative", () => {
    const rng = () => 0.42;
    for (let i = 0; i < 20; i++) {
      expect(gammaSample(rng, 2 + i * 0.1)).toBeGreaterThanOrEqual(0);
      expect(betaSample(rng, 2, 3)).toBeGreaterThanOrEqual(0);
      expect(betaSample(rng, 2, 3)).toBeLessThanOrEqual(1);
    }
  });

  it("deadline breach probability is non-degenerate with latency variance", () => {
    const graph = makeGraph(
      [makeNode("a", { capability: "cap.a" })],
      [],
      { globalDeadlineMs: 100 },
    );
    const providers = [
      makeSolverProvider("p1", {
        capability: "cap.a",
        cal: {
          nObservations: 20,
          latencyMean: 80,
          latencyVar: 50_000,
        },
      }),
    ];
    const assignments = [{ nodeId: "a", providerId: "p1", score: 1 }];
    const r = runMonteCarlo(
      { graph, providers, riskAversion: 1 },
      assignments,
      500,
      77,
    );
    expect(r.deadlineBreachProbability).toBeGreaterThan(0);
    expect(r.deadlineBreachProbability).toBeLessThan(1);
  });
});
