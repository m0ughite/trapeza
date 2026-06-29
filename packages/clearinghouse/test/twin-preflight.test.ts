import { describe, expect, it } from "vitest";
import {
  ClearingError,
  assertPreflight,
  fixtureSettlementState,
  formatPreflightSummary,
  preflightSettlement,
} from "@trapeza/clearinghouse";
import { parseUsdcToMicro } from "@trapeza/core";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("settlement preflight twin", () => {
  const graph = makeGraph(
    [makeNode("n1", { capability: "cap.a", valueUsdc: "1.00" })],
    [],
    { globalBudgetUsdc: "2.00" },
  );
  const providers = [
    makeSolverProvider("p1", {
      capability: "cap.a",
      priceUsdc: "0.50",
      bondOfferedUsdc: "0.20",
    }),
  ];
  const input = { graph, providers, riskAversion: 1 };
  const assignments = [{ nodeId: "n1", providerId: "p1", score: 1 }];

  it("passes with sufficient requester balance and bond", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: parseUsdcToMicro("1.00") },
    });
    const r = preflightSettlement(state, input, assignments);
    expect(r.passed).toBe(true);
  });

  it("catches overdraw when fee exceeds requester balance", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("0.10"),
      providerBondMicro: { p1: parseUsdcToMicro("1.00") },
    });
    const r = preflightSettlement(state, input, assignments);
    expect(r.passed).toBe(false);
    expect(r.errors.some((e) => e.includes("overdraw"))).toBe(true);
  });

  it("refunds requester on failure (slash path)", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: parseUsdcToMicro("1.00") },
    });
    const ok = preflightSettlement(state, input, assignments, { n1: true });
    const fail = preflightSettlement(state, input, assignments, { n1: false });
    expect(ok.requesterBalanceMicro).toBeLessThan(
      fail.requesterBalanceMicro,
    );
  });

  it("catches insufficient provider bond", () => {
    const bondGraph = makeGraph(
      [
        makeNode("n1", {
          capability: "cap.a",
          valueUsdc: "1.00",
          bondRatio: 0.5,
        }),
      ],
      [],
    );
    const bondInput = {
      graph: bondGraph,
      providers: [
        makeSolverProvider("p1", {
          capability: "cap.a",
          priceUsdc: "0.10",
          bondOfferedUsdc: "0",
        }),
      ],
      riskAversion: 1,
    };
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: 0n },
    });
    const r = preflightSettlement(state, bondInput, assignments);
    expect(r.passed).toBe(false);
    expect(r.errors.some((e) => e.includes("insufficient bond"))).toBe(true);
  });

  it("catches negative bond after slash when posted bond is too small", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: parseUsdcToMicro("0.10") },
    });
    const r = preflightSettlement(state, input, assignments, { n1: false });
    expect(r.passed).toBe(false);
    expect(r.errors.some((e) => e.includes("negative bond after slash"))).toBe(
      true,
    );
  });

  it("allows slash when posted bond exactly covers slash amount", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: parseUsdcToMicro("0.20") },
    });
    const r = preflightSettlement(state, input, assignments, { n1: false });
    expect(r.errors.some((e) => e.includes("negative bond after slash"))).toBe(
      false,
    );
    expect(r.requesterBalanceMicro).toBeGreaterThan(
      parseUsdcToMicro("1.50"),
    );
  });

  it("catches aggregate requester balance negative after multi-node batch", () => {
    const multiGraph = makeGraph(
      [
        makeNode("n1", { capability: "cap.a", valueUsdc: "1.00" }),
        makeNode("n2", { capability: "cap.b", valueUsdc: "1.00" }),
      ],
      [{ from: "n1", to: "n2" }],
      { globalBudgetUsdc: "2.00" },
    );
    const multiInput = {
      graph: multiGraph,
      providers: [
        makeSolverProvider("p1", {
          capability: "cap.a",
          priceUsdc: "0.30",
          bondOfferedUsdc: "0.05",
        }),
        makeSolverProvider("p2", {
          capability: "cap.b",
          priceUsdc: "0.30",
          bondOfferedUsdc: "0.05",
        }),
      ],
      riskAversion: 1,
    };
    const multiAssignments = [
      { nodeId: "n1", providerId: "p1", score: 1 },
      { nodeId: "n2", providerId: "p2", score: 1 },
    ];
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("0.50"),
      providerBondMicro: {
        p1: parseUsdcToMicro("1.00"),
        p2: parseUsdcToMicro("1.00"),
      },
    });
    const r = preflightSettlement(state, multiInput, multiAssignments);
    expect(r.passed).toBe(false);
    expect(r.errors.some((e) => e.includes("requester balance negative"))).toBe(
      true,
    );
    expect(r.requesterBalanceMicro).toBeLessThan(0n);
  });

  it("assertPreflight throws ClearingError when preflight fails", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("0.10"),
      providerBondMicro: { p1: parseUsdcToMicro("1.00") },
    });
    expect(() => assertPreflight(state, input, assignments)).toThrow(
      ClearingError,
    );
    try {
      assertPreflight(state, input, assignments);
    } catch (e) {
      expect(e).toBeInstanceOf(ClearingError);
      expect((e as ClearingError).code).toBe("PREFLIGHT_FAILED");
      expect((e as ClearingError).message).toContain("preflight failed");
    }
  });

  it("assertPreflight passes and formatPreflightSummary formats happy path", () => {
    const state = fixtureSettlementState({
      requesterBalanceMicro: parseUsdcToMicro("2.00"),
      providerBondMicro: { p1: parseUsdcToMicro("1.00") },
    });
    expect(() => assertPreflight(state, input, assignments)).not.toThrow();
    const r = preflightSettlement(state, input, assignments);
    expect(formatPreflightSummary(r)).toMatch(
      /requester=\d+\.\d{6} errors=0/,
    );
  });
});
