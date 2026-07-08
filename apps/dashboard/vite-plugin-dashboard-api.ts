/**
 * Serves /api/* during `vite` dev — same handlers as Vercel serverless routes.
 * Loads repo-root .env via @trapeza/adapter-arc loadEnv().
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { loadDashboardEnv } from "./api/lib/loadDashboardEnv";
import { readRequestBody, toVercelRequest, toVercelResponse } from "./api/lib/vercelAdapter";

type ApiHandler = (req: import("@vercel/node").VercelRequest, res: import("@vercel/node").VercelResponse) => void | Promise<void>;

const ROUTES: Record<string, () => Promise<{ default: ApiHandler }>> = {
  "/api/arctask-status": () => import("./api/arctask-status"),
  "/api/run-arctask-dag": () => import("./api/run-arctask-dag"),
  "/api/run": () => import("./api/run"),
  "/api/arctask-settle": () => import("./api/arctask-settle"),
};

let envLoaded = false;

function ensureEnv() {
  if (envLoaded) return;
  loadDashboardEnv();
  envLoaded = true;
}

async function handleApi(
  pathname: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const loader = ROUTES[pathname];
  if (!loader) return false;

  ensureEnv();
  const mod = await loader();
  const handler = mod.default;
  const vercelRes = toVercelResponse(res);

  let body: unknown;
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const raw = await readRequestBody(req);
    body = raw ? JSON.parse(raw) : undefined;
  }

  await handler(toVercelRequest(req, body), vercelRes);
  return true;
}

export function dashboardApiPlugin(): Plugin {
  return {
    name: "dashboard-api-dev",
    configureServer(server) {
      loadDashboardEnv();
      envLoaded = true;

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) {
          next();
          return;
        }

        const pathname = url.split("?")[0] ?? url;
        try {
          const handled = await handleApi(pathname, req, res);
          if (!handled) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `no dev handler for ${pathname}` }));
          }
        } catch (e) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
          }
        }
      });
    },
  };
}
