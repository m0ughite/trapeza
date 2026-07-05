/**
 * SQLite-backed `Store` with an append-only `events` feed for dashboards.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Store } from "@trapeza/core";
import type {
  Bond,
  CalibrationRecord,
  Capability,
  Outcome,
  ProviderProfile,
  TaskSpec,
} from "@trapeza/core";
import {
  decodePriceSurface,
  encodePriceSurface,
  type PriceSurfaceKind,
  type PriceSurfaceParams,
} from "./price-surface.js";

export type EventKind =
  | "register"
  | "route"
  | "bond"
  | "settle"
  | "slash"
  | "outcome"
  | "clearing"
  | "skip";

export interface EventRecord {
  id: number;
  ts: number;
  kind: EventKind;
  taskId?: string;
  providerId?: string;
  payload: unknown;
}

export interface SqliteStoreOptions {
  /** Path to the SQLite database file. Parent dirs are created if missing. */
  dbPath: string;
  /** Injected clock for deterministic tests. */
  now?: () => number;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  agent_id TEXT,
  capabilities_json TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  price_surface_kind TEXT NOT NULL,
  price_surface_params_json TEXT NOT NULL,
  bond_balance_usdc TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended'))
);

CREATE TABLE IF NOT EXISTS calibration (
  provider_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  success_alpha REAL NOT NULL,
  success_beta REAL NOT NULL,
  cost_mean REAL NOT NULL,
  cost_var REAL NOT NULL,
  latency_mean REAL NOT NULL,
  latency_var REAL NOT NULL,
  n_observations INTEGER NOT NULL,
  last_update INTEGER NOT NULL,
  PRIMARY KEY (provider_id, capability),
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bonds (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('posted', 'released', 'slashed')),
  escrow_tx_hash TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  passed INTEGER NOT NULL,
  score INTEGER NOT NULL,
  evidence_uri TEXT NOT NULL,
  realized_cost_usdc TEXT NOT NULL,
  realized_latency_ms INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  kind TEXT NOT NULL,
  task_id TEXT,
  provider_id TEXT,
  payload_json TEXT NOT NULL
);
`;

export class SqliteStore implements Store {
  private readonly db: Database.Database;
  private readonly now: () => number;

  private readonly stmtPutProvider: Database.Statement;
  private readonly stmtGetProvider: Database.Statement;
  private readonly stmtListProviders: Database.Statement;
  private readonly stmtPutCalibration: Database.Statement;
  private readonly stmtGetCalibration: Database.Statement;
  private readonly stmtPutTask: Database.Statement;
  private readonly stmtGetTask: Database.Statement;
  private readonly stmtPutBond: Database.Statement;
  private readonly stmtPutOutcome: Database.Statement;
  private readonly stmtAppendEvent: Database.Statement;
  private readonly stmtListEvents: Database.Statement;

  constructor(options: SqliteStoreOptions) {
    mkdirSync(dirname(options.dbPath), { recursive: true });
    this.db = new Database(options.dbPath);
    this.db.exec(SCHEMA);
    this.now = options.now ?? (() => Date.now());

    this.stmtPutProvider = this.db.prepare(`
      INSERT INTO providers (
        id, wallet, agent_id, capabilities_json, endpoint,
        price_surface_kind, price_surface_params_json, bond_balance_usdc, status
      ) VALUES (
        @id, @wallet, @agent_id, @capabilities_json, @endpoint,
        @price_surface_kind, @price_surface_params_json, @bond_balance_usdc, @status
      )
      ON CONFLICT(id) DO UPDATE SET
        wallet = excluded.wallet,
        agent_id = excluded.agent_id,
        capabilities_json = excluded.capabilities_json,
        endpoint = excluded.endpoint,
        price_surface_kind = excluded.price_surface_kind,
        price_surface_params_json = excluded.price_surface_params_json,
        bond_balance_usdc = excluded.bond_balance_usdc,
        status = excluded.status
    `);

    this.stmtGetProvider = this.db.prepare(
      `SELECT * FROM providers WHERE id = ?`,
    );
    this.stmtListProviders = this.db.prepare(
      `SELECT * FROM providers WHERE status = 'active'`,
    );

    this.stmtPutCalibration = this.db.prepare(`
      INSERT INTO calibration (
        provider_id, capability, success_alpha, success_beta,
        cost_mean, cost_var, latency_mean, latency_var,
        n_observations, last_update
      ) VALUES (
        @provider_id, @capability, @success_alpha, @success_beta,
        @cost_mean, @cost_var, @latency_mean, @latency_var,
        @n_observations, @last_update
      )
      ON CONFLICT(provider_id, capability) DO UPDATE SET
        success_alpha = excluded.success_alpha,
        success_beta = excluded.success_beta,
        cost_mean = excluded.cost_mean,
        cost_var = excluded.cost_var,
        latency_mean = excluded.latency_mean,
        latency_var = excluded.latency_var,
        n_observations = excluded.n_observations,
        last_update = excluded.last_update
    `);

    this.stmtGetCalibration = this.db.prepare(
      `SELECT * FROM calibration WHERE provider_id = ? AND capability = ?`,
    );

    this.stmtPutTask = this.db.prepare(`
      INSERT INTO tasks (id, json) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET json = excluded.json
    `);
    this.stmtGetTask = this.db.prepare(`SELECT json FROM tasks WHERE id = ?`);

    this.stmtPutBond = this.db.prepare(`
      INSERT INTO bonds (id, task_id, provider_id, amount_usdc, state, escrow_tx_hash)
      VALUES (@id, @task_id, @provider_id, @amount_usdc, @state, @escrow_tx_hash)
      ON CONFLICT(id) DO UPDATE SET
        state = excluded.state,
        escrow_tx_hash = excluded.escrow_tx_hash
    `);

    this.stmtPutOutcome = this.db.prepare(`
      INSERT INTO outcomes (
        task_id, provider_id, passed, score, evidence_uri,
        realized_cost_usdc, realized_latency_ms, ts
      ) VALUES (
        @task_id, @provider_id, @passed, @score, @evidence_uri,
        @realized_cost_usdc, @realized_latency_ms, @ts
      )
    `);

    this.stmtAppendEvent = this.db.prepare(`
      INSERT INTO events (ts, kind, task_id, provider_id, payload_json)
      VALUES (@ts, @kind, @task_id, @provider_id, @payload_json)
    `);

    this.stmtListEvents = this.db.prepare(`
      SELECT id, ts, kind, task_id, provider_id, payload_json
      FROM events
      ORDER BY id DESC
      LIMIT ?
    `);
  }

  /** Close the underlying database handle. */
  close(): void {
    this.db.close();
  }

  /** Reopen the same path (for WAL durability tests). */
  static reopen(options: SqliteStoreOptions): SqliteStore {
    return new SqliteStore(options);
  }

  async getProvider(id: string): Promise<ProviderProfile | null> {
    const row = this.stmtGetProvider.get(id) as ProviderRow | undefined;
    return row ? rowToProvider(row) : null;
  }

  async putProvider(p: ProviderProfile): Promise<void> {
    const encoded = encodePriceSurface(p.priceSurface);
    this.stmtPutProvider.run({
      id: p.id,
      wallet: p.wallet,
      agent_id: p.agentId?.toString() ?? null,
      capabilities_json: JSON.stringify(p.capabilities),
      endpoint: p.endpoint,
      price_surface_kind: encoded.kind,
      price_surface_params_json: JSON.stringify(encoded.params),
      bond_balance_usdc: p.bondBalanceUsdc,
      status: p.status,
    });
  }

  async listProviders(capability: Capability): Promise<ProviderProfile[]> {
    const rows = this.stmtListProviders.all() as ProviderRow[];
    return rows
      .map(rowToProvider)
      .filter(
        (p) => p.status === "active" && p.capabilities.includes(capability),
      );
  }

  async getCalibration(
    providerId: string,
    capability: Capability,
  ): Promise<CalibrationRecord | null> {
    const row = this.stmtGetCalibration.get(providerId, capability) as
      | CalibrationRow
      | undefined;
    return row ? rowToCalibration(row) : null;
  }

  async putCalibration(record: CalibrationRecord): Promise<void> {
    this.stmtPutCalibration.run({
      provider_id: record.providerId,
      capability: record.capability,
      success_alpha: record.successAlpha,
      success_beta: record.successBeta,
      cost_mean: record.costMean,
      cost_var: record.costVar,
      latency_mean: record.latencyMean,
      latency_var: record.latencyVar,
      n_observations: record.nObservations,
      last_update: record.lastUpdate,
    });
  }

  async getTask(id: string): Promise<TaskSpec | null> {
    const row = this.stmtGetTask.get(id) as { json: string } | undefined;
    return row ? (JSON.parse(row.json) as TaskSpec) : null;
  }

  async putTask(spec: TaskSpec): Promise<void> {
    this.stmtPutTask.run(spec.id, JSON.stringify(spec));
  }

  async putBond(bond: Bond): Promise<void> {
    this.stmtPutBond.run({
      id: bond.id,
      task_id: bond.taskId,
      provider_id: bond.providerId,
      amount_usdc: bond.amountUsdc,
      state: bond.state,
      escrow_tx_hash: bond.escrowTxHash ?? null,
    });
  }

  async putOutcome(outcome: Outcome): Promise<void> {
    this.stmtPutOutcome.run({
      task_id: outcome.taskId,
      provider_id: outcome.providerId,
      passed: outcome.passed ? 1 : 0,
      score: outcome.score,
      evidence_uri: outcome.evidenceURI,
      realized_cost_usdc: outcome.realizedCostUsdc,
      realized_latency_ms: outcome.realizedLatencyMs,
      ts: this.now(),
    });
  }

  async appendEvent(
    event: Omit<EventRecord, "id">,
  ): Promise<void> {
    this.stmtAppendEvent.run({
      ts: event.ts,
      kind: event.kind,
      task_id: event.taskId ?? null,
      provider_id: event.providerId ?? null,
      payload_json: JSON.stringify(event.payload),
    });
  }

  async listEvents(limit = 100): Promise<EventRecord[]> {
    const rows = this.stmtListEvents.all(limit) as EventRow[];
    return rows.map((r) => ({
      id: r.id,
      ts: r.ts,
      kind: r.kind as EventKind,
      taskId: r.task_id ?? undefined,
      providerId: r.provider_id ?? undefined,
      payload: JSON.parse(r.payload_json) as unknown,
    }));
  }

  async listAllProviders(): Promise<ProviderProfile[]> {
    const rows = this.db
      .prepare(`SELECT * FROM providers`)
      .all() as ProviderRow[];
    return rows.map(rowToProvider);
  }

  async listAllCalibrations(): Promise<CalibrationRecord[]> {
    const rows = this.db
      .prepare(`SELECT * FROM calibration`)
      .all() as CalibrationRow[];
    return rows.map(rowToCalibration);
  }

  async listOutcomes(): Promise<Outcome[]> {
    const rows = this.db
      .prepare(
        `SELECT task_id, provider_id, passed, score, evidence_uri,
                realized_cost_usdc, realized_latency_ms
         FROM outcomes ORDER BY id ASC`,
      )
      .all() as OutcomeRow[];
    return rows.map((r) => ({
      taskId: r.task_id,
      providerId: r.provider_id,
      passed: Boolean(r.passed),
      score: r.score,
      evidenceURI: r.evidence_uri,
      realizedCostUsdc: r.realized_cost_usdc,
      realizedLatencyMs: r.realized_latency_ms,
    }));
  }
}

interface ProviderRow {
  id: string;
  wallet: string;
  agent_id: string | null;
  capabilities_json: string;
  endpoint: string;
  price_surface_kind: PriceSurfaceKind;
  price_surface_params_json: string;
  bond_balance_usdc: string;
  status: "active" | "suspended";
}

interface CalibrationRow {
  provider_id: string;
  capability: string;
  success_alpha: number;
  success_beta: number;
  cost_mean: number;
  cost_var: number;
  latency_mean: number;
  latency_var: number;
  n_observations: number;
  last_update: number;
}

interface EventRow {
  id: number;
  ts: number;
  kind: string;
  task_id: string | null;
  provider_id: string | null;
  payload_json: string;
}

interface OutcomeRow {
  task_id: string;
  provider_id: string;
  passed: number;
  score: number;
  evidence_uri: string;
  realized_cost_usdc: string;
  realized_latency_ms: number;
}

function rowToProvider(row: ProviderRow): ProviderProfile {
  const params = JSON.parse(
    row.price_surface_params_json,
  ) as PriceSurfaceParams;
  return {
    id: row.id,
    agentId: row.agent_id ? BigInt(row.agent_id) : null,
    wallet: row.wallet as `0x${string}`,
    capabilities: JSON.parse(row.capabilities_json) as Capability[],
    endpoint: row.endpoint,
    priceSurface: decodePriceSurface(row.price_surface_kind, params),
    bondBalanceUsdc: row.bond_balance_usdc,
    status: row.status,
  };
}

function rowToCalibration(row: CalibrationRow): CalibrationRecord {
  return {
    providerId: row.provider_id,
    capability: row.capability,
    successAlpha: row.success_alpha,
    successBeta: row.success_beta,
    costMean: row.cost_mean,
    costVar: row.cost_var,
    latencyMean: row.latency_mean,
    latencyVar: row.latency_var,
    nObservations: row.n_observations,
    lastUpdate: row.last_update,
  };
}
