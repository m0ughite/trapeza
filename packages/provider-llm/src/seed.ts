/**
 * Seed LLM providers into the market and wire settlement/quote registries.
 */

import type { Store, TrapezaCore } from "@trapeza/core";
import { calibrationFromSpec } from "./calibration.js";
import { LlmQuoteSource } from "./quotes.js";
import {
  LLM_ROSTER,
  providerProfileFromSpec,
  type LlmProviderRole,
} from "./roster.js";
import { LlmSettlementAdapter } from "./settlement.js";

export interface SeededLlmMarket {
  lemonId: string;
  byRole: Map<LlmProviderRole, string>;
  byEndpoint: Map<string, string>;
}

export async function seedLlmProviders(
  core: TrapezaCore,
  store: Store,
  settlement: LlmSettlementAdapter,
  quotes: LlmQuoteSource,
): Promise<SeededLlmMarket> {
  const byRole = new Map<LlmProviderRole, string>();
  const byEndpoint = new Map<string, string>();
  let lemonId = "";

  for (const spec of LLM_ROSTER) {
    const profile = await core.registerProvider(providerProfileFromSpec(spec));
    byEndpoint.set(spec.endpoint, profile.id);
    byRole.set(spec.role, profile.id);
    if (spec.role === "lemon") lemonId = profile.id;

    await store.putCalibration({
      ...calibrationFromSpec({ ...spec, id: profile.id }),
      providerId: profile.id,
    });

    settlement.registerEndpoint(spec.endpoint, {
      providerId: profile.id,
      priceUsdc: spec.priceUsdc,
      quality: spec.quality,
    });
  }

  quotes.seed(LLM_ROSTER, byEndpoint);
  return { lemonId, byRole, byEndpoint };
}
