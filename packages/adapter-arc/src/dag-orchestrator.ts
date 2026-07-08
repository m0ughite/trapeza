/**
 * ArcTask DAG orchestrator — clear graph, fund escrow per node, wait for worker,
 * verify deliverable, settle on-chain.
 */

import {
  defaultCalibration,
  parseUsdcToMicro,
  updateCalibration,
  type GraphClearing,
  type TaskGraph,
} from "@trapeza/core";
import {
  assertPreflight,
  createClearinghouse,
  defaultSettlementState,
  fixtureSettlementState,
} from "@trapeza/clearinghouse";
import { SchemaOracle } from "@trapeza/oracle";
import { agentsToSolverProviders } from "./agent-market.js";
import { ArcTaskChainAdapter } from "./arctask-chain.js";
import {
  ArcTaskClient,
  encodeJobPayloadUri,
  makeWallet,
  parseUsdcToWei,
  SimulatedArcTaskClient,
  type ArcTaskClient as ArcTaskClientType,
} from "./arctask.js";
import { ArcTaskJobStatus } from "./arctask-abis.js";
import { readArctaskSimulated, readArctaskUsdcMode } from "./constants.js";
import { MarketplaceProviderSync } from "./provider-sync.js";
import { ArcTaskSettlementProvider } from "./settlement.js";

export type DagProgressPhase =
  | "validate"
  | "sync-agents"
  | "clear"
  | "preflight"
  | "fund"
  | "wait-worker"
  | "verify"
  | "settle"
  | "done"
  | "error";

export interface DagProgressEvent {
  phase: DagProgressPhase;
  nodeId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ArcTaskNodeResult {
  nodeId: string;
  taskId: string;
  providerId: string;
  agentId: string;
  jobId: string;
  fundTx: string;
  submitTx: string | null;
  settleTx: string;
  settleAction: "release" | "slash";
  passed: boolean;
  deliverablePreview: string;
  priceUsdc: string;
}

export interface ArcTaskDagRunResult {
  mode: "simulated" | "live";
  graphId: string;
  clearing: GraphClearing;
  nodes: ArcTaskNodeResult[];
  honestyNote: string;
}

export interface RunArcTaskDagConfig {
  graph: TaskGraph;
  simulated?: boolean;
  clientPrivateKey?: `0x${string}`;
  evaluatorPrivateKey?: `0x${string}`;
  seed?: number;
  useCalibration?: boolean;
  workerTimeoutMs?: number;
  onProgress?: (event: DagProgressEvent) => void;
  /** Simulated-only: auto-submit deliverables (no worker). Default true in simulated mode. */
  autoSubmitSimulated?: boolean;
}

function emit(
  onProgress: RunArcTaskDagConfig["onProgress"],
  event: DagProgressEvent,
): void {
  onProgress?.(event);
}

function taskIdForNode(graphId: string, nodeId: string): string {
  return `${graphId}:${nodeId}`;
}

function arctaskJobTaskId(jobId: bigint): string {
  return `arctask:job:${jobId.toString()}`;
}

function scheduleOrder(clearing: GraphClearing): string[] {
  return [...clearing.schedule]
    .sort((a, b) => a.startMs - b.startMs || a.nodeId.localeCompare(b.nodeId))
    .map((s) => s.nodeId);
}

function simulatedDeliverable(prompt: string): { summary: string; prompt: string } {
  return {
    summary: `Completed: ${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}`,
    prompt,
  };
}

export async function runArcTaskDag(cfg: RunArcTaskDagConfig): Promise<ArcTaskDagRunResult> {
  const simulated = cfg.simulated ?? readArctaskSimulated();
  const onProgress = cfg.onProgress;
  const graph = cfg.graph;
  const autoSubmit = cfg.autoSubmitSimulated ?? simulated;

  const clientKey =
    cfg.clientPrivateKey ?? (`0x${"11".repeat(32)}` as `0x${string}`);
  const evaluatorKey =
    cfg.evaluatorPrivateKey ?? (`0x${"33".repeat(32)}` as `0x${string}`);

  const arctaskClient: ArcTaskClientType = simulated
    ? new SimulatedArcTaskClient()
    : new ArcTaskClient();

  const chain = new ArcTaskChainAdapter({
    clientPrivateKey: clientKey,
    evaluatorPrivateKey: evaluatorKey,
    simulated,
    arctaskClient,
  });

  const clientWallet = makeWallet(clientKey);
  const ownerWallet = makeWallet((`0x${"22".repeat(32)}`) as `0x${string}`);
  const settler = new ArcTaskSettlementProvider({
    evaluatorPrivateKey: evaluatorKey,
    simulated,
    arctaskClient,
  });

  const oracle = new SchemaOracle();
  const nodeResults: ArcTaskNodeResult[] = [];
  const calibrationByProvider = new Map<string, ReturnType<typeof defaultCalibration>>();

  emit(onProgress, { phase: "validate", message: `Validating DAG ${graph.id}` });

  if (simulated && arctaskClient instanceof SimulatedArcTaskClient) {
    const caps = [...new Set(graph.nodes.map((n) => n.task.capability))];
    for (const cap of caps) {
      await arctaskClient.registerAgent(
        ownerWallet.account,
        undefined,
        encodeJobPayloadUri({ name: `sim-${cap}`, capabilities: [cap] }),
      );
    }
  }

  emit(onProgress, { phase: "sync-agents", message: "Syncing ArcTask registry agents" });
  const sync = new MarketplaceProviderSync(arctaskClient);
  let { providers, market } = await agentsToSolverProviders(sync, {
    calibrationByProvider,
  });

  if (providers.length === 0) {
    throw new Error("no active agents in ArcTask registry — register agents first");
  }

  emit(onProgress, { phase: "clear", message: "Running graph clearing" });
  const clearinghouse = createClearinghouse({
    providers,
    seed: cfg.seed ?? 42,
    useCalibration: cfg.useCalibration ?? true,
    preferCpSat: false,
    onStep: (step) => {
      if (step.nodeId) {
        emit(onProgress, {
          phase: "clear",
          nodeId: step.nodeId,
          message: step.message,
          data: step.data,
        });
      }
    },
  });

  const clearing = await clearinghouse.submitGraph(graph);

  const solverInput = {
    graph,
    providers,
    riskAversion: graph.riskAversion ?? 1,
    seed: cfg.seed ?? 42,
    useCalibration: cfg.useCalibration ?? true,
  };

  const assignments = clearing.allocations.map((a) => {
    const node = graph.nodes.find((n) => n.task.id === a.taskId)!;
    return {
      nodeId: node.nodeId,
      providerId: a.providerId,
      score: a.score,
    };
  });

  emit(onProgress, { phase: "preflight", message: "Preflight settlement snapshot" });
  const snapshot = simulated
    ? fixtureSettlementState({
        requesterBalanceMicro: parseUsdcToMicro(graph.globalBudgetUsdc) * 2n,
        providerBondMicro: Object.fromEntries(
          providers.map((p) => [p.id, parseUsdcToMicro("10")]),
        ),
      })
    : defaultSettlementState(solverInput, assignments);
  assertPreflight(snapshot, solverInput, assignments);

  const allocByNode = new Map(
    clearing.allocations.map((a) => {
      const node = graph.nodes.find((n) => n.task.id === a.taskId)!;
      return [node.nodeId, a] as const;
    }),
  );
  const priceByNode = clearing.settlementPricesUsdc;

  for (const nodeId of scheduleOrder(clearing)) {
    const node = graph.nodes.find((n) => n.nodeId === nodeId)!;
    const alloc = allocByNode.get(nodeId)!;
    const priceUsdc = priceByNode[nodeId] ?? node.task.budgetUsdc;
    const taskId = taskIdForNode(graph.id, nodeId);
    const entry = market.get(alloc.providerId);
    if (!entry) {
      throw new Error(`no market entry for provider ${alloc.providerId}`);
    }

    const taskInput = node.task.input as Record<string, unknown>;
    const prompt =
      typeof taskInput.prompt === "string"
        ? taskInput.prompt
        : JSON.stringify(node.task.input);

    const jobURI = encodeJobPayloadUri({
      title: node.task.id,
      description: prompt,
      prompt,
      capability: node.task.capability,
      nodeId,
      graphId: graph.id,
    });

    const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.ceil(node.task.deadlineMs / 1000));
    const rewardWei = parseUsdcToWei(priceUsdc, readArctaskUsdcMode());

    chain.registerEscrowIntent(taskId, {
      agentId: entry.agentId,
      evaluator: chain.evaluatorAddress,
      jobURI,
      deadline,
      rewardAmountWei: rewardWei,
    });

    emit(onProgress, {
      phase: "fund",
      nodeId,
      message: `Funding escrow for ${nodeId} → agent ${entry.agentId}`,
    });

    const fundTx = await chain.openEscrow(taskId, entry.wallet, priceUsdc);
    const jobId = chain.intents.resolveTaskId(taskId);
    const arctaskTaskId = arctaskJobTaskId(jobId);

    let submitTx: string | null = null;

    if (simulated && autoSubmit && arctaskClient instanceof SimulatedArcTaskClient) {
      const deliverable = simulatedDeliverable(prompt);
      const hash = arctaskClient.hashDeliverable(JSON.stringify(deliverable));
      submitTx = await arctaskClient.submitDeliverable(
        ownerWallet.account,
        ownerWallet.wallet,
        jobId,
        hash,
        deliverable,
      );
    } else {
      emit(onProgress, {
        phase: "wait-worker",
        nodeId,
        message: `Waiting for ArcTask worker to submit deliverable (job ${jobId})`,
      });
      await arctaskClient.waitForJobStatus(
        jobId,
        ArcTaskJobStatus.Submitted,
        cfg.workerTimeoutMs ?? 300_000,
      );
    }

    emit(onProgress, { phase: "verify", nodeId, message: "Verifying deliverable" });

    let deliverable: unknown;
    if (simulated && arctaskClient instanceof SimulatedArcTaskClient) {
      deliverable = await arctaskClient.fetchDeliverable(jobId);
    } else {
      deliverable = await arctaskClient.fetchDeliverable(
        jobId,
        clientWallet.account,
        clientWallet.wallet,
      );
    }

    const execResult = { receipt: deliverable, provider: alloc.providerId, capability: node.task.capability };
    const outcome = await oracle.verify(node.task, deliverable);
    outcome.providerId = alloc.providerId;
    outcome.taskId = arctaskTaskId;
    void execResult;

    emit(onProgress, {
      phase: "settle",
      nodeId,
      message: outcome.passed ? "Accepting work" : "Rejecting work",
    });

    const settled = await settler.settleJob({
      taskId: arctaskTaskId,
      outcome: {
        ...outcome,
        taskId: arctaskTaskId,
        providerId: alloc.providerId,
        realizedCostUsdc: priceUsdc,
        realizedLatencyMs: 0,
      },
    });

    const cal = calibrationByProvider.get(alloc.providerId) ??
      defaultCalibration(alloc.providerId, node.task.capability);
    calibrationByProvider.set(
      alloc.providerId,
      updateCalibration(cal, outcome, cal.nObservations + 1),
    );

    providers = (
      await agentsToSolverProviders(sync, { calibrationByProvider })
    ).providers;
    market = (await agentsToSolverProviders(sync, { calibrationByProvider })).market;

    const preview =
      typeof deliverable === "string"
        ? deliverable.slice(0, 200)
        : JSON.stringify(deliverable).slice(0, 200);

    nodeResults.push({
      nodeId,
      taskId,
      providerId: alloc.providerId,
      agentId: entry.agentId.toString(),
      jobId: jobId.toString(),
      fundTx,
      submitTx,
      settleTx: settled.txHash,
      settleAction: settled.action,
      passed: outcome.passed,
      deliverablePreview: preview,
      priceUsdc,
    });
  }

  emit(onProgress, { phase: "done", message: `Completed ${nodeResults.length} node(s)` });

  return {
    mode: simulated ? "simulated" : "live",
    graphId: graph.id,
    clearing,
    nodes: nodeResults,
    honestyNote: simulated
      ? "Simulated run — deliverables auto-submitted; tx ids are not real arcscan links unless live keys were used."
      : "Live ArcTask run — fund and settle txs are on-chain; deliverables fetched via ArcTask API.",
  };
}
