/**
 * Live-run client. Prefers the Vercel serverless function (`/api/run`, which
 * runs the same Tier-2 engine server-side); if it is unreachable — e.g. a pure
 * static deploy with no functions — it degrades gracefully to running the exact
 * same portable engine in the browser, clearly labeled.
 */

import { runLive, type LiveOptions, type LiveResult } from "../lib/liveEngine";
import type { GraphView, ProviderView } from "../types/contract";

export interface LiveRunResponse {
  result: LiveResult;
  source: "serverless" | "browser-fallback";
  serverlessError?: string;
}

export async function runClearing(
  graph: GraphView,
  providers: ProviderView[],
  opts: Omit<LiveOptions, "engine">,
): Promise<LiveRunResponse> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ graph, providers, ...opts }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`serverless ${res.status}`);
    const result = (await res.json()) as LiveResult;
    return { result, source: "serverless" };
  } catch (e) {
    const result = runLive(graph, providers, { ...opts, engine: "browser" });
    return {
      result,
      source: "browser-fallback",
      serverlessError: e instanceof Error ? e.message : String(e),
    };
  }
}
