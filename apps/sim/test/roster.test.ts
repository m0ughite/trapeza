import { describe, expect, it } from "vitest";
import {
  budgetBottleneckGraph,
  solverProviderFromSeed,
  SEED_PROVIDERS,
} from "../src/roster.js";

describe("roster helpers", () => {
  it("builds solver providers from seed specs", () => {
    const lemon = SEED_PROVIDERS.find((p) => p.role === "lemon")!;
    const solver = solverProviderFromSeed(lemon);
    expect(solver.id).toBe("lemon-logo");
    expect(solver.capabilities).toEqual([lemon.capability]);
    expect(solver.calibration.providerId).toBe("lemon-logo");
  });

  it("builds a budget-bottleneck graph fixture", () => {
    const graph = budgetBottleneckGraph("g-bottleneck");
    expect(graph.id).toBe("g-bottleneck");
    expect(graph.nodes).toHaveLength(2);
    expect(graph.globalBudgetUsdc).toBe("1.00");
    expect(graph.edges[0]).toEqual({ from: "logo", to: "code" });
  });
});
