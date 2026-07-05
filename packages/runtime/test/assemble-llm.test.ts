import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assemble } from "../src/assemble.js";

describe("assemble llm mode", () => {
  it("wires SchemaOracle + LlmSettlementAdapter + LlmQuoteSource", () => {
    const dir = mkdtempSync(join(tmpdir(), "trapeza-assemble-llm-"));
    const rt = assemble({ mode: "llm", dbPath: join(dir, "llm.db") });
    expect(rt.mode).toBe("llm");
    expect(rt.llm?.settlement).toBeDefined();
    expect(rt.llm?.quotes).toBeDefined();
    expect(rt.mocks).toBeUndefined();
    rt.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
