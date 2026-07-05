/**
 * Seeded agent loop — manufactures volume and calibration divergence.
 */

import seedrandom from "seedrandom";
import type { Allocation, ProviderProfile, TaskSpec } from "@trapeza/core";
import { executeClearing, type TrapezaRuntime } from "@trapeza/runtime";
import {
  budgetBottleneckGraph,
  calibrationFromSeed,
  providerProfileFromSeed,
  SEED_PROVIDERS,
  type SeedProviderSpec,
} from "./roster.js";

export interface LoopMetrics {
  providerId: string;
  role: SeedProviderSpec["role"];
  tasksWon: number;
  tasksPassed: number;
  totalCostUsdc: number;
  totalLatencyMs: number;
  resultPerUsdc: number;
  resultPerSecond: number;
}

export interface LoopOptions {
  seed?: number;
  iterations?: number;
  useCalibration?: boolean;
  clock?: () => number;
}

export interface LoopResult {
  metrics: LoopMetrics[];
  allocations: Allocation[];
  calibrationOn: boolean;
}

export interface SeededRoster {
  byEndpoint: Map<string, ProviderProfile>;
  lemonId: string;
}

export async function seedProviders(rt: TrapezaRuntime): Promise<SeededRoster> {
  const byEndpoint = new Map<string, ProviderProfile>();
  let lemonId = "";

  for (const spec of SEED_PROVIDERS) {
    const profile = await rt.core.registerProvider(
      providerProfileFromSeed(spec),
    );
    byEndpoint.set(spec.endpoint, profile);
    if (spec.role === "lemon") lemonId = profile.id;

    await rt.store.putCalibration({
      ...calibrationFromSeed(spec),
      providerId: profile.id,
    });

    if (rt.mocks) {
      rt.mocks.quotes.setQuote(profile.id, {
        priceUsdc: spec.priceUsdc,
        claimedSuccessProb: spec.claimedSuccessProb,
        claimedLatencyMs: spec.claimedLatencyMs,
        bondOfferedUsdc: "0.05",
      });
      rt.mocks.settlement.setPrice(spec.endpoint, spec.priceUsdc);
    }
  }

  if (rt.mocks) {
    for (const spec of SEED_PROVIDERS) {
      if (spec.role === "lemon") {
        rt.mocks.oracle.script("task-logo", { passed: false, score: 0 });
      }
    }
    rt.mocks.oracle.script("task-code", { passed: true, score: 100 });
  }

  return { byEndpoint, lemonId };
}

export async function runSingleTaskLoop(
  rt: TrapezaRuntime,
  roster: SeededRoster,
  options: LoopOptions = {},
): Promise<LoopResult> {
  const seed = options.seed ?? 42;
  const iterations = options.iterations ?? 10;
  const useCalibration = options.useCalibration ?? true;
  const clock = options.clock ?? (() => Date.now());
  const rng = seedrandom(String(seed));

  const specByEndpoint = new Map(SEED_PROVIDERS.map((s) => [s.endpoint, s]));
  const metrics = new Map<string, LoopMetrics>();
  for (const profile of roster.byEndpoint.values()) {
    const spec = specByEndpoint.get(profile.endpoint)!;
    metrics.set(profile.id, {
      providerId: profile.id,
      role: spec.role,
      tasksWon: 0,
      tasksPassed: 0,
      totalCostUsdc: 0,
      totalLatencyMs: 0,
      resultPerUsdc: 0,
      resultPerSecond: 0,
    });
  }

  const allocations: Allocation[] = [];

  for (let i = 0; i < iterations; i++) {
    const cap = rng() < 0.5 ? "cap.logo" : "cap.code";
    const task: TaskSpec = {
      id: `loop-task-${i}`,
      capability: cap,
      input: {},
      oracleSpec: { schema: { type: "object" }, groundTruth: {} },
      valueUsdc: "0.50",
      budgetUsdc: "0.80",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: 60_000,
    };

    if (rt.mocks && cap === "cap.logo") {
      const lemon = [...roster.byEndpoint.values()].find((p) => {
        const spec = specByEndpoint.get(p.endpoint);
        return spec?.role === "lemon";
      });
      const workhorse = [...roster.byEndpoint.values()].find((p) => {
        const spec = specByEndpoint.get(p.endpoint);
        return spec?.role === "workhorse";
      });
      if (lemon) rt.mocks.oracle.script(task.id, { passed: false, score: 0 });
      void workhorse;
    } else if (rt.mocks) {
      rt.mocks.oracle.script(task.id, { passed: true, score: 100 });
    }

    await rt.core.submitTask(task);
    const quotes = await rt.core.collectQuotes(task.id);
    const allocation = await rt.core.route(task.id, quotes, useCalibration);
    allocations.push(allocation);

    const m = metrics.get(allocation.providerId);
    if (m) m.tasksWon += 1;

    await rt.core.postBond(allocation);
    const started = clock();
    const result = (await rt.core.execute(allocation)) as {
      receipt: { amountUsdc: string };
    };
    const verdict = await rt.core.oracleVerify(task, result);
    const outcome = {
      ...verdict,
      providerId: allocation.providerId,
      realizedCostUsdc: result.receipt.amountUsdc,
      realizedLatencyMs: clock() - started,
    };
    await rt.core.settle(task.id, outcome);
    await rt.core.recordOutcome(outcome);

    if (m) {
      if (outcome.passed) m.tasksPassed += 1;
      m.totalCostUsdc += Number(outcome.realizedCostUsdc);
      m.totalLatencyMs += outcome.realizedLatencyMs;
    }

    await rt.store.appendEvent({
      ts: clock(),
      kind: "outcome",
      taskId: task.id,
      providerId: allocation.providerId,
      payload: {
        passed: outcome.passed,
        resultPerUsdc:
          outcome.passed && Number(outcome.realizedCostUsdc) > 0
            ? 1 / Number(outcome.realizedCostUsdc)
            : 0,
        resultPerSecond:
          outcome.passed && outcome.realizedLatencyMs > 0
            ? 1000 / outcome.realizedLatencyMs
            : 0,
      },
    });
  }

  for (const m of metrics.values()) {
    m.resultPerUsdc =
      m.tasksPassed > 0 && m.totalCostUsdc > 0
        ? m.tasksPassed / m.totalCostUsdc
        : 0;
    m.resultPerSecond =
      m.tasksPassed > 0 && m.totalLatencyMs > 0
        ? (m.tasksPassed * 1000) / m.totalLatencyMs
        : 0;
  }

  return {
    metrics: [...metrics.values()],
    allocations,
    calibrationOn: useCalibration,
  };
}

export async function runGraphIteration(
  rt: TrapezaRuntime,
  graphId: string,
  options: LoopOptions = {},
): Promise<void> {
  const graph = budgetBottleneckGraph(graphId);
  const ch = await rt.createClearinghouseFor(graph);
  const clearing = await ch.submitGraph(graph);
  await executeClearing(rt.core, graph, clearing, {
    clock: options.clock,
    events: rt.store,
  });
}

export function lemonWinShare(result: LoopResult): number {
  const lemon = result.metrics.find((m) => m.role === "lemon");
  const totalWins = result.metrics.reduce((s, m) => s + m.tasksWon, 0);
  if (!lemon || totalWins === 0) return 0;
  return lemon.tasksWon / totalWins;
}
