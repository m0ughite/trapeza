import {
  greedyAssign,
  lnsImprove,
  objectiveFromAssignments,
} from "./score.js";
import type { SolverInput, SolverResult } from "./types.js";

export function solveGreedyLns(input: SolverInput): SolverResult {
  const seed = input.seed ?? 42;
  const assignments = lnsImprove(input, seed);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}

export function solveGreedyOnly(input: SolverInput): SolverResult {
  const assignments = greedyAssign(input);
  return {
    assignments,
    objectiveValue: objectiveFromAssignments(input, assignments),
    solver: "greedy_lns",
  };
}
