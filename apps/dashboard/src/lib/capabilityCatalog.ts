/**
 * Capability catalog — the bridge that lets a non-expert describe a workflow in
 * plain terms ("parse a document", "reconcile the data") and have Trapeza fill
 * in the *provider market* automatically.
 *
 * The catalog is derived DETERMINISTICALLY from the bundled `DemoRun` fixtures:
 * every provider that has ever appeared in a reference run is grouped by the
 * capability it advertises, de-duplicated by id, and sorted. So the "simple
 * mode" input never has to name a provider, a price, a bond or a calibration
 * row — those all come from here.
 *
 * This module is pure (types + a builder + a static label map) so it can be
 * imported from the browser bundle AND the serverless `api/run` function.
 */

import type { DemoRun, ProviderView } from "../types/contract";

export interface CapabilityEntry {
  /** Machine id used in the graph contract, e.g. "doc.parse". */
  capability: string;
  /** Plain-language name shown to users, e.g. "Parse a document". */
  label: string;
  /** One-line description of what a step with this capability does. */
  description: string;
  /** Every catalog provider that can execute this capability (sorted by id). */
  providers: ProviderView[];
}

export type CapabilityCatalog = CapabilityEntry[];

/**
 * Human-friendly names + descriptions for the capabilities that appear in the
 * bundled runs. Anything not listed here falls back to a generated label so the
 * catalog never hides an available capability.
 */
const CAPABILITY_META: Record<string, { label: string; description: string }> = {
  "doc.parse": { label: "Parse a document", description: "Turn a raw file (PDF, scan or image) into machine-readable text." },
  "doc.extract": { label: "Extract from a document", description: "Pull structured findings or fields out of a source document." },
  "doc.chunk": { label: "Chunk a document", description: "Split a long document into passages for indexing/retrieval." },
  "data.extract": { label: "Extract data", description: "Pull line-items, totals or fields out of parsed content." },
  "data.reconcile": { label: "Reconcile data", description: "Match records against a source of truth and resolve discrepancies." },
  "data.aggregate": { label: "Aggregate data", description: "Combine multiple inputs (e.g. parallel pulls) into one dataset." },
  "verify.rules": { label: "Validate against rules", description: "Check the result against a rule set / policy." },
  "verify.claims": { label: "Fact-check claims", description: "Verify stated claims against evidence before publishing." },
  "verify.tone": { label: "Tone-check text", description: "Review drafted text for tone, safety and correctness." },
  "verify.grounding": { label: "Check grounding", description: "Confirm a generated answer is supported by its sources." },
  "report.format": { label: "Format a report", description: "Render the final result into a clean, presentable report." },
  "web.research": { label: "Research on the web", description: "Gather relevant sources and evidence for a topic." },
  "ticket.classify": { label: "Classify a ticket", description: "Route/label an inbound support ticket by intent." },
  "kb.lookup": { label: "Look up the knowledge base", description: "Find the relevant knowledge-base articles for a query." },
  "sentiment.analyze": { label: "Analyze sentiment", description: "Gauge the sentiment / urgency of a message." },
  "entitlement.check": { label: "Check entitlement", description: "Verify the requester's plan / permissions." },
  "response.draft": { label: "Draft a response", description: "Write a reply from the gathered context." },
  "code.generate": { label: "Generate code", description: "Produce a code change for the requested task." },
  "test.run": { label: "Run tests", description: "Execute the test suite against a change." },
  "code.review": { label: "Review a diff", description: "Review a code change for correctness and quality." },
  "security.scan": { label: "Security-scan", description: "Scan a change for security vulnerabilities." },
  "embed.index": { label: "Build an index", description: "Embed chunks into a searchable vector index." },
  "retrieve.topk": { label: "Retrieve top passages", description: "Fetch the most relevant passages for a query." },
  "answer.generate": { label: "Generate an answer", description: "Produce a grounded answer from retrieved context." },
};

/** Fallback label for a capability with no curated metadata. */
export function labelForCapability(capability: string): string {
  const meta = CAPABILITY_META[capability];
  if (meta) return meta.label;
  const last = capability.split(".").pop() ?? capability;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function descriptionForCapability(capability: string): string {
  return CAPABILITY_META[capability]?.description ?? `Steps that perform "${capability}".`;
}

function cloneProvider(provider: ProviderView): ProviderView {
  return { ...provider, capabilities: [...provider.capabilities] };
}

/**
 * Build the capability catalog from a set of reference runs. Deterministic:
 * providers are collected in run order, de-duplicated by id, and every capability
 * lists its backing providers sorted by id; capabilities are sorted alphabetically.
 */
export function buildCapabilityCatalog(runs: DemoRun[]): CapabilityCatalog {
  const providerById = new Map<string, ProviderView>();
  for (const run of runs) {
    for (const provider of run.providers) {
      if (!providerById.has(provider.id)) providerById.set(provider.id, cloneProvider(provider));
    }
  }

  const byCapability = new Map<string, ProviderView[]>();
  for (const provider of providerById.values()) {
    for (const capability of provider.capabilities) {
      const list = byCapability.get(capability) ?? [];
      list.push(provider);
      byCapability.set(capability, list);
    }
  }

  return [...byCapability.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((capability) => ({
      capability,
      label: labelForCapability(capability),
      description: descriptionForCapability(capability),
      providers: byCapability
        .get(capability)!
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(cloneProvider),
    }));
}

/** Convenience lookup keyed by capability id. */
export function catalogIndex(catalog: CapabilityCatalog): Map<string, CapabilityEntry> {
  return new Map(catalog.map((entry) => [entry.capability, entry]));
}

/** All valid capability ids, sorted — used in "unknown capability" errors. */
export function capabilityIds(catalog: CapabilityCatalog): string[] {
  return catalog.map((entry) => entry.capability);
}
