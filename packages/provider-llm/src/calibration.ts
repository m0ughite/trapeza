/**
 * Seed synthetic calibration history for LLM providers.
 */

import {
  defaultCalibration,
  updateCalibration,
  type CalibrationRecord,
  type Outcome,
} from "@trapeza/core";
import type { LlmProviderSpec } from "./roster.js";

export function calibrationFromSpec(spec: LlmProviderSpec): CalibrationRecord {
  let cal = defaultCalibration(spec.id, "cap.qa");
  const passes = Math.round(spec.historySamples * spec.realizedPassRate);
  for (let i = 0; i < spec.historySamples; i++) {
    const outcome: Outcome = {
      taskId: `synth-${spec.id}-${i}`,
      providerId: spec.id,
      passed: i < passes,
      score: i < passes ? 100 : 0,
      evidenceURI: "llm://synthetic",
      realizedCostUsdc: spec.priceUsdc,
      realizedLatencyMs: spec.claimedLatencyMs,
    };
    cal = updateCalibration(cal, outcome, i + 1);
  }
  return cal;
}
