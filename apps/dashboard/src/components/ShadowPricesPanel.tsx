import type { ClearingView } from "../types/contract";
import { Bar, Collapsible, Panel, Tooltip } from "./ui";
import { num } from "../services/format";

function label(key: string): string {
  if (key === "budget") return "Budget — value of one more dollar";
  if (key === "deadline") return "Deadline — value of one more second";
  if (key.startsWith("capacity:")) return `Provider demand · ${key.slice("capacity:".length)}`;
  return key;
}

export function ShadowPricesPanel(props: { clearing: ClearingView }) {
  const entries = Object.entries(props.clearing.shadowPricesUsdc)
    .map(([k, v]) => ({ k, v: Number(v) }))
    .sort((a, b) => b.v - a.v);
  const max = Math.max(0.000001, ...entries.map((e) => e.v));
  const binding = entries.filter((e) => e.v > 0);

  return (
    <Panel
      title="Constraint prices"
      right={
        <span className="hint">
          what&apos;s scarce{" "}
          <Tooltip>
            A price above zero means that limit is fully used and is holding the plan back — loosening
            it would let the market clear more value.
          </Tooltip>
        </span>
      }
      sub="For each limit in the workflow — the budget, the deadline, each provider — this shows how much more value the plan could capture if you relaxed it by one unit. Zero means there's slack."
    >
      {binding.length === 0 ? (
        <div className="callout">
          Nothing is binding in this plan — budget, deadline and provider availability all have room
          to spare, so no single limit is holding the clearing back.
        </div>
      ) : (
        <table className="t">
          <thead>
            <tr>
              <th>limit</th>
              <th style={{ width: "45%" }}>how much it&apos;s worth to loosen</th>
              <th>value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.k} style={e.v > 0 ? { background: "rgba(74,168,255,0.05)" } : undefined}>
                <td>{label(e.k)}</td>
                <td>
                  <Bar value={e.v} max={max} tone="blue" />
                </td>
                <td className="mono">{num(e.v, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Collapsible label="How to read these prices">
        <p>
          These are the clearing&apos;s marginal prices: the extra plan value unlocked per additional
          unit of a scarce resource. A high budget price, for example, says the workflow is
          cash-starved — an extra dollar would buy more than a dollar of value, which is exactly why
          the bottleneck step clears at a premium.
        </p>
        <p>
          They&apos;re shown for insight only. Actual settlement uses the discriminatory
          lower-of-ask-and-reserve price per step, so surplus stays with the buyer.
        </p>
      </Collapsible>
    </Panel>
  );
}
