import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { providerInputSchema, taskGraphSchema } from "../src/schemas.js";
import {
  allocationSummary,
  getProviderCalibration,
  getProviders,
  getReceipt,
  getStatus,
  mapError,
  McpToolError,
  registerProvider,
  submitGraph,
  submitTask,
} from "../src/tools.js";
import { assemble } from "@trapeza/runtime";
import { ClearingError } from "@trapeza/clearinghouse";

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-mcp-"));
  return { path: join(dir, "mcp.db"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("MCP schemas", () => {
  it("rejects malformed provider wallet", () => {
    expect(() =>
      providerInputSchema.parse({
        wallet: "not-a-wallet",
        capabilities: ["cap.a"],
        endpoint: "https://x.example",
        bondBalanceUsdc: "1.00",
      }),
    ).toThrow();
  });
});

describe("MCP tools", () => {
  it("registers a provider and reports health", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    const profile = await registerProvider(rt, {
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.logo"],
      endpoint: "https://provider.example/p1",
      bondBalanceUsdc: "2.00",
      status: "active",
      priceUsdc: "0.15",
    });
    expect(profile.id).toMatch(/^prov_/);
    const status = await getStatus(rt);
    expect(status.mode).toBe("mock");
    rt.store.close();
    cleanup();
  });

  it("maps ClearingError to structured code", () => {
    const err = mapError(new ClearingError("nope", "INFEASIBLE"));
    expect(err.code).toBe("INFEASIBLE");
  });

  it("maps generic and unknown errors to INTERNAL", () => {
    expect(mapError(new Error("boom")).code).toBe("INTERNAL");
    expect(mapError("oops").code).toBe("INTERNAL");
    expect(mapError(new McpToolError("NOT_FOUND", "x")).code).toBe("NOT_FOUND");
  });

  it("lists providers and calibration", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    const profile = await registerProvider(rt, {
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.logo"],
      endpoint: "https://provider.example/p1",
      bondBalanceUsdc: "2.00",
      status: "active",
    });
    const providers = await getProviders(rt, "cap.logo");
    expect(providers).toHaveLength(1);
    expect(providers[0]!.id).toBe(profile.id);

    const cal = await getProviderCalibration(rt, profile.id, "cap.logo");
    expect(cal.providerId).toBe(profile.id);
    expect(cal.nObservations).toBe(0);

    rt.store.close();
    cleanup();
  });

  it("submit_task runs the broker pipeline in mock mode", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    await registerProvider(rt, {
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.logo"],
      endpoint: "https://p1.example",
      bondBalanceUsdc: "5.00",
      status: "active",
      priceUsdc: "0.15",
    });
    rt.mocks!.oracle.script("task-single", { passed: true });

    const result = await submitTask(rt, {
      id: "task-single",
      capability: "cap.logo",
      valueUsdc: "0.50",
      budgetUsdc: "0.80",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: 60_000,
      oracleSpec: { schema: { type: "object" }, groundTruth: {} },
      useCalibration: true,
    });

    expect(result.action).toBe("release");
    expect(result.outcome.providerId).toBeDefined();
    expect(allocationSummary(result.allocation).taskId).toBe("task-single");

    rt.store.close();
    cleanup();
  });

  it("get_receipt returns task and outcome", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    await registerProvider(rt, {
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.logo"],
      endpoint: "https://p1.example",
      bondBalanceUsdc: "5.00",
      status: "active",
    });
    rt.mocks!.oracle.script("task-r", { passed: true });
    await submitTask(rt, {
      id: "task-r",
      capability: "cap.logo",
      valueUsdc: "0.50",
      budgetUsdc: "0.80",
      preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
      deadlineMs: 60_000,
      oracleSpec: { schema: { type: "object" }, groundTruth: {} },
    });

    const receipt = await getReceipt(rt, "task-r");
    expect(receipt.task.id).toBe("task-r");
    expect(receipt.outcome?.passed).toBe(true);

    await expect(getReceipt(rt, "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    rt.store.close();
    cleanup();
  });

  it("submit_graph maps infeasible clearing to structured error", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path, clearinghouse: { preferCpSat: false } });

    const graph = taskGraphSchema.parse({
      id: "g-bad",
      nodes: [
        {
          nodeId: "only",
          task: {
            id: "task-only",
            capability: "cap.missing",
            input: {},
            oracleSpec: { schema: { type: "object" }, groundTruth: {} },
            valueUsdc: "0.50",
            budgetUsdc: "0.80",
            preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
            deadlineMs: 60_000,
          },
        },
      ],
      edges: [],
      globalBudgetUsdc: "1.00",
      globalDeadlineMs: 60_000,
    });

    await expect(submitGraph(rt, graph)).rejects.toMatchObject({
      code: "NO_PROVIDER",
    });

    rt.store.close();
    cleanup();
  });

  it("submit_graph e2e on mock providers", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path, clearinghouse: { preferCpSat: false } });

    await registerProvider(rt, {
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.logo"],
      endpoint: "https://p1.example",
      bondBalanceUsdc: "5.00",
      status: "active",
      priceUsdc: "0.15",
    });
    await registerProvider(rt, {
      wallet: "0x2222222222222222222222222222222222222222",
      capabilities: ["cap.code"],
      endpoint: "https://p2.example",
      bondBalanceUsdc: "5.00",
      status: "active",
      priceUsdc: "0.50",
    });

    rt.mocks!.oracle.script("task-logo", { passed: true });
    rt.mocks!.oracle.script("task-code", { passed: true });

    const graph = taskGraphSchema.parse({
      id: "g-mcp",
      nodes: [
        {
          nodeId: "logo",
          task: {
            id: "task-logo",
            capability: "cap.logo",
            input: {},
            oracleSpec: { schema: { type: "object" }, groundTruth: {} },
            valueUsdc: "0.50",
            budgetUsdc: "0.80",
            preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
            deadlineMs: 60_000,
          },
        },
        {
          nodeId: "code",
          task: {
            id: "task-code",
            capability: "cap.code",
            input: {},
            oracleSpec: { schema: { type: "object" }, groundTruth: {} },
            valueUsdc: "0.50",
            budgetUsdc: "0.80",
            preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
            deadlineMs: 60_000,
          },
        },
      ],
      edges: [{ from: "logo", to: "code" }],
      globalBudgetUsdc: "2.00",
      globalDeadlineMs: 120_000,
    });

    const result = await submitGraph(rt, graph);
    expect(result.execution.nodes).toHaveLength(2);
    expect(result.clearing.meta.solver).toBeDefined();

    rt.store.close();
    cleanup();
  });
});
