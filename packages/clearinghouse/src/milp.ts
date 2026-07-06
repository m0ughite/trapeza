import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  parseUsdcToMicro,
  scaleLogProbability,
  type TaskGraph,
} from "@trapeza/core";
import {
  pHat,
  providerBondMicro,
  providerCostMicro,
  scoreProviderForNode,
} from "./score.js";
import { ClearingError, type NodeAssignment, type SolverInput, type SolverProvider } from "./types.js";

type HighsModule = {
  solve: (
    lp: string,
    opts?: { time_limit?: number },
  ) => {
    Status: string;
    ObjectiveValue?: number;
    Columns?: Record<string, { Primal?: number }>;
    Rows?: { Name?: string; Dual?: number }[];
  };
};

let highsPromise: Promise<HighsModule> | null = null;

async function loadHighs(): Promise<HighsModule> {
  if (!highsPromise) {
    highsPromise = (async () => {
      const require = createRequire(import.meta.url);
      const wasmPath = require.resolve("highs/runtime");
      const highsBuildDir = dirname(wasmPath);
      const mod = await import("highs");
      const factory = (mod.default ?? mod) as unknown as (opts: {
        locateFile: (file: string) => string;
      }) => HighsModule;
      return factory({
        locateFile: (file: string) => join(highsBuildDir, file),
      });
    })();
  }
  return highsPromise;
}

/** Build and solve MILP via HiGHS (binary assignment). */
export async function solveMilp(input: SolverInput): Promise<{
  assignments: NodeAssignment[];
  objectiveValue: number;
}> {
  const { graph, providers } = input;
  const useCalibration = input.useCalibration ?? true;
  const pairs: {
    nodeId: string;
    p: SolverProvider;
    varName: string;
  }[] = [];

  for (const node of graph.nodes) {
    const eligible = providers.filter((p) =>
      p.capabilities.includes(node.task.capability),
    );
    if (eligible.length === 0) {
      throw new ClearingError(
        `no provider for node ${node.nodeId} capability ${node.task.capability}`,
        "NO_PROVIDER",
      );
    }
    for (const p of eligible) {
      pairs.push({
        nodeId: node.nodeId,
        p,
        varName: `x_${sanitize(node.nodeId)}_${sanitize(p.id)}`,
      });
    }
  }

  const objectiveTerms: string[] = [];
  for (const { nodeId, p, varName } of pairs) {
    const score = scoreProviderForNode(graph, nodeId, p, useCalibration);
    const coeff = Math.round(score * 1000);
    if (coeff !== 0) objectiveTerms.push(`${coeff} ${varName}`);
  }

  const subjectTo: string[] = [];
  for (const node of graph.nodes) {
    const vars = pairs
      .filter((x) => x.nodeId === node.nodeId)
      .map((x) => x.varName);
    subjectTo.push(`${vars.join(" + ")} = 1`);
  }

  const budgetUsed = pairs
    .map(({ nodeId, p, varName }) => {
      const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
      const cost = providerCostMicro(p, useCalibration);
      const bond = providerBondMicro(
        p,
        node.task.bondRatio ?? 0.1,
        node.task.valueUsdc,
      );
      const micro = cost + bond;
      return `${micro} ${varName}`;
    })
    .join(" + ");

  const budgetMicro = parseUsdcToMicro(graph.globalBudgetUsdc);
  subjectTo.push(`${budgetUsed} <= ${budgetMicro}`);

  const qMin = graph.globalQualityFloor ?? 0;
  if (qMin > 0) {
    const logTerms = pairs
      .map(({ p, varName }) => {
        return `${scaleLogProbability(pHat(p, useCalibration))} ${varName}`;
      })
      .join(" + ");
    subjectTo.push(`${logTerms} >= ${scaleLogProbability(qMin)}`);
  }

  for (const node of graph.nodes) {
    const q = node.task.qualityFloor;
    if (q === undefined || q <= 0) continue;
    const terms = pairs
      .filter((x) => x.nodeId === node.nodeId)
      .map(({ p, varName }) => {
        return `${scaleLogProbability(pHat(p, useCalibration))} ${varName}`;
      })
      .join(" + ");
    subjectTo.push(`${terms} >= ${scaleLogProbability(q)}`);
  }

  const binaries = pairs.map((x) => x.varName).join("\n ");
  const lp = `
Maximize
 obj: ${objectiveTerms.length ? objectiveTerms.join(" + ") : "0 dummy"}
Subject To
 ${subjectTo.join("\n ")}
Binaries
 ${binaries}
End
`;

  const highs = await loadHighs();
  const sol = highs.solve(lp, { time_limit: 5 });
  if (sol.Status !== "Optimal" && sol.Status !== "Feasible") {
    throw new ClearingError(`HiGHS status: ${sol.Status}`, "INFEASIBLE");
  }

  const assignments: NodeAssignment[] = [];
  for (const { nodeId, p, varName } of pairs) {
    const val = sol.Columns?.[varName]?.Primal ?? 0;
    if (val > 0.5) {
      assignments.push({
        nodeId,
        providerId: p.id,
        score: scoreProviderForNode(graph, nodeId, p, useCalibration),
      });
    }
  }

  if (assignments.length !== graph.nodes.length) {
    throw new ClearingError("incomplete MILP assignment", "INFEASIBLE");
  }

  return {
    assignments,
    objectiveValue: assignments.reduce((s, a) => s + a.score, 0),
  };
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, "_");
}

function buildLpRelaxation(
  graph: TaskGraph,
  providers: SolverProvider[],
  budgetMicro: bigint,
  useCalibration = true,
): string {
  const pairs: {
    nodeId: string;
    p: SolverProvider;
    varName: string;
  }[] = [];

  for (const node of graph.nodes) {
    for (const p of providers.filter((x) =>
      x.capabilities.includes(node.task.capability),
    )) {
      pairs.push({
        nodeId: node.nodeId,
        p,
        varName: `x_${sanitize(node.nodeId)}_${sanitize(p.id)}`,
      });
    }
  }

  const objectiveTerms = pairs.map(({ nodeId, p, varName }) => {
    const score = scoreProviderForNode(graph, nodeId, p, useCalibration);
    return `${Math.round(score * 1000)} ${varName}`;
  });

  const assignConstraints: string[] = [];
  for (const node of graph.nodes) {
    const vars = pairs
      .filter((x) => x.nodeId === node.nodeId)
      .map((x) => x.varName);
    if (vars.length > 0) {
      assignConstraints.push(`${vars.join(" + ")} = 1`);
    }
  }

  const budgetExpr = pairs
    .map(({ nodeId, p, varName }) => {
      const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
      const micro =
        providerCostMicro(p, useCalibration) +
        providerBondMicro(p, node.task.bondRatio ?? 0.1, node.task.valueUsdc);
      return `${micro} ${varName}`;
    })
    .join(" + ");

  return `
Maximize
 obj: ${objectiveTerms.length ? objectiveTerms.join(" + ") : "0 dummy"}
Subject To
 ${assignConstraints.length ? assignConstraints.join("\n ") : "dummy: 0 = 0"}
 budget: ${budgetExpr || "0 dummy"} <= ${budgetMicro}
Bounds
 ${pairs.map((x) => `0 <= ${x.varName} <= 1`).join("\n ")}
End
`;
}

async function lpObjective(lp: string): Promise<number> {
  const highs = await loadHighs();
  const sol = highs.solve(lp, { time_limit: 5 });
  if (sol.Status !== "Optimal" && sol.Status !== "Feasible") {
    return NaN;
  }
  return sol.ObjectiveValue ?? 0;
}

export async function computeShadowPrices(
  graph: TaskGraph,
  providers: SolverProvider[],
  budgetMicro: bigint,
  useCalibration = true,
): Promise<{ budgetDual: number }> {
  const lp = buildLpRelaxation(graph, providers, budgetMicro, useCalibration);
  const highs = await loadHighs();
  const sol = highs.solve(lp, { time_limit: 5 });
  const budgetRow = sol.Rows?.find((r) => r.Name === "budget");
  let budgetDual = budgetRow?.Dual ?? 0;

  if (budgetDual === 0) {
    const eps = 100_000n;
    const baseObj = await lpObjective(lp);
    const bumpedObj = await lpObjective(
      buildLpRelaxation(graph, providers, budgetMicro + eps, useCalibration),
    );
    if (Number.isFinite(baseObj) && Number.isFinite(bumpedObj)) {
      budgetDual = (bumpedObj - baseObj) / Number(eps);
    }
  }

  return { budgetDual: Math.max(0, budgetDual) };
}
