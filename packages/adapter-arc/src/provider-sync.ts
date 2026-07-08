/**
 * MarketplaceProviderSync — ArcTaskAgentRegistry agents → Trapeza ProviderProfile.
 */

import type { Capability, ProviderProfile } from "@trapeza/core";
import { ArcTaskClient, type ArcTaskAgent } from "./arctask.js";

export interface AgentMetadata {
  name?: string;
  capabilities?: string[];
  endpoint?: string;
  description?: string;
}

/** Best-effort parse of agent metadataURI (ipfs, https, or inline json). */
export function parseAgentMetadata(metadataURI: string): AgentMetadata {
  if (metadataURI.startsWith("data:application/json,")) {
    try {
      const json = decodeURIComponent(metadataURI.slice("data:application/json,".length));
      return JSON.parse(json) as AgentMetadata;
    } catch {
      return {};
    }
  }
  return { name: metadataURI };
}

export function agentToProviderProfile(
  agent: ArcTaskAgent,
  opts: {
    defaultCapability?: Capability;
    defaultEndpoint?: string;
    bondBalanceUsdc?: string;
  } = {},
): ProviderProfile {
  const meta = parseAgentMetadata(agent.metadataURI);
  const capabilities =
    meta.capabilities && meta.capabilities.length > 0
      ? meta.capabilities
      : [opts.defaultCapability ?? "arctask.general.v1"];

  return {
    id: `arctask-agent-${agent.agentId}`,
    agentId: agent.agentId,
    wallet: agent.owner,
    capabilities,
    endpoint: meta.endpoint ?? opts.defaultEndpoint ?? `arctask://agent/${agent.agentId}`,
    priceSurface: () => "0.001",
    bondBalanceUsdc: opts.bondBalanceUsdc ?? "0.01",
    status: agent.active ? "active" : "suspended",
  };
}

export class MarketplaceProviderSync {
  constructor(private readonly client = new ArcTaskClient()) {}

  async syncProviders(opts?: {
    defaultCapability?: Capability;
    defaultEndpoint?: string;
  }): Promise<ProviderProfile[]> {
    const agents = await this.client.listAgents();
    return agents
      .filter((a) => a.active)
      .map((agent) => agentToProviderProfile(agent, opts));
  }

  async getProvider(agentId: bigint): Promise<ProviderProfile> {
    const agent = await this.client.getAgent(agentId);
    return agentToProviderProfile(agent);
  }
}
