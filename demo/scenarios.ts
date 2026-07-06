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
import type { SolverProvider } from "@trapeza/clearinghouse";
import { makeProvider, makeUncalibratedProvider, workflowProviders } from "./data.js";

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

/** Cold-start providers — no observations, braggart vs honest per capability. */
export const coldStartGraph: TaskGraph = {
  id: "demo-cold-start",
  nodes: [
    node("stepA", "cap.1", { valueUsdc: "0.80", budgetUsdc: "1.00" }),
    node("stepB", "cap.2", { valueUsdc: "0.80", budgetUsdc: "1.00" }),
    node("stepC", "cap.3", { valueUsdc: "0.80", budgetUsdc: "1.00" }),
  ],
  edges: [
    { from: "stepA", to: "stepB" },
    { from: "stepB", to: "stepC" },
  ],
  globalBudgetUsdc: "3.00",
  globalDeadlineMs: 60_000,
  riskAversion: 1,
};

export const coldStartProviders = [
  makeUncalibratedProvider("braggart-1", "cap.1", {
    priceUsdc: "0.28",
    claimedSuccessProb: 0.99,
  }),
  makeUncalibratedProvider("honest-1", "cap.1", {
    priceUsdc: "0.18",
    claimedSuccessProb: 0.68,
  }),
  makeUncalibratedProvider("braggart-2", "cap.2", {
    priceUsdc: "0.32",
    claimedSuccessProb: 0.98,
  }),
  makeUncalibratedProvider("honest-2", "cap.2", {
    priceUsdc: "0.22",
    claimedSuccessProb: 0.70,
  }),
  makeUncalibratedProvider("braggart-3", "cap.3", {
    priceUsdc: "0.35",
    claimedSuccessProb: 0.97,
  }),
  makeUncalibratedProvider("honest-3", "cap.3", {
    priceUsdc: "0.24",
    claimedSuccessProb: 0.66,
  }),
];

/** Quality floor binds — low-p provider excluded. */
export const qualityFloorGraph: TaskGraph = {
  id: "demo-quality-floor",
  nodes: [
    node("extract", "cap.2", { valueUsdc: "1.00", budgetUsdc: "1.20" }),
    node("verify", "cap.1", { valueUsdc: "1.50", budgetUsdc: "1.50" }),
  ],
  edges: [{ from: "extract", to: "verify" }],
  globalBudgetUsdc: "2.50",
  globalDeadlineMs: 30_000,
  globalQualityFloor: 0.75,
  riskAversion: 1,
};

function lemonsOutcomes(passes: number, total: number, cost: string, latency: number) {
  return Array.from({ length: total }, (_, i) => ({
    passed: i < passes,
    cost,
    latency: latency + (i % 5) * 10,
  }));
}

export const qualityFloorProviders = [
  makeProvider("high-quality", "cap.2", {
    priceUsdc: "0.45",
    claimedSuccessProb: 0.80,
    claimedLatencyMs: 120,
    outcomes: lemonsOutcomes(19, 20, "0.44", 115),
  }),
  makeProvider("high-verify", "cap.1", {
    priceUsdc: "0.55",
    claimedSuccessProb: 0.75,
    claimedLatencyMs: 150,
    outcomes: lemonsOutcomes(19, 20, "0.54", 145),
  }),
];

/** 14-node scale stress DAG. */
export const scaleStressGraph: TaskGraph = {
  id: "demo-scale-stress",
  nodes: Array.from({ length: 14 }, (_, i) =>
    node(`n${i + 1}`, `cap.${(i % 3) + 1}`, { valueUsdc: "0.40", budgetUsdc: "0.60" }),
  ),
  edges: [
    { from: "n1", to: "n4" },
    { from: "n2", to: "n4" },
    { from: "n3", to: "n5" },
    { from: "n4", to: "n6" },
    { from: "n5", to: "n6" },
    { from: "n6", to: "n9" },
    { from: "n7", to: "n9" },
    { from: "n8", to: "n10" },
    { from: "n9", to: "n11" },
    { from: "n10", to: "n11" },
    { from: "n11", to: "n12" },
    { from: "n12", to: "n13" },
    { from: "n13", to: "n14" },
  ],
  globalBudgetUsdc: "8.00",
  globalDeadlineMs: 120_000,
  riskAversion: 1,
};

export const scaleStressProviders = workflowProviders;

/** Tight deadline — makespan pressed against global deadline. */
export const deadlineTightGraph: TaskGraph = {
  ...researchGraph,
  id: "demo-deadline-tight",
  globalDeadlineMs: 1200,
};

export const deadlineTightProviders = researchProviders;

/** Concurrency stress — two parallel nodes, one provider concurrency=1 (tier1). */
export const concurrencyGraph: TaskGraph = {
  id: "demo-concurrency",
  nodes: [
    node("parallelA", "cap.1", { valueUsdc: "0.50" }),
    node("parallelB", "cap.1", { valueUsdc: "0.50" }),
    node("merge", "cap.2", { valueUsdc: "0.60" }),
  ],
  edges: [
    { from: "parallelA", to: "merge" },
    { from: "parallelB", to: "merge" },
  ],
  globalBudgetUsdc: "2.00",
  globalDeadlineMs: 5000,
  riskAversion: 1,
};

export const concurrencyProviders: SolverProvider[] = [
  {
    ...workflowProviders[0]!,
    id: "solo-cap1",
    capabilities: ["cap.1"],
    concurrency: 1,
    bondCapacityUsdc: "10.00",
  },
  workflowProviders[2]!,
];

/** Bond capacity stress — provider bond cap binds (tier1). */
export const bondCapacityGraph: TaskGraph = {
  id: "demo-bond-capacity",
  nodes: [
    node("heavyA", "cap.3", { valueUsdc: "2.00", budgetUsdc: "2.00", bondRatio: 0.5 }),
    node("heavyB", "cap.3", { valueUsdc: "2.00", budgetUsdc: "2.00", bondRatio: 0.5 }),
  ],
  edges: [{ from: "heavyA", to: "heavyB" }],
  globalBudgetUsdc: "4.00",
  globalDeadlineMs: 60_000,
  riskAversion: 1,
};

export const bondCapacityProviders: SolverProvider[] = [
  {
    ...workflowProviders[4]!,
    id: "bond-limited",
    bondOfferedUsdc: "0.50",
    bondCapacityUsdc: "0.50",
  },
  workflowProviders[4]!,
];
