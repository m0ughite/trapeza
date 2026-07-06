import {
  greedyAssign,
  lnsImprove,
  meetsGlobalQuality,
  objectiveFromAssignments,
} from "./score.js";
import { ClearingError, type SolverInput, type SolverResult } from "./types.js";

function assertGlobalQuality(
  input: SolverInput,
  assignments: import("./types.js").NodeAssignment[],
  useCalibration: boolean,
): void {
  if (!meetsGlobalQuality(input, assignments, useCalibration)) {
    throw new ClearingError(
      `assignment violates global quality floor ${input.graph.globalQualityFloor}`,
      "INFEASIBLE",
    );
  }
}

export function solveGreedyLns(input: SolverInput): SolverResult {
  const useCalibration = input.useCalibration ?? true;
  const seed = input.seed ?? 42;
  const assignments = lnsImprove(input, seed, 30, useCalibration);
  assertGlobalQuality(input, assignments, useCalibration);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}

export function solveGreedyOnly(input: SolverInput): SolverResult {
  const useCalibration = input.useCalibration ?? true;
  const assignments = greedyAssign(input, useCalibration);
  assertGlobalQuality(input, assignments, useCalibration);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}
