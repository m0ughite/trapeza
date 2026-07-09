import { describe, expect, it } from "vitest";
import { RUNS } from "../src/fixtures";
import { buildCapabilityCatalog } from "../src/lib/capabilityCatalog";
import {
  buildDefaultSimpleInput,
  expandSimpleInput,
  RISK_AVERSION,
  type SimpleRunInput,
} from "../src/lib/simpleInput";
import { validateRunPayload } from "../src/lib/liveRunContract";

const catalog = buildCapabilityCatalog(RUNS);

function base(): SimpleRunInput {
  return {
    name: "test-flow",
    budgetUsdc: "3.00",
    risk: "medium",
    steps: [
      { id: "parse", capability: "doc.parse" },
      { id: "extract", capability: "data.extract", dependsOn: ["parse"] },
      { id: "reconcile", capability: "data.reconcile", dependsOn: ["extract"] },
    ],
  };
}

describe("expandSimpleInput", () => {
  it("expands a happy-path workflow into a contract-valid payload", () => {
    const { payload, issues } = expandSimpleInput(base(), catalog);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(payload).not.toBeNull();
    expect(validateRunPayload(payload!)).toEqual([]);
    expect(payload!.graph.nodes.map((n) => n.nodeId)).toEqual(["parse", "extract", "reconcile"]);
    expect(payload!.graph.edges).toEqual([
      { from: "parse", to: "extract" },
      { from: "extract", to: "reconcile" },
    ]);
  });

  it("auto-fills providers, prices and bonds from the catalog (user supplies none)", () => {
    const { payload } = expandSimpleInput(base(), catalog);
    expect(payload!.providers.length).toBeGreaterThan(0);
    // every used capability is backed by at least one provider
    for (const node of payload!.graph.nodes) {
      const backing = payload!.providers.filter((p) => p.capabilities.includes(node.capability));
      expect(backing.length).toBeGreaterThan(0);
    }
    // providers are deduped by id and sorted
    const ids = payload!.providers.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
    // every node gets a positive default value + budget
    for (const node of payload!.graph.nodes) {
      expect(Number(node.valueUsdc)).toBeGreaterThan(0);
      expect(Number(node.budgetUsdc)).toBeGreaterThan(0);
    }
  });

  it("auto-sizes a budget when none is supplied", () => {
    const input = base();
    delete input.budgetUsdc;
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(Number(payload!.run.budgetUsdc)).toBeGreaterThan(0);
    expect(payload!.run.budgetUsdc).toBe(payload!.graph.globalBudgetUsdc);
  });

  it("maps risk levels to riskAversion", () => {
    for (const risk of ["low", "medium", "high"] as const) {
      const input = { ...base(), risk };
      const { payload } = expandSimpleInput(input, catalog);
      expect(payload!.run.riskAversion).toBe(RISK_AVERSION[risk]);
      expect(payload!.graph.riskAversion).toBe(RISK_AVERSION[risk]);
    }
  });

  it("rejects an unknown capability and lists the valid ones", () => {
    const input = base();
    input.steps[1]!.capability = "totally.made.up";
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).toBeNull();
    const issue = issues.find((i) => i.code === "unknown-capability");
    expect(issue).toBeTruthy();
    expect(issue!.message).toContain("doc.parse");
  });

  it("rejects cyclic dependencies and points at the steps", () => {
    const input = base();
    input.steps[0]!.dependsOn = ["reconcile"]; // parse ← reconcile ← extract ← parse
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).toBeNull();
    expect(issues.some((i) => i.code === "cyclic-dependency")).toBe(true);
  });

  it("rejects self-dependencies", () => {
    const input = base();
    input.steps[0]!.dependsOn = ["parse"];
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).toBeNull();
    expect(issues.some((i) => i.code === "self-dependency")).toBe(true);
  });

  it("resolves dependencies given by 0-based index", () => {
    const input: SimpleRunInput = {
      budgetUsdc: "3.00",
      steps: [
        { id: "a", capability: "doc.parse" },
        { id: "b", capability: "data.extract", dependsOn: [0] },
      ],
    };
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(payload!.graph.edges).toEqual([{ from: "a", to: "b" }]);
  });

  it("flags an out-of-range dependency index", () => {
    const input: SimpleRunInput = {
      steps: [{ id: "a", capability: "doc.parse", dependsOn: [7] }],
    };
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).toBeNull();
    expect(issues.some((i) => i.code === "unknown-dependency")).toBe(true);
  });

  it("warns (but does not block) when the budget is too low", () => {
    const input = { ...base(), budgetUsdc: "0.05" };
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).not.toBeNull();
    const warn = issues.find((i) => i.code === "budget-too-low");
    expect(warn).toBeTruthy();
    expect(warn!.severity).toBe("warning");
  });

  it("rejects empty steps", () => {
    const { payload, issues } = expandSimpleInput({ steps: [] }, catalog);
    expect(payload).toBeNull();
    expect(issues.some((i) => i.code === "empty-steps")).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const input: SimpleRunInput = {
      budgetUsdc: "3.00",
      steps: [
        { id: "dup", capability: "doc.parse" },
        { id: "dup", capability: "data.extract" },
      ],
    };
    const { issues } = expandSimpleInput(input, catalog);
    expect(issues.some((i) => i.code === "duplicate-step-id")).toBe(true);
  });

  it("rejects an invalid risk level", () => {
    const input = { ...base(), risk: "extreme" as unknown as SimpleRunInput["risk"] };
    const { payload, issues } = expandSimpleInput(input, catalog);
    expect(payload).toBeNull();
    expect(issues.some((i) => i.code === "invalid-risk")).toBe(true);
  });
});

describe("buildDefaultSimpleInput", () => {
  it("produces a one-click example that clears", () => {
    const example = buildDefaultSimpleInput(catalog);
    expect(example.steps.length).toBeGreaterThanOrEqual(2);
    expect(example.budgetUsdc).toBeTruthy();
    const { payload, issues } = expandSimpleInput(example, catalog);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(payload).not.toBeNull();
    expect(validateRunPayload(payload!)).toEqual([]);
  });
});
