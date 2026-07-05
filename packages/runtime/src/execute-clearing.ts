/**
 * Execute a cleared graph through the broker pipeline (the missing join).
 */

import type {
  Allocation,
  GraphClearing,
  Outcome,
  TaskGraph,
  TrapezaCore,
} from "@trapeza/core";
import type { EventKind } from "@trapeza/store-sqlite";

export interface EventSink {
  appendEvent(event: {
    ts: number;
    kind: EventKind;
    taskId?: string;
    providerId?: string;
    payload: unknown;
  }): Promise<void>;
}

export interface ExecutionNodeReport {
  nodeId: string;
  providerId: string;
  skipped: boolean;
  outcome?: Outcome;
  action?: "release" | "slash";
  txHash?: string;
}

export interface ExecutionReport {
  graphId: string;
  nodes: ExecutionNodeReport[];
}

export interface ExecuteClearingOptions {
  clock?: () => number;
  events?: EventSink;
}

interface ExecuteResultPayload {
  receipt: { amountUsdc: string; txHash: string; result?: unknown };
  provider: string;
  capability: string;
}

function buildParentMap(graph: TaskGraph): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const node of graph.nodes) {
    parents.set(node.nodeId, []);
  }
  for (const edge of graph.edges) {
    parents.get(edge.to)?.push(edge.from);
  }
  return parents;
}

function allocationFor(
  clearing: GraphClearing,
  nodeId: string,
): Allocation | undefined {
  const node = clearing.allocations.find((a) => {
    const taskId = a.taskId;
    return taskId.endsWith(nodeId) || taskId.includes(nodeId);
  });
  if (node) return node;
  return clearing.allocations.find((_, i) => {
    const scheduleEntry = clearing.schedule[i];
    return scheduleEntry?.nodeId === nodeId;
  });
}

export async function executeClearing(
  core: TrapezaCore,
  graph: TaskGraph,
  clearing: GraphClearing,
  options: ExecuteClearingOptions = {},
): Promise<ExecutionReport> {
  const clock = options.clock ?? (() => Date.now());
  const events = options.events;
  const parents = buildParentMap(graph);
  const failedNodes = new Set<string>();
  const reports: ExecutionNodeReport[] = [];

  const scheduleOrder = [...clearing.schedule].sort(
    (a, b) => a.startMs - b.startMs,
  );

  if (events) {
    await events.appendEvent({
      ts: clock(),
      kind: "clearing",
      taskId: graph.id,
      payload: {
        solver: clearing.meta.solver,
        objectiveValue: clearing.meta.objectiveValue,
        degraded: clearing.meta.degraded ?? false,
        shadowPricesUsdc: clearing.shadowPricesUsdc,
        settlementPricesUsdc: clearing.settlementPricesUsdc,
      },
    });
  }

  for (const entry of scheduleOrder) {
    const node = graph.nodes.find((n) => n.nodeId === entry.nodeId);
    if (!node) continue;

    const alloc =
      clearing.allocations.find((a) => a.taskId === node.task.id) ??
      allocationFor(clearing, entry.nodeId);

    if (!alloc) {
      reports.push({
        nodeId: entry.nodeId,
        providerId: "unknown",
        skipped: true,
      });
      continue;
    }

    const allocation: Allocation = {
      ...alloc,
      taskId: node.task.id,
    };

    const upstreamFailed = (parents.get(entry.nodeId) ?? []).some((p) =>
      failedNodes.has(p),
    );

    if (upstreamFailed) {
      failedNodes.add(entry.nodeId);
      const skippedOutcome: Outcome = {
        taskId: node.task.id,
        providerId: alloc.providerId,
        passed: false,
        score: 0,
        evidenceURI: "executor://upstream-failure",
        realizedCostUsdc: "0",
        realizedLatencyMs: 0,
      };
      reports.push({
        nodeId: entry.nodeId,
        providerId: alloc.providerId,
        skipped: true,
        outcome: skippedOutcome,
      });
      if (events) {
        await events.appendEvent({
          ts: clock(),
          kind: "skip",
          taskId: node.task.id,
          providerId: alloc.providerId,
          payload: { reason: "upstream_failure" },
        });
      }
      continue;
    }

    await core.submitTask(node.task);
    await core.postBond(allocation);

    if (events) {
      await events.appendEvent({
        ts: clock(),
        kind: "bond",
        taskId: node.task.id,
        providerId: allocation.providerId,
        payload: { mechanism: allocation.mechanism },
      });
    }

    const started = clock();
    const execResult = (await core.execute(allocation)) as ExecuteResultPayload;
    const deliverable = execResult.receipt.result ?? execResult;
    const verdict = await core.oracleVerify(node.task, deliverable);

    const outcome: Outcome = {
      ...verdict,
      providerId: allocation.providerId,
      realizedCostUsdc: execResult.receipt.amountUsdc,
      realizedLatencyMs: clock() - started,
    };

    const { action, txHash } = await core.settle(node.task.id, outcome);
    await core.recordOutcome(outcome);

    if (!outcome.passed) {
      failedNodes.add(entry.nodeId);
    }

    if (events) {
      await events.appendEvent({
        ts: clock(),
        kind: action === "slash" ? "slash" : "settle",
        taskId: node.task.id,
        providerId: allocation.providerId,
        payload: { action, txHash, passed: outcome.passed },
      });
      await events.appendEvent({
        ts: clock(),
        kind: "outcome",
        taskId: node.task.id,
        providerId: allocation.providerId,
        payload: outcome,
      });
    }

    reports.push({
      nodeId: entry.nodeId,
      providerId: allocation.providerId,
      skipped: false,
      outcome,
      action,
      txHash,
    });
  }

  return { graphId: graph.id, nodes: reports };
}
