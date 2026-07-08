import type { IncomingMessage, ServerResponse } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function toVercelResponse(res: ServerResponse): VercelResponse {
  const vercelRes = {
    status(code: number) {
      res.statusCode = code;
      return vercelRes;
    },
    json(body: unknown) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(body));
      return vercelRes;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return vercelRes;
    },
    end() {
      res.end();
      return vercelRes;
    },
  } as VercelResponse;
  return vercelRes;
}

export function toVercelRequest(req: IncomingMessage, body?: unknown): VercelRequest {
  return {
    method: req.method,
    headers: req.headers,
    body,
    query: {},
    cookies: {},
  } as VercelRequest;
}
