import { useEffect, useMemo, useState } from "react";
import type { TraceStep } from "../types/contract";
import { Badge, Collapsible, Panel } from "./ui";

const PHASE_TONE: Record<TraceStep["phase"], "mint" | "amber" | "violet" | "blue" | "default"> = {
  "validate-dag": "blue",
  "score-candidates": "violet",
  assign: "mint",
  schedule: "blue",
  "deadline-check": "amber",
  preflight: "amber",
  "shadow-prices": "violet",
  "bake-off": "violet",
  calibration: "mint",
  twin: "blue",
  settlement: "mint",
};

export function RunTracePanel(props: {
  trace: TraceStep[] | undefined;
  onActiveNode?: (nodeId: string | undefined) => void;
}) {
  const { trace } = props;
  const [currentSeq, setCurrentSeq] = useState(1);
  const [playing, setPlaying] = useState(false);

  const steps = trace ?? [];
  const current = useMemo(
    () => steps.find((s) => s.seq === currentSeq) ?? steps[0],
    [steps, currentSeq],
  );

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const t = window.setInterval(() => {
      setCurrentSeq((s) => {
        const max = steps[steps.length - 1]!.seq;
        if (s >= max) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => window.clearInterval(t);
  }, [playing, steps]);

  useEffect(() => {
    props.onActiveNode?.(current?.nodeId);
  }, [current?.nodeId, props.onActiveNode]);

  if (!steps.length) {
    return (
      <Panel title="Run trace" sub="Step-by-step clearing log — emitted with each fixture.">
        <div className="callout">No trace data in this fixture. Re-run demo:emit to generate.</div>
      </Panel>
    );
  }

  const minSeq = steps[0]!.seq;
  const maxSeq = steps[steps.length - 1]!.seq;

  return (
    <Panel
      title="Run trace"
      sub="Step through the clearing log. The highlighted node in the graph follows the current step."
      right={<Badge tone="violet">{steps.length} steps</Badge>}
    >
      <div className="trace-controls">
        <button
          className="btn ghost"
          disabled={currentSeq <= minSeq}
          onClick={() => setCurrentSeq((s) => Math.max(minSeq, s - 1))}
        >
          ◂ prev
        </button>
        <button className="btn ghost" onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ pause" : "▶ play"}
        </button>
        <button
          className="btn ghost"
          disabled={currentSeq >= maxSeq}
          onClick={() => setCurrentSeq((s) => Math.min(maxSeq, s + 1))}
        >
          next ▸
        </button>
        <span className="trace-pos">
          step {currentSeq} / {maxSeq}
        </span>
      </div>

      {current ? (
        <div className={`trace-current trace-level-${current.level}`}>
          <Badge tone={PHASE_TONE[current.phase]}>{current.phase}</Badge>
          {current.nodeId ? <span className="mono">{current.nodeId}</span> : null}
          <p>{current.message}</p>
          {current.data ? (
            <Collapsible label="Step data">
              <pre className="trace-data">{JSON.stringify(current.data, null, 2)}</pre>
            </Collapsible>
          ) : null}
        </div>
      ) : null}

      <ol className="trace-list">
        {steps.map((s) => (
          <li
            key={s.seq}
            className={`trace-item${s.seq === currentSeq ? " active" : ""}${s.seq < currentSeq ? " past" : ""}`}
          >
            <button type="button" onClick={() => setCurrentSeq(s.seq)}>
              <span className="trace-seq">{s.seq}</span>
              <Badge tone={PHASE_TONE[s.phase]}>{s.phase}</Badge>
              {s.nodeId ? <span className="mono trace-node">{s.nodeId}</span> : null}
              <span className="trace-msg">{s.message}</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
