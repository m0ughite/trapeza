/** Presentation helpers — pure, no React. */

export function usd(v: string | number, dp = 4): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "$0";
  return `$${n.toFixed(dp)}`;
}

export function pct(p: number, dp = 1): string {
  return `${(p * 100).toFixed(dp)}%`;
}

/** Success probabilities so small they need more precision (lemons collapse). */
export function pctSmall(p: number): string {
  if (p === 0) return "0%";
  if (p < 0.001) return `${(p * 100).toExponential(1)}%`;
  return `${(p * 100).toFixed(p < 0.1 ? 2 : 1)}%`;
}

export function ms(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
  return `${v} ms`;
}

export function num(v: number, dp = 2): string {
  return v.toFixed(dp);
}

export function shortHash(h: string, head = 10, tail = 8): string {
  if (h.length <= head + tail + 1) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s-])\w/g, (m) => m.toUpperCase());
}

/**
 * Sanitize engine-authored prose (fixture narratives, solver descriptions) into
 * plain product language for the primary UI. The underlying data is untouched;
 * this only rewrites academic/paper jargon at display time. The full technical
 * vocabulary lives in the README / docs.
 */
const PLAIN_MAP: Array<[RegExp, string]> = [
  [/State[- ]Twins Monte[- ]Carlo/gi, "risk preflight"],
  [/State[- ]Twins/gi, "risk preflight"],
  [/Monte[- ]Carlo/gi, "simulation"],
  [/Shadow prices/g, "Constraint prices"],
  [/shadow prices/gi, "constraint prices"],
  [/CP-SAT clearing/gi, "whole-graph clearing"],
  [/CP-SAT/gi, "the graph solver"],
  [/Greedy \+ LNS \(per-node, Tier-2\)/gi, "greedy per-task router"],
  [/greedy\s*\+\s*LNS/gi, "greedy router"],
  [/\bLNS\b/g, ""],
  [/\bTier-?[12]\b/gi, ""],
  [/\bNO_PROVIDER\b/g, "no feasible provider"],
  [/topological order/gi, "workflow order"],
  [/bonded broker/gi, "per-task broker"],
  [/infeasible upper bound/gi, "an unreachable best case"],
  [/\bobjective\b/g, "plan score"],
];

export function plain(s: string): string {
  let out = s;
  for (const [re, to] of PLAIN_MAP) out = out.replace(re, to);
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,])/g, "$1").trim();
}
