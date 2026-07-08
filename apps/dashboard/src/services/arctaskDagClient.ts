/**
 * Client for POST /api/run-arctask-dag
 */

import type { TaskGraph } from "../types/taskGraph";

export interface DagProgressEvent {
  phase: string;
  nodeId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ArcTaskNodeResult {
  nodeId: string;
  taskId: string;
  providerId: string;
  agentId: string;
  jobId: string;
  fundTx: string;
  submitTx: string | null;
  settleTx: string;
  settleAction: "release" | "slash";
  passed: boolean;
  deliverablePreview: string;
  priceUsdc: string;
}

export interface ArcTaskDagRunResult {
  mode: "simulated" | "live";
  graphId: string;
  nodes: ArcTaskNodeResult[];
  honestyNote: string;
}

export interface ArcTaskDagRunResponse {
  result: ArcTaskDagRunResult;
  progress: DagProgressEvent[];
  source: "serverless" | "unavailable";
  error?: string;
}

export async function runArcTaskDagLive(
  graph: TaskGraph,
  opts?: { simulated?: boolean },
): Promise<ArcTaskDagRunResponse> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 600_000);
    const res = await fetch("/api/run-arctask-dag", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ graph, simulated: opts?.simulated }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `serverless ${res.status}`);
    }
    const payload = (await res.json()) as Omit<ArcTaskDagRunResponse, "source">;
    return { ...payload, source: "serverless" };
  } catch (e) {
    return {
      result: {
        mode: "simulated",
        graphId: graph.id,
        nodes: [],
        honestyNote: "Live API unavailable in static deploy.",
      },
      progress: [],
      source: "unavailable",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
