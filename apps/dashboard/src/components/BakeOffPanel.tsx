import type { BakeOff, BakeOffSolverResult, SolverKind } from "../types/contract";
import { Badge, Collapsible, Panel } from "./ui";
import { num, plain } from "../services/format";

/** Plain-language name for a solver, so the UI never leans on jargon. */
function solverName(kind: SolverKind): string {
  if (kind === "greedy_lns") return "Greedy per-task router";
  return "Whole-graph clearing";
}

function SolverCard(props: { r: BakeOffSolverResult; win: boolean; tie: boolean }) {
  const { r, win, tie } = props;
  const failed = r.status === "failed";
  const cls = tie ? "tie" : win ? "win" : failed ? "lose" : "";
  return (
    <div className={`solver-card ${cls}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>{solverName(r.kind)}</strong>
        {tie ? (
          <Badge>matched</Badge>
        ) : win ? (
          <Badge tone="mint">winner</Badge>
        ) : failed ? (
          <Badge tone="red">busts</Badge>
        ) : null}
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
          <div className="sc-obj" style={{ color: win && !tie ? "var(--accent)" : "var(--text)" }}>
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

/**
 * A "tie" is when both solvers produced a feasible plan with effectively equal
 * objective values. The graph solver's number is rounded to 6 dp on the Python
 * side while greedy carries full float precision, so we compare with a small
 * epsilon rather than for exact equality.
 */
function isTie(bakeOff: BakeOff): boolean {
  const { greedy, optimal } = bakeOff;
  if (greedy.status !== "cleared" || optimal.status !== "cleared") return false;
  if (greedy.objectiveValue == null || optimal.objectiveValue == null) return false;
  return Math.abs(greedy.objectiveValue - optimal.objectiveValue) <= 1e-3;
}

export function BakeOffPanel(props: { bakeOff: BakeOff }) {
  const { bakeOff } = props;
  const tie = isTie(bakeOff);
  const greedyWins = !tie && bakeOff.winner === bakeOff.greedy.kind;
  const optimalWins = !tie && bakeOff.winner === bakeOff.optimal.kind;

  return (
    <Panel
      title="Same graph, two solvers"
      right={<Badge tone={tie ? "default" : "mint"}>{tie ? "tie on this graph" : "best plan wins"}</Badge>}
      sub="The naive router picks each step in isolation, blind to the shared budget, deadline and quality floors. The whole-graph clearing sees every step at once."
    >
      <div className="bakeoff">
        <SolverCard r={bakeOff.greedy} win={greedyWins} tie={tie} />
        <SolverCard r={bakeOff.optimal} win={optimalWins} tie={tie} />
      </div>
      <div className="callout" style={{ marginTop: 14 }}>
        {tie ? (
          <>
            <strong>Tie — greedy matches the optimum on this graph.</strong> No global constraint
            (budget, deadline, quality floor or bond) binds here, so picking the best provider for
            each step independently already gives the optimal whole-graph plan. Both solvers return
            the same feasible allocation and the same plan score — this is not a case where solving
            jointly changes the answer. To see the graph solver pull ahead, switch to the{" "}
            <strong>Data ETL &amp; reconciliation</strong> scenario, where a tight budget makes the
            greedy router bust.
          </>
        ) : (
          plain(bakeOff.narrative)
        )}
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
