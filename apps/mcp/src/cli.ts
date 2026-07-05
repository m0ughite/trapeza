#!/usr/bin/env node
import { startStdioServer } from "./server.js";

startStdioServer().catch((err) => {
  console.error("trapeza-mcp failed:", err);
  process.exit(1);
});
