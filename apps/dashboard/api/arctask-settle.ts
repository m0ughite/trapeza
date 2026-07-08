/**
 * Vercel serverless ArcTask escrow settlement.
 *
 * Simulated by default (no wallet, no chain). Live testnet only when
 * TRAPEZA_LIVE_ONCHAIN=1 + ARCTASK_SIMULATED=false + server keys are set.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { simulateArcTaskSettle } from "../src/lib/arctaskSettle";
import type { AgentView, AllocationView } from "../src/types/contract";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
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

function liveEnabled(): boolean {
  return (
    process.env.TRAPEZA_LIVE_ONCHAIN === "1" &&
    process.env.ARCTASK_SIMULATED === "false" &&
    Boolean(process.env.ARCTASK_CLIENT_PRIVATE_KEY) &&
    Boolean(process.env.ARCTASK_EVALUATOR_PRIVATE_KEY)
  );
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
    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as {
      allocations: AllocationView[];
      agents: AgentView[];
      reward?: string;
      runId?: string;
    };
    if (!Array.isArray(body?.allocations) || !Array.isArray(body?.agents)) {
      res.status(400).json({ error: "expected { allocations, agents }" });
      return;
    }

    if (liveEnabled()) {
      res.status(501).json({
        error: "live ArcTask settlement is env-gated and not enabled in this deployment",
      });
      return;
    }

    const receipts = simulateArcTaskSettle({
      allocations: body.allocations,
      agents: body.agents,
      rewardUsdc: body.reward,
      runId: body.runId,
    });
    res.status(200).json(receipts);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
