import { useState } from "react";
import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { Badge, Collapsible, Panel, Stat, Tooltip } from "../components/ui";
import { DagView } from "../components/DagView";
import { RunTracePanel } from "../components/RunTracePanel";
import { ms, num, plain, usd } from "../services/format";

export function ClearingPage() {
  const { run } = useScenario();
  const c = run.clearing;
  const [traceNode, setTraceNode] = useState<string | undefined>();

  return (
    <>
      <PageHeader path="/clearing" />
      <Panel
        title="The cleared workflow"
        headline
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <Badge tone="mint">graph solver</Badge>
            {c.degraded ? <Badge tone="amber">degraded</Badge> : null}
            {c.preflightPassed ? (
              <Badge tone="mint">preflight ok</Badge>
            ) : (
              <Badge tone="red">blocked</Badge>
            )}
          </div>
        }
        sub={plain(run.meta.narrative)}
      >
        <div className="stat-row" style={{ marginBottom: 14 }}>
          <Stat
            k="plan score"
            v={num(c.objectiveValue, 4)}
            tone="mint"
            note="expected value − cost − risk, summed over the plan"
          />
          <Stat k="total cleared" v={usd(c.totalClearedUsdc)} />
          <Stat k="makespan" v={ms(c.makespanMs)} small />
          <Stat k="steps" v={run.graph.nodes.length} small />
        </div>
        <DagView graph={run.graph} allocations={c.allocations} activeNodeId={traceNode} />
        <div style={{ marginTop: 16 }}>
          <RunTracePanel trace={run.trace} onActiveNode={setTraceNode} />
        </div>
        <div className="dag-legend">
          <span>
            <i className="chip chosen" /> chosen provider
          </span>
          <span>
            <i className="chip bottleneck" /> bottleneck step
          </span>
          <span>
            each box shows <strong>step · capability · value</strong> and the hired provider
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div className="mini-label">
              What each step pays{" "}
              <Tooltip>
                Each step settles at the lower of the provider&apos;s ask and the requester&apos;s
                reserve, so surplus stays with the buyer.
              </Tooltip>
            </div>
            <table className="t">
              <tbody>
                {Object.entries(c.settlementPricesUsdc).map(([n, p]) => (
                  <tr key={n}>
                    <td className="mono">{n}</td>
                    <td style={{ textAlign: "right" }}>{usd(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <div className="callout warn">
              <strong>Nothing moves until the plan is safe.</strong> The same clearing against an
              under-funded buyer is rejected before any money moves — {run.preflight.underFunded.summary}.
            </div>
          </div>
        </div>
        <Collapsible label="How the clearing works">
          <p>
            Trapeza takes the workflow as a directed graph of steps, each with a value, a capability
            and dependencies. It picks one provider per step to maximize
            <code> Σ (success × value − cost − risk)</code> subject to the shared budget, the
            deadline, per-step quality floors and provider bond limits.
          </p>
          <p>
            The reference clearings shown here are produced by an exact constraint solver running
            offline; the numbers are replayed verbatim so the demo has zero live dependency. The
            interactive <em>Run Your Own</em> page uses a lighter, instant solver.
          </p>
        </Collapsible>
      </Panel>
    </>
  );
}
