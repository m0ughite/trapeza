import {
  formatMicroToUsdc,
  parseUsdcToMicro,
  type GraphClearinghouse,
  type StateSnapshotSource,
} from "@trapeza/core";
import { validateDag } from "./dag.js";
import { solveGreedyLns, solveGreedyOnly } from "./greedy-lns.js";
import { computeShadowPrices, solveMilp } from "./milp.js";
import { computeSchedule } from "./schedule.js";
import { preflightSettlement, assertPreflight, formatPreflightSummary } from "./twin/preflight.js";
import { fixtureSettlementState } from "./twin/snapshot.js";
import { ClearingError, type SolverProvider } from "./types.js";

export interface ClearinghouseOptions {
  providers: SolverProvider[];
  snapshot?: StateSnapshotSource;
  seed?: number;
  /** Prefer MILP; fall back to greedy+LNS on failure. */
  preferMilp?: boolean;
}

export function createClearinghouse(
  options: ClearinghouseOptions,
): GraphClearinghouse {
  const seed = options.seed ?? 42;

  return {
    async submitGraph(graph) {
      validateDag(graph);
      const input = {
        graph,
        providers: options.providers,
        riskAversion: graph.riskAversion ?? 1,
        seed,
      };

      let solver: "highs_milp" | "greedy_lns" = "greedy_lns";
      let assignments;
      let objectiveValue = 0;

      if (options.preferMilp !== false) {
        try {
          const milp = await solveMilp(input);
          assignments = milp.assignments;
          objectiveValue = milp.objectiveValue;
          solver = "highs_milp";
        } catch (e) {
          if (e instanceof ClearingError && e.code === "NO_PROVIDER") throw e;
          const greedy = solveGreedyLns(input);
          assignments = greedy.assignments;
          objectiveValue = greedy.objectiveValue;
          solver = "greedy_lns";
        }
      } else {
        const greedy = solveGreedyLns(input);
        assignments = greedy.assignments;
        objectiveValue = greedy.objectiveValue;
      }

      const { schedule, makespanMs } = computeSchedule(
        graph,
        assignments,
        options.providers,
      );

      if (makespanMs > graph.globalDeadlineMs) {
        throw new ClearingError(
          `makespan ${makespanMs}ms exceeds deadline ${graph.globalDeadlineMs}ms`,
          "INFEASIBLE",
        );
      }

      const snapshot = options.snapshot
        ? await options.snapshot.getSettlementState()
        : fixtureSettlementState({
            requesterBalanceMicro: parseUsdcToMicro(graph.globalBudgetUsdc) * 2n,
          });

      const preflight = preflightSettlement(snapshot, input, assignments);

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

      return {
        graphId: graph.id,
        allocations,
        schedule,
        shadowPricesUsdc: {
          budget: String(shadowBudgetDual),
        },
        settlementPricesUsdc,
        totalClearedUsdc: formatMicroToUsdc(totalMicro),
        meta: {
          solver,
          objectiveValue,
          makespanMs,
          seed,
          preflightPassed: preflight.passed,
        },
      };
    },
  };
}

export { solveGreedyOnly, solveGreedyLns, solveMilp };
export { computeShadowPrices } from "./milp.js";
export { runMonteCarlo } from "./twin/montecarlo.js";
export { preflightSettlement, assertPreflight, formatPreflightSummary } from "./twin/preflight.js";
export { fixtureSettlementState } from "./twin/snapshot.js";
export { ClearingError } from "./types.js";
