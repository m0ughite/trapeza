import { useMemo, useState } from "react";
import type { AgentView } from "../types/contract";
import { Badge, Bar, Panel } from "./ui";
import { pct, shortHash } from "../services/format";

function archetypeTone(archetype: AgentView["archetype"]): "mint" | "amber" | "blue" {
  if (archetype === "workhorse") return "mint";
  if (archetype === "braggart") return "amber";
  return "blue";
}

export function AgentsPanel(props: { agents: AgentView[] }) {
  const [cap, setCap] = useState<string | null>(null);
  const allCaps = useMemo(() => {
    const t = new Set<string>();
    for (const a of props.agents) for (const c of a.capabilities) t.add(c);
    return [...t].sort();
  }, [props.agents]);

  const filtered = useMemo(() => {
    if (!cap) return props.agents;
    return props.agents.filter((a) => a.capabilities.includes(cap));
  }, [props.agents, cap]);

  return (
    <Panel
      title="ArcTask agent registry"
      right={<Badge tone="blue">{props.agents.length} agents</Badge>}
      sub="Bundled snapshot of agents registered on ArcTask. Claimed success is what they advertise; calibrated success is what they have actually delivered. Compose a workflow from these agents in the panel below."
    >
      <div className="tag-filters">
        <button
          type="button"
          className={`tag-chip${cap === null ? " active" : ""}`}
          onClick={() => setCap(null)}
        >
          all
        </button>
        {allCaps.map((t) => (
          <button
            key={t}
            type="button"
            className={`tag-chip${cap === t ? " active" : ""}`}
            onClick={() => setCap(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="agent-grid">
        {filtered.map((a) => (
          <div key={a.agentId} className="agent-card">
            <div className="ec-top">
              <span className="ec-title">Agent #{a.agentId}</span>
              <Badge tone={a.active ? "mint" : "red"}>{a.active ? "active" : "inactive"}</Badge>
            </div>
            <div className="agent-meta mono">{shortHash(a.wallet, 8, 6)}</div>
            <div className="ec-tags">
              {a.capabilities.map((c) => (
                <span key={c} className="ec-tag">
                  {c}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ width: 52, fontSize: 12, color: "var(--text-muted)" }}>claims</span>
                <div style={{ flex: 1 }}>
                  <Bar value={a.claimedSuccessProb} tone="amber" />
                </div>
                <span style={{ width: 36, fontSize: 12 }}>{pct(a.claimedSuccessProb, 0)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 52, fontSize: 12, color: "var(--text-muted)" }}>delivers</span>
                <div style={{ flex: 1 }}>
                  <Bar value={a.calibratedSuccessProb} tone="mint" />
                </div>
                <span style={{ width: 36, fontSize: 12 }}>{pct(a.calibratedSuccessProb, 0)}</span>
              </div>
            </div>
            <div className="ec-meta" style={{ marginTop: 10 }}>
              <Badge tone={archetypeTone(a.archetype)}>{a.archetype}</Badge>
              <span>·</span>
              <span>bond {a.bondUsdc} USDC</span>
              <span>·</span>
              <span>{a.nObservations} jobs</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
