import type { AgentView, ProviderView } from "../types/contract";

/** Demo ask prices keyed by the provider id each agent mirrors. */
const PRICE_BY_LINKED: Record<string, string> = {
  "workhorse-1": "0.15",
  "braggart-1": "0.30",
  "workhorse-2": "0.20",
  "braggart-2": "0.35",
  "workhorse-3": "0.25",
  "braggart-3": "0.40",
  "premium-logo": "0.65",
  "cheap-logo": "0.15",
  "mid-code": "0.50",
  "premium-code": "0.80",
};

function priceFor(agent: AgentView): string {
  return PRICE_BY_LINKED[agent.linkedProviderId] ?? "0.25";
}

function pStdDev(p: number, n: number): number {
  if (n <= 0) return 0.15;
  return Math.sqrt((p * (1 - p)) / (n + 1));
}

/** Map bundled ArcTask agents into ProviderView rows for the live clearing engine. */
export function agentsToProviders(agents: AgentView[]): ProviderView[] {
  return agents.filter((a) => a.active).map((a) => {
    const price = priceFor(a);
    const priceN = Number(price);
    return {
      id: a.linkedProviderId,
      capabilities: [...a.capabilities],
      priceUsdc: price,
      bondOfferedUsdc: a.bondUsdc || "0",
      claimedSuccessProb: a.claimedSuccessProb,
      claimedLatencyMs: 100,
      calibratedSuccessProb: a.calibratedSuccessProb,
      pSuccessStdDev: pStdDev(a.calibratedSuccessProb, a.nObservations),
      successAlpha: a.calibratedSuccessProb * a.nObservations,
      successBeta: (1 - a.calibratedSuccessProb) * a.nObservations,
      costMeanUsdc: priceN * 0.96,
      latencyMeanMs: 100,
      nObservations: a.nObservations,
      archetype: a.archetype,
    };
  });
}

export function agentCapabilities(agents: AgentView[]): string[] {
  const caps = new Set<string>();
  for (const a of agents) for (const c of a.capabilities) caps.add(c);
  return [...caps].sort();
}
