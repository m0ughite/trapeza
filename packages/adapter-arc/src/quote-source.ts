/**
 * ArcTaskQuoteSource — the RFQ step, sourced from the ArcTask agent registry.
 *
 * In production this hits each agent's x402 RFQ endpoint. Here we read the
 * self-reported RFQ fields (price, claimed success, latency, bond) that agents
 * publish in their on-chain registry metadata. These are PRIORS only: the router
 * scores on the calibration ledger's realized outcomes, never on these claims
 * (except on the deliberate CALIBRATION OFF demo path).
 */

import type { ProviderProfile, Quote, QuoteSource, TaskSpec } from "@trapeza/core";
import {
  ArcTaskClient,
  parseUsdcToWei,
  formatErc20Usdc,
  formatNativeUsdc,
} from "./arctask.js";
import { ARCTASK_USDC_MODE } from "./constants.js";
import { parseAgentMetadata, type AgentMetadata } from "./provider-sync.js";

export interface ArcTaskQuoteSourceConfig {
  /** Default self-reported success probability for cold-start agents. */
  defaultSuccessProb?: number;
  defaultLatencyMs?: number;
  /** Price per capability; falls back to task budget fraction. */
  priceByCapability?: Record<string, string>;
}

export class ArcTaskQuoteSource implements QuoteSource {
  private readonly metaCache = new Map<string, AgentMetadata>();

  /**
   * @param cfg    default RFQ knobs.
   * @param client optional registry client. When provided, each provider's
   *   self-reported RFQ fields are read from its on-chain agent metadata; when
   *   omitted, the configured defaults apply (kept for simple call sites/tests).
   */
  constructor(
    private readonly cfg: ArcTaskQuoteSourceConfig = {},
    private readonly client?: ArcTaskClient,
  ) {}

  private async readMeta(provider: ProviderProfile): Promise<AgentMetadata> {
    if (!this.client || provider.agentId == null) return {};
    const key = provider.agentId.toString();
    const cached = this.metaCache.get(key);
    if (cached) return cached;
    try {
      const agent = await this.client.getAgent(provider.agentId);
      const meta = parseAgentMetadata(agent.metadataURI);
      this.metaCache.set(key, meta);
      return meta;
    } catch {
      return {};
    }
  }

  async quotesFor(
    spec: TaskSpec,
    providers: ProviderProfile[],
  ): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const provider of providers) {
      if (!provider.capabilities.includes(spec.capability)) continue;
      const meta = await this.readMeta(provider);
      const priceUsdc =
        meta.priceUsdc ??
        this.cfg.priceByCapability?.[spec.capability] ??
        minPrice(spec.budgetUsdc, provider.priceSurface(0, 0));

      quotes.push({
        providerId: provider.id,
        priceUsdc,
        claimedSuccessProb: meta.claimedSuccessProb ?? this.cfg.defaultSuccessProb ?? 0.85,
        claimedLatencyMs: meta.claimedLatencyMs ?? this.cfg.defaultLatencyMs ?? 30_000,
        bondOfferedUsdc: meta.bondUsdc ?? provider.bondBalanceUsdc,
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
