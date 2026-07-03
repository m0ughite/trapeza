import {
  greedyAssign,
  lnsImprove,
  meetsGlobalQuality,
  objectiveFromAssignments,
} from "./score.js";
import { ClearingError, type SolverInput, type SolverResult } from "./types.js";

function assertGlobalQuality(input: SolverInput, assignments: import("./types.js").NodeAssignment[]): void {
  if (!meetsGlobalQuality(input, assignments)) {
    throw new ClearingError(
      `assignment violates global quality floor ${input.graph.globalQualityFloor}`,
      "INFEASIBLE",
    );
  }
}

export function solveGreedyLns(input: SolverInput): SolverResult {
  const seed = input.seed ?? 42;
  const assignments = lnsImprove(input, seed);
  assertGlobalQuality(input, assignments);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}

export function solveGreedyOnly(input: SolverInput): SolverResult {
  const assignments = greedyAssign(input);
  assertGlobalQuality(input, assignments);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}
