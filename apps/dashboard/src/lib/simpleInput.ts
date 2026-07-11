/**
 * Simple-mode input — the beginner-friendly "bring your own workflow" format.
 *
 * A non-expert (or a hackathon judge) describes a workflow as a short list of
 * steps in plain terms: a label, a capability chosen from the documented
 * catalog, and optional dependencies. `expandSimpleInput()` DETERMINISTICALLY
 * transforms that into the full `LiveRunInput` contract — pulling provider
 * candidates, prices, bonds and calibration rows from the capability catalog,
 * assigning sensible default values/deadlines, and mapping a risk level to the
 * engine's `riskAversion` lever.
 *
 * The full advanced contract is untouched; this is layered on top of it.
 */

import type { GraphEdgeView, GraphNodeView, LiveRunInput, ProviderView } from "../types/contract";
import { capabilityIds, catalogIndex, type CapabilityCatalog } from "./capabilityCatalog";
import { validateRunPayload } from "./liveRunContract";

// ─────────────────────────────────────────────────────────────────────────────
// Public schema
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

export interface SimpleStepInput {
  /** Stable step id (e.g. "parse"). Optional — auto-generated when omitted. */
  id?: string;
  /** Human label; used as the id when `id` is absent. */
  label?: string;
  /** Capability id from the catalog, e.g. "doc.parse". Required. */
  capability: string;
  /** Steps this one waits on — by step id OR by 0-based index. Optional. */
  dependsOn?: Array<string | number>;
}

export interface SimpleRunInput {
  /** Friendly workflow name → becomes the graph id. Optional. */
  name?: string;
  /** Shared spend cap for the whole workflow. Optional — auto-sized if omitted. */
  budgetUsdc?: string | number;
  /** Deadline in ms. Optional — defaults to a comfortable value. */
  deadlineMs?: number;
  /** low | medium | high → mapped to riskAversion. Optional (medium). */
  risk?: RiskLevel;
  /** Route on realized outcomes ("on") or self-reported bids ("off"). Optional (on). */
  calibration?: "on" | "off";
  /** The ordered list of workflow steps. Required, non-empty. */
  steps: SimpleStepInput[];
}

export type SimpleIssueCode =
  | "invalid-json"
  | "invalid-input"
  | "empty-steps"
  | "invalid-step"
  | "duplicate-step-id"
  | "unknown-capability"
  | "unknown-dependency"
  | "self-dependency"
  | "cyclic-dependency"
  | "invalid-risk"
  | "invalid-calibration"
  | "invalid-budget"
  | "invalid-deadline"
  | "budget-too-low"
  | "contract-error";

export interface SimpleIssue {
  code: SimpleIssueCode;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface SimpleExpandResult {
  /** The full contract payload, or null when there are error-severity issues. */
  payload: LiveRunInput | null;
  issues: SimpleIssue[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Defaults (the abstraction knobs — documented in public/input-contract.md, served at /input-contract.md)
// ─────────────────────────────────────────────────────────────────────────────

export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

/** Risk level → the engine's riskAversion (0..3). */
export const RISK_AVERSION: Record<RiskLevel, number> = {
  low: 0.5,
  medium: 1.0,
  high: 2.0,
};

const DEFAULT_RISK: RiskLevel = "medium";
const DEFAULT_CALIBRATION: "on" | "off" = "on";
const DEFAULT_DEADLINE_MS = 800;
/** Low bond keeps budget pressure realistic (matches the reference fixtures). */
const DEFAULT_BOND_RATIO = 0.1;
/** A step is worth this multiple of its priciest candidate's ask, by default. */
const VALUE_MULTIPLIER = 2;
const MIN_NODE_VALUE = 0.25;
/** Headroom applied to the auto-sized budget so a default workflow clears. */
const BUDGET_HEADROOM = 1.35;

export function riskToAversion(risk: RiskLevel): number {
  return RISK_AVERSION[risk];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────────────────────

interface ResolvedStep {
  id: string;
  capability: string;
  deps: string[];
  /** Priciest candidate ask for this capability (drives value + budget sizing). */
  maxAsk: number;
  minCost: number;
  value: number;
}

function slugify(raw: string, fallback: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : fallback;
}

function round2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Transform a simple workflow description into the full `LiveRunInput` contract.
 * Pure and deterministic given the same `catalog`.
 */
export function expandSimpleInput(input: SimpleRunInput, catalog: CapabilityCatalog): SimpleExpandResult {
  const issues: SimpleIssue[] = [];
  const fail = (): SimpleExpandResult => ({ payload: null, issues });

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    issues.push({ code: "invalid-input", path: "$", severity: "error", message: "Input must be a JSON object." });
    return fail();
  }
  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    issues.push({ code: "empty-steps", path: "$.steps", severity: "error", message: "Add at least one step under \"steps\"." });
    return fail();
  }

  const index = catalogIndex(catalog);
  const validCaps = capabilityIds(catalog);

  // Pass 1: resolve ids + capabilities.
  const ids: string[] = [];
  const idToPos = new Map<string, number>();
  const resolved: ResolvedStep[] = [];
  const usedIds = new Set<string>();

  input.steps.forEach((step, i) => {
    const path = `$.steps[${i}]`;
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      issues.push({ code: "invalid-step", path, severity: "error", message: `Step ${i + 1} must be an object.` });
      ids.push(`step-${i + 1}`);
      return;
    }

    const rawId = (step.id ?? step.label ?? `step-${i + 1}`).toString();
    let id = slugify(rawId, `step-${i + 1}`);
    if (usedIds.has(id)) {
      issues.push({
        code: "duplicate-step-id",
        path: `${path}.id`,
        severity: "error",
        message: `Duplicate step id "${id}". Give each step a unique id or label.`,
      });
      // keep a distinct id so later index/id references stay resolvable.
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    usedIds.add(id);
    ids.push(id);
    idToPos.set(id, i);

    const capability = typeof step.capability === "string" ? step.capability : "";
    const entry = index.get(capability);
    if (!entry) {
      issues.push({
        code: "unknown-capability",
        path: `${path}.capability`,
        severity: "error",
        message: `Unknown capability "${capability || "(missing)"}". Valid capabilities: ${validCaps.join(", ")}.`,
      });
      return;
    }

    const asks = entry.providers.map((p) => Number(p.priceUsdc)).filter((n) => Number.isFinite(n));
    const maxAsk = asks.length > 0 ? Math.max(...asks) : MIN_NODE_VALUE;
    const minCost = asks.length > 0 ? Math.min(...asks) : MIN_NODE_VALUE;
    const value = Math.max(MIN_NODE_VALUE, Math.round(maxAsk * VALUE_MULTIPLIER * 100) / 100);
    resolved.push({ id, capability, deps: [], maxAsk, minCost, value });
  });

  // Pass 2: resolve dependencies (by id or index), detect self/unknown deps.
  input.steps.forEach((step, i) => {
    if (!step || typeof step !== "object") return;
    const r = resolved.find((x) => x.id === ids[i]);
    if (!r) return;
    const raw = step.dependsOn;
    if (raw == null) return;
    if (!Array.isArray(raw)) {
      issues.push({
        code: "invalid-step",
        path: `$.steps[${i}].dependsOn`,
        severity: "error",
        message: `Step "${ids[i]}" dependsOn must be an array of step ids or indexes.`,
      });
      return;
    }
    for (const dep of raw) {
      let depId: string | null = null;
      if (typeof dep === "number") {
        if (!Number.isInteger(dep) || dep < 0 || dep >= input.steps.length) {
          issues.push({
            code: "unknown-dependency",
            path: `$.steps[${i}].dependsOn`,
            severity: "error",
            message: `Step "${ids[i]}" depends on step index ${dep}, which does not exist (0..${input.steps.length - 1}).`,
          });
          continue;
        }
        depId = ids[dep]!;
      } else if (typeof dep === "string") {
        const slug = slugify(dep, dep);
        depId = usedIds.has(slug) ? slug : usedIds.has(dep) ? dep : null;
        if (!depId) {
          issues.push({
            code: "unknown-dependency",
            path: `$.steps[${i}].dependsOn`,
            severity: "error",
            message: `Step "${ids[i]}" depends on "${dep}", which is not a known step id.`,
          });
          continue;
        }
      } else {
        issues.push({
          code: "unknown-dependency",
          path: `$.steps[${i}].dependsOn`,
          severity: "error",
          message: `Step "${ids[i]}" has an invalid dependency (must be a step id or index).`,
        });
        continue;
      }
      if (depId === r.id) {
        issues.push({
          code: "self-dependency",
          path: `$.steps[${i}].dependsOn`,
          severity: "error",
          message: `Step "${r.id}" cannot depend on itself.`,
        });
        continue;
      }
      if (!r.deps.includes(depId)) r.deps.push(depId);
    }
  });

  // Risk / calibration / deadline levers.
  let risk: RiskLevel = DEFAULT_RISK;
  if (input.risk != null) {
    if (RISK_LEVELS.includes(input.risk)) {
      risk = input.risk;
    } else {
      issues.push({
        code: "invalid-risk",
        path: "$.risk",
        severity: "error",
        message: `Unknown risk level "${String(input.risk)}". Use one of: ${RISK_LEVELS.join(", ")}.`,
      });
    }
  }

  let calibration: "on" | "off" = DEFAULT_CALIBRATION;
  if (input.calibration != null) {
    if (input.calibration === "on" || input.calibration === "off") {
      calibration = input.calibration;
    } else {
      issues.push({
        code: "invalid-calibration",
        path: "$.calibration",
        severity: "error",
        message: `calibration must be "on" or "off".`,
      });
    }
  }

  let deadlineMs = DEFAULT_DEADLINE_MS;
  if (input.deadlineMs != null) {
    if (typeof input.deadlineMs === "number" && Number.isInteger(input.deadlineMs) && input.deadlineMs > 0) {
      deadlineMs = input.deadlineMs;
    } else {
      issues.push({
        code: "invalid-deadline",
        path: "$.deadlineMs",
        severity: "error",
        message: "deadlineMs must be a positive integer (milliseconds).",
      });
    }
  }

  // Budget: use supplied, else auto-size. Warn on under-budget.
  const recommended = recommendedBudget(resolved);
  const minFeasible = minFeasibleBudget(resolved);
  let budgetUsdc: string;
  if (input.budgetUsdc != null) {
    const n = typeof input.budgetUsdc === "number" ? input.budgetUsdc : Number(input.budgetUsdc);
    if (!Number.isFinite(n) || n <= 0) {
      issues.push({
        code: "invalid-budget",
        path: "$.budgetUsdc",
        severity: "error",
        message: "budgetUsdc must be a positive number or decimal string.",
      });
      budgetUsdc = round2(recommended);
    } else {
      budgetUsdc = round2(n);
      if (n < minFeasible) {
        issues.push({
          code: "budget-too-low",
          path: "$.budgetUsdc",
          severity: "warning",
          message: `Budget $${round2(n)} is below the ~$${round2(minFeasible)} needed to hire the cheapest provider for every step; the run may report no feasible plan. Suggested budget: $${round2(recommended)}.`,
        });
      }
    }
  } else {
    budgetUsdc = round2(recommended);
  }

  // Bail before building the payload if any hard errors were found.
  if (issues.some((it) => it.severity === "error")) return fail();

  const nodes: GraphNodeView[] = resolved.map((r) => ({
    nodeId: r.id,
    capability: r.capability,
    valueUsdc: round2(r.value),
    budgetUsdc: round2(r.value),
    bondRatio: DEFAULT_BOND_RATIO,
    qualityFloor: null,
    bottleneck: false,
  }));

  const edges: GraphEdgeView[] = [];
  for (const r of resolved) {
    for (const dep of r.deps) edges.push({ from: dep, to: r.id });
  }

  // Providers: union of catalog providers for every used capability, deduped.
  const usedCaps = new Set(resolved.map((r) => r.capability));
  const providerById = new Map<string, ProviderView>();
  for (const cap of usedCaps) {
    for (const p of index.get(cap)?.providers ?? []) {
      if (!providerById.has(p.id)) providerById.set(p.id, { ...p, capabilities: [...p.capabilities] });
    }
  }
  const providers = [...providerById.values()].sort((a, b) => a.id.localeCompare(b.id));

  const riskAversion = riskToAversion(risk);
  const payload: LiveRunInput = {
    graph: {
      id: input.name ? slugify(input.name, "custom-workflow") : "custom-workflow",
      globalBudgetUsdc: budgetUsdc,
      globalDeadlineMs: deadlineMs,
      globalQualityFloor: null,
      riskAversion,
      nodes,
      edges,
    },
    providers,
    run: { budgetUsdc, deadlineMs, riskAversion, calibration },
  };

  // Final safety net: the produced payload MUST satisfy the full contract.
  // Translate any residual contract issues (e.g. an introduced cycle) so the
  // caller always sees simple-mode-shaped, human-readable errors.
  const contractIssues = validateRunPayload(payload);
  for (const ci of contractIssues) {
    if (ci.code === "cyclic-graph") {
      issues.push({
        code: "cyclic-dependency",
        path: "$.steps[].dependsOn",
        severity: "error",
        message: "Your dependencies form a cycle. Steps must flow one way (a DAG) — remove the back-reference.",
      });
    } else {
      issues.push({ code: "contract-error", path: ci.path, severity: "error", message: ci.message });
    }
  }

  if (issues.some((it) => it.severity === "error")) return fail();
  return { payload, issues };
}

/** Budget that comfortably clears the default plan (priciest candidate + bond, + headroom). */
function recommendedBudget(steps: ResolvedStep[]): number {
  const raw = steps.reduce((sum, s) => sum + s.maxAsk + s.value * DEFAULT_BOND_RATIO, 0);
  return Math.max(MIN_NODE_VALUE, raw * BUDGET_HEADROOM);
}

/** Minimum budget to hire the cheapest provider for every step (cost + bond). */
function minFeasibleBudget(steps: ResolvedStep[]): number {
  return steps.reduce((sum, s) => sum + s.minCost + s.value * DEFAULT_BOND_RATIO, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON entry point + prefill helper
// ─────────────────────────────────────────────────────────────────────────────

export function parseSimpleInputJson(raw: string, catalog: CapabilityCatalog): SimpleExpandResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      payload: null,
      issues: [{ code: "invalid-json", path: "$", severity: "error", message: e instanceof Error ? e.message : "Invalid JSON" }],
    };
  }
  return expandSimpleInput(parsed as SimpleRunInput, catalog);
}

/** Curated 3-step chain used for the prefilled, one-click example when present. */
const PREFERRED_DEFAULT_CHAIN = ["doc.parse", "data.extract", "data.reconcile"];

/**
 * A friendly, valid example the UI prefills so a single click runs. Deterministic:
 * prefers a documented chain if the catalog has it, else the first few capabilities.
 * The returned budget is explicit and sufficient to clear.
 */
export function buildDefaultSimpleInput(catalog: CapabilityCatalog): SimpleRunInput {
  const available = new Set(capabilityIds(catalog));
  const chosen = PREFERRED_DEFAULT_CHAIN.filter((c) => available.has(c));
  const caps = chosen.length >= 2 ? chosen : capabilityIds(catalog).slice(0, Math.min(3, catalog.length));

  const usedIds = new Set<string>();
  const steps: SimpleStepInput[] = [];
  caps.forEach((capability, i) => {
    const base = slugify(capability.split(".").pop() ?? capability, `step-${i + 1}`);
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    const step: SimpleStepInput = { id, capability };
    if (i > 0) step.dependsOn = [steps[i - 1]!.id!];
    steps.push(step);
  });

  const draft: SimpleRunInput = {
    name: "my-workflow",
    risk: "medium",
    calibration: "on",
    deadlineMs: DEFAULT_DEADLINE_MS,
    steps,
  };
  // Ask the transform for the auto-sized budget so the example always clears.
  const { payload } = expandSimpleInput(draft, catalog);
  draft.budgetUsdc = payload ? payload.run.budgetUsdc : "2.50";
  return draft;
}
