import { afterAll, describe, expect, it } from "vitest";
import { startHttpServer } from "../src/http.js";
import { assemble } from "@trapeza/runtime";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-mcp-http-"));
  return { path: join(dir, "mcp.db"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  "mcp-protocol-version": "2024-11-05",
} as const;

describe("MCP HTTP transport", () => {
  let close: (() => Promise<void>) | undefined;

  afterAll(async () => {
    if (close) await close();
  });

  it("lists tools over Streamable HTTP", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    const server = await startHttpServer(0, rt);
    close = server.close;
    const url = new URL(server.url);

    const initRes = await fetch(url, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" },
        },
      }),
    });
    expect(initRes.status).toBe(200);

    const listRes = await fetch(url, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      result?: { tools?: { name: string }[] };
    };
    const tools = listBody.result?.tools ?? [];
    expect(tools).toHaveLength(7);
    expect(tools.map((t) => t.name)).toContain("register_provider");

    rt.store.close();
    cleanup();
    await server.close();
    close = undefined;
  });
});
