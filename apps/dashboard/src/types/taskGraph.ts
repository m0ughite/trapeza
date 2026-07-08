/**
 * Dashboard TaskGraph type — mirrors @trapeza/core TaskGraph for API payloads.
 * Kept local so the browser bundle does not import workspace packages.
 */

export interface TaskGraphNode {
  nodeId: string;
  task: {
    id: string;
    capability: string;
    input: Record<string, unknown>;
    oracleSpec: {
      schema: Record<string, unknown>;
      groundTruth: Record<string, unknown>;
    };
    valueUsdc: string;
    budgetUsdc: string;
    preference: { price: number; latency: number; quality: number; risk: number };
    deadlineMs: number;
    bondRatio?: number;
    qualityFloor?: number;
  };
}

export interface TaskGraph {
  id: string;
  nodes: TaskGraphNode[];
  edges: Array<{ from: string; to: string }>;
  globalBudgetUsdc: string;
  globalDeadlineMs: number;
  globalQualityFloor?: number;
  riskAversion?: number;
}
