/**
 * Deterministic schema + ground-truth oracle (AJV).
 */

import { createRequire } from "node:module";
import type { Oracle, Outcome, TaskSpec } from "@trapeza/core";
import { parseUsdcToMicro } from "@trapeza/core";
import { normalizeOracleSpec } from "./schemas.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv2020 = require("ajv/dist/2020") as new (opts: object) => import("ajv").default;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormats = require("ajv-formats") as (ajv: import("ajv").default) => void;

const NUMERIC_TOLERANCE_MICRO = 1n;

export interface SchemaOracleOptions {
  /** Default numeric tolerance in micro-USDC for ground-truth number fields. */
  numericToleranceMicro?: bigint;
}

function stableHash(obj: unknown): string {
  return JSON.stringify(obj);
}

export class SchemaOracle implements Oracle {
  private readonly ajv: import("ajv").default;
  private readonly cache = new Map<string, ReturnType<import("ajv").default["compile"]>>();
  private readonly numericToleranceMicro: bigint;

  constructor(options: SchemaOracleOptions = {}) {
    this.ajv = new Ajv2020({
      allErrors: true,
      useDefaults: false,
      strict: false,
    });
    addFormats(this.ajv);
    this.numericToleranceMicro =
      options.numericToleranceMicro ?? NUMERIC_TOLERANCE_MICRO;
  }

  private getValidator(schema: Record<string, unknown>) {
    const normalized = normalizeOracleSpec({
      schema,
      groundTruth: {},
    }).schema;
    const key = stableHash(normalized);
    let fn = this.cache.get(key);
    if (!fn) {
      fn = this.ajv.compile(normalized);
      this.cache.set(key, fn);
    }
    return fn;
  }

  async verify(spec: TaskSpec, result: unknown): Promise<Outcome> {
    const oracleSpec = normalizeOracleSpec(spec.oracleSpec);
    const validate = this.getValidator(oracleSpec.schema);
    const shapeValid = validate(result);
    const fieldResults = diffGroundTruth(
      result,
      oracleSpec.groundTruth,
      this.numericToleranceMicro,
    );
    const truthPassed = fieldResults.every((r) => r.passed);
    const passed = Boolean(shapeValid) && truthPassed;
    const correct = fieldResults.filter((r) => r.passed).length;
    const total = Math.max(fieldResults.length, 1);
    const score = passed
      ? 100
      : Math.round((correct / total) * 100 * (shapeValid ? 1 : 0.5));

    const providerId =
      typeof result === "object" &&
      result !== null &&
      "providerId" in result &&
      typeof (result as { providerId: unknown }).providerId === "string"
        ? (result as { providerId: string }).providerId
        : "unknown";

    const errors = shapeValid
      ? []
      : (validate.errors ?? []).map(
          (e) => `${e.instancePath} ${e.message ?? "invalid"}`,
        );

    return {
      taskId: spec.id,
      providerId,
      passed,
      score,
      evidenceURI: `oracle://schema/${spec.id}?passed=${passed}&errors=${encodeURIComponent(errors.join(";"))}`,
      realizedCostUsdc: spec.budgetUsdc,
      realizedLatencyMs: 0,
    };
  }

  /** Exposed for cache-hit tests. */
  cacheSize(): number {
    return this.cache.size;
  }
}

function diffGroundTruth(
  result: unknown,
  groundTruth: Record<string, unknown>,
  toleranceMicro: bigint,
): { field: string; passed: boolean }[] {
  if (typeof result !== "object" || result === null) {
    return Object.keys(groundTruth).map((field) => ({ field, passed: false }));
  }
  const obj = result as Record<string, unknown>;
  return Object.entries(groundTruth).map(([field, expected]) => ({
    field,
    passed: compareField(obj[field], expected, toleranceMicro),
  }));
}

function compareField(
  actual: unknown,
  expected: unknown,
  toleranceMicro: bigint,
): boolean {
  if (expected === null || expected === undefined) return actual === expected;
  if (typeof expected === "number" && typeof actual === "number") {
    const a = BigInt(Math.round(actual * 1_000_000));
    const e = parseUsdcToMicro(String(expected));
    const diff = a > e ? a - e : e - a;
    return diff <= toleranceMicro;
  }
  if (typeof expected === "string" && typeof actual === "string") {
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
  }
  return actual === expected;
}
