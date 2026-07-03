/**
 * Graph-level clearing seam (DESIGN-CLEARINGHOUSE.md).
 *
 * Types only in core; solver/twin live in `@trapeza/clearinghouse`.
 */

import type { Allocation, TaskSpec } from "./models.js";

/** A node in a task DAG: a single TaskSpec plus its in-graph identity. */
export interface TaskGraphNode {
  nodeId: string;
  task: TaskSpec;
}

/** A directed dependency edge (`from` must complete before `to`). */
export interface TaskGraphEdge {
  from: string;
  to: string;
}

/** A requester-submitted workflow: a DAG with global constraints. */
export interface TaskGraph {
  id: string;
  nodes: TaskGraphNode[];
  edges: TaskGraphEdge[];
  globalBudgetUsdc: string;
  globalDeadlineMs: number;
  /** Minimum end-to-end success probability (q_min). */
  globalQualityFloor?: number;
  /** Requester risk aversion ρ applied in the solver objective. */
  riskAversion?: number;
}

/** Scheduled start time for a cleared node. */
export interface NodeSchedule {
  nodeId: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

/** Solver metadata returned with a clearing. */
export interface ClearingMeta {
  solver: "cp_sat" | "highs_milp" | "greedy_lns";
  objectiveValue: number;
  makespanMs: number;
  seed?: number;
  preflightPassed: boolean;
  /** True when the primary Python CP-SAT path was used; false on TS degrade. */
  degraded?: boolean;
}

/** State-Twins Monte Carlo robustness scoring (Amendment 1; flag-gated). */
export interface TwinSimulation {
  failureProbability: number;
  budgetOverrunProbability: number;
  deadlineBreachProbability: number;
  expectedNetCostUsdc: number;
  seed: number;
  iterations: number;
  /** Where the simulation ran: Python service or in-process TS fallback. */
  engine: "python" | "ts";
}

/** The result of clearing a graph: per-node allocation plus pricing. */
export interface GraphClearing {
  graphId: string;
  allocations: Allocation[];
  schedule: NodeSchedule[];
  /** Shadow prices (LP duals) — display only. */
  shadowPricesUsdc: Record<string, string>;
  /** Per-node settlement price (min(ask, reserve)). */
  settlementPricesUsdc: Record<string, string>;
  totalClearedUsdc: string;
  meta: ClearingMeta;
  /** Optional Monte Carlo twin output when the feature flag is enabled. */
  twinSimulation?: TwinSimulation;
}

/** Read-only on-chain settlement snapshot for the state twin (injected). */
export interface SettlementState {
  requesterBalanceMicro: bigint;
  providerBondMicro: Record<string, bigint>;
  escrowLockedMicro: Record<string, bigint>;
  /** nodeId → fee locked in escrow for that job. */
  nodeFeeMicro: Record<string, bigint>;
}

/** Injected boundary: fetch a real testnet snapshot without signing. */
export interface StateSnapshotSource {
  getSettlementState(): Promise<SettlementState>;
}

/** Clearinghouse entrypoint — implemented by `@trapeza/clearinghouse`. */
export interface GraphClearinghouse {
  submitGraph(graph: TaskGraph): Promise<GraphClearing>;
}
