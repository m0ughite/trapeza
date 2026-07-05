/**
 * Bridge ProviderProfile + per-capability calibration to SolverProvider.
 */

import {
  defaultCalibration,
  type CalibrationRecord,
  type Capability,
  type ProviderProfile,
  type Quote,
  type TaskGraph,
} from "@trapeza/core";
import type { SolverProvider } from "@trapeza/clearinghouse";
import type { Store } from "@trapeza/core";

const NEUTRAL_CLAIMED_SUCCESS = 0.5;
const NEUTRAL_CLAIMED_LATENCY_MS = 100;

export function toSolverProvider(
  profile: ProviderProfile,
  calibrationFor: (capability: Capability) => CalibrationRecord,
  primaryCapability: Capability,
  quote?: Quote,
): SolverProvider {
  const calibration = calibrationFor(primaryCapability);
  const priceUsdc = profile.priceSurface(0, 1);
  return {
    id: profile.id,
    capabilities: profile.capabilities,
    priceUsdc,
    bondOfferedUsdc: quote?.bondOfferedUsdc ?? "0.05",
    claimedSuccessProb: quote?.claimedSuccessProb ?? NEUTRAL_CLAIMED_SUCCESS,
    claimedLatencyMs: quote?.claimedLatencyMs ?? NEUTRAL_CLAIMED_LATENCY_MS,
    calibration,
    concurrency: 1,
    bondCapacityUsdc: profile.bondBalanceUsdc,
  };
}

/** Load solver providers eligible for a graph (v1: single-capability providers). */
export async function solverProvidersFor(
  store: Store,
  graph: TaskGraph,
): Promise<SolverProvider[]> {
  const capabilities = new Set(
    graph.nodes.map((n) => n.task.capability),
  );
  const byId = new Map<string, SolverProvider>();

  for (const cap of capabilities) {
    const profiles = await store.listProviders(cap);
    for (const profile of profiles) {
      if (byId.has(profile.id)) continue;
      const calibration =
        (await store.getCalibration(profile.id, cap)) ??
        defaultCalibration(profile.id, cap);
      byId.set(
        profile.id,
        toSolverProvider(
          profile,
          () => calibration,
          cap,
        ),
      );
    }
  }

  return [...byId.values()];
}
