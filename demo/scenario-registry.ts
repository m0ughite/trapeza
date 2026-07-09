import type { TaskGraph } from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import {
  codePrGraph,
  codePrProviders,
  etlGraph,
  etlProviders,
  invoiceGraph,
  invoiceProviders,
  ragGraph,
  ragProviders,
  researchGraph,
  researchProviders,
  supportGraph,
  supportProviders,
} from "./scenarios.js";

export type ScenarioTier = "tier1" | "tier2";

export interface ScenarioExpect {
  greedyBusts?: boolean;
  minSuccessLift?: number;
  minDivergentNodes?: number;
  preflightFails?: boolean;
  expectDegraded?: boolean;
  qualityFloorBinds?: boolean;
  makespanWithinDeadline?: boolean;
}

export interface Scenario {
  runId: string;
  label: string;
  description: string;
  narrative: string;
  proves: string;
  tags: string[];
  emitFixture: boolean;
  tier: ScenarioTier;
  expect: ScenarioExpect;
  graph: TaskGraph;
  providers: SolverProvider[];
  bottleneckNodeIds: string[];
  mcDeadlineMs?: number;
  solverUseCalibration?: boolean;
  /** Use under-funded snapshot for headline clearing (preflight rejection demo). */
  underFunded?: boolean;
  /** Force CP-SAT with a dead solver URL to demonstrate degrade path. */
  forceDegrade?: boolean;
  /** Skip CP-SAT entirely (harness forces Tier-2). */
  preferCpSat?: boolean;
}

export const SCENARIOS: Scenario[] = [
  {
    runId: "invoice-processing",
    label: "Invoice processing",
    description:
      "Parse an invoice, extract line-items and totals, reconcile them, validate against rules, and format the result — six steps that match the narrative exactly.",
    narrative:
      "Trapeza prices every provider from its realized-outcome ledger, not its sales pitch. A budget OCR vendor advertises 98% accuracy but has only ever delivered ~18%; with the ledger ON it never wins the work. Flip the ledger OFF and the same market buys that vendor across the pipeline — and end-to-end accuracy collapses.",
    proves:
      "Scoring on realized outcomes filters confident-but-unreliable providers; trusting claims buys lemons.",
    tags: ["calibration", "risk"],
    emitFixture: true,
    tier: "tier2",
    expect: { minDivergentNodes: 1, minSuccessLift: 0 },
    graph: invoiceGraph,
    providers: invoiceProviders,
    bottleneckNodeIds: ["reconcile"],
    mcDeadlineMs: 5000,
  },
  {
    runId: "research-report",
    label: "Research → report",
    description:
      "Research a topic, extract findings from three sources in parallel plus a data pull, reconcile everything, fact-check the claims, and format a report — a dense eight-step DAG under a tight deadline.",
    narrative:
      "A real critical path with fan-out and fan-in. The clearing schedules the parallel extractions, then shows which constraint is actually binding via shadow prices, and dry-runs the plan thousands of times to score failure, deadline-miss and budget-overrun risk before a cent moves.",
    proves:
      "Whole-graph scheduling + shadow-price readout + Monte-Carlo risk preflight on a dense DAG.",
    tags: ["scheduling", "risk", "budget"],
    emitFixture: true,
    tier: "tier2",
    expect: { makespanWithinDeadline: true },
    graph: researchGraph,
    providers: researchProviders,
    bottleneckNodeIds: ["reconcile", "fact-check"],
    mcDeadlineMs: 10_000,
  },
  {
    runId: "data-reconciliation",
    label: "Data ETL & reconciliation",
    description:
      "Extract a batch of records then reconcile them against a source of truth, under a tight budget where the expensive step is the one that matters.",
    narrative:
      "The naive per-step router spends in order: it overpays on the easy extraction and has nothing left for the reconcile step — so it returns NO_PROVIDER. The whole-graph clearing sees the budget squeeze coming, buys cheap-but-adequate extraction, and reserves budget for the bottleneck. The single-task bonded broker is this graph's one-node special case.",
    proves:
      "Graph-aware clearing reserves budget for the bottleneck where a greedy per-step router busts.",
    tags: ["budget", "bottleneck"],
    emitFixture: true,
    tier: "tier2",
    expect: { greedyBusts: true },
    graph: etlGraph,
    providers: etlProviders,
    bottleneckNodeIds: ["reconcile"],
    solverUseCalibration: false,
  },
  {
    runId: "support-triage",
    label: "Customer-support triage",
    description:
      "Classify an inbound ticket, then in parallel look up the knowledge base, gauge sentiment and check entitlement, draft a reply, and tone-check it — a fan-out/fan-in graph on a tight SLA.",
    narrative:
      "With a tight deadline and higher risk-aversion, the clearing avoids the fast auto-responder that fabricates answers and schedules the parallel checks so the reply is drafted only once its inputs are ready. Realized-outcome pricing keeps the reply step honest.",
    proves:
      "Fan-out/fan-in scheduling under a tight deadline and elevated risk-aversion.",
    tags: ["scheduling", "risk"],
    emitFixture: true,
    tier: "tier2",
    expect: { makespanWithinDeadline: true },
    graph: supportGraph,
    providers: supportProviders,
    bottleneckNodeIds: ["draft"],
    mcDeadlineMs: 6500,
  },
  {
    runId: "code-pr-pipeline",
    label: "Code-PR review pipeline",
    description:
      "Generate a change, run the tests, review the diff, and security-scan it — a chain where every step carries a minimum-quality bar.",
    narrative:
      "Each step sets a quality floor. The cheap, fast providers advertise near-perfect success but have a realized track record below the floor, so they are ineligible — the clearing must hire providers that actually clear the bar, even at a higher price.",
    proves:
      "Per-step quality floors exclude providers whose realized reliability is below the bar.",
    tags: ["quality-floor", "calibration"],
    emitFixture: true,
    tier: "tier2",
    expect: { qualityFloorBinds: true, makespanWithinDeadline: true },
    graph: codePrGraph,
    providers: codePrProviders,
    bottleneckNodeIds: ["security-scan"],
  },
  {
    runId: "rag-qa",
    label: "RAG document Q&A",
    description:
      "Chunk a document, build an index, retrieve the top passages, generate a grounded answer, and check it for grounding — five steps served by brand-new providers with no track record.",
    narrative:
      "At cold-start the ledger has zero data, so it refuses to trust self-reported success and prices everyone at a neutral 0.5 prior — the cheaper honest provider wins each step. Turn the ledger OFF and the market believes the confident newcomers' inflated claims. Same graph, two very different markets.",
    proves:
      "Cold-start policy: ON is claim-free (neutral prior); OFF buys the loudest new provider.",
    tags: ["calibration", "cold-start"],
    emitFixture: true,
    tier: "tier2",
    expect: { minDivergentNodes: 1 },
    graph: ragGraph,
    providers: ragProviders,
    bottleneckNodeIds: ["answer"],
  },
  {
    runId: "preflight-underfunded",
    label: "Preflight rejected (under-funded)",
    description:
      "The invoice pipeline submitted by a requester whose balance is too low — rejected before any settlement.",
    narrative:
      "Preflight is enforced, not advisory. An under-funded requester cannot draw down more than their balance, so the clearing throws PREFLIGHT_FAILED before a cent moves.",
    proves: "Preflight blocks settlement when the requester is under-funded.",
    tags: ["preflight"],
    emitFixture: false,
    tier: "tier2",
    expect: { preflightFails: true },
    graph: invoiceGraph,
    providers: invoiceProviders,
    bottleneckNodeIds: ["reconcile"],
    underFunded: true,
  },
];

export function scenariosByTag(tag: string): Scenario[] {
  return SCENARIOS.filter((s) => s.tags.includes(tag));
}

export function scenarioById(runId: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.runId === runId);
}

export function emitFixtureScenarios(): Scenario[] {
  return SCENARIOS.filter((s) => s.emitFixture);
}

export function tier2Scenarios(): Scenario[] {
  return SCENARIOS.filter((s) => s.tier === "tier2");
}
