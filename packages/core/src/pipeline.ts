/**
 * The one canonical Trapeza clearing pipeline (DESIGN.md §4.2):
 *
 *   submitTask → collectQuotes → route → postBond → execute
 *     → verify(Oracle) → settle → recordOutcome
 *
 * `createTrapezaCore` is the single constructor for the primitive. It takes the
 * injected adapters (`Store`, `SettlementAdapter`, `ChainAdapter`, `Oracle`,
 * and a `QuoteSource`) and returns a `TrapezaCore`. The app never re-implements
 * this loop — it only calls it. There are NO chain SDK / UI / MCP calls inline
 * here; everything chain- or network-specific is behind an injected boundary
 * (DESIGN.md §4.3 hard rule).
 *
 * Calibration is the allocation signal: `route()` consumes the realized-outcome
 * ledger via `@trapeza/core/calibration`, and `recordOutcome()` is the only
 * writer of that ledger. Self-reported quotes are priors, used as the signal
 * ONLY on the CALIBRATION OFF path.
 */

import {
  defaultCalibration,
  updateCalibration,
} from "./calibration.js";
import { withDefaults, type TrapezaConfig } from "./config.js";
import type {
  ChainAdapter,
  Oracle,
  QuoteSource,
  SettlementAdapter,
  Store,
  TrapezaCore,
} from "./interfaces.js";
import type {
  Allocation,
  Bond,
  CalibrationRecord,
  Capability,
  Outcome,
  ProviderProfile,
  Quote,
  TaskSpec,
} from "./models.js";
import { route as routeCandidates, type RouteCandidate } from "./router.js";

export interface TrapezaDeps {
  store: Store;
  settlement: SettlementAdapter;
  chain: ChainAdapter;
  oracle: Oracle;
  /** Optional RFQ source. Required only if you call `collectQuotes`. */
  quotes?: QuoteSource;
  /** Optional tuning; sane defaults applied via `withDefaults`. */
  config?: Partial<TrapezaConfig>;
  /** Injected clock for deterministic tests. Defaults to `Date.now`. */
  now?: () => number;
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not implemented.`);
    this.name = "NotImplementedError";
  }
}

/**
 * Internal per-task transient state. This is runtime bookkeeping for the
 * in-flight pipeline (the chosen allocation, the winning quote, the posted
 * bond), NOT durable storage — durable objects (providers, calibration, bonds,
 * outcomes, tasks) all go through the injected `Store`.
 */
interface TaskRuntime {
  allocation?: Allocation;
  winningQuote?: Quote;
  bond?: Bond;
}

/**
 * Build the primitive from injected adapters. The returned object is the only
 * thing the app layer imports behavior from.
 */
export function createTrapezaCore(deps: TrapezaDeps): TrapezaCore {
  const { store, settlement, chain, oracle } = deps;
  const config = withDefaults(deps.config);
  const now = deps.now ?? (() => Date.now());

  const runtime = new Map<string, TaskRuntime>();
  let providerSeq = 0;

  function rt(taskId: string): TaskRuntime {
    let r = runtime.get(taskId);
    if (!r) {
      r = {};
      runtime.set(taskId, r);
    }
    return r;
  }

  async function loadCalibration(
    providerId: string,
    capability: Capability,
  ): Promise<CalibrationRecord> {
    const existing = await store.getCalibration(providerId, capability);
    return existing ?? defaultCalibration(providerId, capability);
  }

  async function requireTask(taskId: string): Promise<TaskSpec> {
    const task = await store.getTask(taskId);
    if (!task) throw new Error(`unknown task: ${taskId}`);
    return task;
  }

  async function requireProvider(id: string): Promise<ProviderProfile> {
    const p = await store.getProvider(id);
    if (!p) throw new Error(`unknown provider: ${id}`);
    return p;
  }

  return {
    // ── discovery & registration ──────────────────────────────────────────
    async registerProvider(p) {
      const id = `prov_${++providerSeq}`;
      const agentId = await chain.mintIdentity({
        id,
        wallet: p.wallet,
        capabilities: p.capabilities,
        endpoint: p.endpoint,
      });
      const profile: ProviderProfile = { ...p, id, agentId };
      await store.putProvider(profile);
      return profile;
    },

    async listProviders(capability) {
      return store.listProviders(capability);
    },

    async getCalibration(providerId, capability) {
      return loadCalibration(providerId, capability);
    },

    // ── the core clearing loop ────────────────────────────────────────────
    async submitTask(spec) {
      await store.putTask(spec);
      rt(spec.id); // open runtime slot
      return spec.id;
    },

    async collectQuotes(taskId) {
      if (!deps.quotes) {
        throw new Error(
          "collectQuotes requires an injected QuoteSource (deps.quotes)",
        );
      }
      const task = await requireTask(taskId);
      const providers = await store.listProviders(task.capability);
      return deps.quotes.quotesFor(task, providers);
    },

    async route(taskId, quotes, useCalibration = config.calibrationOnByDefault) {
      const task = await requireTask(taskId);

      const candidates: RouteCandidate[] = [];
      for (const quote of quotes) {
        const calibration = await loadCalibration(
          quote.providerId,
          task.capability,
        );
        candidates.push({ quote, calibration });
      }

      const { allocation } = routeCandidates(
        task,
        candidates,
        useCalibration,
        config,
      );

      const state = rt(taskId);
      state.allocation = allocation;
      state.winningQuote = quotes.find(
        (q) => q.providerId === allocation.providerId,
      );
      return allocation;
    },

    async postBond(allocation) {
      const state = rt(allocation.taskId);
      const provider = await requireProvider(allocation.providerId);
      // Bond amount = the provider's offered bond from its winning quote, if we
      // have it; otherwise the provider's standing bond balance.
      const amountUsdc =
        state.winningQuote?.bondOfferedUsdc ?? provider.bondBalanceUsdc;

      const escrowTxHash = await chain.openEscrow(
        allocation.taskId,
        provider.wallet,
        amountUsdc,
      );

      const bond: Bond = {
        id: `bond_${allocation.taskId}`,
        providerId: allocation.providerId,
        taskId: allocation.taskId,
        amountUsdc,
        state: "posted",
        escrowTxHash,
      };
      await store.putBond(bond);
      state.bond = bond;
      return bond;
    },

    async execute(allocation) {
      const task = await requireTask(allocation.taskId);
      const provider = await requireProvider(allocation.providerId);
      // x402 pay-per-call to the provider's endpoint (mocked behind the adapter).
      const receipt = await settlement.pay(provider.endpoint, task.input);
      const state = rt(allocation.taskId);
      // stash the realized cost so the app can build the Outcome if it wants
      void state;
      return { receipt, provider: provider.id, capability: task.capability };
    },

    async oracleVerify(spec, result) {
      // The pipeline's `verify(Oracle)` step: delegate to the injected oracle.
      // No verification logic lives inline here — the oracle is the pluggable
      // boundary (schema/ground-truth for v1, hidden test suite for v2).
      return oracle.verify(spec, result);
    },

    async settle(taskId, outcome) {
      const state = rt(taskId);
      const action: "release" | "slash" = outcome.passed ? "release" : "slash";
      const txHash = await chain.resolveEscrow(taskId, action);

      if (state.bond) {
        const next: Bond = {
          ...state.bond,
          state: action === "release" ? "released" : "slashed",
        };
        await store.putBond(next);
        state.bond = next;
      }
      return { action, txHash };
    },

    async recordOutcome(outcome) {
      const task = await requireTask(outcome.taskId);
      const capability = task.capability;

      const prev = await loadCalibration(outcome.providerId, capability);
      const updated = updateCalibration(prev, outcome, now());
      await store.putCalibration(updated);
      await store.putOutcome(outcome);

      // Mirror the realized outcome to ERC-8004 reputation (behind the adapter).
      const provider = await store.getProvider(outcome.providerId);
      if (provider?.agentId != null) {
        await chain.giveFeedback(
          provider.agentId,
          outcome.score,
          outcome.passed ? "success" : "failure",
          outcome.evidenceURI,
        );
      }
    },
  };
}
