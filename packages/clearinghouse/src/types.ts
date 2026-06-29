import type { CalibrationRecord, TaskGraph } from "@trapeza/core";

/** Provider profile fed into the graph solver. */
export interface SolverProvider {
  id: string;
  capabilities: string[];
  /** Ask price for quoting / settlement. */
  priceUsdc: string;
  bondOfferedUsdc: string;
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  calibration: CalibrationRecord;
}

export interface NodeAssignment {
  nodeId: string;
  providerId: string;
  score: number;
}

export interface SolverResult {
  assignments: NodeAssignment[];
  objectiveValue: number;
  solver: "highs_milp" | "greedy_lns";
}

export interface SolverInput {
  graph: TaskGraph;
  providers: SolverProvider[];
  riskAversion: number;
  seed?: number;
}

export class ClearingError extends Error {
  readonly code:
    | "INVALID_DAG"
    | "NO_PROVIDER"
    | "INFEASIBLE"
    | "PREFLIGHT_FAILED";

  constructor(
    message: string,
    code: "INVALID_DAG" | "NO_PROVIDER" | "INFEASIBLE" | "PREFLIGHT_FAILED",
  ) {
    super(message);
    this.code = code;
    this.name = "ClearingError";
  }
}
