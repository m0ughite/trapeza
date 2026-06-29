import type { TaskGraph } from "@trapeza/core";
import { ClearingError } from "./types.js";

export function validateDag(graph: TaskGraph): void {
  const ids = new Set(graph.nodes.map((n) => n.nodeId));
  for (const edge of graph.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new ClearingError(
        `edge references unknown node: ${edge.from} -> ${edge.to}`,
        "INVALID_DAG",
      );
    }
    if (edge.from === edge.to) {
      throw new ClearingError("self-loop edge", "INVALID_DAG");
    }
  }
  if (hasCycle(graph.nodes.map((n) => n.nodeId), graph.edges)) {
    throw new ClearingError("graph contains a cycle", "INVALID_DAG");
  }
}

function hasCycle(
  nodeIds: string[],
  edges: { from: string; to: string }[],
): boolean {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) adj.get(e.from)!.push(e.to);

  const visiting = new Set<string>();
  const done = new Set<string>();

  function dfs(u: string): boolean {
    if (done.has(u)) return false;
    if (visiting.has(u)) return true;
    visiting.add(u);
    for (const v of adj.get(u) ?? []) {
      if (dfs(v)) return true;
    }
    visiting.delete(u);
    done.add(u);
    return false;
  }

  for (const id of nodeIds) {
    if (dfs(id)) return true;
  }
  return false;
}

/** Kahn topological sort; throws if cycle detected. */
export function topologicalSort(graph: TaskGraph): string[] {
  validateDag(graph);
  const ids = graph.nodes.map((n) => n.nodeId);
  const inDeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) {
    inDeg.set(id, 0);
    adj.set(id, []);
  }
  for (const e of graph.edges) {
    adj.get(e.from)!.push(e.to);
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  }
  const queue = ids.filter((id) => (inDeg.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      inDeg.set(v, (inDeg.get(v) ?? 0) - 1);
      if (inDeg.get(v) === 0) queue.push(v);
    }
  }
  if (order.length !== ids.length) {
    throw new ClearingError("topological sort failed (cycle)", "INVALID_DAG");
  }
  return order;
}

export function sinkNodeIds(graph: TaskGraph): string[] {
  const hasOutgoing = new Set(graph.edges.map((e) => e.from));
  return graph.nodes
    .filter((n) => !hasOutgoing.has(n.nodeId))
    .map((n) => n.nodeId);
}

export function parentMap(graph: TaskGraph): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const n of graph.nodes) parents.set(n.nodeId, []);
  for (const e of graph.edges) {
    parents.get(e.to)!.push(e.from);
  }
  return parents;
}
