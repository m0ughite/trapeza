/**
 * SEAM (not built in P0) — graph-level clearing for the Trapeza Clearinghouse
 * extension (see DESIGN-CLEARINGHOUSE.md).
 *
 * This file exists only to keep the boundary open: the clearinghouse is a
 * separate module that *imports the primitive and does not modify it*. We
 * declare the `TaskGraph` data model and a `GraphClearing.submitGraph()`
 * signature here so the primitive's public types are forward-compatible. No
 * solver, no State-Twins sandbox, no LP duals in P0 — those live in the future
 * clearinghouse package and call `createTrapezaCore` underneath.
 */

import type { Allocation, TaskSpec } from "./models.js";

/** A node in a task DAG: a single TaskSpec plus its in-graph identity. */
export interface TaskGraphNode {
  nodeId: string;
  task: TaskSpec;
}

/** A directed dependency edge (`from` must complete before `to`). */
export interface TaskGraphEdge {
  from: string; // nodeId
  to: string; // nodeId
}

/** A requester-submitted workflow: a DAG with global constraints. */
export interface TaskGraph {
  id: string;
  nodes: TaskGraphNode[];
  edges: TaskGraphEdge[];
  /** Global ceilings the clearing must respect across the whole graph. */
  globalBudgetUsdc: string;
  globalDeadlineMs: number;
}

/** The result of clearing a graph: a per-node allocation plus pricing. */
export interface GraphClearing {
  graphId: string;
  allocations: Allocation[];
  /** Shadow prices (LP duals) per node — populated by the future solver. */
  shadowPricesUsdc: Record<string, string>;
  totalClearedUsdc: string;
}

/**
 * Future clearinghouse entrypoint. Intentionally a type only in P0 — the MCP
 * `submit_graph()` tool and the CP-SAT/LNS solver implement this on top of the
 * primitive later. Declared here so the seam is type-stable from day one.
 */
export interface GraphClearinghouse {
  submitGraph(graph: TaskGraph): Promise<GraphClearing>;
}
