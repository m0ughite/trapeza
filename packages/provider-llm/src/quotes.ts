/**
 * Quote source for LLM providers (RFQ priors).
 */

import type { ProviderProfile, Quote, QuoteSource, TaskSpec } from "@trapeza/core";
import type { LlmProviderSpec } from "./roster.js";
import { quoteFromSpec } from "./roster.js";

export class LlmQuoteSource implements QuoteSource {
  private quotesByProviderId = new Map<string, Quote>();

  seed(specs: LlmProviderSpec[], idByEndpoint: Map<string, string>): void {
    for (const spec of specs) {
      const providerId = idByEndpoint.get(spec.endpoint);
      if (providerId) {
        this.quotesByProviderId.set(providerId, quoteFromSpec(spec, providerId));
      }
    }
  }

  setQuote(providerId: string, quote: Omit<Quote, "providerId">): void {
    this.quotesByProviderId.set(providerId, { providerId, ...quote });
  }

  async quotesFor(
    _spec: TaskSpec,
    providers: ProviderProfile[],
  ): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const p of providers) {
      const q = this.quotesByProviderId.get(p.id);
      if (q) quotes.push(q);
    }
    return quotes;
  }
}
