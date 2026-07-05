#!/usr/bin/env node
import { join } from "node:path";
import { homedir } from "node:os";
import { assemble } from "@trapeza/runtime";
import { runGraphIteration, runSingleTaskLoop, seedProviders } from "./loop.js";

const dbPath =
  process.env.TRAPEZA_DB_PATH ?? join(homedir(), ".trapeza", "trapeza.db");
const calibrationOn = process.env.TRAPEZA_CALIBRATION !== "off";
const iterations = Number(process.env.TRAPEZA_ITERATIONS ?? "20");

async function main() {
  const rt = assemble({
    mode: (process.env.TRAPEZA_MODE as "mock" | "live") ?? "mock",
    dbPath,
    clearinghouse: { preferCpSat: false },
  });
  const roster = await seedProviders(rt);
  const result = await runSingleTaskLoop(rt, roster, {
    seed: 42,
    iterations,
    useCalibration: calibrationOn,
  });
  await runGraphIteration(rt, `graph-${Date.now()}`);
  console.log(JSON.stringify(result, null, 2));
  rt.store.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
