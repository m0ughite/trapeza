import { join } from "node:path";
import { homedir } from "node:os";
import { SqliteStore } from "@trapeza/store-sqlite";

export function dbPath(): string {
  return (
    process.env.TRAPEZA_DB_PATH ?? join(homedir(), ".trapeza", "trapeza.db")
  );
}

export function openStore(): SqliteStore {
  return new SqliteStore({ dbPath: dbPath() });
}
