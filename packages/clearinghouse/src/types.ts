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
  /** Max nodes this provider can run concurrently (k_p). Default: unbounded. */
  concurrency?: number;
  /** Max USDC bond lockable across all assigned nodes (B_p). Default: unbounded. */
  bondCapacityUsdc?: string;
}

export interface NodeAssignment {
  nodeId: string;
  providerId: string;
  score: number;
}

export type SolverKind = "cp_sat" | "highs_milp" | "greedy_lns";

export interface SolverResult {
  assignments: NodeAssignment[];
  objectiveValue: number;
  solver: SolverKind;
}

export interface SolverInput {
  graph: TaskGraph;
  providers: SolverProvider[];
  riskAversion: number;
  seed?: number;
  /**
   * When true (default), p_success comes from the calibration ledger's posterior
   * mean — claim-free at cold-start (Beta(1,1) = 0.5). When false, trusts the
   * provider's self-reported claim (the lemons-collapse demo path).
   */
  useCalibration?: boolean;
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
