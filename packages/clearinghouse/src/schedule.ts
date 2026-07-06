import type { TaskGraph } from "@trapeza/core";
import { topologicalSort } from "./dag.js";
import type { NodeAssignment, SolverProvider } from "./types.js";

export function latencyMs(
  provider: SolverProvider,
  useCalibration = true,
): number {
  if (useCalibration && provider.calibration.nObservations > 0) {
    return Math.max(0, Math.round(provider.calibration.latencyMean));
  }
  return Math.max(0, provider.claimedLatencyMs);
}

/** Compute start/end times and makespan along the DAG longest path. */
export function computeSchedule(
  graph: TaskGraph,
  assignments: NodeAssignment[],
  providers: SolverProvider[],
  useCalibration = true,
): { schedule: import("@trapeza/core").NodeSchedule[]; makespanMs: number } {
  const byId = new Map(providers.map((p) => [p.id, p]));
  const assignMap = new Map(assignments.map((a) => [a.nodeId, a.providerId]));
  const order = topologicalSort(graph);
  const start = new Map<string, number>();
  const duration = new Map<string, number>();

  for (const nodeId of order) {
    const provId = assignMap.get(nodeId)!;
    const prov = byId.get(provId)!;
    const dur = latencyMs(prov, useCalibration);
    duration.set(nodeId, dur);
    let earliest = 0;
    for (const e of graph.edges) {
      if (e.to !== nodeId) continue;
      const predEnd =
        (start.get(e.from) ?? 0) + (duration.get(e.from) ?? 0);
      earliest = Math.max(earliest, predEnd);
    }
    start.set(nodeId, earliest);
  }

  let makespanMs = 0;
  const schedule: import("@trapeza/core").NodeSchedule[] = [];
  for (const nodeId of order) {
    const s = start.get(nodeId) ?? 0;
    const d = duration.get(nodeId) ?? 0;
    makespanMs = Math.max(makespanMs, s + d);
    schedule.push({ nodeId, startMs: s, durationMs: d, endMs: s + d });
  }
  return { schedule, makespanMs };
}
