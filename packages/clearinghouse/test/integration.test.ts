import { describe, expect, it } from "vitest";
import {
  createClearinghouse,
  fixtureSettlementState,
} from "@trapeza/clearinghouse";
import { parseUsdcToMicro } from "@trapeza/core";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("submitGraph integration", () => {
  it("clears and prefights a 6-node DAG end to end", async () => {
    const nodes = ["n1", "n2", "n3", "n4", "n5", "n6"].map((id, i) =>
      makeNode(id, {
        capability: `cap.${(i % 3) + 1}`,
        valueUsdc: "0.50",
        budgetUsdc: "0.80",
      }),
    );

    const graph = makeGraph(
      nodes,
      [
        { from: "n1", to: "n4" },
        { from: "n2", to: "n4" },
        { from: "n3", to: "n5" },
        { from: "n4", to: "n6" },
        { from: "n5", to: "n6" },
      ],
      { globalBudgetUsdc: "5.00", globalDeadlineMs: 120_000 },
    );

    const providers = [
      makeSolverProvider("p1", { capability: "cap.1", priceUsdc: "0.15" }),
      makeSolverProvider("p2", { capability: "cap.2", priceUsdc: "0.20" }),
      makeSolverProvider("p3", { capability: "cap.3", priceUsdc: "0.25" }),
      makeSolverProvider("p1b", { capability: "cap.1", priceUsdc: "0.30" }),
      makeSolverProvider("p2b", { capability: "cap.2", priceUsdc: "0.35" }),
      makeSolverProvider("p3b", { capability: "cap.3", priceUsdc: "0.40" }),
    ];

    const ch = createClearinghouse({
      providers,
      seed: 42,
      snapshot: {
        getSettlementState: async () =>
          fixtureSettlementState({
            requesterBalanceMicro: parseUsdcToMicro("10.00"),
            providerBondMicro: Object.fromEntries(
              providers.map((p) => [p.id, parseUsdcToMicro("10.00")]),
            ),
          }),
      },
    });
    const clearing = await ch.submitGraph(graph);

    expect(clearing.allocations).toHaveLength(6);
    expect(clearing.schedule).toHaveLength(6);
    expect(clearing.meta.preflightPassed).toBe(true);
    expect(["cp_sat", "highs_milp", "greedy_lns"]).toContain(
      clearing.meta.solver,
    );
    expect(Number(clearing.shadowPricesUsdc.budget)).toBeGreaterThanOrEqual(0);
  });

  it("rethrows NO_PROVIDER from MILP fallback when capability is unserved", async () => {
    const graph = makeGraph(
      [makeNode("orphan", { capability: "cap.unserved" })],
      [],
      { globalBudgetUsdc: "5.00" },
    );
    const providers = [
      makeSolverProvider("p1", { capability: "cap.other", priceUsdc: "0.10" }),
    ];
    const ch = createClearinghouse({ providers, seed: 42 });
    await expect(ch.submitGraph(graph)).rejects.toMatchObject({
      code: "NO_PROVIDER",
    });
  });
});
