/**
 * In-memory `Store` implementation for tests and the seeded loop. No database,
 * no chain — just Maps. Swap for a Supabase/Postgres-backed store in production
 * without touching the primitive.
 */

import type { Store } from "../interfaces.js";
import type {
  Capability,
  CalibrationRecord,
  Bond,
  Outcome,
  ProviderProfile,
  TaskSpec,
} from "../models.js";

function calKey(providerId: string, capability: Capability): string {
  return `${providerId}::${capability}`;
}

export class InMemoryStore implements Store {
  readonly providers = new Map<string, ProviderProfile>();
  readonly calibrations = new Map<string, CalibrationRecord>();
  readonly tasks = new Map<string, TaskSpec>();
  readonly bonds = new Map<string, Bond>();
  readonly outcomes: Outcome[] = [];

  async getProvider(id: string): Promise<ProviderProfile | null> {
    return this.providers.get(id) ?? null;
  }

  async putProvider(p: ProviderProfile): Promise<void> {
    this.providers.set(p.id, p);
  }

  async listProviders(capability: Capability): Promise<ProviderProfile[]> {
    return [...this.providers.values()].filter(
      (p) => p.status === "active" && p.capabilities.includes(capability),
    );
  }

  async getCalibration(
    providerId: string,
    capability: Capability,
  ): Promise<CalibrationRecord | null> {
    return this.calibrations.get(calKey(providerId, capability)) ?? null;
  }

  async putCalibration(record: CalibrationRecord): Promise<void> {
    this.calibrations.set(calKey(record.providerId, record.capability), record);
  }

  async getTask(id: string): Promise<TaskSpec | null> {
    return this.tasks.get(id) ?? null;
  }

  async putTask(spec: TaskSpec): Promise<void> {
    this.tasks.set(spec.id, spec);
  }

  async putBond(bond: Bond): Promise<void> {
    this.bonds.set(bond.id, bond);
  }

  async putOutcome(outcome: Outcome): Promise<void> {
    this.outcomes.push(outcome);
  }
}
