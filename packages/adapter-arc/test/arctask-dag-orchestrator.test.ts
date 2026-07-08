import { describe, expect, it } from "vitest";
import type { TaskGraph } from "@trapeza/core";
import {
  encodeJobPayloadUri,
  runArcTaskDag,
} from "../src/index.js";

function twoNodeGraph(): TaskGraph {
  return {
    id: "test-dag-2",
    globalBudgetUsdc: "2.00",
    globalDeadlineMs: 600_000,
    riskAversion: 1,
    nodes: [
      {
        nodeId: "a",
        task: {
          id: "task-a",
          capability: "arctask.general.v1",
          input: { prompt: "Say hello in one sentence." },
          oracleSpec: {
            schema: {
              type: "object",
              required: ["summary"],
              properties: { summary: { type: "string", minLength: 8 } },
            },
            groundTruth: {},
          },
          valueUsdc: "0.50",
          budgetUsdc: "0.50",
          preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
          deadlineMs: 300_000,
          bondRatio: 0.05,
        },
      },
      {
        nodeId: "b",
        task: {
          id: "task-b",
          capability: "code.fix.v1",
          input: { prompt: "Fix a broken sum function." },
          oracleSpec: {
            schema: {
              type: "object",
              required: ["summary"],
              properties: { summary: { type: "string", minLength: 8 } },
            },
            groundTruth: {},
          },
          valueUsdc: "0.50",
          budgetUsdc: "0.50",
          preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
          deadlineMs: 300_000,
          bondRatio: 0.05,
        },
      },
    ],
    edges: [{ from: "a", to: "b" }],
  };
}

describe("runArcTaskDag", () => {
  it("clears and settles a 2-node simulated DAG", async () => {
    const progress: string[] = [];
    const result = await runArcTaskDag({
      graph: twoNodeGraph(),
      simulated: true,
      autoSubmitSimulated: true,
      onProgress: (e) => progress.push(e.phase),
    });

    expect(result.mode).toBe("simulated");
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.every((n) => n.passed)).toBe(true);
    expect(result.nodes.every((n) => n.settleAction === "release")).toBe(true);
    expect(progress).toContain("clear");
    expect(progress).toContain("done");
  });

  it("encodes prompts into jobURI payloads", () => {
    const uri = encodeJobPayloadUri({
      prompt: "test prompt",
      capability: "arctask.general.v1",
      nodeId: "a",
      graphId: "g1",
    });
    expect(uri).toContain("test%20prompt");
  });
});
