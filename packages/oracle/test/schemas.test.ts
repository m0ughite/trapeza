import { describe, expect, it } from "vitest";
import {
  JSON_SCHEMA_DRAFT,
  normalizeOracleSpec,
  oracleSpecFromOutputSchema,
} from "@trapeza/oracle";

describe("oracle schemas", () => {
  it("normalizes oracle spec without injecting $schema", () => {
    const spec = oracleSpecFromOutputSchema(
      { type: "object", properties: { total: { type: "number" } } },
      { total: 100 },
    );
    expect(spec.groundTruth.total).toBe(100);
    expect(spec.schema).not.toHaveProperty("$schema");
    expect(JSON_SCHEMA_DRAFT).toContain("2020-12");
  });

  it("preserves ground truth on normalize", () => {
    const raw = {
      schema: { type: "object" },
      groundTruth: { vendor: "Acme" },
    };
    const norm = normalizeOracleSpec(raw);
    expect(norm.groundTruth.vendor).toBe("Acme");
  });
});
