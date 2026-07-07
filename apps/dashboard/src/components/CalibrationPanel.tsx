import { useState } from "react";
import type { CalibrationContrast, ProviderView } from "../types/contract";
import { Badge, Bar, Collapsible, Panel, Stat, Tooltip } from "./ui";
import { pct, pctSmall, usd } from "../services/format";

/**
 * The moat. Same market, one switch: OFF trusts self-reported claims, ON trusts
 * the realized-outcome ledger. The toggle flips the allocation and shows the
 * lemons collapse vs. quality re-emergence.
 */
export function CalibrationPanel(props: {
  calibration: CalibrationContrast;
  providers: ProviderView[];
}) {
  const { calibration, providers } = props;
  const [mode, setMode] = useState<"on" | "off">("on");
  const active = calibration[mode];
  const chosen = new Map(active.allocations.map((a) => [a.nodeId, a.providerId]));
  const chosenIds = new Set(active.allocations.map((a) => a.providerId));

  const uncalibrated = providers.every((p) => p.nObservations === 0);

  return (
    <Panel
      title="Claimed vs. delivered"
      right={
        <div className="toggle" role="group" aria-label="calibration mode">
          <button
            className={`toggle-btn${mode === "off" ? " active" : ""}`}
            onClick={() => setMode("off")}
          >
            Calibration OFF
          </button>
          <button
            className={`toggle-btn${mode === "on" ? " active" : ""}`}
            onClick={() => setMode("on")}
          >
            Calibration ON
          </button>
        </div>
      }
      sub="OFF hires on the success rate providers claim; ON hires on the rate they have actually delivered. Bars show claimed (amber) vs. delivered (mint); the ★ marks who this mode hires."
    >
      {uncalibrated ? (
        <div className="callout warn" style={{ marginBottom: 14 }}>
          Providers in this run have no track record yet, so ON and OFF pick the same plan. Switch to
          the invoice or research scenario to see the full contrast.
        </div>
      ) : null}

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <Stat
          k={`real end-to-end success (${mode})`}
          v={pctSmall(active.realizedEndToEndSuccess)}
          tone={mode === "on" ? "mint" : undefined}
          note="chance the whole workflow actually succeeds"
        />
        <Stat
          k="what the claims promised"
          v={pctSmall(active.claimedEndToEndSuccess)}
          note="if you believed every provider's pitch"
        />
        <Stat
          k="success gained by ON"
          v={pct(calibration.successLift)}
          tone="mint"
          note={`${calibration.divergentNodes.length} step(s) re-routed`}
        />
        <Stat k={`expected spend (${mode})`} v={usd(active.expectedSpendUsdc)} small />
      </div>

      <table className="t">
        <thead>
          <tr>
            <th>provider</th>
            <th>type</th>
            <th style={{ width: "22%" }}>
              claims{" "}
              <Tooltip>The success rate the provider advertises in its bid — never trusted directly.</Tooltip>
            </th>
            <th style={{ width: "22%" }}>
              delivers{" "}
              <Tooltip>The success rate estimated from this provider&apos;s realized track record.</Tooltip>
            </th>
            <th>jobs seen</th>
            <th>hired</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => {
            const hired = chosenIds.has(p.id);
            const tone =
              p.archetype === "braggart" ? "amber" : p.archetype === "workhorse" ? "mint" : "blue";
            return (
              <tr key={p.id} style={hired ? { background: "rgba(61,220,151,0.05)" } : undefined}>
                <td className="mono">{p.id}</td>
                <td>
                  <Badge tone={tone}>{p.archetype}</Badge>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 42 }}>{pct(p.claimedSuccessProb, 0)}</span>
                    <div style={{ flex: 1 }}>
                      <Bar value={p.claimedSuccessProb} tone="amber" />
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 42 }}>{pct(p.calibratedSuccessProb, 0)}</span>
                    <div style={{ flex: 1 }}>
                      <Bar value={p.calibratedSuccessProb} tone="mint" />
                    </div>
                  </div>
                </td>
                <td>{p.nObservations}</td>
                <td>{hired ? <span style={{ color: "var(--accent)" }}>★</span> : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-dim)" }}>
        Plan ({mode}):{" "}
        {active.allocations.length
          ? active.allocations.map((a) => `${a.nodeId} → ${chosen.get(a.nodeId)}`).join(",  ")
          : "no feasible plan on claims alone"}
      </div>

      <Collapsible label="How providers get scored">
        <p>
          Every finished job updates a running estimate of each provider&apos;s success rate — a
          Bayesian tally of wins and losses that starts skeptical and tightens with evidence. New
          providers sit near a coin-flip until they build a record.
        </p>
        <p>
          With calibration OFF the market takes bids at face value and routes to whoever claims the
          highest number — so confident-but-unreliable providers (&ldquo;braggarts&rdquo;) win and the
          workflow quietly collapses. With it ON, the delivered rate drives the allocation and the
          quiet performers (&ldquo;workhorses&rdquo;) get the work.
        </p>
      </Collapsible>
    </Panel>
  );
}
