import { describe, expect, it } from "vitest";
import { ClearingError, pHat, solverHealthy } from "@trapeza/clearinghouse";
import { DEMO_RUN_SCHEMA_VERSION } from "../../apps/dashboard/src/types/contract.js";
import { computeRun } from "../run-scenario.js";
import { tier2Scenarios, type Scenario, type ScenarioExpect } from "../scenario-registry.js";

function assertDemoRunShape(run: Awaited<ReturnType<typeof computeRun>>, scenario: Scenario) {
  expect(run.schemaVersion).toBe(DEMO_RUN_SCHEMA_VERSION);
  expect(run.meta.runId).toBe(scenario.runId);
  expect(run.graph.nodes.length).toBe(scenario.graph.nodes.length);
  expect(run.providers.length).toBe(scenario.providers.length);

  if (run.status === "rejected") {
    expect(run.error?.code).toBeTruthy();
    expect(run.trace?.length).toBeGreaterThan(0);
    return;
  }

  expect(run.clearing.allocations.length).toBe(scenario.graph.nodes.length);
  for (const a of run.clearing.allocations) {
    expect(run.providers.some((p) => p.id === a.providerId)).toBe(true);
    expect(Number.isFinite(a.score)).toBe(true);
  }
  expect(run.clearing.preflightPassed).toBe(true);
  expect(run.clearing.makespanMs).toBeLessThanOrEqual(scenario.graph.globalDeadlineMs);
}

function assertTrace(
  trace: NonNullable<Awaited<ReturnType<typeof computeRun>>["trace"]>,
  nodeCount: number,
  status: Awaited<ReturnType<typeof computeRun>>["status"],
) {
  expect(trace.length).toBeGreaterThan(0);
  const seqs = trace.map((s) => s.seq);
  expect(new Set(seqs).size).toBe(seqs.length);
  for (let i = 1; i < seqs.length; i++) {
    expect(seqs[i]!).toBeGreaterThan(seqs[i - 1]!);
  }
  expect(trace[0]!.phase).toBe("validate-dag");
  const assigns = trace.filter((s) => s.phase === "assign");
  expect(assigns.length).toBeGreaterThanOrEqual(nodeCount);
  if (status !== "rejected") {
    expect(trace.some((s) => s.phase === "settlement")).toBe(true);
  }
}

function assertExpect(run: Awaited<ReturnType<typeof computeRun>>, scenario: Scenario) {
  const exp: ScenarioExpect = scenario.expect;
  if (exp.preflightFails) {
    expect(run.status).toBe("rejected");
    expect(run.error?.code).toBe("PREFLIGHT_FAILED");
    return;
  }
  if (exp.expectDegraded) {
    expect(run.status).toBe("degraded");
    expect(run.clearing.degraded).toBe(true);
    expect(run.clearing.solver).toBe("greedy_lns");
  }
  if (exp.greedyBusts) {
    expect(run.bakeOff.greedy.status).toBe("failed");
    expect(run.bakeOff.optimal.status).toBe("cleared");
  }
  if (exp.minDivergentNodes !== undefined) {
    expect(run.calibration.divergentNodes.length).toBeGreaterThanOrEqual(exp.minDivergentNodes);
  }
  if (exp.minSuccessLift !== undefined) {
    expect(run.calibration.successLift).toBeGreaterThanOrEqual(exp.minSuccessLift);
  }
  if (exp.makespanWithinDeadline) {
    expect(run.clearing.makespanMs).toBeLessThanOrEqual(scenario.graph.globalDeadlineMs);
  }
  if (exp.qualityFloorBinds) {
    const floor = scenario.graph.globalQualityFloor ?? 0;
    const byId = new Map(scenario.providers.map((p) => [p.id, p]));
    for (const a of run.clearing.allocations) {
      const p = byId.get(a.providerId)!;
      expect(pHat(p, true)).toBeGreaterThanOrEqual(floor - 1e-6);
    }
  }
}

describe("scenario harness (tier2)", () => {
  for (const scenario of tier2Scenarios()) {
    describe(scenario.runId, () => {
      it(`runs and satisfies invariants [${scenario.tags.join(", ")}]`, async () => {
        const needsGraphSolver = scenario.expect.greedyBusts === true;
        const preferCpSat = needsGraphSolver ? await solverHealthy() : false;
        if (needsGraphSolver && !preferCpSat) {
          return; // skip when CP-SAT required but unavailable
        }

        const run = await computeRun(scenario, { preferCpSat, trace: true });
        assertDemoRunShape(run, scenario);
        if (run.trace) assertTrace(run.trace, scenario.graph.nodes.length, run.status);
        assertExpect(run, scenario);
      });
    });
  }
});

describe("preflight-underfunded engine throw", () => {
  it("throws ClearingError at engine level when under-funded", async () => {
    const scenario = tier2Scenarios().find((s) => s.runId === "preflight-underfunded")!;
    const { createClearinghouse } = await import("@trapeza/clearinghouse");
    const { underFundedSnapshot } = await import("../data.js");
    const ch = createClearinghouse({
      providers: scenario.providers,
      snapshot: { getSettlementState: async () => underFundedSnapshot(scenario.providers) },
    });
    await expect(ch.submitGraph(scenario.graph)).rejects.toBeInstanceOf(ClearingError);
  });
});
