/**
 * Client for GET /api/arctask-status
 */

export interface ArcTaskStatusChecks {
  trapezaLiveOnchain: boolean;
  arctaskLiveMode: boolean;
  buyerKey: boolean;
  validatorKey: boolean;
  registryAddress?: string;
  escrowAddress?: string;
  arctaskApiBase?: string;
  arctaskApiReachable: boolean;
  workerReachable: boolean;
  workerLive: boolean;
  workerExecutor?: string;
}

export interface ArcTaskStatusResponse {
  liveReady: boolean;
  simulatedDefault: boolean;
  checks: ArcTaskStatusChecks;
  hints: string[];
  missing: string[];
  error?: string;
  source: "serverless" | "unavailable";
}

export async function fetchArcTaskStatus(): Promise<ArcTaskStatusResponse> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8_000);
    const res = await fetch("/api/arctask-status", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `status ${res.status}`);
    }
    const payload = (await res.json()) as Omit<ArcTaskStatusResponse, "source">;
    return { ...payload, source: "serverless" };
  } catch (e) {
    return {
      liveReady: false,
      simulatedDefault: true,
      checks: {
        trapezaLiveOnchain: false,
        arctaskLiveMode: false,
        buyerKey: false,
        validatorKey: false,
        arctaskApiReachable: false,
        workerReachable: false,
        workerLive: false,
      },
      hints: [
        "Status API unreachable — restart dashboard dev server from apps/dashboard.",
      ],
      missing: [],
      error: e instanceof Error ? e.message : String(e),
      source: "unavailable",
    };
  }
}
