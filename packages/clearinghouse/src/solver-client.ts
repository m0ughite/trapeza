/**
 * TypeScript client for the Python CP-SAT solver service (Tier-1).
 *
 * Responsibilities (thin, honest boundary):
 *  - translate a resolved `SolverInput` into the shared-contract `SolveRequest`,
 *    computing every economic number in TS (scores via `scoreProviderForNode`)
 *    so the solver never touches the ledger and the bake-off stays apples-to-apples;
 *  - validate the request AND the response against the ONE shared JSON Schema
 *    (`contract/solver-contract.schema.json`) with AJV — no drifting second copy;
 *  - fail fast (throw) on any transport/timeout/validation/infeasible error so the
 *    caller degrades to the in-process TS Tier-2 (greedy+LNS).
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  parseUsdcToMicro,
  pSuccessMean,
  type CalibrationRecord,
} from "@trapeza/core";
import { scoreProviderForNode, providerBondMicro, providerCostMicro } from "./score.js";
import { latencyMs } from "./schedule.js";
import type { NodeAssignment, SolverInput, SolverProvider } from "./types.js";
import type { NodeSchedule } from "@trapeza/core";

const require = createRequire(import.meta.url);
// AJV 2020 dialect (matches the $schema in the contract).
const Ajv2020 = require("ajv/dist/2020") as new (opts: object) => import("ajv").default;

const SCHEMA_ID = "https://trapeza.dev/contract/solver-contract.schema.json";

let validators: {
  request: import("ajv").ValidateFunction;
  response: import("ajv").ValidateFunction;
  simRequest: import("ajv").ValidateFunction;
  simResponse: import("ajv").ValidateFunction;
} | null = null;

function getValidators() {
  if (validators) return validators;
  // contract/ sits at the repo root; src/ and dist/ are both one dir under the
  // package, so this relative path resolves identically from source and build.
  const schemaPath = fileURLToPath(
    new URL("../../../contract/solver-contract.schema.json", import.meta.url),
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(schema);
  const get = (name: string) => {
    const v = ajv.getSchema(`${SCHEMA_ID}#/$defs/${name}`);
    if (!v) throw new Error(`contract schema missing $defs/${name}`);
    return v;
  };
  validators = {
    request: get("SolveRequest"),
    response: get("SolveResponse"),
    simRequest: get("SimulateRequest"),
    simResponse: get("SimulateResponse"),
  };
  return validators;
}

const HUGE_MICRO = "1000000000000"; // 1e6 USDC — effectively unbounded default

function pHatOf(p: SolverProvider): number {
  return p.calibration.nObservations > 0
    ? pSuccessMean(p.calibration)
    : p.claimedSuccessProb;
}

/** Build the shared-contract SolveRequest from a resolved SolverInput. */
export function buildSolveRequest(
  input: SolverInput,
  options?: { timeLimitMs?: number },
): unknown {
  const { graph, providers } = input;
  const candidates: unknown[] = [];
  for (const node of graph.nodes) {
    const valueMicro = parseUsdcToMicro(node.task.valueUsdc ?? node.task.budgetUsdc);
    for (const p of providers) {
      if (!p.capabilities.includes(node.task.capability)) continue;
      const bond = providerBondMicro(p, node.task.bondRatio ?? 0.1, node.task.valueUsdc);
      const costPlusBond = providerCostMicro(p) + bond;
      candidates.push({
        nodeId: node.nodeId,
        providerId: p.id,
        score: scoreProviderForNode(graph, node.nodeId, p),
        costPlusBondUsdcMicro: costPlusBond.toString(),
        bondUsdcMicro: bond.toString(),
        pHat: pHatOf(p),
        latencyMs: latencyMs(p),
      });
    }
  }

  return {
    graphId: graph.id,
    budgetUsdcMicro: parseUsdcToMicro(graph.globalBudgetUsdc).toString(),
    deadlineMs: graph.globalDeadlineMs,
    globalQualityFloor: graph.globalQualityFloor ?? null,
    riskAversion: input.riskAversion,
    nodes: graph.nodes.map((n) => ({
      nodeId: n.nodeId,
      capability: n.task.capability,
      valueUsdcMicro: parseUsdcToMicro(n.task.valueUsdc ?? n.task.budgetUsdc).toString(),
      qualityFloor: n.task.qualityFloor ?? null,
      latencyCapMs: null,
    })),
    edges: graph.edges.map((e) => ({ from: e.from, to: e.to })),
    providers: providers.map((p) => ({
      id: p.id,
      concurrency: p.concurrency ?? graph.nodes.length,
      bondCapacityUsdcMicro: p.bondCapacityUsdc
        ? parseUsdcToMicro(p.bondCapacityUsdc).toString()
        : HUGE_MICRO,
    })),
    candidates,
    options: {
      timeLimitMs: options?.timeLimitMs ?? 5000,
      seed: input.seed ?? 42,
    },
  };
}

export interface CpSatResult {
  assignments: NodeAssignment[];
  objectiveValue: number;
  schedule: NodeSchedule[];
  shadowPricesUsdc: Record<string, string>;
  makespanMs: number;
  solver: "cp_sat";
}

export interface SolverClientOptions {
  /** Base URL of the Python service. Default env TRAPEZA_SOLVER_URL or localhost. */
  baseUrl?: string;
  /** Abort the request after this many ms. Default 8000. */
  timeoutMs?: number;
}

function baseUrlOf(o?: SolverClientOptions): string {
  return (
    o?.baseUrl ??
    process.env.TRAPEZA_SOLVER_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
}

async function postJson(
  url: string,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`solver service ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** True if the service answers /health within the timeout. */
export async function solverHealthy(o?: SolverClientOptions): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o?.timeoutMs ?? 2000);
    try {
      const res = await fetch(`${baseUrlOf(o)}/health`, { signal: ctrl.signal });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * Call the Python CP-SAT service. Throws on transport error, contract-validation
 * failure, or an `infeasible` result — the caller degrades to TS Tier-2.
 */
export async function solveCpSat(
  input: SolverInput,
  o?: SolverClientOptions,
): Promise<CpSatResult> {
  const v = getValidators();
  const req = buildSolveRequest(input, { timeLimitMs: o?.timeoutMs });
  if (!v.request(req)) {
    throw new Error(
      `SolveRequest failed contract validation: ${JSON.stringify(v.request.errors)}`,
    );
  }
  const raw = await postJson(`${baseUrlOf(o)}/solve`, req, o?.timeoutMs ?? 8000);
  if (!v.response(raw)) {
    throw new Error(
      `SolveResponse failed contract validation: ${JSON.stringify(v.response.errors)}`,
    );
  }
  const resp = raw as {
    status: string;
    objectiveValue: number;
    assignments: NodeAssignment[];
    schedule: NodeSchedule[];
    shadowPrices: Record<string, string>;
    makespanMs: number;
  };
  if (resp.status === "infeasible") {
    throw new Error("CP-SAT reported infeasible");
  }
  return {
    assignments: resp.assignments,
    objectiveValue: resp.objectiveValue,
    schedule: resp.schedule,
    shadowPricesUsdc: resp.shadowPrices,
    makespanMs: resp.makespanMs,
    solver: "cp_sat",
  };
}

export interface SimulateResult {
  failureProbability: number;
  budgetOverrunProbability: number;
  deadlineBreachProbability: number;
  expectedNetCostUsdc: number;
  seed: number;
  iterations: number;
}

/** Build the shared-contract SimulateRequest for the Monte Carlo twin. */
export function buildSimulateRequest(
  input: SolverInput,
  assignments: NodeAssignment[],
  iterations: number,
  seed: number,
): unknown {
  const usedProviderIds = new Set(assignments.map((a) => a.providerId));
  const providers = input.providers
    .filter((p) => usedProviderIds.has(p.id))
    .map((p) => {
      const c: CalibrationRecord = p.calibration;
      return {
        id: p.id,
        successAlpha: c.successAlpha,
        successBeta: c.successBeta,
        costMean: c.costMean,
        costVar: c.costVar,
        latencyMean: c.latencyMean,
        latencyVar: c.latencyVar,
        nObservations: c.nObservations,
        priceUsdc: Number(p.priceUsdc),
      };
    });
  return {
    graphId: input.graph.id,
    deadlineMs: input.graph.globalDeadlineMs,
    budgetUsdcMicro: parseUsdcToMicro(input.graph.globalBudgetUsdc).toString(),
    nodes: input.graph.nodes.map((n) => ({ nodeId: n.nodeId })),
    edges: input.graph.edges.map((e) => ({ from: e.from, to: e.to })),
    assignments: assignments.map((a) => ({
      nodeId: a.nodeId,
      providerId: a.providerId,
    })),
    providers,
    iterations,
    seed,
  };
}

/** Call the Python Monte Carlo endpoint. Throws so callers can fall back to TS. */
export async function simulateViaService(
  input: SolverInput,
  assignments: NodeAssignment[],
  iterations: number,
  seed: number,
  o?: SolverClientOptions,
): Promise<SimulateResult> {
  const v = getValidators();
  const req = buildSimulateRequest(input, assignments, iterations, seed);
  if (!v.simRequest(req)) {
    throw new Error(
      `SimulateRequest failed contract validation: ${JSON.stringify(v.simRequest.errors)}`,
    );
  }
  const raw = await postJson(`${baseUrlOf(o)}/simulate`, req, o?.timeoutMs ?? 8000);
  if (!v.simResponse(raw)) {
    throw new Error(
      `SimulateResponse failed contract validation: ${JSON.stringify(v.simResponse.errors)}`,
    );
  }
  return raw as SimulateResult;
}
