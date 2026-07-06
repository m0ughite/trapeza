/**
 * Extra scenario graphs for the JSON driver (demo/emit-run.ts).
 *
 * The two headline graphs (six-node workflow, two-node bottleneck) live in
 * demo/data.ts and are reused verbatim. This module adds a denser 8-node
 * research pipeline that stresses the scheduler + twin risk preflight. It reuses
 * the calibrated workflow providers (cap.1/cap.2/cap.3), so the calibration
 * ON-vs-OFF contrast stays meaningful here too.
 */

import type { TaskGraph, TaskSpec } from "@trapeza/core";
import { workflowProviders } from "./data.js";

function node(
  nodeId: string,
  capability: string,
  opts: { valueUsdc?: string; budgetUsdc?: string; bondRatio?: number } = {},
): TaskGraph["nodes"][number] {
  const task: TaskSpec = {
    id: `task-${nodeId}`,
    capability,
    input: {},
    oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    valueUsdc: opts.valueUsdc ?? "0.60",
    budgetUsdc: opts.budgetUsdc ?? "0.90",
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 60_000,
    bondRatio: opts.bondRatio ?? 0.05,
  };
  return { nodeId, task };
}

/** 8-node research pipeline: research → extract×3 + gather → reconcile → factcheck → format. */
export const researchGraph: TaskGraph = {
  id: "demo-research-pipeline",
  nodes: [
    node("research", "cap.1", { valueUsdc: "0.50" }),
    node("extractA", "cap.2"),
    node("extractB", "cap.2"),
    node("extractC", "cap.2"),
    node("gather", "cap.3"),
    node("reconcile", "cap.3", { valueUsdc: "1.20", budgetUsdc: "1.20", bondRatio: 0.1 }),
    node("factcheck", "cap.1", { valueUsdc: "1.00", budgetUsdc: "1.10", bondRatio: 0.1 }),
    node("format", "cap.2", { valueUsdc: "0.40" }),
  ],
  edges: [
    { from: "research", to: "extractA" },
    { from: "research", to: "extractB" },
    { from: "research", to: "extractC" },
    { from: "research", to: "gather" },
    { from: "extractA", to: "reconcile" },
    { from: "extractB", to: "reconcile" },
    { from: "extractC", to: "reconcile" },
    { from: "gather", to: "reconcile" },
    { from: "reconcile", to: "factcheck" },
    { from: "factcheck", to: "format" },
  ],
  globalBudgetUsdc: "5.00",
  globalDeadlineMs: 3000,
  riskAversion: 1,
};

export const researchProviders = workflowProviders;
