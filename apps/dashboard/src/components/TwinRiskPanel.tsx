import type { TwinMonteCarlo } from "../types/contract";
import { Bar, Badge, Collapsible, Panel, Stat } from "./ui";
import { ms, pct, usd } from "../services/format";

export function TwinRiskPanel(props: { twin: TwinMonteCarlo | null }) {
  const t = props.twin;
  return (
    <Panel
      title="Failure, deadline & budget risk"
      right={t ? <Badge tone="violet">{t.iterations.toLocaleString()} simulations</Badge> : undefined}
      sub="Before committing on-chain, the cleared plan is replayed thousands of times using each provider's real outcome distribution — scoring how often it fails, misses the deadline or overruns the budget."
    >
      {!t ? (
        <div className="callout">No risk preflight was recorded for this scenario.</div>
      ) : (
        <>
          <div className="stat-row" style={{ marginBottom: 14 }}>
            <Stat k="expected net cost" v={usd(t.expectedNetCostUsdc)} tone="violet" />
            <Stat k="deadline modeled" v={ms(t.deadlineMs)} small />
            <Stat k="simulations" v={t.iterations.toLocaleString()} small />
          </div>
          <table className="t">
            <tbody>
              {[
                { label: "chance the plan fails", v: t.failureProbability, tone: "red" as const },
                {
                  label: "chance it misses the deadline",
                  v: t.deadlineBreachProbability,
                  tone: "amber" as const,
                },
                {
                  label: "chance it overruns the budget",
                  v: t.budgetOverrunProbability,
                  tone: "violet" as const,
                },
              ].map((row) => (
                <tr key={row.label}>
                  <td style={{ width: "40%" }}>{row.label}</td>
                  <td>
                    <Bar value={row.v} tone={row.tone} />
                  </td>
                  <td className="mono" style={{ width: 62, textAlign: "right" }}>
                    {pct(row.v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <Collapsible label="How the preflight works">
        <p>
          Trapeza takes a snapshot of the settlement state and forks it off-chain, then simulates the
          cleared plan many times — each run drawing a success or failure for every step from that
          provider&apos;s realized outcome distribution. Aggregating the runs gives the tail
          probabilities above.
        </p>
        <p>
          The point is &ldquo;think before you pay&rdquo;: if the plan is too likely to fail or
          overspend, the market can fix the clearing before a single cent moves. Nothing here touches
          the chain.
        </p>
      </Collapsible>
    </Panel>
  );
}
