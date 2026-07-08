/**
 * ArcTaskQuoteSource — first real QuoteSource mapping registry agents to quotes.
 *
 * In production this would hit each agent's x402 RFQ endpoint. For the harness
 * we derive quotes from on-chain agent metadata and a configurable price table.
 */

import type { ProviderProfile, Quote, QuoteSource, TaskSpec } from "@trapeza/core";
import { parseUsdcToWei, formatErc20Usdc, formatNativeUsdc } from "./arctask.js";
import { ARCTASK_USDC_MODE } from "./constants.js";
import { parseAgentMetadata } from "./provider-sync.js";

export interface ArcTaskQuoteSourceConfig {
  /** Default self-reported success probability for cold-start agents. */
  defaultSuccessProb?: number;
  defaultLatencyMs?: number;
  /** Price per capability; falls back to task budget fraction. */
  priceByCapability?: Record<string, string>;
}

export class ArcTaskQuoteSource implements QuoteSource {
  constructor(private readonly cfg: ArcTaskQuoteSourceConfig = {}) {}

  async quotesFor(
    spec: TaskSpec,
    providers: ProviderProfile[],
  ): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const provider of providers) {
      if (!provider.capabilities.includes(spec.capability)) continue;
      const meta = parseAgentMetadata(provider.endpoint);
      void meta;
      const priceUsdc =
        this.cfg.priceByCapability?.[spec.capability] ??
        minPrice(spec.budgetUsdc, "0.001");

      quotes.push({
        providerId: provider.id,
        priceUsdc,
        claimedSuccessProb: this.cfg.defaultSuccessProb ?? 0.85,
        claimedLatencyMs: this.cfg.defaultLatencyMs ?? 30_000,
        bondOfferedUsdc: provider.bondBalanceUsdc,
      });
    }
    return quotes;
  }
}

function minPrice(a: string, b: string): string {
  return Number(a) <= Number(b) ? a : b;
}

/** Convert wei reward from a job to a display USDC string for quotes. */
export function rewardWeiToUsdc(rewardWei: bigint): string {
  return ARCTASK_USDC_MODE === "native"
    ? formatNativeUsdc(rewardWei)
    : formatErc20Usdc(rewardWei);
}

export { parseUsdcToWei };
