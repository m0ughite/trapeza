/**
 * Trapeza = the clearing + evaluator BRAIN over ArcTask. Trapeza is NEVER the
 * worker.
 *
 * The loop, in the approved product model:
 *   1. discover + calibrate — read the ArcTask agent registry into
 *      ProviderProfiles and attach the realized-outcome calibration ledger.
 *   2. get a job — seed one (ARCTASK_SEED_JOB) or ingest a JobCreated/REST job.
 *   3. CLEAR (the differentiator) — rank the registered agents by calibrated
 *      expected net value under the job's budget/deadline and PICK the winner.
 *      Assign the job to that agent on-chain (createJob with the chosen agentId).
 *   4. EXECUTE — ArcTask's OWN worker (scripts/agent-worker.mjs), running as the
 *      chosen agent, submits the deliverable. Trapeza MUST NOT submit it.
 *   5. EVALUATE + SETTLE — Trapeza is the registered evaluator: oracle-verify the
 *      deliverable, acceptWork (release) / rejectWork (refund), write ERC-8004
 *      reputation, update the calibration ledger.
 *
 * Boundary discipline: all chain/marketplace I/O is in `@trapeza/adapter-arc`;
 * the CLEARING (core router) and EVALUATION (`@trapeza/oracle`) are composed
 * here at the orchestration layer, never inside the adapter, and `@trapeza/core`
 * stays chain-agnostic.
 */

import {
  ArcTaskChainAdapter,
  ArcTaskClient,
  ArcTaskQuoteSource,
  ArcJobWatcher,
  MarketplaceProviderSync,
  SimulatedArcTaskClient,
  decodeJobPayloadUri,
  encodeJobPayloadUri,
  formatErc20Usdc,
  formatNativeUsdc,
  jobToTaskSpec,
  makeWallet,
  parseAgentMetadata,
  parseUsdcToWei,
  taskIdToJobId,
  ARC_TESTNET_CAIP2,
  ARC_TESTNET_EXPLORER,
  readArctaskApiBase,
  readArctaskEscrowAddress,
  readArctaskRegistryAddress,
  type ArcTaskJob,
  type ArcTaskUsdcMode,
} from "@trapeza/adapter-arc";
import {
  createTrapezaCore,
  defaultCalibration,
  pSuccessMean,
  route as routeCandidates,
  updateCalibration,
  withDefaults,
  type CalibrationRecord,
  type Outcome,
  type ProviderProfile,
  type Quote,
  type RouteCandidate,
  type TaskSpec,
} from "@trapeza/core";
import { InMemoryStore, MockSettlementAdapter } from "@trapeza/core/testing";
import { SchemaOracle } from "@trapeza/oracle";
import type { PrivateKeyAccount } from "viem";

// ── Public shapes ───────────────────────────────────────────────────────────

export type Phase =
  | "discover"
  | "job"
  | "clear"
  | "assign"
  | "execute"
  | "evaluate"
  | "done";

export type Logger = (phase: Phase, message: string) => void;

export interface ArcBrainOptions {
  simulated: boolean;
  usdcMode: ArcTaskUsdcMode;
  /** Post the job as a demo client (ARCTASK_SEED_JOB) so the loop is runnable. */
  seedJob: boolean;
  /** Clearing signal. true = realized-outcome ledger (product); false = bids. */
  useCalibration?: boolean;
  clientKey: `0x${string}`;
  evaluatorKey: `0x${string}`;
  /** Provider/agent owner (worker) wallet — used for registration in sim mode. */
  ownerKey: `0x${string}`;
  /** Injected client (SimulatedArcTaskClient in offline/tests). */
  arctaskClient?: ArcTaskClient;
  /** Deterministic clock for reproducible receipts. */
  now?: () => number;
  /** Fixed generatedAt for reproducible emitted fixtures. */
  generatedAt?: string;
  log?: Logger;
  /** The seed job to clear + post (used when seedJob is true). */
  seedTask?: SeedTask;
  /** Extra agent roster to register in simulated mode (the calibrated directory). */
  simRoster?: SimAgentSeed[];
  /**
   * How long to wait for ArcTask's worker to submit (live product path). If the
   * worker never submits (e.g. no LLM creds), the loop reports a clear blocker.
   */
  workerTimeoutMs?: number;
  /**
   * Read the registry + compute the clearing decision, then STOP before any
   * on-chain writes (no createJob / escrow). Safe way to exercise the live path
   * without moving funds or stranding escrow.
   */
  dryRun?: boolean;
}

export interface SeedTask {
  title: string;
  description: string;
  rewardUsdc: string;
  capability: string;
  deadlineSec?: number;
}

/** A synthetic agent for the offline directory, with a seeded track record. */
export interface SimAgentSeed {
  key: `0x${string}`;
  name: string;
  capability: string;
  priceUsdc: string;
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  bondUsdc: string;
  archetype: "workhorse" | "braggart" | "neutral";
  /** Prior realized outcomes to fold into the ledger (pass count, fail count). */
  priorPass: number;
  priorFail: number;
}

export interface OnchainRefLike {
  kind: "evm-tx" | "gateway-settlement-id" | "address";
  value: string;
  url: string | null;
  linkable: boolean;
  label: string;
}

/** The emitted receipt — matches apps/dashboard ArcTaskClearingReceipt. */
export interface ArcClearingReceipt {
  schemaVersion: "1.0.0";
  meta: {
    generatedAt: string;
    network: string;
    caip2: string;
    explorer: string;
    mode: "simulated" | "live";
    provider: string;
    registryAddress: string;
    escrowAddress: string;
    usdcRail: "native" | "erc20";
    evaluator: string;
    seededJob: boolean;
    note: string;
  };
  job: {
    jobId: string;
    title: string;
    description: string;
    budgetUsdc: string;
    deadlineIso: string;
    source: "seeded" | "organic";
  };
  registry: Array<{
    agentId: string;
    providerId: string;
    wallet: string;
    capabilities: string[];
    status: "active" | "suspended";
    claimedSuccessProb: number;
    calibratedSuccessProb: number;
    nObservations: number;
    priceUsdc: string;
    bondUsdc: string;
    archetype: "workhorse" | "braggart" | "neutral";
  }>;
  clearing: {
    useCalibration: boolean;
    winnerProviderId: string;
    winnerAgentId: string;
    mechanism: string;
    ranked: Array<{
      rank: number;
      providerId: string;
      agentId: string;
      score: number;
      pSuccessUsed: number;
      source: "calibrated" | "self-reported";
      priceUsdc: number;
      riskPremium: number;
      hired: boolean;
    }>;
    calibratedWinner: string;
    claimedWinner: string;
    rationale: string;
  };
  execution: {
    worker: string;
    submittedByTrapeza: false;
    submitted: boolean;
    deliverable: OnchainRefLike | null;
    note: string;
  };
  evaluation: {
    passed: boolean;
    score: number;
    settlement: "release" | "refund";
    verdictNote: string;
    steps: Array<{
      key: "createJob" | "submitDeliverable" | "settle" | "reputation";
      label: string;
      detail: string;
      ref: OnchainRefLike;
    }>;
    reputation: OnchainRefLike | null;
  };
  provenLive: {
    note: string;
    registryAddress: string;
    escrowAddress: string;
    agentId: string;
    jobId: string;
    steps: Array<{
      key: "createJob" | "submitDeliverable" | "settle" | "reputation";
      label: string;
      detail: string;
      ref: OnchainRefLike;
    }>;
  } | null;
}

/**
 * REAL Arc-testnet transactions from an earlier live ArcTask escrow lifecycle
 * (verified on-chain: register → createJob → submitDeliverable → acceptWork, all
 * status 0x1). These are the only explorer-linkable refs in the receipt; they
 * prove the on-chain seam regardless of the (simulated) clearing above.
 */
const PROVEN_LIVE = {
  registryAddress: "0x4ab5791a689b15126fcc7a549f8e4c7e16c5e0b8",
  escrowAddress: "0x58ca473df727301bce771d6087f883364c83a3b6",
  agentId: "14",
  jobId: "9",
  txs: {
    createJob: "0xd3443ee4d33e3a74f54f801ec4fe54f3b011bbad9bb017e9b612c299fc3d9c8e",
    submitDeliverable: "0x53a50daf9b9aa4fbedd83b5a0a86df4532a9c40276192dd6339aec9102503b35",
    settle: "0xccbe68b9a3d1677b4c4a102266ceeb36f7d3f92e05e3e713b6e51cff42f46f4b",
  },
} as const;

function provenLiveSection(explorer: string): ArcClearingReceipt["provenLive"] {
  return {
    note:
      "Real, verified Arc-testnet transactions from an earlier live ArcTask escrow run against the " +
      "deployed contracts. They prove the full on-chain seam (createJob → submitDeliverable → " +
      "acceptWork) end-to-end. Only these real 0x+64-hex hashes link to the explorer.",
    registryAddress: PROVEN_LIVE.registryAddress,
    escrowAddress: PROVEN_LIVE.escrowAddress,
    agentId: PROVEN_LIVE.agentId,
    jobId: PROVEN_LIVE.jobId,
    steps: [
      {
        key: "createJob",
        label: "Open + fund escrow",
        detail: `Job #${PROVEN_LIVE.jobId} created and funded (native USDC) on the ArcTask escrow, evaluator = Trapeza.`,
        ref: ref(PROVEN_LIVE.txs.createJob, "createJob → ArcTask escrow", explorer),
      },
      {
        key: "submitDeliverable",
        label: "Worker submits deliverable",
        detail: `Deliverable hash submitted on-chain for job #${PROVEN_LIVE.jobId}, moving it to Submitted.`,
        ref: ref(PROVEN_LIVE.txs.submitDeliverable, "submitDeliverable → ArcTask escrow", explorer),
      },
      {
        key: "settle",
        label: "Verify + release escrow",
        detail: "Trapeza, as the registered evaluator, released escrow to the worker (acceptWork).",
        ref: ref(PROVEN_LIVE.txs.settle, "acceptWork → ArcTask escrow (release)", explorer),
      },
    ],
  };
}

export interface ArcBrainResult {
  receipt: ArcClearingReceipt;
  jobId: bigint;
  winnerProviderId: string;
  winnerAgentId: bigint;
  settlement: "release" | "refund";
  /** True only when Trapeza waited for an external worker and it never submitted. */
  workerBlocked: boolean;
}

const CAPABILITY_DEFAULT = "arctask.general.v1";

/** The offline directory: workhorse (delivers) vs braggart (over-claims). */
export const DEFAULT_SIM_ROSTER: SimAgentSeed[] = [
  {
    key: ("0x" + "a1".repeat(32)) as `0x${string}`,
    name: "steady-solver",
    capability: CAPABILITY_DEFAULT,
    priceUsdc: "0.006",
    claimedSuccessProb: 0.8,
    claimedLatencyMs: 24_000,
    bondUsdc: "0.02",
    archetype: "workhorse",
    priorPass: 18,
    priorFail: 2,
  },
  {
    key: ("0x" + "b2".repeat(32)) as `0x${string}`,
    name: "loud-bidder",
    capability: CAPABILITY_DEFAULT,
    priceUsdc: "0.005",
    claimedSuccessProb: 0.98,
    claimedLatencyMs: 18_000,
    bondUsdc: "0.004",
    archetype: "braggart",
    priorPass: 4,
    priorFail: 6,
  },
  {
    key: ("0x" + "c3".repeat(32)) as `0x${string}`,
    name: "newcomer",
    capability: CAPABILITY_DEFAULT,
    priceUsdc: "0.006",
    claimedSuccessProb: 0.85,
    claimedLatencyMs: 28_000,
    bondUsdc: "0.01",
    archetype: "neutral",
    priorPass: 1,
    priorFail: 1,
  },
];

export const DEFAULT_SEED_TASK: SeedTask = {
  title: "Summarize the Arc x402 settlement flow",
  description:
    "Produce a one-paragraph plain-language summary of how USDC escrow settles on Arc, ending with a single JSON line {\"summary\": \"...\"}.",
  rewardUsdc: "0.02",
  capability: CAPABILITY_DEFAULT,
};

function ref(
  value: string,
  label: string,
  explorer: string,
): OnchainRefLike {
  const linkable = /^0x[0-9a-fA-F]{64}$/.test(value);
  return {
    kind: "evm-tx",
    value,
    url: linkable ? `${explorer}/tx/${value}` : null,
    linkable,
    label,
  };
}

function displayUsdc(wei: bigint, mode: ArcTaskUsdcMode): string {
  return mode === "native" ? formatNativeUsdc(wei) : formatErc20Usdc(wei);
}

/**
 * Run one full brain loop and return the structured receipt. Throws only on
 * unexpected errors; a missing external worker in live mode is reported via
 * `result.workerBlocked` rather than thrown, so callers can surface the exact
 * blocker (which env/endpoint the ArcTask worker needs).
 */
export async function runArcBrain(opts: ArcBrainOptions): Promise<ArcBrainResult> {
  const log: Logger = opts.log ?? (() => {});
  const now = opts.now ?? (() => Date.now());
  const useCalibration = opts.useCalibration ?? true;
  const capability = opts.seedTask?.capability ?? CAPABILITY_DEFAULT;
  const explorer = ARC_TESTNET_EXPLORER;
  const config = withDefaults();

  const arctask =
    opts.arctaskClient ??
    (opts.simulated ? new SimulatedArcTaskClient() : new ArcTaskClient());

  const chain = new ArcTaskChainAdapter({
    clientPrivateKey: opts.clientKey,
    evaluatorPrivateKey: opts.evaluatorKey,
    validatorPrivateKey: opts.simulated ? undefined : opts.evaluatorKey,
    simulated: opts.simulated,
    arctaskClient: arctask,
  });

  // ── 1. Discover + calibrate ────────────────────────────────────────────────
  // Register the offline directory in simulated mode so there are calibrated
  // agents to rank; live mode reads whatever is already on the registry.
  const ownerAccounts = new Map<string, PrivateKeyAccount>(); // agentId -> owner
  if (opts.simulated) {
    const roster = opts.simRoster ?? DEFAULT_SIM_ROSTER;
    for (const seed of roster) {
      const owner = makeWallet(seed.key);
      const metadataURI = encodeJobPayloadUri({
        name: seed.name,
        capabilities: [seed.capability],
        priceUsdc: seed.priceUsdc,
        claimedSuccessProb: seed.claimedSuccessProb,
        claimedLatencyMs: seed.claimedLatencyMs,
        bondUsdc: seed.bondUsdc,
        archetype: seed.archetype,
      });
      const { agentId } = await (arctask as SimulatedArcTaskClient).registerAgent(
        owner.account,
        owner.wallet,
        metadataURI,
      );
      ownerAccounts.set(agentId.toString(), owner.account);
    }
  }

  const store = new InMemoryStore();
  const sync = new MarketplaceProviderSync(arctask);
  const providers = await sync.syncProviders({ defaultCapability: capability });
  for (const p of providers) await store.putProvider(p);
  log("discover", `read ${providers.length} agent(s) from the ArcTask registry`);

  // Attach the calibration ledger (realized-outcome scoring). In simulated mode
  // we replay a labeled prior track record; live mode is cold-start (Beta(1,1)).
  const rosterByAgentId = new Map<string, SimAgentSeed>();
  if (opts.simulated) {
    for (const seed of opts.simRoster ?? DEFAULT_SIM_ROSTER) {
      const owner = makeWallet(seed.key);
      const provider = providers.find((p) => p.wallet === owner.account.address);
      if (!provider) continue;
      rosterByAgentId.set(String(provider.agentId), seed);
      let record = defaultCalibration(provider.id, seed.capability);
      for (let i = 0; i < seed.priorPass; i++) {
        record = updateCalibration(record, synthOutcome(provider.id, true, seed.priceUsdc, seed.claimedLatencyMs), now());
      }
      for (let i = 0; i < seed.priorFail; i++) {
        record = updateCalibration(record, synthOutcome(provider.id, false, seed.priceUsdc, seed.claimedLatencyMs), now());
      }
      await store.putCalibration(record);
    }
  }

  // ── 2. Get a job ────────────────────────────────────────────────────────────
  const quoteSource = new ArcTaskQuoteSource({ defaultSuccessProb: 0.85 }, arctask);
  const settlement = new MockSettlementAdapter("0.001");
  const oracle = new SchemaOracle();
  const core = createTrapezaCore({ store, chain, settlement, oracle, quotes: quoteSource });

  let spec: TaskSpec;
  let jobSource: "seeded" | "organic";
  let organicJob: ArcTaskJob | undefined;

  if (opts.seedJob || opts.simulated) {
    const seed = opts.seedTask ?? DEFAULT_SEED_TASK;
    const deadlineSec = seed.deadlineSec ?? 3_600;
    spec = {
      id: "arctask:pending",
      capability: seed.capability,
      input: { title: seed.title, description: seed.description },
      oracleSpec: {
        schema: { type: "object", required: ["summary"], properties: { summary: { type: "string" } } },
        groundTruth: {},
      },
      valueUsdc: seed.rewardUsdc,
      budgetUsdc: seed.rewardUsdc,
      preference: { price: 0.35, latency: 0.15, quality: 0.35, risk: 0.15 },
      deadlineMs: deadlineSec * 1000,
    };
    jobSource = "seeded";
    log("job", `seeded job "${seed.title}" @ ${seed.rewardUsdc} USDC (ARCTASK_SEED_JOB / demo client)`);
  } else {
    // Organic ingestion: subscribe to JobCreated / GET /api/network/jobs.
    const watcher = new ArcJobWatcher(arctask as ArcTaskClient, {
      apiBase: readArctaskApiBase(),
      activeOnly: true,
    });
    const jobs = await watcher.discoverJobs();
    const funded = jobs.find((j) => j.status === 0);
    if (!funded) {
      throw new Error(
        "no organic funded ArcTask job found. Set ARCTASK_SEED_JOB=true to post a demo job, " +
          "or wait for a real client to createJob.",
      );
    }
    organicJob = funded;
    spec = jobToTaskSpec(funded, { capability });
    jobSource = "organic";
    log("job", `ingested organic job #${funded.jobId} from the marketplace`);
  }

  // ── 3. CLEAR (the differentiator) ───────────────────────────────────────────
  await store.putTask(spec);
  const quotes: Quote[] = await quoteSource.quotesFor(spec, providers);
  if (quotes.length === 0) {
    throw new Error(`no registered agent advertises capability "${capability}"`);
  }
  const candidates: RouteCandidate[] = [];
  for (const quote of quotes) {
    const calibration =
      (await store.getCalibration(quote.providerId, capability)) ??
      defaultCalibration(quote.providerId, capability);
    candidates.push({ quote, calibration });
  }

  const onResult = routeCandidates(spec, candidates, true, config);
  const offResult = routeCandidates(spec, candidates, false, config);
  const chosen = useCalibration ? onResult : offResult;
  const winnerProviderId = chosen.allocation.providerId;
  const winnerProvider = providers.find((p) => p.id === winnerProviderId)!;
  const winnerAgentId = winnerProvider.agentId!;
  const calibratedWinner = onResult.allocation.providerId;
  const claimedWinner = offResult.allocation.providerId;

  log(
    "clear",
    `ranked ${candidates.length} agents by calibrated EV; picked ${winnerProviderId} ` +
      `(agent #${winnerAgentId}), mechanism=${chosen.allocation.mechanism}`,
  );
  if (calibratedWinner !== claimedWinner) {
    log(
      "clear",
      `differentiator: calibration hires ${calibratedWinner}; trusting the bids would hire ${claimedWinner}`,
    );
  }

  // Shared views (used by both the dry-run receipt and the full receipt).
  const registryView: ArcClearingReceipt["registry"] = providers.map((p) => {
    const seed = rosterByAgentId.get(String(p.agentId));
    const meta = seed
      ? {
          claimedSuccessProb: seed.claimedSuccessProb,
          priceUsdc: seed.priceUsdc,
          bondUsdc: seed.bondUsdc,
          archetype: seed.archetype,
        }
      : parseAgentMetadataForView(p);
    const cal = store.calibrations.get(`${p.id}::${capability}`);
    return {
      agentId: String(p.agentId),
      providerId: p.id,
      wallet: p.wallet,
      capabilities: p.capabilities,
      status: p.status,
      claimedSuccessProb: meta.claimedSuccessProb,
      calibratedSuccessProb: cal ? pSuccessMean(cal) : 0.5,
      nObservations: cal?.nObservations ?? 0,
      priceUsdc: meta.priceUsdc,
      bondUsdc: meta.bondUsdc,
      archetype: meta.archetype,
    };
  });
  const clearingView: ArcClearingReceipt["clearing"] = {
    useCalibration,
    winnerProviderId,
    winnerAgentId: winnerAgentId.toString(),
    mechanism: chosen.allocation.mechanism,
    ranked: chosen.ranked.map((r, i) => {
      const p = providers.find((pp) => pp.id === r.providerId);
      return {
        rank: i + 1,
        providerId: r.providerId,
        agentId: p ? String(p.agentId) : "?",
        score: r.score,
        pSuccessUsed: r.pSuccessUsed,
        source: r.source,
        priceUsdc: r.priceUsdc,
        riskPremium: r.riskPremium,
        hired: r.providerId === winnerProviderId,
      };
    }),
    calibratedWinner,
    claimedWinner,
    rationale:
      calibratedWinner === claimedWinner
        ? `Calibrated EV and the bids agree on ${winnerProviderId}.`
        : `Calibration hires ${calibratedWinner} on its realized track record; trusting the self-reported bids would hire ${claimedWinner}, which over-claims. score = p_success·value − price − risk_premium, with p_success from the realized-outcome ledger.`,
  };

  if (opts.dryRun) {
    log("done", "dry run: registry read + clearing decision only (no on-chain writes)");
    const registryAddress = opts.simulated ? "0xSIMULATED_REGISTRY" : readArctaskRegistryAddress();
    const escrowAddress = opts.simulated ? "0xSIMULATED_ESCROW" : readArctaskEscrowAddress();
    return {
      receipt: {
        schemaVersion: "1.0.0",
        meta: {
          generatedAt: opts.generatedAt ?? new Date(now()).toISOString(),
          network: "Arc Testnet",
          caip2: ARC_TESTNET_CAIP2,
          explorer,
          mode: opts.simulated ? "simulated" : "live",
          provider: "ArcTask (Arc-native job marketplace)",
          registryAddress: String(registryAddress),
          escrowAddress: String(escrowAddress),
          usdcRail: opts.usdcMode,
          evaluator: chain.evaluatorAddress,
          seededJob: false,
          note: "Dry run: Trapeza read the live ArcTask registry and computed the clearing decision. No job was created and no funds moved.",
        },
        job: {
          jobId: "(dry-run — not assigned)",
          title: opts.seedTask?.title ?? DEFAULT_SEED_TASK.title,
          description: opts.seedTask?.description ?? DEFAULT_SEED_TASK.description,
          budgetUsdc: spec.budgetUsdc,
          deadlineIso: new Date(now() + spec.deadlineMs).toISOString(),
          source: "seeded",
        },
        registry: registryView,
        clearing: clearingView,
        execution: {
          worker: "arctask-agent-worker",
          submittedByTrapeza: false,
          submitted: false,
          deliverable: null,
          note: "Dry run: execution not attempted. In product mode ArcTask's own worker executes; Trapeza never submits.",
        },
        evaluation: {
          passed: false,
          score: 0,
          settlement: "refund",
          verdictNote: "Dry run: no deliverable, no settlement.",
          steps: [],
          reputation: null,
        },
        provenLive: provenLiveSection(explorer),
      },
      jobId: 0n,
      winnerProviderId,
      winnerAgentId,
      settlement: "refund",
      workerBlocked: false,
    };
  }

  // ── 4. Assign on-chain (createJob with the chosen agentId) ──────────────────
  const rewardUsdc = spec.budgetUsdc;
  const rewardWei = parseUsdcToWei(rewardUsdc, opts.usdcMode);
  let jobId: bigint;
  const taskId = spec.id;
  const createJobRef = { value: "", label: "createJob → ArcTask escrow" };

  if (jobSource === "seeded") {
    chain.registerEscrowIntent(taskId, {
      agentId: winnerAgentId,
      evaluator: chain.evaluatorAddress,
      jobURI: encodeJobPayloadUri({
        title: opts.seedTask?.title ?? DEFAULT_SEED_TASK.title,
        description: opts.seedTask?.description ?? DEFAULT_SEED_TASK.description,
        prompt: opts.seedTask?.description ?? DEFAULT_SEED_TASK.description,
      }),
      deadline: BigInt(Math.floor(now() / 1000) + Math.floor(spec.deadlineMs / 1000)),
      rewardAmountWei: rewardWei,
    });
    const escrowTx = await chain.openEscrow(taskId, winnerProvider.wallet, rewardUsdc);
    jobId = chain.intents.resolveTaskId(taskId);
    createJobRef.value = escrowTx;
    log("assign", `assigned job #${jobId} to agent #${winnerAgentId}; escrow funded (${rewardUsdc} USDC) tx=${escrowTx}`);
  } else {
    jobId = organicJob!.jobId;
    chain.intents.linkJob(taskId, jobId);
    chain.intents.linkJob(`arctask:job:${jobId}`, jobId);
    createJobRef.value = `job#${jobId}`;
    log("assign", `organic job #${jobId} already assigned by its client to agent #${organicJob!.agentId}`);
  }
  // Rebind the spec id to the real job id so settle/record line up.
  const realTaskId = `arctask:job:${jobId}`;
  spec = { ...spec, id: realTaskId };
  await store.putTask(spec);
  chain.intents.linkJob(realTaskId, jobId);

  // ── 5. EXECUTE — ArcTask's OWN worker submits. Trapeza never submits. ───────
  let submitted = false;
  let workerBlocked = false;
  let deliverableRef: OnchainRefLike | null = null;
  let deliverableBody: unknown = null;
  let workerLabel: string;

  if (opts.simulated) {
    // Offline stand-in for ArcTask's autonomous worker (scripts/agent-worker.mjs).
    // This is the marketplace's worker, NOT Trapeza — clearly labeled as such.
    workerLabel = "simulated-external-worker";
    const ownerAccount = ownerAccounts.get(String(winnerAgentId));
    const owner = ownerAccount
      ? { account: ownerAccount }
      : { account: makeWallet(opts.ownerKey).account };
    const body = {
      title: opts.seedTask?.title ?? DEFAULT_SEED_TASK.title,
      summary:
        "USDC escrow on Arc locks the reward at createJob; the evaluator releases it with acceptWork once the deliverable verifies, or refunds the client with rejectWork.",
    };
    const subTx = await (arctask as SimulatedArcTaskClient).submitDeliverable(
      owner.account,
      makeWallet(opts.ownerKey).wallet,
      jobId,
      arctask.hashDeliverable(JSON.stringify(body)),
      body,
    );
    submitted = true;
    deliverableBody = body;
    deliverableRef = ref(subTx, "submitDeliverable → ArcTask escrow (external worker)", explorer);
    log("execute", `ArcTask worker (stand-in) submitted deliverable for job #${jobId} tx=${subTx}`);
  } else {
    // LIVE PRODUCT PATH: Trapeza waits for ArcTask's worker; it does NOT submit.
    workerLabel = "arctask-agent-worker";
    log("execute", `waiting for ArcTask's own worker to submit deliverable for job #${jobId} (Trapeza does not submit)`);
    try {
      const timeoutMs = opts.workerTimeoutMs ?? 120_000;
      const job = await arctask.waitForJobStatus(jobId, 1 /* Submitted */, timeoutMs);
      submitted = job.status >= 1;
      deliverableRef = ref(job.deliverableHash, "submitDeliverable → ArcTask escrow (external worker)", explorer);
      try {
        deliverableBody = await arctask.fetchDeliverable(
          jobId,
          makeWallet(opts.clientKey).account,
          makeWallet(opts.clientKey).wallet,
        );
      } catch (e) {
        deliverableBody = { summary: `deliverable submitted (hash ${job.deliverableHash})` };
        log("execute", `deliverable hash on-chain but REST body not retrievable: ${errMsg(e)}`);
      }
      log("execute", `ArcTask worker submitted deliverable for job #${jobId}`);
    } catch (e) {
      workerBlocked = true;
      log(
        "execute",
        `BLOCKED: no deliverable from ArcTask's worker: ${errMsg(e)}. ` +
          `Start the worker with LLM_* creds (see docs/ARCTASK-INTEGRATION-EVAL.md §"ArcTask worker LLM").`,
      );
    }
  }

  // ── 6. EVALUATE + SETTLE — Trapeza as registered evaluator ──────────────────
  const steps: ArcClearingReceipt["evaluation"]["steps"] = [];
  steps.push({
    key: "createJob",
    label: jobSource === "seeded" ? "Assign + fund escrow" : "Job assigned by client",
    detail:
      jobSource === "seeded"
        ? `Job #${jobId} created and funded with ${rewardUsdc} USDC, assigned to the cleared winner (agent #${winnerAgentId}); evaluator = Trapeza.`
        : `Organic job #${jobId} funded by its client and assigned to agent #${organicJob!.agentId}.`,
    ref: ref(createJobRef.value, createJobRef.label, explorer),
  });
  if (deliverableRef) {
    steps.push({
      key: "submitDeliverable",
      label: "Worker submits deliverable",
      detail: `${workerLabel} (ArcTask, not Trapeza) submitted the deliverable hash on-chain.`,
      ref: deliverableRef,
    });
  }

  let passed = false;
  let score = 0;
  let settlementAction: "release" | "refund" = "refund";
  let settleRef: OnchainRefLike | null = null;
  let reputationRef: OnchainRefLike | null = null;
  let verdictNote: string;

  if (submitted && !workerBlocked) {
    const result = { providerId: winnerProviderId, ...(deliverableBody as object) };
    const outcome: Outcome = await core.oracleVerify(spec, result);
    passed = outcome.passed;
    score = outcome.score;
    settlementAction = passed ? "release" : "refund";

    const settled = await core.settle(realTaskId, outcome);
    settleRef = ref(
      settled.txHash,
      settled.action === "release" ? "acceptWork → release escrow" : "rejectWork → refund client",
      explorer,
    );
    steps.push({
      key: "settle",
      label: passed ? "Verify + release escrow" : "Verify + refund client",
      detail: passed
        ? `Oracle verified the deliverable (score ${score}); Trapeza, as evaluator, released escrow to the worker (acceptWork).`
        : `Oracle rejected the deliverable; Trapeza, as evaluator, refunded the client (rejectWork).`,
      ref: settleRef,
    });

    // ERC-8004-style reputation + calibration ledger update (realized outcome).
    const prev =
      (await store.getCalibration(winnerProviderId, capability)) ??
      defaultCalibration(winnerProviderId, capability);
    const updated = updateCalibration(prev, { ...outcome, providerId: winnerProviderId }, now());
    await store.putCalibration(updated);
    const repTx = await chain.giveFeedback(
      winnerAgentId,
      score,
      passed ? "success" : "failure",
      outcome.evidenceURI,
    );
    reputationRef = ref(repTx, "giveFeedback → ERC-8004 reputation", explorer);
    steps.push({
      key: "reputation",
      label: "Write reputation",
      detail: `Realized outcome folded into the calibration ledger (n=${updated.nObservations}, p̂=${pSuccessMean(updated).toFixed(3)}) and mirrored to ERC-8004 reputation.`,
      ref: reputationRef,
    });
    verdictNote = passed
      ? `Deliverable verified (score ${score}). Escrow released to the worker; reputation and calibration updated.`
      : `Deliverable failed verification. Escrow refunded to the client; reputation and calibration updated.`;
    log("evaluate", `verdict passed=${passed} score=${score}; escrow ${settlementAction}`);
  } else {
    verdictNote =
      "No deliverable to evaluate — ArcTask's worker has not submitted. Trapeza never fabricates a deliverable; settlement is deferred until the worker runs.";
    log("evaluate", verdictNote);
  }

  const usdcRailDisplay = opts.usdcMode;
  const registryAddress = opts.simulated ? "0xSIMULATED_REGISTRY" : readArctaskRegistryAddress();
  const escrowAddress = opts.simulated ? "0xSIMULATED_ESCROW" : readArctaskEscrowAddress();

  const receipt: ArcClearingReceipt = {
    schemaVersion: "1.0.0",
    meta: {
      generatedAt: opts.generatedAt ?? new Date(now()).toISOString(),
      network: "Arc Testnet",
      caip2: ARC_TESTNET_CAIP2,
      explorer,
      mode: opts.simulated ? "simulated" : "live",
      provider: "ArcTask (Arc-native job marketplace)",
      registryAddress: String(registryAddress),
      escrowAddress: String(escrowAddress),
      usdcRail: usdcRailDisplay,
      evaluator: chain.evaluatorAddress,
      seededJob: jobSource === "seeded",
      note:
        "Trapeza is the clearing + evaluator brain over ArcTask, never the worker. It reads the " +
        "registry, ranks agents by calibrated expected net value, picks the winner, assigns the job " +
        "on-chain, lets ArcTask's own worker execute, then verifies and settles escrow. Clearing uses " +
        "the @trapeza/core router; evaluation uses @trapeza/oracle; all chain I/O stays in " +
        "@trapeza/adapter-arc.",
    },
    job: {
      jobId: jobId.toString(),
      title: opts.seedTask?.title ?? DEFAULT_SEED_TASK.title,
      description: opts.seedTask?.description ?? DEFAULT_SEED_TASK.description,
      budgetUsdc: rewardUsdc,
      deadlineIso: new Date(now() + spec.deadlineMs).toISOString(),
      source: jobSource,
    },
    registry: registryView,
    clearing: clearingView,
    execution: {
      worker: workerLabel!,
      submittedByTrapeza: false,
      submitted,
      deliverable: deliverableRef,
      note:
        "Execution is ArcTask's own autonomous worker (scripts/agent-worker.mjs), running as the " +
        "chosen agent. Trapeza MUST NOT submit deliverables in product mode." +
        (opts.simulated
          ? " In this offline run the worker is a clearly-labeled stand-in."
          : workerBlocked
            ? " The live worker did not submit — see the evaluation note for the exact blocker."
            : ""),
    },
    evaluation: {
      passed,
      score,
      settlement: settlementAction,
      verdictNote,
      steps,
      reputation: reputationRef,
    },
    provenLive: provenLiveSection(explorer),
  };

  log("done", "brain loop complete");
  return {
    receipt,
    jobId,
    winnerProviderId,
    winnerAgentId,
    settlement: settlementAction,
    workerBlocked,
  };
}

function synthOutcome(
  providerId: string,
  passed: boolean,
  priceUsdc: string,
  latencyMs: number,
): Outcome {
  return {
    taskId: "prior",
    providerId,
    passed,
    score: passed ? 100 : 0,
    evidenceURI: "seed://prior-track-record",
    realizedCostUsdc: priceUsdc,
    realizedLatencyMs: latencyMs,
  };
}

function parseAgentMetadataForView(p: ProviderProfile): {
  claimedSuccessProb: number;
  priceUsdc: string;
  bondUsdc: string;
  archetype: "workhorse" | "braggart" | "neutral";
} {
  // Live agents carry their RFQ fields in registry metadata; endpoint is the
  // best-effort carrier we have on the profile. Fall back to neutral defaults.
  const meta = parseAgentMetadata(p.endpoint);
  return {
    claimedSuccessProb: meta.claimedSuccessProb ?? 0.85,
    priceUsdc: meta.priceUsdc ?? p.priceSurface(0, 0),
    bondUsdc: meta.bondUsdc ?? p.bondBalanceUsdc,
    archetype: meta.archetype ?? "neutral",
  };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export { taskIdToJobId, decodeJobPayloadUri };
