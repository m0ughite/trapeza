/**
 * Vercel serverless live-run function.
 *
 * Executes the portable Tier-2 clearing (greedy over the shared budget) on a
 * caller-supplied graph + providers. This is the "run your own" backend the
 * dashboard calls; it degrades to the identical in-browser engine when this
 * function isn't deployed.
 *
 * SAFETY: this endpoint performs NO on-chain action. It never touches a funded
 * wallet, so it cannot be turned into an abusable faucet. A real capped
 * testnet nanopayment would go behind an explicit, rate-limited, env-gated flag
 * (TRAPEZA_LIVE_ONCHAIN=1 + server-side keys) — off by default. A light
 * in-memory rate limit protects the compute path.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runLive } from "../src/lib/liveEngine";
import { normalizeRunPayload, validateRunPayload } from "../src/lib/liveRunContract";
import type { GraphView, LiveRunInput, ProviderView } from "../src/types/contract";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
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

export default function handler(req: VercelRequest, res: VercelResponse): void {
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
    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as
      | LiveRunInput
      | {
        graph: GraphView;
        providers: ProviderView[];
        budgetUsdc?: string;
        riskAversion?: number;
        calibration?: "on" | "off";
      };

    const payload: LiveRunInput = body && typeof body === "object" && "run" in body
      ? body
      : {
        graph: (body as { graph: GraphView }).graph,
        providers: (body as { providers: ProviderView[] }).providers,
        run: {
          budgetUsdc: (body as { budgetUsdc?: string; graph: GraphView }).budgetUsdc
            ?? (body as { graph: GraphView }).graph?.globalBudgetUsdc,
          deadlineMs: (body as { graph: GraphView }).graph?.globalDeadlineMs,
          riskAversion: (body as { riskAversion?: number; graph: GraphView }).riskAversion
            ?? (body as { graph: GraphView }).graph?.riskAversion
            ?? 1,
          calibration: (body as { calibration?: "on" | "off" }).calibration ?? "on",
        },
      };

    const issues = validateRunPayload(payload);
    if (issues.length > 0) {
      res.status(400).json({ error: "invalid run payload", issues });
      return;
    }

    const normalized = normalizeRunPayload(payload);
    const result = runLive(normalized.graph, normalized.providers, {
      budgetUsdc: normalized.run.budgetUsdc,
      riskAversion: normalized.run.riskAversion,
      calibration: normalized.run.calibration,
      engine: "serverless",
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
