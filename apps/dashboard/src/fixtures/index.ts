/**
 * Bundled fixtures — the always-on content. These JSON files are emitted offline
 * by `demo/emit-run.ts` (runs) and `demo/emit-onchain.ts` (receipts) and imported
 * directly into the bundle, so the deployed dashboard replays real CP-SAT +
 * on-chain data with zero backend.
 */

import type { DemoRun, OnchainReceipts } from "../types/contract";
import invoiceProcessing from "./invoice-processing.json";
import researchReport from "./research-report.json";
import dataReconciliation from "./data-reconciliation.json";
import supportTriage from "./support-triage.json";
import codePrPipeline from "./code-pr-pipeline.json";
import ragQa from "./rag-qa.json";
import onchainReceipts from "./onchain-receipts.json";

export const RUNS: DemoRun[] = [
  invoiceProcessing as unknown as DemoRun,
  researchReport as unknown as DemoRun,
  dataReconciliation as unknown as DemoRun,
  supportTriage as unknown as DemoRun,
  codePrPipeline as unknown as DemoRun,
  ragQa as unknown as DemoRun,
];

export const RECEIPTS: OnchainReceipts = onchainReceipts as unknown as OnchainReceipts;

export function runById(id: string): DemoRun | undefined {
  return RUNS.find((r) => r.meta.runId === id);
}
