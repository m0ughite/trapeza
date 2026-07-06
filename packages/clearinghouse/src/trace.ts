export type TracePhase =
  | "validate-dag"
  | "score-candidates"
  | "assign"
  | "schedule"
  | "deadline-check"
  | "preflight"
  | "shadow-prices"
  | "bake-off"
  | "calibration"
  | "twin"
  | "settlement";

export type TraceLevel = "info" | "warn" | "error";

export interface TraceStep {
  seq: number;
  phase: TracePhase;
  nodeId?: string;
  level: TraceLevel;
  message: string;
  data?: Record<string, unknown>;
}

export type TraceSink = (step: Omit<TraceStep, "seq">) => void;

export function createTraceCollector(): {
  sink: TraceSink;
  steps: TraceStep[];
} {
  const steps: TraceStep[] = [];
  let seq = 0;
  const sink: TraceSink = (partial) => {
    seq += 1;
    steps.push({ seq, ...partial });
  };
  return { sink, steps };
}
