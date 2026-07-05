#!/usr/bin/env node
import { startHttpServer } from "./http.js";

const port = Number(process.env.TRAPEZA_MCP_PORT ?? "3100");

startHttpServer(port)
  .then(({ url }) => {
    console.error(`trapeza-mcp http listening on ${url}`);
  })
  .catch((err) => {
    console.error("trapeza-mcp http failed:", err);
    process.exit(1);
  });
