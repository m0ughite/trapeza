import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeQaTask, nextDemoQa, seedLlmProviders } from "@trapeza/provider-llm";
import { assemble } from "@trapeza/runtime";
import { submitTask } from "../src/tools.js";

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-mcp-llm-"));
  return { path: join(dir, "llm.db"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("MCP llm mode", () => {
  it("submit_task runs the broker pipeline with seeded LLM roster", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "llm", dbPath: path });
    await seedLlmProviders(rt.core, rt.store, rt.llm!.settlement, rt.llm!.quotes);

    const qa = nextDemoQa(0);
    const task = makeQaTask("mcp-llm-task", qa, 0);

    const result = await submitTask(rt, {
      id: task.id,
      capability: task.capability,
      input: task.input,
      oracleSpec: task.oracleSpec,
      valueUsdc: task.valueUsdc,
      budgetUsdc: task.budgetUsdc,
      preference: task.preference,
      deadlineMs: task.deadlineMs,
      bondRatio: task.bondRatio,
      useCalibration: true,
    });

    expect(["release", "slash"]).toContain(result.action);
    expect(result.outcome.providerId).toBeDefined();
    expect(result.outcome.passed).toBe(true);

    rt.store.close();
    cleanup();
  });
});
