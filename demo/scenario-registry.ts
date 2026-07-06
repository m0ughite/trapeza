import type { TaskGraph } from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import {
  budgetBottleneckGraph,
  budgetBottleneckProvidersUncalibrated,
  workflowGraph,
  workflowProviders,
} from "./data.js";
import {
  bondCapacityGraph,
  bondCapacityProviders,
  coldStartGraph,
  coldStartProviders,
  concurrencyGraph,
  concurrencyProviders,
  deadlineTightGraph,
  deadlineTightProviders,
  qualityFloorGraph,
  qualityFloorProviders,
  researchGraph,
  researchProviders,
  scaleStressGraph,
  scaleStressProviders,
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
    runId: "invoice-workflow",
    label: "Invoice workflow (6-node DAG)",
    description:
      "A six-node extraction → reconcile → fact-check → format pipeline where braggart providers claim 97–99% but realize ~15%.",
    narrative:
      "The clearinghouse ingests the whole workflow and prices every provider from its realized-outcome ledger, not its bid. Calibration ON routes to the workhorses; the same market with calibration OFF buys the braggarts and the workflow collapses.",
    proves: "Calibration ON filters braggarts; OFF buys lemons and collapses end-to-end success.",
    tags: ["calibration", "risk", "scheduling"],
    emitFixture: true,
    tier: "tier2",
    expect: { minDivergentNodes: 1, minSuccessLift: 0 },
    graph: workflowGraph,
    providers: workflowProviders,
    bottleneckNodeIds: ["n6"],
    mcDeadlineMs: 620,
  },
  {
    runId: "budget-bottleneck",
    label: "Budget bottleneck (greedy busts)",
    description:
      "A two-node logo → code graph under a tight $1.00 budget: the CP-SAT clearing vs the naive greedy router.",
    narrative:
      "Greedy spends in topological order, overpays on the easy logo step, and has nothing left for the bottleneck code node — it returns NO_PROVIDER. CP-SAT sees the whole graph and clears feasibly at a higher objective. The single-task bonded broker is this graph's one-node special case.",
    proves: "Graph-aware clearing reserves budget for the bottleneck; greedy busts.",
    tags: ["budget", "degrade"],
    emitFixture: true,
    tier: "tier2",
    expect: { greedyBusts: true },
    graph: budgetBottleneckGraph,
    providers: budgetBottleneckProvidersUncalibrated,
    bottleneckNodeIds: ["code"],
    solverUseCalibration: false,
  },
  {
    runId: "research-pipeline",
    label: "Research pipeline (8-node, tight deadline)",
    description:
      "An eight-node research → extract×3 → reconcile → fact-check → format DAG under a tight deadline, stressing the schedule and the twin risk preflight.",
    narrative:
      "A denser workflow with a real critical path. Shadow prices reveal which constraint (budget vs deadline vs a scarce provider) is binding, and the State-Twins Monte Carlo scores failure / deadline-breach / budget-overrun risk on the cleared plan before a cent moves.",
    proves: "Scheduler + shadow prices + Monte Carlo twin on a dense DAG.",
    tags: ["scheduling", "risk", "budget"],
    emitFixture: true,
    tier: "tier2",
    expect: { makespanWithinDeadline: true },
    graph: researchGraph,
    providers: researchProviders,
    bottleneckNodeIds: ["reconcile", "factcheck"],
    mcDeadlineMs: 900,
  },
  {
    runId: "cold-start-calibration",
    label: "Cold-start calibration (claim-free ON)",
    description:
      "Brand-new providers with zero observations: calibration ON uses a neutral 0.5 prior; OFF trusts inflated bids.",
    narrative:
      "At cold-start the ledger has no data — calibration ON refuses to trust self-reported success and prices everyone at the Beta(1,1) prior. Calibration OFF buys the braggarts. Same graph, two markets.",
    proves: "Cold-start policy: ON is claim-free; OFF buys braggarts.",
    tags: ["calibration", "cold-start"],
    emitFixture: true,
    tier: "tier2",
    expect: { minDivergentNodes: 1 },
    graph: coldStartGraph,
    providers: coldStartProviders,
    bottleneckNodeIds: ["stepC"],
  },
  {
    runId: "quality-floor",
    label: "Quality floor binds",
    description:
      "A global quality floor excludes low-calibrated providers even when they are cheap.",
    narrative:
      "The requester sets a minimum success probability. Providers below the floor are ineligible — the clearing must hire adequate quality even at higher cost.",
    proves: "Global quality floor excludes low-p providers.",
    tags: ["quality-floor", "calibration"],
    emitFixture: true,
    tier: "tier2",
    expect: { qualityFloorBinds: true, makespanWithinDeadline: true },
    graph: qualityFloorGraph,
    providers: qualityFloorProviders,
    bottleneckNodeIds: ["verify"],
  },
  {
    runId: "scale-stress",
    label: "Scale stress (14-node DAG)",
    description:
      "A 14-node workflow with ample budget — stresses solver throughput and schedule depth.",
    narrative:
      "Larger graphs expose whether the clearing scales: every node must receive a feasible provider within budget and deadline.",
    proves: "Clears a 14-node DAG within budget and deadline.",
    tags: ["scheduling", "budget"],
    emitFixture: true,
    tier: "tier2",
    expect: { makespanWithinDeadline: true },
    graph: scaleStressGraph,
    providers: scaleStressProviders,
    bottleneckNodeIds: ["n14"],
  },
  {
    runId: "deadline-tight",
    label: "Deadline tight (8-node)",
    description:
      "Research pipeline with a very tight global deadline — makespan pressed to the limit.",
    narrative:
      "When the deadline is binding, the scheduler must fit the critical path. Shadow prices show deadline as the scarce resource.",
    proves: "Makespan fits within a tight global deadline.",
    tags: ["scheduling", "risk"],
    emitFixture: true,
    tier: "tier2",
    expect: { makespanWithinDeadline: true },
    graph: deadlineTightGraph,
    providers: deadlineTightProviders,
    bottleneckNodeIds: ["reconcile", "factcheck"],
    mcDeadlineMs: 800,
  },
  {
    runId: "preflight-underfunded",
    label: "Preflight rejected (under-funded)",
    description:
      "Same workflow as invoice, but the requester balance is too low — clearing is rejected before settlement.",
    narrative:
      "Preflight is enforced, not advisory. An under-funded requester cannot draw down more than their balance — the clearing throws PREFLIGHT_FAILED.",
    proves: "Preflight blocks settlement when the requester is under-funded.",
    tags: ["preflight"],
    emitFixture: true,
    tier: "tier2",
    expect: { preflightFails: true },
    graph: workflowGraph,
    providers: workflowProviders,
    bottleneckNodeIds: ["n6"],
    underFunded: true,
  },
  {
    runId: "solver-degrade",
    label: "Solver degrade (CP-SAT → greedy)",
    description:
      "CP-SAT service unreachable — clearing degrades gracefully to greedy+LNS.",
    narrative:
      "When the Python Tier-1 solver is down, the clearinghouse falls back to the in-process TS Tier-2 engine. The run completes with degraded=true.",
    proves: "Graceful degrade from CP-SAT to greedy+LNS.",
    tags: ["degrade"],
    emitFixture: true,
    tier: "tier2",
    expect: { expectDegraded: true },
    graph: workflowGraph,
    providers: workflowProviders,
    bottleneckNodeIds: ["n6"],
    forceDegrade: true,
  },
  {
    runId: "concurrency",
    label: "Concurrency cap (tier-1)",
    description:
      "Two parallel nodes share one provider with concurrency=1 — CP-SAT serializes execution.",
    narrative:
      "Resource-constrained project scheduling: a provider can only run one node at a time. Makespan reflects serialization.",
    proves: "CP-SAT respects provider concurrency caps.",
    tags: ["scheduling"],
    emitFixture: true,
    tier: "tier1",
    expect: { makespanWithinDeadline: true },
    graph: concurrencyGraph,
    providers: concurrencyProviders,
    bottleneckNodeIds: ["merge"],
  },
  {
    runId: "bond-capacity",
    label: "Bond capacity (tier-1)",
    description:
      "Provider bond capacity binds — only one heavy node can lock the limited bond.",
    narrative:
      "Bond capacity is a hard constraint in CP-SAT. When a provider cannot post enough bond for all assigned nodes, the solver must re-route.",
    proves: "CP-SAT respects per-provider bond capacity.",
    tags: ["budget", "risk"],
    emitFixture: true,
    tier: "tier1",
    expect: { makespanWithinDeadline: true },
    graph: bondCapacityGraph,
    providers: bondCapacityProviders,
    bottleneckNodeIds: ["heavyB"],
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
