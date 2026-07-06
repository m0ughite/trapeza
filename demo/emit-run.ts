/**
 * Engine → JSON driver (thin CLI).
 *
 * Runs scenarios from the registry and emits versioned demo-run.json fixtures.
 *
 * Run:  npm run demo:emit
 *       npm run demo:emit -- --tag calibration
 *       npm run demo:emit -- --only invoice-workflow --trace
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { solverHealthy } from "@trapeza/clearinghouse";
import { DEMO_RUN_SCHEMA_VERSION } from "../apps/dashboard/src/types/contract.js";
import { computeRun, manifestFromRun, printTrace } from "./run-scenario.js";
import { emitFixtureScenarios, SCENARIOS } from "./scenario-registry.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, "..", "apps", "dashboard", "src", "fixtures");

function parseArgs(argv: string[]): { tags: string[]; only: string[]; trace: boolean } {
  const tags: string[] = [];
  const only: string[] = [];
  let trace = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--trace") trace = true;
    else if (a === "--tag" && argv[i + 1]) {
      tags.push(argv[++i]!);
    } else if (a === "--only" && argv[i + 1]) {
      only.push(argv[++i]!);
    }
  }
  return { tags, only, trace };
}

function selectScenarios(tags: string[], only: string[]) {
  let list = emitFixtureScenarios();
  if (only.length > 0) list = list.filter((s) => only.includes(s.runId));
  if (tags.length > 0) list = list.filter((s) => tags.some((t) => s.tags.includes(t)));
  return list;
}

async function main(): Promise<void> {
  const { tags, only, trace } = parseArgs(process.argv.slice(2));
  const selected = selectScenarios(tags, only);
  if (selected.length === 0) {
    console.error("No scenarios matched selection.");
    process.exit(1);
  }

  mkdirSync(FIXTURE_DIR, { recursive: true });
  const manifest = [];

  for (const scenario of selected) {
    if (scenario.tier === "tier1" && !(await solverHealthy())) {
      process.stdout.write(`  skipping ${scenario.runId} (tier1, solver down) …\n`);
      continue;
    }

    process.stdout.write(`  emitting ${scenario.runId} … `);
    const run = await computeRun(scenario, { trace: true });
    const file = join(FIXTURE_DIR, `${scenario.runId}.json`);
    writeFileSync(file, `${JSON.stringify(run, null, 2)}\n`, "utf8");
    manifest.push(manifestFromRun(scenario, run));

    const status = run.status ?? "cleared";
    process.stdout.write(
      `ok (status=${status}, solver=${run.clearing.solver}, obj=${run.clearing.objectiveValue.toFixed(4)})\n`,
    );
    if (trace && run.trace?.length) {
      process.stdout.write(`  trace (${run.trace.length} steps):\n`);
      printTrace(run.trace);
    }
  }

  writeFileSync(
    join(FIXTURE_DIR, "manifest.json"),
    `${JSON.stringify({ schemaVersion: DEMO_RUN_SCHEMA_VERSION, runs: manifest }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(
    `\n  wrote ${manifest.length} fixtures + manifest to ${FIXTURE_DIR} (${SCENARIOS.length} total in registry)\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
