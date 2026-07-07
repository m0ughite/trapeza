import { describe, expect, it } from "vitest";
import { SchemaOracle } from "@trapeza/oracle";
import type { TaskSpec } from "@trapeza/core";

function task(overrides: Partial<TaskSpec> = {}): TaskSpec {
  return {
    id: "t1",
    capability: "extract.invoice.v1",
    input: {},
    oracleSpec: {
      schema: {
        type: "object",
        properties: {
          total: { type: "number" },
          vendor: { type: "string" },
        },
        required: ["total", "vendor"],
        additionalProperties: false,
      },
      groundTruth: { total: 100.5, vendor: "Acme Corp" },
    },
    valueUsdc: "1.00",
    budgetUsdc: "1.00",
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 5000,
    ...overrides,
  };
}

describe("SchemaOracle", () => {
  it("passes when shape and ground truth match", async () => {
    const oracle = new SchemaOracle();
    const out = await oracle.verify(task(), {
      total: 100.5000001,
      vendor: "acme corp",
    });
    expect(out.passed).toBe(true);
    expect(out.score).toBe(100);
  });

  it("fails on value diff beyond tolerance", async () => {
    const oracle = new SchemaOracle();
    const out = await oracle.verify(task(), {
      total: 200,
      vendor: "Acme Corp",
    });
    expect(out.passed).toBe(false);
    expect(out.score).toBeLessThan(100);
  });

  it("fails when required field omitted (no default rescue)", async () => {
    const oracle = new SchemaOracle({ numericToleranceMicro: 0n });
    const out = await oracle.verify(task(), { total: 100.5 });
    expect(out.passed).toBe(false);
  });

  it("reuses compiled schema cache", async () => {
    const oracle = new SchemaOracle();
    const spec = task();
    await oracle.verify(spec, { total: 100.5, vendor: "Acme Corp" });
    expect(oracle.cacheSize()).toBe(1);
    await oracle.verify(spec, { total: 100.5, vendor: "Acme Corp" });
    expect(oracle.cacheSize()).toBe(1);
  });
});
