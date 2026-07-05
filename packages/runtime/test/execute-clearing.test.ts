import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { GraphClearing, TaskGraph } from "@trapeza/core";
import { assemble } from "../src/assemble.js";
import { executeClearing } from "../src/execute-clearing.js";

function tempDb(): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-runtime-"));
  return { path: join(dir, "test.db"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function makeGraph(): TaskGraph {
  return {
    id: "g-exec",
    nodes: [
      {
        nodeId: "n1",
        task: {
          id: "task-n1",
          capability: "cap.a",
          input: {},
          oracleSpec: { schema: { type: "object" }, groundTruth: {} },
          valueUsdc: "1.00",
          budgetUsdc: "1.00",
          preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
          deadlineMs: 60_000,
        },
      },
      {
        nodeId: "n2",
        task: {
          id: "task-n2",
          capability: "cap.b",
          input: {},
          oracleSpec: { schema: { type: "object" }, groundTruth: {} },
          valueUsdc: "1.00",
          budgetUsdc: "1.00",
          preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
          deadlineMs: 60_000,
        },
      },
    ],
    edges: [{ from: "n1", to: "n2" }],
    globalBudgetUsdc: "5.00",
    globalDeadlineMs: 120_000,
  };
}

function makeClearing(graph: TaskGraph): GraphClearing {
  return {
    graphId: graph.id,
    allocations: graph.nodes.map((n, i) => ({
      taskId: n.task.id,
      providerId: i === 0 ? "p-up" : "p-down",
      mechanism: "posted" as const,
      score: 1,
    })),
    schedule: graph.nodes.map((n, i) => ({
      nodeId: n.nodeId,
      startMs: i * 100,
      durationMs: 50,
      endMs: i * 100 + 50,
    })),
    shadowPricesUsdc: { budget: "0.000000" },
    settlementPricesUsdc: Object.fromEntries(
      graph.nodes.map((n) => [n.nodeId, "0.10"]),
    ),
    totalClearedUsdc: "0.20",
    meta: {
      solver: "greedy_lns",
      objectiveValue: 2,
      makespanMs: 150,
      preflightPassed: true,
    },
  };
}

describe("executeClearing", () => {
  it("overrides providerId and records real cost from receipt", async () => {
    const { path, cleanup } = tempDb();
    let t = 1000;
    const rt = assemble({ mode: "mock", dbPath: path, now: () => t++ });
    const graph = makeGraph();

    await rt.core.registerProvider({
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.a"],
      endpoint: "https://up.example",
      priceSurface: () => "0.10",
      bondBalanceUsdc: "1.00",
      status: "active",
    });
    const pUp = (await rt.store.listAllProviders())[0]!;
    await rt.core.registerProvider({
      wallet: "0x2222222222222222222222222222222222222222",
      capabilities: ["cap.b"],
      endpoint: "https://down.example",
      priceSurface: () => "0.10",
      bondBalanceUsdc: "1.00",
      status: "active",
    });

    rt.mocks!.settlement.setPrice("https://up.example", "0.07");
    rt.mocks!.oracle.script("task-n1", { passed: true, score: 100 });
    rt.mocks!.oracle.script("task-n2", { passed: true, score: 100 });

    const clearing = makeClearing(graph);
    clearing.allocations[0]!.providerId = pUp.id;
    const providers = await rt.store.listAllProviders();
    clearing.allocations[1]!.providerId = providers[1]!.id;

    const report = await executeClearing(rt.core, graph, clearing, {
      clock: () => t++,
      events: rt.store,
    });

    expect(report.nodes).toHaveLength(2);
    expect(report.nodes[0]!.outcome?.providerId).toBe(pUp.id);
    expect(report.nodes[0]!.outcome?.realizedCostUsdc).toBe("0.07");
    expect(report.nodes[0]!.action).toBe("release");

    const outcomes = await rt.store.listOutcomes();
    expect(outcomes[0]!.providerId).toBe(pUp.id);
    expect(outcomes[0]!.realizedCostUsdc).toBe("0.07");

    const events = await rt.store.listEvents();
    const clearingEvent = events.find((e) => e.kind === "clearing");
    expect(clearingEvent).toBeDefined();
    expect(
      (clearingEvent!.payload as { shadowPricesUsdc?: Record<string, string> })
        .shadowPricesUsdc,
    ).toEqual({ budget: "0.000000" });
    expect(events.some((e) => e.kind === "settle")).toBe(true);

    rt.store.close();
    cleanup();
  });

  it("propagates upstream failure and skips downstream payment", async () => {
    const { path, cleanup } = tempDb();
    let t = 2000;
    const rt = assemble({ mode: "mock", dbPath: path, now: () => t++ });
    const graph = makeGraph();

    await rt.core.registerProvider({
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.a", "cap.b"],
      endpoint: "https://p.example",
      priceSurface: () => "0.10",
      bondBalanceUsdc: "1.00",
      status: "active",
    });
    const p = (await rt.store.listAllProviders())[0]!;

    rt.mocks!.oracle.script("task-n1", { passed: false, score: 0 });

    const clearing = makeClearing(graph);
    clearing.allocations[0]!.providerId = p.id;
    clearing.allocations[1]!.providerId = p.id;

    const report = await executeClearing(rt.core, graph, clearing, {
      clock: () => t++,
      events: rt.store,
    });

    expect(report.nodes[0]!.action).toBe("slash");
    expect(report.nodes[1]!.skipped).toBe(true);
    expect(rt.mocks!.settlement.payments).toHaveLength(1);

    rt.store.close();
    cleanup();
  });

  it("skips nodes with no matching allocation", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    const graph = makeGraph();
    const clearing = makeClearing(graph);
    clearing.allocations = [];

    const report = await executeClearing(rt.core, graph, clearing);
    expect(report.nodes.every((n) => n.skipped)).toBe(true);

    rt.store.close();
    cleanup();
  });

  it("resolves allocation via schedule index fallback", async () => {
    const { path, cleanup } = tempDb();
    let t = 3000;
    const rt = assemble({ mode: "mock", dbPath: path, now: () => t++ });
    const graph: TaskGraph = {
      id: "g-fallback",
      nodes: [makeGraph().nodes[0]!],
      edges: [],
      globalBudgetUsdc: "5.00",
      globalDeadlineMs: 120_000,
    };

    await rt.core.registerProvider({
      wallet: "0x1111111111111111111111111111111111111111",
      capabilities: ["cap.a"],
      endpoint: "https://p.example",
      priceSurface: () => "0.10",
      bondBalanceUsdc: "1.00",
      status: "active",
    });
    const p = (await rt.store.listAllProviders())[0]!;
    rt.mocks!.oracle.script("task-n1", { passed: true });

    const clearing = makeClearing(graph);
    clearing.allocations = [
      {
        taskId: "wrong-id",
        providerId: p.id,
        mechanism: "posted",
        score: 1,
      },
    ];
    clearing.schedule = [{ nodeId: "n1", startMs: 0, durationMs: 50, endMs: 50 }];

    const report = await executeClearing(rt.core, graph, clearing, {
      clock: () => t++,
    });
    expect(report.nodes[0]!.skipped).toBe(false);
    expect(report.nodes[0]!.providerId).toBe(p.id);

    rt.store.close();
    cleanup();
  });
});

describe("assemble", () => {
  it("boots mock mode and reports health", async () => {
    const { path, cleanup } = tempDb();
    const rt = assemble({ mode: "mock", dbPath: path });
    const health = await rt.health();
    expect(health.mode).toBe("mock");
    expect(health.db).toBe(path);
    rt.store.close();
    cleanup();
  });

  it("rejects live mode without required env vars", () => {
    const { path, cleanup } = tempDb();
    const prev = process.env.OWNER_PRIVATE_KEY;
    delete process.env.OWNER_PRIVATE_KEY;
    expect(() => assemble({ mode: "live", dbPath: path })).toThrow(
      /OWNER_PRIVATE_KEY/,
    );
    if (prev) process.env.OWNER_PRIVATE_KEY = prev;
    cleanup();
  });
});
