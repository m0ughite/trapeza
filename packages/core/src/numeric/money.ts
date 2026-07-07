/**
 * Integer micro-USDC (1e-6 USDC) helpers.
 *
 * All engine budget/cost/bond math uses whole micro-USDC integers to avoid
 * float drift and preserve nanopayment precision.
 */

/** One USDC expressed in micro-USDC (6 decimal places). */
export const MICRO_USDC_PER_USDC = 1_000_000n;

const MICRO_USDC_PER_USDC_NUM = 1_000_000;

/** Parse a decimal USDC string to micro-USDC bigint. */
export function parseUsdcToMicro(usdc: string): bigint {
  const trimmed = usdc.trim();
  if (!trimmed) return 0n;

  const negative = trimmed.startsWith("-");
  const s = negative ? trimmed.slice(1) : trimmed;
  const parts = s.split(".");
  const wholePart = parts[0] ?? "";
  const fracPart = parts[1] ?? "";
  const whole = wholePart === "" ? 0n : BigInt(wholePart);
  const fracPadded = (fracPart + "000000").slice(0, 6);
  const frac = BigInt(fracPadded);
  const micro = whole * MICRO_USDC_PER_USDC + frac;
  return negative ? -micro : micro;
}

/** Format micro-USDC bigint to a fixed 6-decimal USDC string. */
export function formatMicroToUsdc(micro: bigint): string {
  const negative = micro < 0n;
  const abs = negative ? -micro : micro;
  const whole = abs / MICRO_USDC_PER_USDC;
  const frac = abs % MICRO_USDC_PER_USDC;
  const fracStr = frac.toString().padStart(6, "0");
  const body = `${whole}.${fracStr}`;
  return negative ? `-${body}` : body;
}

export function addMicro(a: bigint, b: bigint): bigint {
  return a + b;
}

export function subMicro(a: bigint, b: bigint): bigint {
  return a - b;
}

export function compareMicro(a: bigint, b: bigint): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Scale a probability in [0,1] to an integer score for MILP objectives. */
export function scaleProbability(p: number, scale = 1_000_000): number {
  if (!Number.isFinite(p)) return 0;
  const clamped = Math.min(1, Math.max(0, p));
  return Math.round(clamped * scale);
}

/** log(p) scaled to integer for chance constraints; p must be in (0,1]. */
export function scaleLogProbability(p: number, scale = 1_000_000): number {
  if (!Number.isFinite(p) || p <= 0) return -scale * 20;
  return Math.round(Math.log(p) * scale);
}

/** Convert a JS number USDC amount (from calibration ledger) to micro-USDC. */
export function numberUsdcToMicro(amount: number): bigint {
  if (!Number.isFinite(amount)) return 0n;
  return BigInt(Math.round(amount * MICRO_USDC_PER_USDC_NUM));
}
