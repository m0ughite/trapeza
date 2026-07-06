import { beforeAll, describe, expect, it } from "vitest";
import {
  createClearinghouse,
  fixtureSettlementState,
  solveCpSat,
  solveGreedyLns,
  solveGreedyOnly,
  solverHealthy,
} from "@trapeza/clearinghouse";
import { parseUsdcToMicro } from "@trapeza/core";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

const SOLVER_URL = process.env.TRAPEZA_SOLVER_URL ?? "http://127.0.0.1:8000";
const DEAD_URL = "http://127.0.0.1:9"; // nothing listens here -> forces degrade

// Budget-vs-bottleneck: greedy busts the budget, CP-SAT finds the global solve.
const benchGraph = makeGraph(
  [
    makeNode("easy", { capability: "cap.easy", valueUsdc: "2.00", budgetUsdc: "2.00", bondRatio: 0.05 }),
    makeNode("bottleneck", { capability: "cap.hard", valueUsdc: "1.50", budgetUsdc: "1.50", bondRatio: 0.05 }),
  ],
  [{ from: "easy", to: "bottleneck" }],
  { globalBudgetUsdc: "1.00" },
);
const benchProviders = [
  makeSolverProvider("premium-easy", { capability: "cap.easy", priceUsdc: "0.65", claimedSuccessProb: 0.98 }),
  makeSolverProvider("cheap-easy", { capability: "cap.easy", priceUsdc: "0.15", claimedSuccessProb: 0.55 }),
  makeSolverProvider("mid-bn", { capability: "cap.hard", priceUsdc: "0.50", claimedSuccessProb: 0.9 }),
  makeSolverProvider("premium-bn", { capability: "cap.hard", priceUsdc: "0.80", claimedSuccessProb: 0.95 }),
];
const benchInput = { graph: benchGraph, providers: benchProviders, riskAversion: 1, seed: 42, useCalibration: false };

// Ample-budget graph where BOTH solvers succeed (for the >= comparison).
const ampleGraph = makeGraph(
  [
    makeNode("a", { capability: "cap.a", valueUsdc: "1.00", budgetUsdc: "1.00" }),
    makeNode("b", { capability: "cap.b", valueUsdc: "1.00", budgetUsdc: "1.00" }),
    makeNode("c", { capability: "cap.c", valueUsdc: "1.00", budgetUsdc: "1.00" }),
  ],
  [
    { from: "a", to: "c" },
    { from: "b", to: "c" },
  ],
  { globalBudgetUsdc: "5.00" },
);
const ampleProviders = [
  makeSolverProvider("a1", { capability: "cap.a", priceUsdc: "0.20" }),
  makeSolverProvider("a2", { capability: "cap.a", priceUsdc: "0.50" }),
  makeSolverProvider("b1", { capability: "cap.b", priceUsdc: "0.20" }),
  makeSolverProvider("b2", { capability: "cap.b", priceUsdc: "0.50" }),
  makeSolverProvider("c1", { capability: "cap.c", priceUsdc: "0.30" }),
  makeSolverProvider("c2", { capability: "cap.c", priceUsdc: "0.40" }),
];
const ampleInput = { graph: ampleGraph, providers: ampleProviders, riskAversion: 1, seed: 42 };

function fundedSnapshotFor(providers: { id: string }[]) {
  return {
    getSettlementState: async () =>
      fixtureSettlementState({
        requesterBalanceMicro: parseUsdcToMicro("100.00"),
        providerBondMicro: Object.fromEntries(
          providers.map((p) => [p.id, parseUsdcToMicro("100.00")]),
        ),
      }),
  };
}

describe("TS↔Python degradation (service down)", () => {
  it("submitGraph degrades to greedy+LNS when the solver service is unreachable", async () => {
    const ch = createClearinghouse({
      providers: ampleProviders,
      seed: 42,
      solverUrl: DEAD_URL,
      solverTimeoutMs: 1500,
      snapshot: fundedSnapshotFor(ampleProviders),
    });
    const clearing = await ch.submitGraph(ampleGraph);
    expect(clearing.meta.solver).toBe("greedy_lns");
    expect(clearing.meta.degraded).toBe(true);
    expect(clearing.allocations).toHaveLength(3);
  });

  it("Monte Carlo flag falls back to the in-process TS twin when service is down", async () => {
    const ch = createClearinghouse({
      providers: ampleProviders,
      seed: 42,
      solverUrl: DEAD_URL,
      solverTimeoutMs: 1500,
      snapshot: fundedSnapshotFor(ampleProviders),
      monteCarlo: { enabled: true, iterations: 200 },
    });
    const clearing = await ch.submitGraph(ampleGraph);
    expect(clearing.twinSimulation).toBeDefined();
    expect(clearing.twinSimulation!.engine).toBe("ts");
    expect(clearing.twinSimulation!.iterations).toBe(200);
  });
});

describe("CP-SAT Tier-1 (service up)", () => {
  let healthy = false;
  beforeAll(async () => {
    healthy = await solverHealthy({ baseUrl: SOLVER_URL, timeoutMs: 2000 });
  });

  it("CP-SAT finds a feasible clearing where greedy busts the budget", async (ctx) => {
    if (!healthy) ctx.skip();
    const cp = await solveCpSat(benchInput, { baseUrl: SOLVER_URL });
    expect(cp.solver).toBe("cp_sat");
    expect(cp.assignments).toHaveLength(2);
    const easy = cp.assignments.find((a) => a.nodeId === "easy")!;
    expect(easy.providerId).toBe("cheap-easy");
    expect(cp.objectiveValue).toBeGreaterThan(0);
    // greedy cannot even complete this instance
    expect(() => solveGreedyOnly(benchInput)).toThrow(/no feasible provider/);
  });

  it("CP-SAT objective >= greedy+LNS objective (apples-to-apples)", async (ctx) => {
    if (!healthy) ctx.skip();
    const cp = await solveCpSat(ampleInput, { baseUrl: SOLVER_URL });
    const tier2 = solveGreedyLns(ampleInput);
    expect(cp.objectiveValue).toBeGreaterThanOrEqual(tier2.objectiveValue - 1e-6);
  });

  it("submitGraph uses cp_sat and returns LP-dual shadow prices when service is up", async (ctx) => {
    if (!healthy) ctx.skip();
    const ch = createClearinghouse({
      providers: benchProviders,
      seed: 42,
      solverUrl: SOLVER_URL,
      snapshot: fundedSnapshotFor(benchProviders),
    });
    const clearing = await ch.submitGraph(benchGraph);
    expect(clearing.meta.solver).toBe("cp_sat");
    expect(clearing.meta.degraded).toBe(false);
    expect(clearing.shadowPricesUsdc.budget).toBeDefined();
    expect(Number(clearing.shadowPricesUsdc.budget)).toBeGreaterThanOrEqual(0);
  });

  it("Monte Carlo flag uses the Python engine when service is up", async (ctx) => {
    if (!healthy) ctx.skip();
    const ch = createClearinghouse({
      providers: benchProviders,
      seed: 42,
      solverUrl: SOLVER_URL,
      snapshot: fundedSnapshotFor(benchProviders),
      monteCarlo: { enabled: true, iterations: 300 },
    });
    const clearing = await ch.submitGraph(benchGraph);
    expect(clearing.twinSimulation).toBeDefined();
    expect(clearing.twinSimulation!.engine).toBe("python");
    expect(clearing.twinSimulation!.iterations).toBe(300);
  });
});
