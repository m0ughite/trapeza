import type { GraphView } from "../types/contract";
import type { TaskGraph } from "../types/taskGraph";

export interface BuilderNode {
  nodeId: string;
  capability: string;
  valueUsdc: string;
  prompt: string;
}

export type WorkflowTemplate = "linear-3" | "fork-join" | "groq-live" | "custom";

export const WORKFLOW_TEMPLATES: Record<
  WorkflowTemplate,
  { label: string; nodes: BuilderNode[]; edges: Array<{ from: string; to: string }> }
> = {
  "groq-live": {
    label: "Groq live · 3 steps (real LLM)",
    nodes: [
      {
        nodeId: "s1",
        capability: "arctask.general.v1",
        valueUsdc: "0.50",
        prompt:
          "In one sentence, explain what an agent workflow marketplace does. End with JSON: {\"summary\":\"...\"}",
      },
      {
        nodeId: "s2",
        capability: "code.fix.v1",
        valueUsdc: "0.50",
        prompt:
          "Fix this Python bug and explain the fix in one sentence: def add(xs): return xs[0]. End with JSON: {\"summary\":\"...\"}",
      },
      {
        nodeId: "s3",
        capability: "extract.invoice.v1",
        valueUsdc: "0.50",
        prompt:
          'From this line extract vendor and total: "Acme Corp — Invoice #42 — Total: $128.50 USD". End with JSON: {"summary":"vendor and total in one sentence"}',
      },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3" },
    ],
  },
  "linear-3": {
    label: "Linear · 3 steps",
    nodes: [
      { nodeId: "s1", capability: "arctask.general.v1", valueUsdc: "0.50", prompt: "Summarize the workflow goal in one sentence." },
      { nodeId: "s2", capability: "code.fix.v1", valueUsdc: "0.50", prompt: "Fix: def add(xs): return xs[0]" },
      { nodeId: "s3", capability: "extract.invoice.v1", valueUsdc: "0.50", prompt: "Extract vendor and total from a sample invoice line." },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3" },
    ],
  },
  "fork-join": {
    label: "Fork · parallel then join",
    nodes: [
      { nodeId: "s1", capability: "arctask.general.v1", valueUsdc: "0.40", prompt: "Plan parallel workstreams." },
      { nodeId: "s2", capability: "code.fix.v1", valueUsdc: "0.45", prompt: "Fix a broken Python helper." },
      { nodeId: "s3", capability: "extract.invoice.v1", valueUsdc: "0.45", prompt: "Extract invoice fields." },
      { nodeId: "s4", capability: "arctask.general.v1", valueUsdc: "0.60", prompt: "Merge results into a final summary." },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s1", to: "s3" },
      { from: "s2", to: "s4" },
      { from: "s3", to: "s4" },
    ],
  },
  custom: {
    label: "Custom · build your own",
    nodes: [{ nodeId: "s1", capability: "arctask.general.v1", valueUsdc: "0.50", prompt: "Describe your task." }],
    edges: [],
  },
};

export function linearEdges(nodes: BuilderNode[]): Array<{ from: string; to: string }> {
  return nodes.slice(0, -1).map((n, i) => ({ from: n.nodeId, to: nodes[i + 1]!.nodeId }));
}

export function buildGraph(
  nodes: BuilderNode[],
  edges: Array<{ from: string; to: string }>,
  opts: { budgetUsdc: number; riskAversion: number },
): GraphView {
  return {
    id: "user-arctask-workflow",
    globalBudgetUsdc: opts.budgetUsdc.toFixed(2),
    globalDeadlineMs: 120_000,
    globalQualityFloor: null,
    riskAversion: opts.riskAversion,
    nodes: nodes.map((n) => ({
      nodeId: n.nodeId,
      capability: n.capability,
      valueUsdc: n.valueUsdc,
      budgetUsdc: n.valueUsdc,
      bondRatio: 0.05,
      qualityFloor: null,
      bottleneck: false,
    })),
    edges,
  };
}

export function nextNodeId(nodes: BuilderNode[]): string {
  let i = nodes.length + 1;
  while (nodes.some((n) => n.nodeId === `s${i}`)) i++;
  return `s${i}`;
}

const DEFAULT_ORACLE = {
  schema: {
    type: "object",
    required: ["summary"],
    properties: { summary: { type: "string", minLength: 8 } },
  },
  groundTruth: {},
};

/** Convert dashboard builder state → TaskGraph for the live DAG API. */
export function graphViewToTaskGraph(
  nodes: BuilderNode[],
  edges: Array<{ from: string; to: string }>,
  opts: { budgetUsdc: number; riskAversion: number; deadlineMs?: number },
): TaskGraph {
  const graph = buildGraph(nodes, edges, opts);
  return {
    id: graph.id,
    globalBudgetUsdc: graph.globalBudgetUsdc,
    globalDeadlineMs: opts.deadlineMs ?? 600_000,
    riskAversion: graph.riskAversion,
    edges: graph.edges,
    nodes: nodes.map((n) => ({
      nodeId: n.nodeId,
      task: {
        id: `task-${n.nodeId}`,
        capability: n.capability,
        input: { prompt: n.prompt },
        oracleSpec: DEFAULT_ORACLE,
        valueUsdc: n.valueUsdc,
        budgetUsdc: n.valueUsdc,
        preference: { price: 0.4, latency: 0.2, quality: 0.3, risk: 0.1 },
        deadlineMs: Math.min(opts.deadlineMs ?? 600_000, 300_000),
        bondRatio: 0.05,
      },
    })),
  };
}
