/**
 * ArcTask registry agents → clearinghouse SolverProvider + lookup map.
 */

import { defaultCalibration, type CalibrationRecord, type ProviderProfile } from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import type { ArcTaskAgent } from "./arctask.js";
import { MarketplaceProviderSync, parseAgentMetadata } from "./provider-sync.js";

export interface AgentMarketEntry {
  providerId: string;
  agentId: bigint;
  wallet: `0x${string}`;
}

export type AgentMarketMap = Map<string, AgentMarketEntry>;

export function providerIdForAgent(agentId: bigint): string {
  return `arctask-agent-${agentId}`;
}

export function parseAgentIdFromProviderId(providerId: string): bigint | null {
  const m = providerId.match(/^arctask-agent-(\d+)$/);
  return m ? BigInt(m[1]!) : null;
}

export function profileToSolverProvider(
  profile: ProviderProfile,
  opts: {
    claimedSuccessProb?: number;
    claimedLatencyMs?: number;
    priceUsdc?: string;
    calibration?: CalibrationRecord;
  } = {},
): SolverProvider {
  const cap = profile.capabilities[0] ?? "arctask.general.v1";
  const cal =
    opts.calibration ?? defaultCalibration(profile.id, cap);
  return {
    id: profile.id,
    capabilities: [...profile.capabilities],
    priceUsdc: opts.priceUsdc ?? profile.priceSurface(0, 0),
    bondOfferedUsdc: profile.bondBalanceUsdc,
    claimedSuccessProb: opts.claimedSuccessProb ?? 0.85,
    claimedLatencyMs: opts.claimedLatencyMs ?? 30_000,
    calibration: cal,
  };
}

export function agentToMarketEntry(agent: ArcTaskAgent, providerId?: string): AgentMarketEntry {
  return {
    providerId: providerId ?? providerIdForAgent(agent.agentId),
    agentId: agent.agentId,
    wallet: agent.owner,
  };
}

/** Sync registry and build SolverProviders + providerId → agent lookup. */
export async function agentsToSolverProviders(
  sync: MarketplaceProviderSync,
  opts?: {
    defaultSuccessProb?: number;
    defaultLatencyMs?: number;
    calibrationByProvider?: Map<string, CalibrationRecord>;
  },
): Promise<{ providers: SolverProvider[]; market: AgentMarketMap }> {
  const profiles = await sync.syncProviders();
  const market: AgentMarketMap = new Map();
  const providers: SolverProvider[] = [];

  for (const profile of profiles) {
    const agentId = profile.agentId;
    if (agentId === undefined || agentId === null) continue;
    market.set(profile.id, {
      providerId: profile.id,
      agentId,
      wallet: profile.wallet,
    });
    const meta = parseAgentMetadata(profile.endpoint);
    void meta;
    providers.push(
      profileToSolverProvider(profile, {
        claimedSuccessProb: opts?.defaultSuccessProb,
        claimedLatencyMs: opts?.defaultLatencyMs,
        calibration: opts?.calibrationByProvider?.get(profile.id),
      }),
    );
  }

  return { providers, market };
}
