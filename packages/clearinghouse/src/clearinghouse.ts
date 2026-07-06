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
import { type TraceSink } from "./trace.js";

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
  /**
   * When true (default), p_success comes from the calibration ledger's posterior
   * mean — claim-free at cold-start (Beta(1,1) = 0.5). When false, trusts the
   * provider's self-reported claim (the lemons-collapse demo path).
   */
  useCalibration?: boolean;
  /** Optional step-by-step trace sink (no-op when absent). */
  onStep?: TraceSink;
}

export function createClearinghouse(
  options: ClearinghouseOptions,
): GraphClearinghouse {
  const seed = options.seed ?? 42;
  const useCalibration = options.useCalibration ?? true;
  const onStep = options.onStep;
  const clientOpts: SolverClientOptions = {
    baseUrl: options.solverUrl,
    timeoutMs: options.solverTimeoutMs,
  };

  return {
    async submitGraph(graph) {
      validateDag(graph);
      onStep?.({
        phase: "validate-dag",
        level: "info",
        message: `DAG valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
        data: { graphId: graph.id, nodeCount: graph.nodes.length, edgeCount: graph.edges.length },
      });

      const input = {
        graph,
        providers: options.providers,
        riskAversion: graph.riskAversion ?? 1,
        seed,
        useCalibration,
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
        } catch (e) {
          // Degrade to TS Tier-2. Solver-level infeasibility that a capability
          // gap causes will re-surface as NO_PROVIDER from greedy below.
          degraded = true;
          onStep?.({
            phase: "assign",
            level: "warn",
            message: `CP-SAT unavailable — degrading to greedy+LNS (${e instanceof Error ? e.message : String(e)})`,
          });
        }
      }

      if (!assignments) {
        const greedy = solveGreedyLns(input);
        assignments = greedy.assignments;
        objectiveValue = greedy.objectiveValue;
        solver = "greedy_lns";
      }

      for (const a of assignments) {
        onStep?.({
          phase: "assign",
          nodeId: a.nodeId,
          level: "info",
          message: `${a.nodeId}: assigned ${a.providerId} (score ${a.score.toFixed(4)})`,
          data: { providerId: a.providerId, score: a.score },
        });
      }

      let schedule: NodeSchedule[];
      let makespanMs: number;
      if (cpSchedule && cpMakespan !== undefined) {
        schedule = cpSchedule;
        makespanMs = cpMakespan;
      } else {
        const s = computeSchedule(
          graph,
          assignments,
          options.providers,
          useCalibration,
        );
        schedule = s.schedule;
        makespanMs = s.makespanMs;
      }

      onStep?.({
        phase: "schedule",
        level: "info",
        message: `Schedule computed: makespan ${makespanMs}ms`,
        data: {
          makespanMs,
          schedule: schedule.map((s) => ({
            nodeId: s.nodeId,
            startMs: s.startMs,
            endMs: s.endMs,
          })),
        },
      });

      if (makespanMs > graph.globalDeadlineMs) {
        onStep?.({
          phase: "deadline-check",
          level: "error",
          message: `Makespan ${makespanMs}ms exceeds deadline ${graph.globalDeadlineMs}ms`,
        });
        throw new ClearingError(
          `makespan ${makespanMs}ms exceeds deadline ${graph.globalDeadlineMs}ms`,
          "INFEASIBLE",
        );
      }

      onStep?.({
        phase: "deadline-check",
        level: "info",
        message: `Deadline ok: makespan ${makespanMs}ms ≤ ${graph.globalDeadlineMs}ms`,
      });

      const snapshot = options.snapshot
        ? await options.snapshot.getSettlementState()
        : defaultSettlementState(input, assignments);

      // Preflight is ENFORCED (bug #3): a clearing that would overdraw the
      // requester or over-commit a bond never settles.
      const preflight = preflightSettlement(snapshot, input, assignments);
      if (!preflight.passed) {
        onStep?.({
          phase: "preflight",
          level: "error",
          message: `Preflight failed: ${preflight.errors.join("; ")}`,
          data: { errors: preflight.errors },
        });
        throw new ClearingError(
          `preflight failed: ${preflight.errors.join("; ")}`,
          "PREFLIGHT_FAILED",
        );
      }

      onStep?.({
        phase: "preflight",
        level: "info",
        message: "Preflight passed — requester funded and bonds sufficient",
      });

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
            useCalibration,
          );
          shadowBudgetDual = sp.budgetDual;
        } catch {
          /* display-only */
        }
        shadowPricesUsdc = { budget: String(shadowBudgetDual) };
      }

      onStep?.({
        phase: "shadow-prices",
        level: "info",
        message: `Shadow prices computed (${Object.keys(shadowPricesUsdc).length} constraints)`,
        data: { shadowPricesUsdc },
      });

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

      onStep?.({
        phase: "settlement",
        level: "info",
        message: `Settlement prices computed: ${formatMicroToUsdc(totalMicro)} total cleared`,
        data: { settlementPricesUsdc, totalClearedUsdc: formatMicroToUsdc(totalMicro) },
      });

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
          onStep?.({
            phase: "twin",
            level: "info",
            message: `Monte Carlo twin (python): failure p=${sim.failureProbability.toFixed(3)}`,
            data: { engine: "python", ...sim },
          });
        } catch {
          const mc = runMonteCarlo(input, assignments, iterations, seed);
          clearing.twinSimulation = { ...mc, engine: "ts" };
          onStep?.({
            phase: "twin",
            level: "info",
            message: `Monte Carlo twin (ts): failure p=${mc.failureProbability.toFixed(3)}`,
            data: { engine: "ts", ...mc },
          });
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
