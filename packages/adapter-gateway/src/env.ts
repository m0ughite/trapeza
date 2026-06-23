/**
 * Zero-dependency .env loader (see adapter-arc/src/env.ts for rationale).
 * Reads `.env` / `.env.local` from the monorepo root and cwd into process.env
 * without overwriting existing values.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "..", "..", "..");
  const candidates = [
    join(repoRoot, ".env"),
    join(repoRoot, ".env.local"),
    join(process.cwd(), ".env"),
    join(process.cwd(), ".env.local"),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const parsed = parseEnv(readFileSync(file, "utf-8"));
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v;
    }
  }
}
