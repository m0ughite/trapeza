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
  solveCpSat,
  solveGreedyLns,
  solveMilp,
  solverHealthy,
  type SolverProvider,
} from "@trapeza/clearinghouse";
import { DEMO_SEED, fundedSnapshot, underFundedSnapshot } from "./data.js";
import {
  etlGraph,
  etlProviders,
  invoiceGraph,
  invoiceProviders,
} from "./scenarios.js";
import { fmtPct, fmtUsdc, kv, section, table } from "./format.js";

const invoiceTightDeadline: TaskGraph = {
  ...invoiceGraph,
  id: "invoice-tight",
  globalDeadlineMs: 4500,
};

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
  printGraph(invoiceGraph);

  // ── 2. Calibration vs bragging ───────────────────────────────────────────
  section("2. Calibration vs bragging — realized record beats claims");
  console.log(
    "  Braggart providers claim 97–99% success but realized ~10–20%.",
  );
  console.log(
    "  Workhorse providers claim 65–70% but realized ~85–90%.",
  );
  console.log("");
  printCalibrationTable(invoiceProviders);

  // ── 3. Clearing ──────────────────────────────────────────────────────────
  section("3. Clearing — submitGraph end to end");
  const serviceUp = await solverHealthy();
  console.log(
    serviceUp
      ? "  Python CP-SAT solver service: UP (Tier-1 primary path)."
      : "  Python CP-SAT solver service: DOWN → degrading to TS greedy+LNS (Tier-2).",
  );
  console.log("");
  const ch = createClearinghouse({
    providers: invoiceProviders,
    seed: DEMO_SEED,
    snapshot: {
      getSettlementState: async () => fundedSnapshot(invoiceProviders),
    },
  });
  const clearing = await ch.submitGraph(invoiceGraph);

  table(
    ["node", "provider", "score"],
    clearing.allocations.map((a) => {
      const node = invoiceGraph.nodes.find((n) => n.task.id === a.taskId)!;
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
  console.log("");
  table(
    ["shadow price", "value"],
    Object.entries(clearing.shadowPricesUsdc).map(([k, v]) => [k, v]),
  );
  console.log("");
  kv(
    "solver",
    `${clearing.meta.solver}${clearing.meta.degraded ? " (degraded from CP-SAT)" : ""}`,
  );
  kv("objective value", clearing.meta.objectiveValue.toFixed(4));
  kv("makespan", `${clearing.meta.makespanMs} ms`);
  kv("preflight passed", clearing.meta.preflightPassed);

  const assignments = clearing.allocations.map((a) => {
    const node = invoiceGraph.nodes.find((n) => n.task.id === a.taskId)!;
    return { nodeId: node.nodeId, providerId: a.providerId, score: a.score };
  });

  // ── 4. Bake-off ──────────────────────────────────────────────────────────
  section("4. Bake-off — CP-SAT (Python Tier-1) vs greedy+LNS (TS Tier-2)");
  printGraph(etlGraph);
  console.log("");
  console.log(
    "  Greedy+LNS overspends on the easy extraction step and cannot afford the reconcile bottleneck.",
  );

  const bakeInput = {
    graph: etlGraph,
    providers: etlProviders,
    riskAversion: 1,
    seed: DEMO_SEED,
    useCalibration: false,
  };

  try {
    const greedy = solveGreedyLns(bakeInput);
    kv("greedy+LNS objective", greedy.objectiveValue.toFixed(4));
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
      kv("greedy+LNS result", `${e.code}: ${e.message}`);
    } else {
      kv("greedy+LNS result", String(e));
    }
  }

  console.log("");
  if (serviceUp) {
    const cp = await solveCpSat(bakeInput);
    kv("CP-SAT objective (Python)", cp.objectiveValue.toFixed(4));
    table(
      ["node", "provider", "score"],
      cp.assignments.map((a) => [a.nodeId, a.providerId, a.score.toFixed(4)]),
    );
    console.log("");
    console.log(
      "  CP-SAT sees the whole graph: budget-extractor + ledger-reconciler, both under $1.00.",
    );
  } else {
    const milp = await solveMilp(bakeInput);
    kv("TS HiGHS stand-in objective", milp.objectiveValue.toFixed(4));
    table(
      ["node", "provider", "score"],
      milp.assignments.map((a) => [a.nodeId, a.providerId, a.score.toFixed(4)]),
    );
    console.log("");
    console.log(
      "  Python service down → TS HiGHS stand-in clears budget-extractor + ledger-reconciler.",
    );
  }

  // ── 5. Twin Monte Carlo (feature-flagged) ─────────────────────────────────
  section("5. Twin Monte Carlo — flagged robustness scoring on the cleared plan");
  console.log(
    "  Enabled via `monteCarlo: { enabled: true }` on the clearinghouse.",
  );
  console.log(
    serviceUp
      ? "  Engine: Python/NumPy (vectorized) when the service is up."
      : "  Engine: in-process TS fallback (service down).",
  );
  console.log("");
  kv("deadline (tight)", `${invoiceTightDeadline.globalDeadlineMs} ms`);
  const mcCh = createClearinghouse({
    providers: invoiceProviders,
    seed: DEMO_SEED,
    snapshot: {
      getSettlementState: async () => fundedSnapshot(invoiceProviders),
    },
    monteCarlo: { enabled: true, iterations: 500 },
  });
  try {
    const mcClearing = await mcCh.submitGraph(invoiceTightDeadline);
    const mc = mcClearing.twinSimulation;
    if (mc) {
      kv("twin engine", mc.engine);
      kv("failure probability", fmtPct(mc.failureProbability));
      kv("budget overrun probability", fmtPct(mc.budgetOverrunProbability));
      kv("deadline breach probability", fmtPct(mc.deadlineBreachProbability));
      kv("expected net cost", fmtUsdc(mc.expectedNetCostUsdc));
      kv("iterations", mc.iterations);
    }
  } catch (e) {
    const msg = e instanceof ClearingError ? `${e.code}: ${e.message}` : String(e);
    kv("clearing (tight deadline)", msg);
  }

  // ── 6. Preflight guard ───────────────────────────────────────────────────
  section("6. Preflight guard — twin rejects under-funded plan");
  console.log(
    "  Same clearing, but requester balance is only $0.05 — preflight catches it.",
  );
  console.log("");
  const badPreflight = preflightSettlement(
    underFundedSnapshot(invoiceProviders),
    {
      graph: invoiceGraph,
      providers: invoiceProviders,
      riskAversion: 1,
      seed: DEMO_SEED,
    },
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
