import type { SettlementState } from "@trapeza/core";

/** Fixture snapshot for tests — no chain RPC required. */
export function fixtureSettlementState(
  overrides: Partial<SettlementState> = {},
): SettlementState {
  return {
    requesterBalanceMicro: 10_000_000n,
    providerBondMicro: {},
    escrowLockedMicro: {},
    nodeFeeMicro: {},
    ...overrides,
  };
}
