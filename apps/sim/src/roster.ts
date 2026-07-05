/**
 * Deterministic seeded provider roster for the lemons-collapse demo.
 */

import {
  defaultCalibration,
  updateCalibration,
  type CalibrationRecord,
  type Outcome,
  type ProviderProfile,
  type TaskGraph,
  type TaskSpec,
} from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";

function synthCalibration(
  providerId: string,
  capability: string,
  passes: number,
  total: number,
  cost: string,
  latency: number,
): CalibrationRecord {
  let cal = defaultCalibration(providerId, capability);
  for (let i = 0; i < total; i++) {
    const outcome: Outcome = {
      taskId: `synth-${providerId}-${i}`,
      providerId,
      passed: i < passes,
      score: i < passes ? 100 : 0,
      evidenceURI: "sim://synthetic",
      realizedCostUsdc: cost,
      realizedLatencyMs: latency,
    };
    cal = updateCalibration(cal, outcome, i + 1);
  }
  return cal;
}

export interface SeedProviderSpec {
  id: string;
  capability: string;
  wallet: `0x${string}`;
  endpoint: string;
  priceUsdc: string;
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  realizedPassRate: number;
  historySamples: number;
  role: "lemon" | "workhorse" | "bottleneck" | "mid";
}

export const SEED_PROVIDERS: SeedProviderSpec[] = [
  {
    id: "lemon-logo",
    capability: "cap.logo",
    wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    endpoint: "https://sim.lemon/logo",
    priceUsdc: "0.12",
    claimedSuccessProb: 0.98,
    claimedLatencyMs: 50,
    realizedPassRate: 0.15,
    historySamples: 20,
    role: "lemon",
  },
  {
    id: "workhorse-logo",
    capability: "cap.logo",
    wallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    endpoint: "https://sim.workhorse/logo",
    priceUsdc: "0.18",
    claimedSuccessProb: 0.65,
    claimedLatencyMs: 90,
    realizedPassRate: 0.9,
    historySamples: 20,
    role: "workhorse",
  },
  {
    id: "bottleneck-code",
    capability: "cap.code",
    wallet: "0xcccccccccccccccccccccccccccccccccccccccc",
    endpoint: "https://sim.bottleneck/code",
    priceUsdc: "0.55",
    claimedSuccessProb: 0.7,
    claimedLatencyMs: 180,
    realizedPassRate: 0.92,
    historySamples: 20,
    role: "bottleneck",
  },
  {
    id: "mid-code",
    capability: "cap.code",
    wallet: "0xdddddddddddddddddddddddddddddddddddddddd",
    endpoint: "https://sim.mid/code",
    priceUsdc: "0.35",
    claimedSuccessProb: 0.85,
    claimedLatencyMs: 120,
    realizedPassRate: 0.55,
    historySamples: 20,
    role: "mid",
  },
];

export function providerProfileFromSeed(
  spec: SeedProviderSpec,
): Omit<ProviderProfile, "id" | "agentId"> {
  return {
    wallet: spec.wallet,
    capabilities: [spec.capability],
    endpoint: spec.endpoint,
    priceSurface: () => spec.priceUsdc,
    bondBalanceUsdc: "5.00",
    status: "active",
  };
}

export function calibrationFromSeed(spec: SeedProviderSpec): CalibrationRecord {
  const passes = Math.round(spec.historySamples * spec.realizedPassRate);
  return synthCalibration(
    spec.id,
    spec.capability,
    passes,
    spec.historySamples,
    spec.priceUsdc,
    spec.claimedLatencyMs,
  );
}

export function solverProviderFromSeed(spec: SeedProviderSpec): SolverProvider {
  return {
    id: spec.id,
    capabilities: [spec.capability],
    priceUsdc: spec.priceUsdc,
    bondOfferedUsdc: "0.05",
    claimedSuccessProb: spec.claimedSuccessProb,
    claimedLatencyMs: spec.claimedLatencyMs,
    calibration: calibrationFromSeed(spec),
    concurrency: 1,
    bondCapacityUsdc: "5.00",
  };
}

export function budgetBottleneckGraph(id: string): TaskGraph {
  return {
    id,
    nodes: [
      {
        nodeId: "logo",
        task: makeTask("task-logo", "cap.logo", "0.50", "0.80"),
      },
      {
        nodeId: "code",
        task: makeTask("task-code", "cap.code", "1.00", "1.20"),
      },
    ],
    edges: [{ from: "logo", to: "code" }],
    globalBudgetUsdc: "1.00",
    globalDeadlineMs: 120_000,
    globalQualityFloor: 0.5,
  };
}

function makeTask(
  id: string,
  capability: string,
  valueUsdc: string,
  budgetUsdc: string,
): TaskSpec {
  return {
    id,
    capability,
    input: {},
    oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    valueUsdc,
    budgetUsdc,
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 60_000,
    bondRatio: 0.05,
  };
}
