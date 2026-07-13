#!/usr/bin/env tsx
/**
 * ArcTask × Trapeza brain-loop harness.
 *
 * Trapeza runs as the CLEARING + EVALUATOR brain over the ArcTask marketplace —
 * it is NEVER the worker. One pass:
 *   discover + calibrate (read registry) → get job (seed or organic) →
 *   CLEAR (rank agents by calibrated EV, pick the winner, assign on-chain) →
 *   EXECUTE (ArcTask's OWN worker submits) → EVALUATE + SETTLE (oracle verify →
 *   acceptWork/rejectWork → ERC-8004 reputation → calibration ledger).
 *
 *   npm run harness:arc                                    # simulated (default)
 *   ARCTASK_SEED_JOB=true ARCTASK_SIMULATED=false \
 *     ARCTASK_USDC_MODE=native npm run harness:arc         # live Arc testnet
 *   npm run arctask:emit                                   # regenerate dashboard fixture
 *
 * Live execution requires ArcTask's own worker running with LLM_* creds (see
 * docs/ARCTASK-INTEGRATION-EVAL.md §"ArcTask worker LLM"). If the worker never
 * submits, the harness reports the exact blocker and never fabricates success.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnv,
  readArctaskUsdcMode,
  ARC_TESTNET_EXPLORER,
} from "@trapeza/adapter-arc";
import { runArcBrain, type Phase } from "./arc-brain.js";

loadEnv();

const simulated = process.env.ARCTASK_SIMULATED !== "false";
const usdcMode = readArctaskUsdcMode();
const seedJob = process.env.ARCTASK_SEED_JOB === "true";
const emit = process.env.ARCTASK_EMIT_RECEIPTS === "true";
const useCalibration = process.env.ARCTASK_CALIBRATION !== "off";
const dryRun = process.env.ARCTASK_DRY_RUN === "true";

function requireKey(name: string, fallback: string): `0x${string}` {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) {
    if (!simulated) {
      throw new Error(
        `${name} is required for a live run (set it in .env). ` +
          `Run simulated with ARCTASK_SIMULATED=true to skip live wallets.`,
      );
    }
    return fallback as `0x${string}`;
  }
  return v as `0x${string}`;
}

const PHASE_TAG: Record<Phase, string> = {
  discover: "[1] discover+calibrate",
  job: "[2] job",
  clear: "[3] CLEAR (route)",
  assign: "[4] assign",
  execute: "[5] execute (external worker)",
  evaluate: "[6] evaluate+settle",
  done: "[✓]",
};

async function main(): Promise<void> {
  console.log("=== ArcTask × Trapeza — clearing + evaluator brain ===");
  console.log(
    `mode: ${simulated ? "simulated" : "live"} | usdc rail: ${usdcMode} | ` +
      `job: ${seedJob || simulated ? "seeded (demo client)" : "organic"} | ` +
      `calibration: ${useCalibration ? "on" : "off"}`,
  );
  console.log("role: Trapeza = clearing + evaluator brain. Trapeza is NEVER the worker.\n");

  // Deterministic clock when regenerating the committed fixture.
  const fixedNow = emit ? Date.parse("2026-07-13T00:00:00.000Z") : undefined;

  const result = await runArcBrain({
    simulated,
    usdcMode,
    seedJob,
    useCalibration,
    clientKey: requireKey("BUYER_PRIVATE_KEY", "0x" + "11".repeat(32)),
    evaluatorKey: requireKey("VALIDATOR_PRIVATE_KEY", "0x" + "33".repeat(32)),
    ownerKey: requireKey("OWNER_PRIVATE_KEY", "0x" + "22".repeat(32)),
    dryRun,
    now: fixedNow ? () => fixedNow : undefined,
    generatedAt: emit ? "2026-07-13T00:00:00.000Z" : undefined,
    log: (phase, msg) => console.log(`${PHASE_TAG[phase]} ${msg}`),
  });

  const { receipt } = result;
  console.log("\n── clearing decision ──");
  for (const r of receipt.clearing.ranked) {
    console.log(
      `  ${r.hired ? "★" : " "} #${r.rank} ${r.providerId} (agent #${r.agentId})  ` +
        `score=${r.score.toFixed(5)}  p=${r.pSuccessUsed.toFixed(3)} (${r.source})  ` +
        `price=${r.priceUsdc}  risk=${r.riskPremium.toFixed(5)}`,
    );
  }
  console.log(`  rationale: ${receipt.clearing.rationale}`);

  console.log("\n── settlement ──");
  for (const s of receipt.evaluation.steps) {
    const link = s.ref.linkable && s.ref.url ? `  ${ARC_TESTNET_EXPLORER}/tx/${s.ref.value}` : "";
    console.log(`  ${s.label}: ${s.ref.value}${link}`);
  }

  if (result.workerBlocked) {
    console.log(
      "\n⚠ live worker BLOCKED: ArcTask's autonomous worker did not submit a deliverable.\n" +
        "  Needed to finish the live loop:\n" +
        "   • a running ArcTask fork clone (git clone https://github.com/VadymManiuk/ArcTask.git)\n" +
        "   • its worker started as the chosen agent:  npm run agent:worker:live\n" +
        "   • LLM creds in the fork's .env.local: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL\n" +
        "     (e.g. Groq: LLM_BASE_URL=https://api.groq.com/openai/v1, LLM_MODEL=llama-3.3-70b-versatile)\n" +
        "  Trapeza did NOT fabricate a deliverable; settlement is deferred until the worker runs.",
    );
  }

  if (emit) {
    const here = dirname(fileURLToPath(import.meta.url));
    const out =
      process.env.ARCTASK_RECEIPTS_OUT ??
      resolve(here, "..", "apps", "dashboard", "src", "fixtures", "arctask-clearing.json");
    writeFileSync(out, JSON.stringify(receipt, null, 2) + "\n");
    console.log(`\nreceipts written → ${out}`);
  }

  console.log("\nharness complete ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
