/**
 * JSON Schema Draft 2020-12 standardization for node I/O contracts.
 */

import type { OracleSpec } from "@trapeza/core";

export const JSON_SCHEMA_DRAFT =
  "https://json-schema.org/draft/2020-12/schema";

export function normalizeOracleSpec(spec: OracleSpec): OracleSpec {
  return {
    schema: { ...spec.schema },
    groundTruth: spec.groundTruth,
  };
}

export function oracleSpecFromOutputSchema(
  outputSchema: Record<string, unknown>,
  groundTruth: Record<string, unknown>,
): OracleSpec {
  return normalizeOracleSpec({ schema: outputSchema, groundTruth });
}
