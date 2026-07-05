import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultCalibration,
  type ProviderProfile,
  type TaskGraph,
  type TaskSpec,
} from "@trapeza/core";
import { toSolverProvider } from "../src/provider-projection.js";

const profile: ProviderProfile = {
  id: "p1",
  agentId: null,
  wallet: "0xabc1234567890123456789012345678901234567890",
  capabilities: ["cap.logo"],
  endpoint: "https://x.example/p1",
  priceSurface: (load, complexity) =>
    (0.1 + load * 0.01 + complexity * 0.02).toFixed(6),
  bondBalanceUsdc: "2.00",
  status: "active",
};

describe("toSolverProvider", () => {
  it("uses neutral priors when quote is omitted", () => {
    const cal = defaultCalibration("p1", "cap.logo");
    const solver = toSolverProvider(profile, () => cal, "cap.logo");
    expect(solver.claimedSuccessProb).toBe(0.5);
    expect(solver.claimedLatencyMs).toBe(100);
    expect(solver.bondOfferedUsdc).toBe("0.05");
  });

  it("evaluates priceSurface and picks per-capability calibration", () => {
    const cal = defaultCalibration("p1", "cap.logo");
    const solver = toSolverProvider(
      profile,
      () => cal,
      "cap.logo",
      {
        providerId: "p1",
        priceUsdc: "0.50",
        claimedSuccessProb: 0.9,
        claimedLatencyMs: 80,
        bondOfferedUsdc: "0.10",
      },
    );
    expect(solver.priceUsdc).toBe("0.120000");
    expect(solver.calibration).toBe(cal);
    expect(solver.claimedSuccessProb).toBe(0.9);
    expect(solver.claimedLatencyMs).toBe(80);
    expect(solver.bondOfferedUsdc).toBe("0.10");
  });
});

describe("solverProvidersFor", () => {
  it("loads eligible single-capability providers for graph nodes", async () => {
    const { solverProvidersFor } = await import("../src/provider-projection.js");
    const { InMemoryStore } = await import("@trapeza/core/testing");
    const store = new InMemoryStore();
    await store.putProvider(profile);
    await store.putCalibration(defaultCalibration("p1", "cap.logo"));

    const graph: TaskGraph = {
      id: "g1",
      nodes: [
        {
          nodeId: "n1",
          task: {
            id: "t1",
            capability: "cap.logo",
            input: {},
            oracleSpec: { schema: { type: "object" }, groundTruth: {} },
            valueUsdc: "1",
            budgetUsdc: "1",
            preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
            deadlineMs: 1000,
          },
        },
      ],
      edges: [],
      globalBudgetUsdc: "1.00",
      globalDeadlineMs: 5000,
    };

    const providers = await solverProvidersFor(store, graph);
    expect(providers).toHaveLength(1);
    expect(providers[0]!.id).toBe("p1");
  });
});
