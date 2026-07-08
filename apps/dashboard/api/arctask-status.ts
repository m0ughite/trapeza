/**
 * Read-only ArcTask readiness probe for the dashboard.
 * Never returns secrets or LLM keys.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  liveMissingReasons,
  liveReadyFromChecks,
  probeArcTaskApi,
  probeWorkerStatus,
  readArcTaskEnvChecks,
} from "./lib/arctaskLive";
import { loadDashboardEnv } from "./lib/loadDashboardEnv";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only" });
    return;
  }

  loadDashboardEnv();

  const checks = readArcTaskEnvChecks();
  const envLiveReady = liveReadyFromChecks(checks);
  const missing = liveMissingReasons(checks);

  const [arctaskApiReachable, worker] = await Promise.all([
    probeArcTaskApi(checks.arctaskApiBase),
    probeWorkerStatus(checks.arctaskApiBase),
  ]);

  const hints: string[] = [];
  if (!envLiveReady) {
    hints.push(`Set server env: ${missing.join(", ")}`);
  }
  if (!arctaskApiReachable) {
    hints.push(`Start ArcTask API at ${checks.arctaskApiBase} (npm run dev in ArcTask fork)`);
  }
  if (!worker.live) {
    hints.push(
      "Start worker: cd ArcTask && npm run agent:worker:live (Groq: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL in ArcTask .env.local)",
    );
  }

  res.status(200).json({
    liveReady: envLiveReady && arctaskApiReachable,
    simulatedDefault: process.env.ARCTASK_SIMULATED !== "false",
    checks: {
      trapezaLiveOnchain: checks.trapezaLiveOnchain,
      arctaskLiveMode: checks.arctaskLiveMode,
      buyerKey: checks.buyerKey,
      validatorKey: checks.validatorKey,
      registryAddress: checks.registryAddress,
      escrowAddress: checks.escrowAddress,
      arctaskApiBase: checks.arctaskApiBase,
      arctaskApiReachable,
      workerReachable: worker.reachable,
      workerLive: worker.live,
      workerExecutor: worker.executor,
    },
    hints,
    missing,
  });
}
