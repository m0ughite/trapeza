/**
 * ArcTask settle client. Prefers `/api/arctask-settle`; falls back to in-browser simulation.
 */

import { simulateArcTaskSettle, type SettleInput } from "../lib/arctaskSettle";
import type { ArcTaskReceipts } from "../types/contract";

export interface ArcTaskSettleResponse {
  receipts: ArcTaskReceipts;
  source: "serverless" | "browser-fallback";
  serverlessError?: string;
}

export async function settleViaArcTask(input: SettleInput): Promise<ArcTaskSettleResponse> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("/api/arctask-settle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`serverless ${res.status}`);
    const receipts = (await res.json()) as ArcTaskReceipts;
    return { receipts, source: "serverless" };
  } catch (e) {
    const receipts = simulateArcTaskSettle(input);
    return {
      receipts,
      source: "browser-fallback",
      serverlessError: e instanceof Error ? e.message : String(e),
    };
  }
}
