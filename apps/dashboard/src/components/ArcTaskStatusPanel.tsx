import { useEffect, useState } from "react";
import { fetchArcTaskStatus, type ArcTaskStatusResponse } from "../services/arctaskStatusClient";
import { Badge, Panel } from "./ui";
import { shortHash } from "../services/format";

function CheckBadge(props: { ok: boolean; label: string }) {
  return <Badge tone={props.ok ? "mint" : "amber"}>{props.label}</Badge>;
}

export function ArcTaskStatusPanel() {
  const [status, setStatus] = useState<ArcTaskStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const s = await fetchArcTaskStatus();
      if (!cancelled) {
        setStatus(s);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const c = status?.checks;

  return (
    <Panel
      title="ArcTask live readiness"
      right={
        <Badge tone={status?.liveReady ? "mint" : "amber"}>
          {loading ? "checking…" : status?.liveReady ? "live ready" : "not ready"}
        </Badge>
      }
      sub="Server env + ArcTask API + worker probes. Groq keys stay in ArcTask .env.local — never in this dashboard."
    >
      {status?.source === "unavailable" ? (
        <div className="callout warn" style={{ marginBottom: 12 }}>
          Status API unreachable. Restart with <code>npm run dev</code> from <code>apps/dashboard</code>{" "}
          (Vite now serves <code>/api/*</code> locally) or use <code>npm run dev:full</code>.
        </div>
      ) : null}
      {status?.error && status.source === "serverless" ? (
        <div className="callout warn" style={{ marginBottom: 12 }}>
          {status.error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <CheckBadge ok={Boolean(c?.trapezaLiveOnchain)} label="TRAPEZA_LIVE_ONCHAIN" />
        <CheckBadge ok={Boolean(c?.arctaskLiveMode)} label="ARCTASK_SIMULATED=false" />
        <CheckBadge ok={Boolean(c?.buyerKey)} label="buyer key" />
        <CheckBadge ok={Boolean(c?.validatorKey)} label="validator key" />
        <CheckBadge ok={Boolean(c?.arctaskApiReachable)} label="ArcTask API" />
        <CheckBadge ok={Boolean(c?.workerLive)} label="worker live" />
      </div>

      {c?.registryAddress ? (
        <div className="mono" style={{ fontSize: 12, marginBottom: 4 }}>
          registry {shortHash(c.registryAddress, 10, 8)}
        </div>
      ) : null}
      {c?.escrowAddress ? (
        <div className="mono" style={{ fontSize: 12, marginBottom: 4 }}>
          escrow {shortHash(c.escrowAddress, 10, 8)}
        </div>
      ) : null}
      {c?.arctaskApiBase ? (
        <div className="mono" style={{ fontSize: 12, marginBottom: 4 }}>
          API {c.arctaskApiBase}
        </div>
      ) : null}
      {c?.workerExecutor ? (
        <div style={{ fontSize: 12, marginBottom: 8, color: "var(--text-muted)" }}>
          worker executor: <span className="mono">{c.workerExecutor}</span>
        </div>
      ) : null}

      <div className="callout" style={{ fontSize: 13 }}>
        Groq / LLM config: <code>LLM_BASE_URL</code>, <code>LLM_API_KEY</code>, <code>LLM_MODEL</code> in
        ArcTask <code>.env.local</code>. See{" "}
        <code>integrations/arctask/README.md</code> and <code>docs/ARCTASK-DAG-RUNNER.md</code>.
      </div>

      {status?.hints?.length ? (
        <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 13 }}>
          {status.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="btn ghost"
        style={{ marginTop: 12 }}
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setStatus(await fetchArcTaskStatus());
          setLoading(false);
        }}
      >
        Refresh status
      </button>
    </Panel>
  );
}
