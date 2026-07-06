/**
 * Bundled fixtures — the always-on content. These JSON files are emitted offline
 * by `demo/emit-run.ts` (runs) and `demo/emit-onchain.ts` (receipts) and imported
 * directly into the bundle, so the deployed dashboard replays real CP-SAT +
 * on-chain data with zero backend.
 */

import type { DemoRun, OnchainReceipts } from "../types/contract";
import invoiceWorkflow from "./invoice-workflow.json";
import budgetBottleneck from "./budget-bottleneck.json";
import researchPipeline from "./research-pipeline.json";
import onchainReceipts from "./onchain-receipts.json";

export const RUNS: DemoRun[] = [
  invoiceWorkflow as unknown as DemoRun,
  budgetBottleneck as unknown as DemoRun,
  researchPipeline as unknown as DemoRun,
];

export const RECEIPTS: OnchainReceipts = onchainReceipts as unknown as OnchainReceipts;

export function runById(id: string): DemoRun | undefined {
  return RUNS.find((r) => r.meta.runId === id);
}
