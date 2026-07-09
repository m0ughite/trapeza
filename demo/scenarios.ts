/**
 * Six real, recognizable multi-step agentic workflows.
 *
 * Each is a genuine use case a developer would recognise — invoice processing,
 * research-to-report, data reconciliation (ETL), customer-support triage, a
 * code-PR pipeline, and RAG document Q&A — with named capabilities
 * (`doc.parse`, `data.reconcile`, `verify.claims`, `code.generate`, …) and
 * believable provider identities (`sonnet-extractor`, `budget-ocr`,
 * `ledger-reconciler`, …). No abstract `cap.N` / `n1..n6` / `workhorse-N`.
 *
 * Dollar values are illustrative WORKFLOW ECONOMICS (what getting each step
 * right is worth to the requester), not amounts moved on-chain. The on-chain
 * settlement panel reports the real, separately-labelled sub-cent Arc-testnet
 * receipts. See PLAN-TANGIBLE-DEMO §3.
 */

import type { TaskGraph } from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import {
  makeNode,
  makeProvider,
  makeUncalibratedProvider,
  trackRecord,
} from "./data.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Invoice processing pipeline  (calibration flip; fixes the mismatch bug)
//    parse → extract-line-items + extract-totals → reconcile → validate → format
// ─────────────────────────────────────────────────────────────────────────────

export const invoiceGraph: TaskGraph = {
  id: "invoice-processing",
  nodes: [
    makeNode("parse", { capability: "doc.parse", valueUsdc: "0.60", budgetUsdc: "0.90" }),
    makeNode("extract-line-items", { capability: "data.extract", valueUsdc: "0.90", budgetUsdc: "1.20" }),
    makeNode("extract-totals", { capability: "data.extract", valueUsdc: "0.70", budgetUsdc: "1.00" }),
    makeNode("reconcile", { capability: "data.reconcile", valueUsdc: "1.50", budgetUsdc: "1.80", bondRatio: 0.1 }),
    makeNode("validate", { capability: "verify.rules", valueUsdc: "0.80", budgetUsdc: "1.00" }),
    makeNode("format", { capability: "report.format", valueUsdc: "0.40", budgetUsdc: "0.60" }),
  ],
  edges: [
    { from: "parse", to: "extract-line-items" },
    { from: "parse", to: "extract-totals" },
    { from: "extract-line-items", to: "reconcile" },
    { from: "extract-totals", to: "reconcile" },
    { from: "reconcile", to: "validate" },
    { from: "validate", to: "format" },
  ],
  globalBudgetUsdc: "6.00",
  globalDeadlineMs: 60_000,
  riskAversion: 1,
};

export const invoiceProviders: SolverProvider[] = [
  // doc.parse — reliable model vs a "98%-accuracy" budget OCR that delivers ~18%.
  makeProvider("sonnet-parser", "doc.parse", {
    priceUsdc: "0.30", claimedSuccessProb: 0.74, claimedLatencyMs: 900,
    outcomes: trackRecord(18, 20, "0.30", 880),
  }),
  makeProvider("budget-ocr", "doc.parse", {
    priceUsdc: "0.26", claimedSuccessProb: 0.98, claimedLatencyMs: 350,
    outcomes: trackRecord(3, 20, "0.26", 360),
  }),
  // data.extract — used by both extraction steps.
  makeProvider("sonnet-extractor", "data.extract", {
    priceUsdc: "0.34", claimedSuccessProb: 0.72, claimedLatencyMs: 1000,
    outcomes: trackRecord(17, 20, "0.34", 980),
  }),
  makeProvider("flash-extractor", "data.extract", {
    priceUsdc: "0.30", claimedSuccessProb: 0.97, claimedLatencyMs: 450,
    outcomes: trackRecord(4, 20, "0.30", 460),
  }),
  // data.reconcile — the bottleneck; a real ledger reconciler vs a fast fabricator.
  makeProvider("ledger-reconciler", "data.reconcile", {
    priceUsdc: "0.55", claimedSuccessProb: 0.70, claimedLatencyMs: 1300,
    outcomes: trackRecord(18, 20, "0.55", 1280),
  }),
  makeProvider("quick-reconciler", "data.reconcile", {
    priceUsdc: "0.48", claimedSuccessProb: 0.96, claimedLatencyMs: 500,
    outcomes: trackRecord(2, 20, "0.48", 520),
  }),
  // verify.rules — a rules validator vs a "just say pass" checker.
  makeProvider("rules-validator", "verify.rules", {
    priceUsdc: "0.30", claimedSuccessProb: 0.76, claimedLatencyMs: 700,
    outcomes: trackRecord(19, 20, "0.30", 690),
  }),
  makeProvider("skip-check", "verify.rules", {
    priceUsdc: "0.26", claimedSuccessProb: 0.99, claimedLatencyMs: 180,
    outcomes: trackRecord(3, 20, "0.26", 190),
  }),
  // report.format — no braggart here; the good formatter simply wins.
  makeProvider("report-formatter", "report.format", {
    priceUsdc: "0.18", claimedSuccessProb: 0.80, claimedLatencyMs: 450,
    outcomes: trackRecord(19, 20, "0.18", 440),
  }),
  makeProvider("template-bot", "report.format", {
    priceUsdc: "0.16", claimedSuccessProb: 0.60, claimedLatencyMs: 380,
    outcomes: trackRecord(16, 20, "0.16", 370),
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Research → report pipeline  (dense DAG; scheduler + shadow prices + twin)
//    research → extract×3 + gather → reconcile → fact-check → format
// ─────────────────────────────────────────────────────────────────────────────

export const researchGraph: TaskGraph = {
  id: "research-report",
  nodes: [
    makeNode("research", { capability: "web.research", valueUsdc: "0.60", budgetUsdc: "0.90" }),
    makeNode("extract-a", { capability: "doc.extract", valueUsdc: "0.55", budgetUsdc: "0.80" }),
    makeNode("extract-b", { capability: "doc.extract", valueUsdc: "0.55", budgetUsdc: "0.80" }),
    makeNode("extract-c", { capability: "doc.extract", valueUsdc: "0.55", budgetUsdc: "0.80" }),
    makeNode("gather", { capability: "data.aggregate", valueUsdc: "0.60", budgetUsdc: "0.90" }),
    makeNode("reconcile", { capability: "data.reconcile", valueUsdc: "1.30", budgetUsdc: "1.50", bondRatio: 0.1 }),
    makeNode("fact-check", { capability: "verify.claims", valueUsdc: "1.10", budgetUsdc: "1.30", bondRatio: 0.1 }),
    makeNode("format", { capability: "report.format", valueUsdc: "0.40", budgetUsdc: "0.60" }),
  ],
  edges: [
    { from: "research", to: "extract-a" },
    { from: "research", to: "extract-b" },
    { from: "research", to: "extract-c" },
    { from: "research", to: "gather" },
    { from: "extract-a", to: "reconcile" },
    { from: "extract-b", to: "reconcile" },
    { from: "extract-c", to: "reconcile" },
    { from: "gather", to: "reconcile" },
    { from: "reconcile", to: "fact-check" },
    { from: "fact-check", to: "format" },
  ],
  globalBudgetUsdc: "7.00",
  globalDeadlineMs: 12_000,
  riskAversion: 1,
};

export const researchProviders: SolverProvider[] = [
  makeProvider("web-scout", "web.research", {
    priceUsdc: "0.28", claimedSuccessProb: 0.72, claimedLatencyMs: 1200,
    outcomes: trackRecord(18, 20, "0.28", 1180),
  }),
  makeProvider("headline-grabber", "web.research", {
    priceUsdc: "0.24", claimedSuccessProb: 0.98, claimedLatencyMs: 500,
    outcomes: trackRecord(4, 20, "0.24", 520),
  }),
  makeProvider("sonnet-reader", "doc.extract", {
    priceUsdc: "0.30", claimedSuccessProb: 0.71, claimedLatencyMs: 950,
    outcomes: trackRecord(17, 20, "0.30", 930),
  }),
  makeProvider("skim-bot", "doc.extract", {
    priceUsdc: "0.26", claimedSuccessProb: 0.97, claimedLatencyMs: 420,
    outcomes: trackRecord(3, 20, "0.26", 440),
  }),
  makeProvider("aggregator", "data.aggregate", {
    priceUsdc: "0.32", claimedSuccessProb: 0.74, claimedLatencyMs: 800,
    outcomes: trackRecord(18, 20, "0.32", 790),
  }),
  makeProvider("ledger-reconciler", "data.reconcile", {
    priceUsdc: "0.58", claimedSuccessProb: 0.70, claimedLatencyMs: 1400,
    outcomes: trackRecord(18, 20, "0.58", 1380),
  }),
  makeProvider("quick-reconciler", "data.reconcile", {
    priceUsdc: "0.50", claimedSuccessProb: 0.96, claimedLatencyMs: 600,
    outcomes: trackRecord(2, 20, "0.50", 620),
  }),
  makeProvider("claim-auditor", "verify.claims", {
    priceUsdc: "0.52", claimedSuccessProb: 0.73, claimedLatencyMs: 1100,
    outcomes: trackRecord(19, 20, "0.52", 1080),
  }),
  makeProvider("rubber-stamp", "verify.claims", {
    priceUsdc: "0.44", claimedSuccessProb: 0.99, claimedLatencyMs: 300,
    outcomes: trackRecord(3, 20, "0.44", 320),
  }),
  makeProvider("report-formatter", "report.format", {
    priceUsdc: "0.20", claimedSuccessProb: 0.80, claimedLatencyMs: 450,
    outcomes: trackRecord(19, 20, "0.20", 440),
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Data ETL & reconciliation  (budget bottleneck — the greedy router busts)
//    extract → reconcile, under a tight budget
// ─────────────────────────────────────────────────────────────────────────────

export const etlGraph: TaskGraph = {
  id: "data-reconciliation",
  nodes: [
    makeNode("extract", { capability: "data.extract", valueUsdc: "2.00", budgetUsdc: "2.00", bondRatio: 0.05 }),
    makeNode("reconcile", { capability: "data.reconcile", valueUsdc: "1.50", budgetUsdc: "1.50", bondRatio: 0.05 }),
  ],
  edges: [{ from: "extract", to: "reconcile" }],
  globalBudgetUsdc: "1.00",
  globalDeadlineMs: 120_000,
  riskAversion: 1,
};

/** Uncalibrated providers — the bake-off trusts self-reported claims here. */
export const etlProviders: SolverProvider[] = [
  makeUncalibratedProvider("premium-extractor", "data.extract", {
    priceUsdc: "0.65", claimedSuccessProb: 0.98, claimedLatencyMs: 800,
  }),
  makeUncalibratedProvider("budget-extractor", "data.extract", {
    priceUsdc: "0.15", claimedSuccessProb: 0.55, claimedLatencyMs: 1200,
  }),
  makeUncalibratedProvider("ledger-reconciler", "data.reconcile", {
    priceUsdc: "0.50", claimedSuccessProb: 0.90, claimedLatencyMs: 1500,
  }),
  makeUncalibratedProvider("premium-reconciler", "data.reconcile", {
    priceUsdc: "0.80", claimedSuccessProb: 0.95, claimedLatencyMs: 1000,
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. Customer-support triage  (fan-out / fan-in; tight deadline)
//    classify → {kb-lookup, sentiment, entitlement} → draft → tone-check
// ─────────────────────────────────────────────────────────────────────────────

export const supportGraph: TaskGraph = {
  id: "support-triage",
  nodes: [
    makeNode("classify", { capability: "ticket.classify", valueUsdc: "0.50", budgetUsdc: "0.80" }),
    makeNode("kb-lookup", { capability: "kb.lookup", valueUsdc: "0.60", budgetUsdc: "0.90" }),
    makeNode("sentiment", { capability: "sentiment.analyze", valueUsdc: "0.40", budgetUsdc: "0.70" }),
    makeNode("entitlement", { capability: "entitlement.check", valueUsdc: "0.55", budgetUsdc: "0.85" }),
    makeNode("draft", { capability: "response.draft", valueUsdc: "1.20", budgetUsdc: "1.40", bondRatio: 0.1 }),
    makeNode("tone-check", { capability: "verify.tone", valueUsdc: "0.50", budgetUsdc: "0.70" }),
  ],
  edges: [
    { from: "classify", to: "kb-lookup" },
    { from: "classify", to: "sentiment" },
    { from: "classify", to: "entitlement" },
    { from: "kb-lookup", to: "draft" },
    { from: "sentiment", to: "draft" },
    { from: "entitlement", to: "draft" },
    { from: "draft", to: "tone-check" },
  ],
  globalBudgetUsdc: "6.00",
  globalDeadlineMs: 8_000,
  riskAversion: 2,
};

export const supportProviders: SolverProvider[] = [
  makeProvider("intent-router", "ticket.classify", {
    priceUsdc: "0.20", claimedSuccessProb: 0.78, claimedLatencyMs: 500,
    outcomes: trackRecord(19, 20, "0.20", 490),
  }),
  makeProvider("kb-retriever", "kb.lookup", {
    priceUsdc: "0.24", claimedSuccessProb: 0.74, claimedLatencyMs: 700,
    outcomes: trackRecord(18, 20, "0.24", 690),
  }),
  makeProvider("stale-kb", "kb.lookup", {
    priceUsdc: "0.20", claimedSuccessProb: 0.97, claimedLatencyMs: 350,
    outcomes: trackRecord(4, 20, "0.20", 360),
  }),
  makeProvider("mood-reader", "sentiment.analyze", {
    priceUsdc: "0.16", claimedSuccessProb: 0.80, claimedLatencyMs: 400,
    outcomes: trackRecord(19, 20, "0.16", 390),
  }),
  makeProvider("plan-checker", "entitlement.check", {
    priceUsdc: "0.22", claimedSuccessProb: 0.76, claimedLatencyMs: 600,
    outcomes: trackRecord(18, 20, "0.22", 590),
  }),
  makeProvider("reply-writer", "response.draft", {
    priceUsdc: "0.50", claimedSuccessProb: 0.72, claimedLatencyMs: 1200,
    outcomes: trackRecord(18, 20, "0.50", 1180),
  }),
  makeProvider("autoresponder", "response.draft", {
    priceUsdc: "0.42", claimedSuccessProb: 0.98, claimedLatencyMs: 500,
    outcomes: trackRecord(3, 20, "0.42", 520),
  }),
  makeProvider("tone-guard", "verify.tone", {
    priceUsdc: "0.22", claimedSuccessProb: 0.79, claimedLatencyMs: 450,
    outcomes: trackRecord(19, 20, "0.22", 440),
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. Code-PR review pipeline  (quality floor excludes unreliable providers)
//    generate → test → review → security-scan
// ─────────────────────────────────────────────────────────────────────────────

export const codePrGraph: TaskGraph = {
  id: "code-pr-pipeline",
  nodes: [
    makeNode("generate", { capability: "code.generate", valueUsdc: "1.00", budgetUsdc: "1.30", qualityFloor: 0.6 }),
    makeNode("test", { capability: "test.run", valueUsdc: "0.70", budgetUsdc: "1.00", qualityFloor: 0.6 }),
    makeNode("review", { capability: "code.review", valueUsdc: "0.90", budgetUsdc: "1.20", qualityFloor: 0.6 }),
    makeNode("security-scan", { capability: "security.scan", valueUsdc: "1.10", budgetUsdc: "1.40", bondRatio: 0.1, qualityFloor: 0.6 }),
  ],
  edges: [
    { from: "generate", to: "test" },
    { from: "test", to: "review" },
    { from: "review", to: "security-scan" },
  ],
  globalBudgetUsdc: "6.00",
  globalDeadlineMs: 60_000,
  globalQualityFloor: 0.35,
  riskAversion: 1,
};

export const codePrProviders: SolverProvider[] = [
  makeProvider("codegen-pro", "code.generate", {
    priceUsdc: "0.45", claimedSuccessProb: 0.74, claimedLatencyMs: 1400,
    outcomes: trackRecord(19, 20, "0.45", 1380),
  }),
  makeProvider("autocomplete-hero", "code.generate", {
    priceUsdc: "0.30", claimedSuccessProb: 0.97, claimedLatencyMs: 600,
    outcomes: trackRecord(8, 20, "0.30", 620),
  }),
  makeProvider("ci-runner", "test.run", {
    priceUsdc: "0.28", claimedSuccessProb: 0.80, claimedLatencyMs: 900,
    outcomes: trackRecord(19, 20, "0.28", 890),
  }),
  makeProvider("flaky-runner", "test.run", {
    priceUsdc: "0.20", claimedSuccessProb: 0.96, claimedLatencyMs: 400,
    outcomes: trackRecord(8, 20, "0.20", 420),
  }),
  makeProvider("senior-reviewer", "code.review", {
    priceUsdc: "0.42", claimedSuccessProb: 0.73, claimedLatencyMs: 1300,
    outcomes: trackRecord(19, 20, "0.42", 1280),
  }),
  makeProvider("lgtm-bot", "code.review", {
    priceUsdc: "0.28", claimedSuccessProb: 0.98, claimedLatencyMs: 300,
    outcomes: trackRecord(7, 20, "0.28", 320),
  }),
  makeProvider("sast-scanner", "security.scan", {
    priceUsdc: "0.50", claimedSuccessProb: 0.75, claimedLatencyMs: 1500,
    outcomes: trackRecord(19, 20, "0.50", 1480),
  }),
  makeProvider("regex-scanner", "security.scan", {
    priceUsdc: "0.34", claimedSuccessProb: 0.97, claimedLatencyMs: 500,
    outcomes: trackRecord(8, 20, "0.34", 520),
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. RAG document Q&A  (cold-start calibration — claim-free ON)
//    chunk → index → retrieve → answer → grounding-check
// ─────────────────────────────────────────────────────────────────────────────

export const ragGraph: TaskGraph = {
  id: "rag-qa",
  nodes: [
    makeNode("chunk", { capability: "doc.chunk", valueUsdc: "0.50", budgetUsdc: "0.80" }),
    makeNode("index", { capability: "embed.index", valueUsdc: "0.60", budgetUsdc: "0.90" }),
    makeNode("retrieve", { capability: "retrieve.topk", valueUsdc: "0.70", budgetUsdc: "1.00" }),
    makeNode("answer", { capability: "answer.generate", valueUsdc: "1.30", budgetUsdc: "1.60", bondRatio: 0.1 }),
    makeNode("grounding-check", { capability: "verify.grounding", valueUsdc: "0.90", budgetUsdc: "1.10" }),
  ],
  edges: [
    { from: "chunk", to: "index" },
    { from: "index", to: "retrieve" },
    { from: "retrieve", to: "answer" },
    { from: "answer", to: "grounding-check" },
  ],
  globalBudgetUsdc: "6.00",
  globalDeadlineMs: 60_000,
  riskAversion: 1,
};

/** Brand-new providers, zero track record — the cold-start case. */
export const ragProviders: SolverProvider[] = [
  makeUncalibratedProvider("splitter", "doc.chunk", { priceUsdc: "0.16", claimedSuccessProb: 0.68, claimedLatencyMs: 400 }),
  makeUncalibratedProvider("megachunk", "doc.chunk", { priceUsdc: "0.24", claimedSuccessProb: 0.99, claimedLatencyMs: 300 }),
  makeUncalibratedProvider("embed-small", "embed.index", { priceUsdc: "0.20", claimedSuccessProb: 0.70, claimedLatencyMs: 600 }),
  makeUncalibratedProvider("embed-xl", "embed.index", { priceUsdc: "0.30", claimedSuccessProb: 0.98, claimedLatencyMs: 450 }),
  makeUncalibratedProvider("bm25-retriever", "retrieve.topk", { priceUsdc: "0.22", claimedSuccessProb: 0.69, claimedLatencyMs: 500 }),
  makeUncalibratedProvider("vector-retriever", "retrieve.topk", { priceUsdc: "0.32", claimedSuccessProb: 0.97, claimedLatencyMs: 400 }),
  makeUncalibratedProvider("grounded-answerer", "answer.generate", { priceUsdc: "0.55", claimedSuccessProb: 0.66, claimedLatencyMs: 1400 }),
  makeUncalibratedProvider("confident-answerer", "answer.generate", { priceUsdc: "0.70", claimedSuccessProb: 0.99, claimedLatencyMs: 900 }),
  makeUncalibratedProvider("citation-checker", "verify.grounding", { priceUsdc: "0.30", claimedSuccessProb: 0.67, claimedLatencyMs: 700 }),
  makeUncalibratedProvider("vibe-checker", "verify.grounding", { priceUsdc: "0.40", claimedSuccessProb: 0.98, claimedLatencyMs: 350 }),
];
