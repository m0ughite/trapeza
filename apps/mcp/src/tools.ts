import { ClearingError } from "@trapeza/clearinghouse";
import type { Allocation, TaskGraph, TaskSpec } from "@trapeza/core";
import { executeClearing, type TrapezaRuntime } from "@trapeza/runtime";
import type { ProviderInput, TaskGraphInput, TaskSpecInput } from "./schemas.js";

export class McpToolError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "McpToolError";
    this.code = code;
  }
}

export function mapError(err: unknown): McpToolError {
  if (err instanceof ClearingError) {
    return new McpToolError(err.code, err.message);
  }
  if (err instanceof McpToolError) return err;
  if (err instanceof Error) {
    return new McpToolError("INTERNAL", err.message);
  }
  return new McpToolError("INTERNAL", "unknown error");
}

function fixedPriceSurface(priceUsdc: string) {
  return () => priceUsdc;
}

export async function registerProvider(
  rt: TrapezaRuntime,
  input: ProviderInput,
) {
  const profile = await rt.core.registerProvider({
    wallet: input.wallet as `0x${string}`,
    capabilities: input.capabilities,
    endpoint: input.endpoint,
    priceSurface: fixedPriceSurface(input.priceUsdc ?? "0.10"),
    bondBalanceUsdc: input.bondBalanceUsdc,
    status: input.status,
  });

  if (rt.llm) {
    const priceUsdc = input.priceUsdc ?? "0.10";
    rt.llm.settlement.registerEndpoint(input.endpoint, {
      providerId: profile.id,
      priceUsdc,
      quality: 0.9,
    });
    rt.llm.quotes.setQuote(profile.id, {
      priceUsdc,
      claimedSuccessProb: 0.9,
      claimedLatencyMs: 100,
      bondOfferedUsdc: "0.05",
    });
  }

  await rt.store.appendEvent({
    ts: Date.now(),
    kind: "register",
    providerId: profile.id,
    payload: { capabilities: profile.capabilities },
  });
  return {
    id: profile.id,
    agentId: profile.agentId?.toString() ?? null,
    wallet: profile.wallet,
    capabilities: profile.capabilities,
    endpoint: profile.endpoint,
  };
}

export async function getProviders(rt: TrapezaRuntime, capability: string) {
  const providers = await rt.core.listProviders(capability);
  return providers.map((p) => ({
    id: p.id,
    wallet: p.wallet,
    capabilities: p.capabilities,
    endpoint: p.endpoint,
    bondBalanceUsdc: p.bondBalanceUsdc,
    status: p.status,
  }));
}

export async function getProviderCalibration(
  rt: TrapezaRuntime,
  providerId: string,
  capability: string,
) {
  const cal = await rt.core.getCalibration(providerId, capability);
  return {
    providerId: cal.providerId,
    capability: cal.capability,
    pSuccess: cal.successAlpha / (cal.successAlpha + cal.successBeta),
    nObservations: cal.nObservations,
    costMean: cal.costMean,
    latencyMean: cal.latencyMean,
    lastUpdate: cal.lastUpdate,
  };
}

export async function submitTask(rt: TrapezaRuntime, input: TaskSpecInput) {
  const { useCalibration, ...rest } = input;
  const task: TaskSpec = { input: {}, ...rest };
  await rt.core.submitTask(task);

  if (rt.mocks?.quotes) {
    const providers = await rt.core.listProviders(task.capability);
    for (const p of providers) {
      rt.mocks.quotes.setQuote(p.id, {
        priceUsdc: p.priceSurface(0, 1),
        claimedSuccessProb: 0.9,
        claimedLatencyMs: 100,
        bondOfferedUsdc: "0.05",
      });
    }
  } else if (!rt.llm?.quotes) {
    throw new McpToolError(
      "NO_QUOTES",
      "submit_task in live mode requires provider quotes — use submit_graph or register providers with x402 endpoints",
    );
  }

  const quotes = await rt.core.collectQuotes(task.id);
  const allocation = await rt.core.route(
    task.id,
    quotes,
    useCalibration ?? true,
  );
  await rt.core.postBond(allocation);
  const started = Date.now();
  const execResult = (await rt.core.execute(allocation)) as {
    receipt: { amountUsdc: string; txHash: string; result?: unknown };
    provider: string;
  };
  const deliverable = execResult.receipt.result ?? execResult;
  const verdict = await rt.core.oracleVerify(task, deliverable);
  const outcome = {
    ...verdict,
    providerId: allocation.providerId,
    realizedCostUsdc: execResult.receipt.amountUsdc,
    realizedLatencyMs: Date.now() - started,
  };
  const { action, txHash } = await rt.core.settle(task.id, outcome);
  await rt.core.recordOutcome(outcome);

  return { taskId: task.id, action, txHash, outcome, allocation };
}

export async function submitGraph(rt: TrapezaRuntime, input: TaskGraphInput) {
  const graph: TaskGraph = {
    ...input,
    nodes: input.nodes.map((n) => ({
      nodeId: n.nodeId,
      task: { input: {}, ...n.task },
    })),
  };
  try {
    const ch = await rt.createClearinghouseFor(graph);
    const clearing = await ch.submitGraph(graph);
    const execution = await executeClearing(rt.core, graph, clearing, {
      events: rt.store,
    });
    return {
      graphId: graph.id,
      clearing: {
        meta: clearing.meta,
        shadowPricesUsdc: clearing.shadowPricesUsdc,
        settlementPricesUsdc: clearing.settlementPricesUsdc,
        totalClearedUsdc: clearing.totalClearedUsdc,
      },
      execution,
    };
  } catch (err) {
    throw mapError(err);
  }
}

export async function getReceipt(rt: TrapezaRuntime, taskId: string) {
  const task = await rt.store.getTask(taskId);
  if (!task) {
    throw new McpToolError("NOT_FOUND", `unknown task: ${taskId}`);
  }
  const outcomes = await rt.store.listOutcomes();
  const outcome = outcomes.find((o) => o.taskId === taskId);
  return { task, outcome: outcome ?? null };
}

export async function getStatus(rt: TrapezaRuntime) {
  return rt.health();
}

export function allocationSummary(a: Allocation) {
  return {
    taskId: a.taskId,
    providerId: a.providerId,
    mechanism: a.mechanism,
    score: a.score,
  };
}
