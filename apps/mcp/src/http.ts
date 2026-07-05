/**
 * HTTP/SSE MCP transport (stateless Streamable HTTP).
 *
 * Stateless mode: one fresh transport + server per request (SDK requirement).
 * Clients should batch initialize + tools/call in a single POST, or use stdio.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { assemble, type TrapezaRuntime } from "@trapeza/runtime";
import { join } from "node:path";
import { homedir } from "node:os";
import { createMcpServer } from "./server.js";

function defaultDbPath(): string {
  return (
    process.env.TRAPEZA_DB_PATH ??
    join(homedir(), ".trapeza", "trapeza.db")
  );
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return undefined;
  return JSON.parse(raw) as unknown;
}

export async function startHttpServer(
  port = Number(process.env.TRAPEZA_MCP_PORT ?? "3100"),
  rt?: TrapezaRuntime,
): Promise<{ close: () => Promise<void>; url: string }> {
  const runtime =
    rt ??
    assemble({
      mode: (process.env.TRAPEZA_MODE as "mock" | "live" | "llm") ?? "mock",
      dbPath: defaultDbPath(),
    });

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname !== "/mcp") {
      res.statusCode = 404;
      res.end("not found");
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = createMcpServer(runtime);

    try {
      await server.connect(transport);
      const body =
        req.method === "POST" || req.method === "DELETE"
          ? await readBody(req)
          : undefined;
      await transport.handleRequest(req, res, body);
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(String(err));
      }
      void transport.close();
      void server.close();
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port, resolve);
  });

  const addr = httpServer.address();
  const actualPort =
    typeof addr === "object" && addr ? addr.port : port;
  const url = `http://127.0.0.1:${actualPort}/mcp`;
  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
