#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { assemble } from "@trapeza/runtime";
import { bootstrapLlmMarket, runShowcaseLoop } from "./loop.js";

const dbPath =
  process.env.TRAPEZA_DB_PATH ?? join(homedir(), ".trapeza", "trapeza.db");
const calibrationOn = process.env.TRAPEZA_CALIBRATION !== "off";
const intervalMs = Number(process.env.TRAPEZA_SHOWCASE_INTERVAL_MS ?? "2500");
const iterations = Number(process.env.TRAPEZA_SHOWCASE_ITERATIONS ?? "12");
const noDashboard = process.env.TRAPEZA_SHOWCASE_NO_DASHBOARD === "1";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

async function main(): Promise<void> {
  console.log("");
  console.log("  Trapeza Live Showcase");
  console.log("  LLM providers → real oracle → mock settlement");
  console.log(`  DB: ${dbPath}`);
  console.log(
    process.env.LLM_BASE_URL
      ? `  LLM: ${process.env.LLM_BASE_URL} (${process.env.LLM_MODEL ?? "default model"})`
      : "  LLM: mock (set LLM_BASE_URL for OpenAI/NIM/Groq/Ollama)",
  );
  console.log("");

  const rt = assemble({ mode: "llm", dbPath, clearinghouse: { preferCpSat: false } });
  const market = await bootstrapLlmMarket(rt);
  console.log(`[showcase] seeded providers: lemon=${market.lemonId}`);
  console.log(`[showcase] calibration: ${calibrationOn ? "ON" : "OFF"}`);

  if (!noDashboard) {
    const dash = spawn(
      "npm",
      ["run", "dev", "-w", "@trapeza/app"],
      {
        cwd: repoRoot,
        env: { ...process.env, TRAPEZA_DB_PATH: dbPath },
        stdio: "inherit",
      },
    );
    dash.on("error", (err) => {
      console.error("[showcase] dashboard failed to start:", err);
    });
    console.log("[showcase] dashboard → http://localhost:3000");
  }

  await runShowcaseLoop(rt, market, {
    intervalMs,
    useCalibration: calibrationOn,
    maxIterations: iterations,
  });

  console.log("[showcase] running — press Ctrl+C to stop");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
