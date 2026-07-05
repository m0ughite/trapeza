/**
 * Composition root — the only module that imports concrete adapters.
 */

import { ArcChainAdapter } from "@trapeza/adapter-arc";
import { GatewaySettlementAdapter } from "@trapeza/adapter-gateway";
import { loadEnv as loadArcEnv } from "@trapeza/adapter-arc";
import { loadEnv as loadGatewayEnv } from "@trapeza/adapter-gateway";
import {
  createClearinghouse,
  solverHealthy,
  type ClearinghouseOptions,
} from "@trapeza/clearinghouse";
import { createTrapezaCore, type GraphClearinghouse, type TaskGraph, type TrapezaCore } from "@trapeza/core";
import {
  MockChainAdapter,
  MockOracle,
  MockQuoteSource,
  MockSettlementAdapter,
} from "@trapeza/core/testing";
import {
  createLlmClient,
  LlmQuoteSource,
  LlmSettlementAdapter,
} from "@trapeza/provider-llm";
import { SchemaOracle } from "@trapeza/oracle";
import { SqliteStore } from "@trapeza/store-sqlite";
import { solverProvidersFor } from "./provider-projection.js";

export type TrapezaMode = "mock" | "live" | "llm";

export interface AssembleOptions {
  mode?: TrapezaMode;
  dbPath: string;
  solverUrl?: string;
  now?: () => number;
  clearinghouse?: Partial<ClearinghouseOptions>;
}

export interface TrapezaMocks {
  chain: MockChainAdapter;
  settlement: MockSettlementAdapter;
  oracle: MockOracle;
  quotes: MockQuoteSource;
}

export interface TrapezaLlm {
  chain: MockChainAdapter;
  settlement: LlmSettlementAdapter;
  quotes: LlmQuoteSource;
}

export interface HealthStatus {
  solver: boolean;
  mode: TrapezaMode;
  db: string;
}

export interface TrapezaRuntime {
  core: TrapezaCore;
  store: SqliteStore;
  mode: TrapezaMode;
  dbPath: string;
  mocks?: TrapezaMocks;
  llm?: TrapezaLlm;
  createClearinghouseFor(graph: TaskGraph): Promise<GraphClearinghouse>;
  health(): Promise<HealthStatus>;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`live mode requires env var ${name}`);
  }
  return v.trim();
}

export function assemble(options: AssembleOptions): TrapezaRuntime {
  const mode = options.mode ?? "mock";
  const now = options.now ?? (() => Date.now());
  const store = new SqliteStore({ dbPath: options.dbPath, now });
  const oracle = new SchemaOracle();

  let mocks: TrapezaMocks | undefined;
  let llm: TrapezaLlm | undefined;
  let core: TrapezaCore;

  if (mode === "mock") {
    const chain = new MockChainAdapter();
    const settlement = new MockSettlementAdapter();
    const mockOracle = new MockOracle();
    const quotes = new MockQuoteSource();
    mocks = { chain, settlement, oracle: mockOracle, quotes };
    core = createTrapezaCore({
      store,
      settlement,
      chain,
      oracle: mockOracle,
      quotes,
      now,
    });
  } else if (mode === "llm") {
    const chain = new MockChainAdapter();
    const client = createLlmClient();
    const usePerEndpointMock = !process.env.LLM_BASE_URL?.trim();
    const settlementRegistry = new Map();
    const settlement = new LlmSettlementAdapter(
      settlementRegistry,
      client,
      (taskId) => store.getTask(taskId),
      usePerEndpointMock,
    );
    const quotes = new LlmQuoteSource();
    llm = { chain, settlement, quotes };
    core = createTrapezaCore({
      store,
      settlement,
      chain,
      oracle,
      quotes,
      now,
    });
  } else {
    loadArcEnv();
    loadGatewayEnv();
    const chain = new ArcChainAdapter({
      ownerPrivateKey: requireEnv("OWNER_PRIVATE_KEY") as `0x${string}`,
      validatorPrivateKey: process.env.VALIDATOR_PRIVATE_KEY?.trim() as
        | `0x${string}`
        | undefined,
    });
    const settlement = new GatewaySettlementAdapter({
      privateKey: requireEnv("BUYER_PRIVATE_KEY") as `0x${string}`,
    });
    core = createTrapezaCore({
      store,
      settlement,
      chain,
      oracle,
      now,
    });
  }

  const solverUrl = options.solverUrl ?? process.env.TRAPEZA_SOLVER_URL;
  const clearingDefaults = options.clearinghouse ?? {};

  return {
    core,
    store,
    mode,
    dbPath: options.dbPath,
    mocks,
    llm,
    async createClearinghouseFor(graph) {
      const providers = await solverProvidersFor(store, graph);
      return createClearinghouse({
        providers,
        preferCpSat: clearingDefaults.preferCpSat,
        solverUrl,
        solverTimeoutMs: clearingDefaults.solverTimeoutMs,
        monteCarlo: clearingDefaults.monteCarlo,
        seed: clearingDefaults.seed,
      });
    },
    async health() {
      return {
        solver: await solverHealthy({ baseUrl: solverUrl }),
        mode,
        db: options.dbPath,
      };
    },
  };
}
