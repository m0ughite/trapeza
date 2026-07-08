/**
 * Bundled fixtures — emitted offline by `demo/emit-run.ts`.
 */

import type { DemoRun, FixtureManifest, OnchainReceipts, AgentView, ArcTaskReceipts } from "../types/contract";
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
import arctaskAgents from "./arctask-agents.json";
import arctaskReceipts from "./arctask-receipts.json";

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

export const AGENTS: AgentView[] = arctaskAgents as unknown as AgentView[];

export const ARCTASK_RECEIPTS: ArcTaskReceipts = arctaskReceipts as unknown as ArcTaskReceipts;

export function runById(id: string): DemoRun | undefined {
  return RUNS.find((r) => r.meta.runId === id);
}
