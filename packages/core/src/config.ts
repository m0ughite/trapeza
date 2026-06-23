/**
 * Tunable knobs for the primitive. All have sane defaults so the core works
 * out of the box; the app/tests override what they need. Nothing chain-specific
 * lives here — these are pure economic/mechanism parameters.
 */

export interface TrapezaConfig {
  /**
   * Default for `route()`'s calibration flag when the caller doesn't pass one.
   * `true` = use the realized-outcome ledger (the moat). `false` = trust the
   * self-reported quote (the lemons-collapse demo path).
   */
  calibrationOnByDefault: boolean;

  /**
   * Mechanism shell thresholds (DESIGN.md §2, value-tiered selection).
   * Tasks at or below this USDC value clear via posted-price / FCFS because the
   * auction overhead would exceed the trade value.
   */
  postedPriceMaxUsdc: number;

  /**
   * Tasks with a latency budget at or below this many ms are treated as
   * time-critical and clear via a (shell) descending Dutch clock.
   */
  dutchDeadlineMs: number;

  /**
   * Global risk-aversion multiplier ρ applied on top of the task's own `risk`
   * preference weight when computing the router's risk premium.
   */
  riskAversion: number;
}

export const DEFAULT_CONFIG: TrapezaConfig = {
  calibrationOnByDefault: true,
  postedPriceMaxUsdc: 0.01,
  dutchDeadlineMs: 250,
  riskAversion: 1,
};

export function withDefaults(config?: Partial<TrapezaConfig>): TrapezaConfig {
  return { ...DEFAULT_CONFIG, ...config };
}
