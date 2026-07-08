/**
 * Vercel serverless ArcTask DAG runner.
 *
 * Live only when TRAPEZA_LIVE_ONCHAIN=1 + ARCTASK_SIMULATED=false + wallets set.
 * Never accepts LLM keys — worker reads LLM_* from ArcTask env.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { TaskGraph } from "@trapeza/core";
import type { ArcTaskDagRunResult, DagProgressEvent } from "@trapeza/adapter-arc";
import { loadDashboardEnv } from "./lib/loadDashboardEnv";
import { liveEnabled, liveMissingReasons, readArcTaskEnvChecks } from "./lib/arctaskLive";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > MAX_PER_WINDOW;
}

function requireKey(name: string): `0x${string}` | undefined {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) return undefined;
  return v as `0x${string}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate limit — try again shortly" });
    return;
  }

  try {
    loadDashboardEnv();
    const { runArcTaskDag } = await import("@trapeza/adapter-arc");

    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as {
      graph?: TaskGraph;
      simulated?: boolean;
    };

    if (!body?.graph?.nodes?.length) {
      res.status(400).json({ error: "expected { graph: TaskGraph }" });
      return;
    }

    const simulated = body.simulated ?? process.env.ARCTASK_SIMULATED !== "false";

    if (!simulated && !liveEnabled()) {
      const missing = liveMissingReasons(readArcTaskEnvChecks());
      res.status(501).json({
        error:
          `Live ArcTask DAG not configured. Missing: ${missing.join(", ")}. See docs/ARCTASK-DAG-RUNNER.md. LLM keys belong in the ArcTask worker env, not this API.`,
        missing,
      });
      return;
    }

    const progress: DagProgressEvent[] = [];
    const result: ArcTaskDagRunResult = await runArcTaskDag({
      graph: body.graph,
      simulated,
      clientPrivateKey: requireKey("BUYER_PRIVATE_KEY"),
      evaluatorPrivateKey: requireKey("VALIDATOR_PRIVATE_KEY"),
      onProgress: (e: DagProgressEvent) => progress.push(e),
    });

    res.status(200).json({ result, progress, source: "serverless" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
