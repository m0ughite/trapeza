import { describe, expect, it } from "vitest";
import { computeSchedule } from "@trapeza/clearinghouse";
import { makeGraph, makeNode, makeSolverProvider } from "./helpers.js";

describe("DAG schedule", () => {
  it("makespan equals longest path on parallel branches", () => {
    const graph = makeGraph(
      [
        makeNode("a", { capability: "cap.a", deadlineMs: 60_000 }),
        makeNode("b", { capability: "cap.b", deadlineMs: 60_000 }),
        makeNode("c", { capability: "cap.c", deadlineMs: 60_000 }),
      ],
      [
        { from: "a", to: "c" },
        { from: "b", to: "c" },
      ],
    );

    const providers = [
      makeSolverProvider("p-a", {
        capability: "cap.a",
        claimedLatencyMs: 100,
      }),
      makeSolverProvider("p-b", {
        capability: "cap.b",
        claimedLatencyMs: 200,
      }),
      makeSolverProvider("p-c", {
        capability: "cap.c",
        claimedLatencyMs: 50,
      }),
    ];

    const assignments = [
      { nodeId: "a", providerId: "p-a", score: 1 },
      { nodeId: "b", providerId: "p-b", score: 1 },
      { nodeId: "c", providerId: "p-c", score: 1 },
    ];

    const { schedule, makespanMs } = computeSchedule(
      graph,
      assignments,
      providers,
    );
    expect(makespanMs).toBe(250);
    const c = schedule.find((s) => s.nodeId === "c")!;
    expect(c.startMs).toBe(200);
  });
});
