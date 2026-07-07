import type { BakeOff, BakeOffSolverResult, SolverKind } from "../types/contract";
import { Badge, Collapsible, Panel } from "./ui";
import { num, plain } from "../services/format";

/** Plain-language name for a solver, so the UI never leans on jargon. */
function solverName(kind: SolverKind): string {
  if (kind === "greedy_lns") return "Greedy per-task router";
  return "Whole-graph clearing";
}

function SolverCard(props: { r: BakeOffSolverResult; win: boolean }) {
  const { r, win } = props;
  const failed = r.status === "failed";
  return (
    <div className={`solver-card ${win ? "win" : failed ? "lose" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>{solverName(r.kind)}</strong>
        {win ? <Badge tone="mint">winner</Badge> : failed ? <Badge tone="red">busts</Badge> : null}
      </div>
      {failed ? (
        <>
          <div className="sc-obj" style={{ color: "var(--bad)" }}>
            no feasible plan
          </div>
          <div className="sub" style={{ margin: 0 }}>
            {r.errorMessage ?? "Ran out of budget before the bottleneck step."}
          </div>
        </>
      ) : (
        <>
          <div className="sc-obj" style={{ color: win ? "var(--accent)" : "var(--text)" }}>
            {num(r.objectiveValue ?? 0, 4)}
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
              plan score
            </span>
          </div>
          <table className="t" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>step</th>
                <th>provider</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {r.assignments.map((a) => (
                <tr key={a.nodeId}>
                  <td>{a.nodeId}</td>
                  <td className="mono">{a.providerId}</td>
                  <td>{num(a.score, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export function BakeOffPanel(props: { bakeOff: BakeOff }) {
  const { bakeOff } = props;
  return (
    <Panel
      title="Same graph, two solvers"
      right={<Badge tone="mint">best plan wins</Badge>}
      sub="The naive router picks each step in isolation, blind to the shared budget, deadline and quality floors. The whole-graph clearing sees every step at once."
    >
      <div className="bakeoff">
        <SolverCard r={bakeOff.greedy} win={bakeOff.winner === bakeOff.greedy.kind} />
        <SolverCard r={bakeOff.optimal} win={bakeOff.winner === bakeOff.optimal.kind} />
      </div>
      <div className="callout" style={{ marginTop: 14 }}>
        {plain(bakeOff.narrative)}
      </div>
      <Collapsible label="How the two solvers differ">
        <p>
          The per-task router walks the workflow in order and hires the best provider it can afford
          at each step. Because it can&apos;t see ahead, it may spend the budget on easy steps and
          leave nothing for the step that decides success.
        </p>
        <p>
          The whole-graph clearing solves all steps jointly with an exact constraint solver, so it
          can deliberately pick cheaper-but-adequate providers early to reserve budget for the
          bottleneck. It follows the familiar pattern of solving off-chain and then settling
          on-chain in a single batch.
        </p>
      </Collapsible>
    </Panel>
  );
}
