/**
 * Bundled fixtures — emitted offline by `demo/emit-run.ts`.
 */

import type { DemoRun, FixtureManifest, OnchainReceipts } from "../types/contract";
import invoiceWorkflow from "./invoice-workflow.json";
import budgetBottleneck from "./budget-bottleneck.json";
import researchPipeline from "./research-pipeline.json";
import coldStartCalibration from "./cold-start-calibration.json";
import qualityFloor from "./quality-floor.json";
import scaleStress from "./scale-stress.json";
import deadlineTight from "./deadline-tight.json";
import preflightUnderfunded from "./preflight-underfunded.json";
import solverDegrade from "./solver-degrade.json";
import concurrency from "./concurrency.json";
import bondCapacity from "./bond-capacity.json";
import manifest from "./manifest.json";
import onchainReceipts from "./onchain-receipts.json";

export const RUNS: DemoRun[] = [
  invoiceWorkflow,
  budgetBottleneck,
  researchPipeline,
  coldStartCalibration,
  qualityFloor,
  scaleStress,
  deadlineTight,
  preflightUnderfunded,
  solverDegrade,
  concurrency,
  bondCapacity,
].map((r) => r as unknown as DemoRun);

export const MANIFEST: FixtureManifest = manifest as unknown as FixtureManifest;

export const RECEIPTS: OnchainReceipts = onchainReceipts as unknown as OnchainReceipts;

export function runById(id: string): DemoRun | undefined {
  return RUNS.find((r) => r.meta.runId === id);
}
