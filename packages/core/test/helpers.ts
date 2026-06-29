/**
 * Shared fixtures for the core tests. Kept tiny and explicit so each test reads
 * as a self-contained story.
 */

import type { ProviderProfile, Quote, TaskSpec } from "@trapeza/core";

export function makeTask(overrides: Partial<TaskSpec> = {}): TaskSpec {
  return {
    id: "task-1",
    capability: "extract.invoice.v1",
    input: { doc: "invoice.pdf" },
    oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    valueUsdc: "1.00",
    budgetUsdc: "1.00",
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 5000,
    ...overrides,
  };
}

export function makeProviderInput(
  overrides: Partial<Omit<ProviderProfile, "id" | "agentId">> = {},
): Omit<ProviderProfile, "id" | "agentId"> {
  return {
    wallet: "0x0000000000000000000000000000000000000001",
    capabilities: ["extract.invoice.v1"],
    endpoint: "https://provider.example/extract",
    priceSurface: () => "0.10",
    bondBalanceUsdc: "1.00",
    status: "active",
    ...overrides,
  };
}

export function makeQuote(
  providerId: string,
  overrides: Partial<Omit<Quote, "providerId">> = {},
): Quote {
  return {
    providerId,
    priceUsdc: "0.10",
    claimedSuccessProb: 0.9,
    claimedLatencyMs: 100,
    bondOfferedUsdc: "0",
    ...overrides,
  };
}
