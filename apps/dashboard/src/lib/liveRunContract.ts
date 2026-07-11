import type { DemoRun, GraphEdgeView, GraphView, LiveRunInput, LiveRunOptions, ProviderView } from "../types/contract";

export interface ValidationIssue {
  code:
    | "invalid-json"
    | "missing-field"
    | "invalid-type"
    | "out-of-range"
    | "unknown-reference"
    | "duplicate-id"
    | "empty-graph"
    | "empty-providers"
    | "no-provider-for-capability"
    | "cyclic-graph";
  path: string;
  message: string;
}

export interface ParseResult {
  payload: LiveRunInput | null;
  issues: ValidationIssue[];
}

const DECIMAL_RE = /^-?\d+(?:\.\d+)?$/;

export function defaultRunOptions(graph: GraphView): LiveRunOptions {
  return {
    budgetUsdc: graph.globalBudgetUsdc,
    deadlineMs: graph.globalDeadlineMs,
    riskAversion: graph.riskAversion,
    calibration: "on",
  };
}

export function payloadFromDemo(run: DemoRun): LiveRunInput {
  return {
    graph: cloneGraph(run.graph),
    providers: cloneProviders(run.providers),
    run: defaultRunOptions(run.graph),
  };
}

export function normalizeRunPayload(payload: LiveRunInput): {
  graph: GraphView;
  providers: ProviderView[];
  run: LiveRunOptions;
} {
  const run = payload.run;
  const graph = cloneGraph(payload.graph);
  graph.globalBudgetUsdc = run.budgetUsdc;
  graph.globalDeadlineMs = run.deadlineMs;
  graph.riskAversion = run.riskAversion;
  return { graph, providers: cloneProviders(payload.providers), run: { ...run } };
}

export function parseRunPayloadJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      payload: null,
      issues: [{
        code: "invalid-json",
        path: "$",
        message: e instanceof Error ? e.message : "Invalid JSON",
      }],
    };
  }
  const payload = parsed as LiveRunInput;
  const issues = validateRunPayload(payload);
  return { payload: issues.length === 0 ? payload : null, issues };
}

export function validateRunPayload(payload: LiveRunInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!payload || typeof payload !== "object") {
    return [{ code: "invalid-type", path: "$", message: "Payload must be an object." }];
  }

  const graph = payload.graph;
  const providers = payload.providers;
  const run = payload.run;

  if (!graph || typeof graph !== "object") {
    issues.push({ code: "missing-field", path: "$.graph", message: "Missing graph object." });
    return issues;
  }
  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    issues.push({ code: "empty-graph", path: "$.graph.nodes", message: "Graph must include at least one step." });
  }
  if (!Array.isArray(graph.edges)) {
    issues.push({ code: "invalid-type", path: "$.graph.edges", message: "graph.edges must be an array." });
  }

  if (!Array.isArray(providers)) {
    issues.push({ code: "invalid-type", path: "$.providers", message: "providers must be an array." });
    return issues;
  }
  if (providers.length === 0) {
    issues.push({ code: "empty-providers", path: "$.providers", message: "Pick at least one provider." });
  }
  if (!run || typeof run !== "object") {
    issues.push({ code: "missing-field", path: "$.run", message: "Missing run options." });
    return issues;
  }

  validateDecimal(run.budgetUsdc, "$.run.budgetUsdc", "Budget", issues, true);
  validatePositiveInt(run.deadlineMs, "$.run.deadlineMs", "Deadline", issues);
  validateNumberRange(run.riskAversion, "$.run.riskAversion", "Risk aversion", 0, 3, issues);
  if (run.calibration !== "on" && run.calibration !== "off") {
    issues.push({
      code: "invalid-type",
      path: "$.run.calibration",
      message: "Calibration must be \"on\" or \"off\".",
    });
  }

  validateDecimal(graph.globalBudgetUsdc, "$.graph.globalBudgetUsdc", "Graph budget", issues, true);
  validatePositiveInt(graph.globalDeadlineMs, "$.graph.globalDeadlineMs", "Graph deadline", issues);
  validateNumberRange(graph.riskAversion, "$.graph.riskAversion", "Graph risk aversion", 0, 3, issues);

  const nodeIds = new Set<string>();
  const capabilities = new Set<string>();
  for (let i = 0; i < (graph.nodes ?? []).length; i += 1) {
    const node = graph.nodes[i]!;
    const path = `$.graph.nodes[${i}]`;
    if (!node.nodeId || typeof node.nodeId !== "string") {
      issues.push({ code: "missing-field", path: `${path}.nodeId`, message: "Each step needs a nodeId." });
      continue;
    }
    if (nodeIds.has(node.nodeId)) {
      issues.push({
        code: "duplicate-id",
        path: `${path}.nodeId`,
        message: `Duplicate nodeId "${node.nodeId}".`,
      });
    }
    nodeIds.add(node.nodeId);
    if (!node.capability || typeof node.capability !== "string") {
      issues.push({
        code: "missing-field",
        path: `${path}.capability`,
        message: `Step "${node.nodeId}" needs a capability.`,
      });
    } else {
      capabilities.add(node.capability);
    }
    validateDecimal(node.valueUsdc, `${path}.valueUsdc`, `Step "${node.nodeId}" value`, issues, true);
    validateDecimal(node.budgetUsdc, `${path}.budgetUsdc`, `Step "${node.nodeId}" budget`, issues, true);
    validateNumberRange(node.bondRatio, `${path}.bondRatio`, `Step "${node.nodeId}" bondRatio`, 0, 5, issues);
    if (node.qualityFloor != null) {
      validateNumberRange(node.qualityFloor, `${path}.qualityFloor`, `Step "${node.nodeId}" qualityFloor`, 0, 1, issues);
    }
  }

  const seenEdges = new Set<string>();
  for (let i = 0; i < (graph.edges ?? []).length; i += 1) {
    const edge = graph.edges[i] as GraphEdgeView;
    const path = `$.graph.edges[${i}]`;
    if (!edge?.from || !edge?.to) {
      issues.push({ code: "missing-field", path, message: "Each edge needs from and to node ids." });
      continue;
    }
    if (!nodeIds.has(edge.from)) {
      issues.push({
        code: "unknown-reference",
        path: `${path}.from`,
        message: `Edge source "${edge.from}" is not a known step.`,
      });
    }
    if (!nodeIds.has(edge.to)) {
      issues.push({
        code: "unknown-reference",
        path: `${path}.to`,
        message: `Edge target "${edge.to}" is not a known step.`,
      });
    }
    const edgeKey = `${edge.from}->${edge.to}`;
    if (seenEdges.has(edgeKey)) {
      issues.push({ code: "duplicate-id", path, message: `Duplicate dependency "${edgeKey}".` });
    }
    seenEdges.add(edgeKey);
    if (edge.from === edge.to) {
      issues.push({
        code: "cyclic-graph",
        path,
        message: `Step "${edge.from}" cannot depend on itself.`,
      });
    }
  }

  const providerIds = new Set<string>();
  const capabilityToProviderCount = new Map<string, number>();
  for (let i = 0; i < providers.length; i += 1) {
    const provider = providers[i]!;
    const path = `$.providers[${i}]`;
    if (!provider.id || typeof provider.id !== "string") {
      issues.push({
        code: "missing-field",
        path: `${path}.id`,
        message: "Each provider needs an id.",
      });
      continue;
    }
    if (providerIds.has(provider.id)) {
      issues.push({
        code: "duplicate-id",
        path: `${path}.id`,
        message: `Duplicate provider id "${provider.id}".`,
      });
    }
    providerIds.add(provider.id);
    if (!Array.isArray(provider.capabilities) || provider.capabilities.length === 0) {
      issues.push({
        code: "missing-field",
        path: `${path}.capabilities`,
        message: `Provider "${provider.id}" needs at least one capability.`,
      });
    } else {
      for (const cap of provider.capabilities) {
        capabilityToProviderCount.set(cap, (capabilityToProviderCount.get(cap) ?? 0) + 1);
      }
    }
    validateDecimal(provider.priceUsdc, `${path}.priceUsdc`, `Provider "${provider.id}" price`, issues, true);
    validateDecimal(provider.bondOfferedUsdc, `${path}.bondOfferedUsdc`, `Provider "${provider.id}" bond`, issues, false);
    validateNumberRange(provider.claimedSuccessProb, `${path}.claimedSuccessProb`, `Provider "${provider.id}" claimed success`, 0, 1, issues);
    validateNumberRange(provider.calibratedSuccessProb, `${path}.calibratedSuccessProb`, `Provider "${provider.id}" calibrated success`, 0, 1, issues);
    validateNumberRange(provider.pSuccessStdDev, `${path}.pSuccessStdDev`, `Provider "${provider.id}" std-dev`, 0, 1, issues);
  }

  for (const cap of capabilities) {
    if ((capabilityToProviderCount.get(cap) ?? 0) === 0) {
      issues.push({
        code: "no-provider-for-capability",
        path: "$.providers",
        message: `No selected provider can execute capability "${cap}".`,
      });
    }
  }

  if (!hasCycle(graph.nodes.map((n) => n.nodeId), graph.edges ?? [])) {
    return dedupeIssues(issues);
  }
  issues.push({
    code: "cyclic-graph",
    path: "$.graph.edges",
    message: "Dependencies must form a DAG (no cycles).",
  });
  return dedupeIssues(issues);
}

export function canApplyDependencies(
  nodes: string[],
  edges: GraphEdgeView[],
  nodeId: string,
  dependencies: string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const normalized = dependencies.filter(Boolean);
  for (const dep of normalized) {
    if (!nodes.includes(dep)) {
      issues.push({
        code: "unknown-reference",
        path: "$.graph.edges",
        message: `Unknown dependency "${dep}" for "${nodeId}".`,
      });
    }
    if (dep === nodeId) {
      issues.push({
        code: "cyclic-graph",
        path: "$.graph.edges",
        message: `Step "${nodeId}" cannot depend on itself.`,
      });
    }
  }
  if (issues.length > 0) return issues;

  const untouched = edges.filter((e) => e.to !== nodeId);
  const candidate = [...untouched, ...normalized.map((from) => ({ from, to: nodeId }))];
  if (hasCycle(nodes, candidate)) {
    issues.push({
      code: "cyclic-graph",
      path: "$.graph.edges",
      message: `Dependencies for "${nodeId}" would create a cycle.`,
    });
  }
  return issues;
}

function hasCycle(nodes: string[], edges: GraphEdgeView[]): boolean {
  if (nodes.length === 0) return false;
  const indegree = new Map<string, number>(nodes.map((id) => [id, 0]));
  const succ = new Map<string, string[]>(nodes.map((id) => [id, []]));
  for (const edge of edges) {
    if (!indegree.has(edge.from) || !indegree.has(edge.to)) continue;
    succ.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = nodes.filter((id) => (indegree.get(id) ?? 0) === 0);
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    visited += 1;
    for (const next of succ.get(id) ?? []) {
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if ((indegree.get(next) ?? 0) === 0) queue.push(next);
    }
  }
  return visited !== nodes.length;
}

function validateDecimal(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
  positiveOnly: boolean,
): void {
  if (typeof value !== "string" || !DECIMAL_RE.test(value)) {
    issues.push({ code: "invalid-type", path, message: `${label} must be a decimal string.` });
    return;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    issues.push({ code: "invalid-type", path, message: `${label} must be finite.` });
    return;
  }
  if (positiveOnly ? num <= 0 : num < 0) {
    issues.push({ code: "out-of-range", path, message: `${label} must be ${positiveOnly ? "greater than 0" : "at least 0"}.` });
  }
}

function validatePositiveInt(value: unknown, path: string, label: string, issues: ValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    issues.push({ code: "invalid-type", path, message: `${label} must be an integer.` });
    return;
  }
  if (value <= 0) {
    issues.push({ code: "out-of-range", path, message: `${label} must be greater than 0.` });
  }
}

function validateNumberRange(
  value: unknown,
  path: string,
  label: string,
  min: number,
  max: number,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ code: "invalid-type", path, message: `${label} must be a number.` });
    return;
  }
  if (value < min || value > max) {
    issues.push({ code: "out-of-range", path, message: `${label} must be between ${min} and ${max}.` });
  }
}

function cloneGraph(graph: GraphView): GraphView {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({ ...node })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

function cloneProviders(providers: ProviderView[]): ProviderView[] {
  return providers.map((provider) => ({ ...provider, capabilities: [...provider.capabilities] }));
}

function dedupeIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  const out: ValidationIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.code}:${issue.path}:${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}
