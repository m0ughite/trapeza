/**
 * Trapeza clearinghouse demo — narrated, deterministic, off-chain.
 *
 * Run: npm run demo
 */

import {
  calibratedEstimate,
  pSuccessMean,
  type TaskGraph,
} from "@trapeza/core";
import {
  ClearingError,
  createClearinghouse,
  formatPreflightSummary,
  preflightSettlement,
  runMonteCarlo,
  solveGreedyOnly,
  solveMilp,
  type SolverProvider,
} from "@trapeza/clearinghouse";
import {
  DEMO_SEED,
  budgetBottleneckGraph,
  budgetBottleneckProvidersUncalibrated,
  fundedSnapshot,
  underFundedSnapshot,
  workflowGraph,
  workflowGraphTightDeadline,
  workflowProviders,
} from "./data.js";
import { fmtPct, fmtUsdc, kv, section, table } from "./format.js";

function printGraph(graph: TaskGraph): void {
  kv("graph id", graph.id);
  kv("global budget", `$${graph.globalBudgetUsdc}`);
  kv("global deadline", `${graph.globalDeadlineMs} ms`);
  console.log("");
  table(
    ["node", "capability", "value", "reserve", "bond ratio"],
    graph.nodes.map((n) => [
      n.nodeId,
      n.task.capability,
      `$${n.task.valueUsdc}`,
      `$${n.task.budgetUsdc}`,
      n.task.bondRatio ?? 0.1,
    ]),
  );
  if (graph.edges.length > 0) {
    console.log("");
    kv(
      "edges",
      graph.edges.map((e) => `${e.from} → ${e.to}`).join(", "),
    );
  }
}

function printCalibrationTable(providers: SolverProvider[]): void {
  table(
    ["provider", "capability", "claimed p", "calibrated p", "cost mean", "n obs"],
    providers.map((p) => {
      const est = calibratedEstimate(p.calibration);
      return [
        p.id,
        p.capabilities[0]!,
        fmtPct(p.claimedSuccessProb),
        fmtPct(pSuccessMean(p.calibration)),
        fmtUsdc(est.costMeanUsdc),
        est.nObservations,
      ];
    }),
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log("  Trapeza Clearinghouse Demo");
  console.log("  Deterministic engine walkthrough (seed = 42)");

  // ── 1. Scenario ──────────────────────────────────────────────────────────
  section("1. Scenario — six-node workflow DAG");
  printGraph(workflowGraph);

  // ── 2. Calibration vs bragging ───────────────────────────────────────────
  section("2. Calibration vs bragging — realized record beats claims");
  console.log(
    "  Braggart providers claim 97–99% success but realized ~10–20%.",
  );
  console.log(
    "  Workhorse providers claim 65–70% but realized ~85–90%.",
  );
  console.log("");
  printCalibrationTable(workflowProviders);

  // ── 3. Clearing ──────────────────────────────────────────────────────────
  section("3. Clearing — submitGraph end to end");
  const ch = createClearinghouse({
    providers: workflowProviders,
    seed: DEMO_SEED,
    snapshot: {
      getSettlementState: async () => fundedSnapshot(workflowProviders),
    },
  });
  const clearing = await ch.submitGraph(workflowGraph);

  table(
    ["node", "provider", "score"],
    clearing.allocations.map((a) => {
      const node = workflowGraph.nodes.find((n) => n.task.id === a.taskId)!;
      return [node.nodeId, a.providerId, a.score.toFixed(4)];
    }),
  );
  console.log("");
  table(
    ["node", "start (ms)", "duration (ms)", "end (ms)"],
    clearing.schedule.map((s) => [
      s.nodeId,
      s.startMs,
      s.durationMs,
      s.endMs,
    ]),
  );
  console.log("");
  table(
    ["node", "settlement price"],
    Object.entries(clearing.settlementPricesUsdc).map(([nodeId, price]) => [
      nodeId,
      `$${price}`,
    ]),
  );
  console.log("");
  kv("total cleared", `$${clearing.totalClearedUsdc}`);
  kv("shadow price (budget)", clearing.shadowPricesUsdc.budget ?? "0");
  kv("solver", clearing.meta.solver);
  kv("objective value", clearing.meta.objectiveValue.toFixed(4));
  kv("makespan", `${clearing.meta.makespanMs} ms`);
  kv("preflight passed", clearing.meta.preflightPassed);

  const assignments = clearing.allocations.map((a) => {
    const node = workflowGraph.nodes.find((n) => n.task.id === a.taskId)!;
    return { nodeId: node.nodeId, providerId: a.providerId, score: a.score };
  });

  // ── 4. Bake-off ──────────────────────────────────────────────────────────
  section("4. Bake-off — MILP vs greedy on budget-vs-bottleneck");
  printGraph(budgetBottleneckGraph);
  console.log("");
  console.log(
    "  Greedy overspends on the easy logo step and cannot afford the bottleneck.",
  );

  const bakeInput = {
    graph: budgetBottleneckGraph,
    providers: budgetBottleneckProvidersUncalibrated,
    riskAversion: 1,
    seed: DEMO_SEED,
  };

  try {
    const greedy = solveGreedyOnly(bakeInput);
    kv("greedy objective", greedy.objectiveValue.toFixed(4));
    table(
      ["node", "provider", "score"],
      greedy.assignments.map((a) => [
        a.nodeId,
        a.providerId,
        a.score.toFixed(4),
      ]),
    );
  } catch (e) {
    if (e instanceof ClearingError) {
      kv("greedy result", `${e.code}: ${e.message}`);
    } else {
      kv("greedy result", String(e));
    }
  }

  const milp = await solveMilp(bakeInput);
  kv("MILP objective", milp.objectiveValue.toFixed(4));
  table(
    ["node", "provider", "score"],
    milp.assignments.map((a) => [a.nodeId, a.providerId, a.score.toFixed(4)]),
  );
  console.log("");
  console.log(
    "  MILP picks cheap-logo + mid-code — both steps covered under $1.00.",
  );

  // ── 5. Twin Monte Carlo ──────────────────────────────────────────────────
  section("5. Twin Monte Carlo — stochastic risk on the cleared plan");
  const mcInput = {
    graph: workflowGraphTightDeadline,
    providers: workflowProviders,
    riskAversion: 1,
    seed: DEMO_SEED,
  };
  kv("deadline (tight)", `${workflowGraphTightDeadline.globalDeadlineMs} ms`);
  const mc = runMonteCarlo(mcInput, assignments, 500, DEMO_SEED);
  kv("failure probability", fmtPct(mc.failureProbability));
  kv("budget overrun probability", fmtPct(mc.budgetOverrunProbability));
  kv("deadline breach probability", fmtPct(mc.deadlineBreachProbability));
  kv("expected net cost", fmtUsdc(mc.expectedNetCostUsdc));
  kv("iterations", mc.iterations);

  // ── 6. Preflight guard ───────────────────────────────────────────────────
  section("6. Preflight guard — twin rejects under-funded plan");
  console.log(
    "  Same clearing, but requester balance is only $0.05 — preflight catches it.",
  );
  console.log("");
  const badPreflight = preflightSettlement(
    underFundedSnapshot(workflowProviders),
    mcInput,
    assignments,
  );
  kv("preflight passed", badPreflight.passed);
  kv("summary", formatPreflightSummary(badPreflight));
  if (badPreflight.errors.length > 0) {
    console.log("");
    kv("errors", badPreflight.errors.join("; "));
  }
  console.log("");
  console.log("  No real money moves until preflight passes.");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
