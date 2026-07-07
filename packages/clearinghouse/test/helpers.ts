import {
  defaultCalibration,
  type CalibrationRecord,
  type TaskGraph,
  type TaskSpec,
} from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";

export function makeSolverProvider(
  id: string,
  overrides: Partial<SolverProvider> & {
    capability?: string;
    cal?: Partial<CalibrationRecord>;
  } = {},
): SolverProvider {
  const cap = overrides.capability ?? "cap.default";
  const cal = defaultCalibration(id, cap);
  const { cal: calOverrides, capability: _cap, ...rest } = overrides;
  return {
    id,
    capabilities: rest.capabilities ?? [cap],
    priceUsdc: "0.10",
    bondOfferedUsdc: "0",
    claimedSuccessProb: 0.9,
    claimedLatencyMs: 100,
    calibration: { ...cal, ...calOverrides },
    ...rest,
  };
}

export function makeNode(
  nodeId: string,
  task: Partial<TaskSpec> & { capability: string },
): TaskGraph["nodes"][0] {
  return {
    nodeId,
    task: {
      id: `task-${nodeId}`,
      capability: task.capability,
      input: {},
      oracleSpec: { schema: { type: "object" }, groundTruth: {} },
      valueUsdc: task.valueUsdc ?? "1.00",
      budgetUsdc: task.budgetUsdc ?? "1.00",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: task.deadlineMs ?? 60_000,
      qualityFloor: task.qualityFloor,
      bondRatio: task.bondRatio,
    },
  };
}

export function makeGraph(
  nodes: TaskGraph["nodes"],
  edges: TaskGraph["edges"] = [],
  overrides: Partial<TaskGraph> = {},
): TaskGraph {
  return {
    id: "g1",
    nodes,
    edges,
    globalBudgetUsdc: "1.00",
    globalDeadlineMs: 60_000,
    ...overrides,
  };
}
