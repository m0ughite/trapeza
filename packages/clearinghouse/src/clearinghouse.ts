import {
  formatMicroToUsdc,
  parseUsdcToMicro,
  type GraphClearing,
  type GraphClearinghouse,
  type NodeSchedule,
  type StateSnapshotSource,
} from "@trapeza/core";
import { validateDag } from "./dag.js";
import { solveGreedyLns, solveGreedyOnly } from "./greedy-lns.js";
import { computeShadowPrices, solveMilp } from "./milp.js";
import { computeSchedule } from "./schedule.js";
import { preflightSettlement } from "./twin/preflight.js";
import { runMonteCarlo } from "./twin/montecarlo.js";
import { defaultSettlementState, fixtureSettlementState } from "./twin/snapshot.js";
import {
  solveCpSat,
  simulateViaService,
  type SolverClientOptions,
} from "./solver-client.js";
import {
  ClearingError,
  type NodeAssignment,
  type SolverKind,
  type SolverProvider,
} from "./types.js";

export interface ClearinghouseOptions {
  providers: SolverProvider[];
  snapshot?: StateSnapshotSource;
  seed?: number;
  /**
   * Prefer the Python CP-SAT Tier-1 solver (default true). On any failure —
   * service down, timeout, contract-validation error, infeasible — the
   * clearinghouse degrades to the in-process TS Tier-2 (greedy+LNS) so the demo
   * runs even without Python (Amendment 3).
   */
  preferCpSat?: boolean;
  /** Base URL of the Python solver service. Default env or localhost:8000. */
  solverUrl?: string;
  /** Solver/simulate request timeout (ms). Default 8000. */
  solverTimeoutMs?: number;
  /** State-Twins Monte Carlo robustness scoring (Amendment 1). Default: off. */
  monteCarlo?: { enabled: boolean; iterations?: number };
}

export function createClearinghouse(
  options: ClearinghouseOptions,
): GraphClearinghouse {
  const seed = options.seed ?? 42;
  const clientOpts: SolverClientOptions = {
    baseUrl: options.solverUrl,
    timeoutMs: options.solverTimeoutMs,
  };

  return {
    async submitGraph(graph) {
      validateDag(graph);
      const input = {
        graph,
        providers: options.providers,
        riskAversion: graph.riskAversion ?? 1,
        seed,
      };

      let solver: SolverKind = "greedy_lns";
      let assignments: NodeAssignment[] | undefined;
      let objectiveValue = 0;
      let degraded = false;
      let cpSchedule: NodeSchedule[] | undefined;
      let cpShadow: Record<string, string> | undefined;
      let cpMakespan: number | undefined;

      const preferCpSat = options.preferCpSat !== false;
      if (preferCpSat) {
        try {
          const cp = await solveCpSat(input, clientOpts);
          assignments = cp.assignments;
          objectiveValue = cp.objectiveValue;
          cpSchedule = cp.schedule;
          cpShadow = cp.shadowPricesUsdc;
          cpMakespan = cp.makespanMs;
          solver = "cp_sat";
        } catch {
          // Degrade to TS Tier-2. Solver-level infeasibility that a capability
          // gap causes will re-surface as NO_PROVIDER from greedy below.
          degraded = true;
        }
      }

      if (!assignments) {
        const greedy = solveGreedyLns(input);
        assignments = greedy.assignments;
        objectiveValue = greedy.objectiveValue;
        solver = "greedy_lns";
      }

      let schedule: NodeSchedule[];
      let makespanMs: number;
      if (cpSchedule && cpMakespan !== undefined) {
        schedule = cpSchedule;
        makespanMs = cpMakespan;
      } else {
        const s = computeSchedule(graph, assignments, options.providers);
        schedule = s.schedule;
        makespanMs = s.makespanMs;
      }

      if (makespanMs > graph.globalDeadlineMs) {
        throw new ClearingError(
          `makespan ${makespanMs}ms exceeds deadline ${graph.globalDeadlineMs}ms`,
          "INFEASIBLE",
        );
      }

      const snapshot = options.snapshot
        ? await options.snapshot.getSettlementState()
        : defaultSettlementState(input, assignments);

      // Preflight is ENFORCED (bug #3): a clearing that would overdraw the
      // requester or over-commit a bond never settles.
      const preflight = preflightSettlement(snapshot, input, assignments);
      if (!preflight.passed) {
        throw new ClearingError(
          `preflight failed: ${preflight.errors.join("; ")}`,
          "PREFLIGHT_FAILED",
        );
      }

      let shadowPricesUsdc: Record<string, string>;
      if (cpShadow) {
        shadowPricesUsdc = cpShadow;
      } else {
        const budgetMicro = parseUsdcToMicro(graph.globalBudgetUsdc);
        let shadowBudgetDual = 0;
        try {
          const sp = await computeShadowPrices(
            graph,
            options.providers,
            budgetMicro,
          );
          shadowBudgetDual = sp.budgetDual;
        } catch {
          /* display-only */
        }
        shadowPricesUsdc = { budget: String(shadowBudgetDual) };
      }

      const allocations = assignments.map((a) => {
        const node = graph.nodes.find((n) => n.nodeId === a.nodeId)!;
        return {
          taskId: node.task.id,
          providerId: a.providerId,
          mechanism: "posted" as const,
          score: a.score,
        };
      });

      const settlementPricesUsdc: Record<string, string> = {};
      let totalMicro = 0n;
      for (const a of assignments) {
        const p = options.providers.find((x) => x.id === a.providerId)!;
        const node = graph.nodes.find((n) => n.nodeId === a.nodeId)!;
        const ask = parseUsdcToMicro(p.priceUsdc);
        const reserve = parseUsdcToMicro(node.task.budgetUsdc);
        const settle = ask < reserve ? ask : reserve;
        settlementPricesUsdc[a.nodeId] = formatMicroToUsdc(settle);
        totalMicro += settle;
      }

      const clearing: GraphClearing = {
        graphId: graph.id,
        allocations,
        schedule,
        shadowPricesUsdc,
        settlementPricesUsdc,
        totalClearedUsdc: formatMicroToUsdc(totalMicro),
        meta: {
          solver,
          objectiveValue,
          makespanMs,
          seed,
          preflightPassed: preflight.passed,
          degraded,
        },
      };

      if (options.monteCarlo?.enabled) {
        const iterations = options.monteCarlo.iterations ?? 500;
        try {
          const sim = await simulateViaService(
            input,
            assignments,
            iterations,
            seed,
            clientOpts,
          );
          clearing.twinSimulation = { ...sim, engine: "python" };
        } catch {
          const mc = runMonteCarlo(input, assignments, iterations, seed);
          clearing.twinSimulation = { ...mc, engine: "ts" };
        }
      }

      return clearing;
    },
  };
}

export { solveGreedyOnly, solveGreedyLns, solveMilp };
export { computeShadowPrices } from "./milp.js";
export { runMonteCarlo } from "./twin/montecarlo.js";
export {
  preflightSettlement,
  assertPreflight,
  formatPreflightSummary,
} from "./twin/preflight.js";
export { defaultSettlementState, fixtureSettlementState } from "./twin/snapshot.js";
export { ClearingError } from "./types.js";
