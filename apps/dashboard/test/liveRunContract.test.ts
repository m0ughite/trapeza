import { describe, expect, it } from "vitest";
import type { LiveRunInput } from "../src/types/contract";
import {
  canApplyDependencies,
  normalizeRunPayload,
  parseRunPayloadJson,
  validateRunPayload,
} from "../src/lib/liveRunContract";

function validPayload(): LiveRunInput {
  return {
    graph: {
      id: "test-workflow",
      globalBudgetUsdc: "1.10",
      globalDeadlineMs: 600,
      globalQualityFloor: null,
      riskAversion: 1,
      nodes: [
        {
          nodeId: "extract",
          capability: "ocr",
          valueUsdc: "0.30",
          budgetUsdc: "0.30",
          bondRatio: 0.5,
          qualityFloor: null,
          bottleneck: false,
        },
        {
          nodeId: "classify",
          capability: "classification",
          valueUsdc: "0.40",
          budgetUsdc: "0.40",
          bondRatio: 0.5,
          qualityFloor: 0.7,
          bottleneck: false,
        },
      ],
      edges: [{ from: "extract", to: "classify" }],
    },
    providers: [
      {
        id: "ocr-a",
        capabilities: ["ocr"],
        priceUsdc: "0.14",
        bondOfferedUsdc: "0.05",
        claimedSuccessProb: 0.82,
        claimedLatencyMs: 120,
        calibratedSuccessProb: 0.78,
        pSuccessStdDev: 0.09,
        successAlpha: 31,
        successBeta: 9,
        costMeanUsdc: 0.13,
        latencyMeanMs: 125,
        nObservations: 40,
        archetype: "workhorse",
      },
      {
        id: "clf-a",
        capabilities: ["classification"],
        priceUsdc: "0.21",
        bondOfferedUsdc: "0.06",
        claimedSuccessProb: 0.86,
        claimedLatencyMs: 130,
        calibratedSuccessProb: 0.74,
        pSuccessStdDev: 0.11,
        successAlpha: 27,
        successBeta: 10,
        costMeanUsdc: 0.2,
        latencyMeanMs: 132,
        nObservations: 37,
        archetype: "neutral",
      },
    ],
    run: {
      budgetUsdc: "1.10",
      deadlineMs: 600,
      riskAversion: 1,
      calibration: "on",
    },
  };
}

describe("liveRunContract", () => {
  it("accepts a valid payload", () => {
    expect(validateRunPayload(validPayload())).toEqual([]);
  });

  it("rejects cycles and missing capability coverage", () => {
    const payload = validPayload();
    payload.graph.edges.push({ from: "classify", to: "extract" });
    payload.providers = payload.providers.filter((p) => !p.capabilities.includes("classification"));

    const issues = validateRunPayload(payload);
    expect(issues.some((issue) => issue.code === "cyclic-graph")).toBe(true);
    expect(issues.some((issue) => issue.code === "no-provider-for-capability")).toBe(true);
  });

  it("parses JSON and returns structured errors", () => {
    const parsed = parseRunPayloadJson("{\"graph\":{}}");
    expect(parsed.payload).toBeNull();
    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(parsed.issues[0]!.path).toBeTruthy();
  });

  it("normalizes run options onto graph", () => {
    const payload = validPayload();
    payload.run.budgetUsdc = "2.50";
    payload.run.deadlineMs = 1000;
    payload.run.riskAversion = 2.5;
    const normalized = normalizeRunPayload(payload);
    expect(normalized.graph.globalBudgetUsdc).toBe("2.50");
    expect(normalized.graph.globalDeadlineMs).toBe(1000);
    expect(normalized.graph.riskAversion).toBe(2.5);
  });

  it("blocks dependency edits that create cycles", () => {
    const payload = validPayload();
    const issues = canApplyDependencies(
      payload.graph.nodes.map((node) => node.nodeId),
      payload.graph.edges,
      "extract",
      ["classify"],
    );
    expect(issues.some((issue) => issue.code === "cyclic-graph")).toBe(true);
  });
});
