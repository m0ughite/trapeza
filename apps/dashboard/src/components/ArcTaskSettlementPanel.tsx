import type { ArcTaskReceipts, OnchainRef } from "../types/contract";
import { Badge, Collapsible, Panel } from "./ui";
import { shortHash, usd } from "../services/format";

function Ref(props: { r: OnchainRef | null; fallback?: string }) {
  const r = props.r;
  if (!r) return <span style={{ color: "var(--text-muted)" }}>{props.fallback ?? "—"}</span>;
  if (r.kind === "simulated-tx" || r.simulated) {
    return (
      <div className="ref-line">
        <span style={{ color: "var(--text-muted)", minWidth: 120 }}>{r.label}</span>
        <span className="val mono">
          {shortHash(r.value, 12, 6)}{" "}
          <Badge tone="amber">simulated</Badge>
        </span>
      </div>
    );
  }
  return (
    <div className="ref-line">
      <span style={{ color: "var(--text-muted)", minWidth: 120 }}>{r.label}</span>
      {r.linkable && r.url ? (
        <a href={r.url} target="_blank" rel="noreferrer" className="mono">
          {shortHash(r.value)} ↗
        </a>
      ) : (
        <span className="val mono">
          {shortHash(r.value, 12, 6)}{" "}
          <Badge tone="amber">not a transaction</Badge>
        </span>
      )}
    </div>
  );
}

export function ArcTaskSettlementPanel(props: {
  receipts: ArcTaskReceipts;
  live?: boolean;
  source?: "serverless" | "browser-fallback";
}) {
  const { receipts } = props;
  const modeTone = receipts.meta.mode === "live" ? "mint" : "amber";
  return (
    <Panel
      title="ArcTask escrow settlement"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {props.live && props.source ? (
            <Badge tone={props.source === "serverless" ? "mint" : "amber"}>
              {props.source === "serverless" ? "ran on the server" : "ran in your browser"}
            </Badge>
          ) : null}
          <Badge tone={modeTone}>{receipts.meta.mode}</Badge>
        </div>
      }
      sub="Agent-marketplace escrow: fund → submit deliverable → accept (pay agent) or reject (refund client). Simulated IDs are never shown as real arcscan links."
    >
      <div className="stat-row" style={{ marginBottom: 14 }}>
        <div>
          <div className="stat-k">job</div>
          <div className="stat-v mono">#{receipts.jobId}</div>
        </div>
        <div>
          <div className="stat-k">agent</div>
          <div className="stat-v mono">#{receipts.agent.agentId}</div>
        </div>
        <div>
          <div className="stat-k">reward</div>
          <div className="stat-v">{usd(receipts.reward.amountUsdc)}</div>
        </div>
        <div>
          <div className="stat-k">rail</div>
          <div className="stat-v">{receipts.reward.usdcMode} USDC</div>
        </div>
      </div>

      <div className="receipt">
        {receipts.lifecycle.map((step) => (
          <div key={step.status} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 14 }}>{step.status}</strong>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{step.at}</span>
            </div>
            <Ref r={step.ref} />
          </div>
        ))}
      </div>

      <div className="callout" style={{ marginTop: 12 }}>
        {receipts.meta.honestyNote}
      </div>

      <Collapsible label="What happens on accept vs reject">
        <p>
          <strong>Accept</strong> releases the escrowed USDC to the agent owner — the nanopayment for
          work that passed oracle verification.
        </p>
        <p>
          <strong>Reject</strong> refunds the client. Trapeza (the evaluator) decides after
          verifying the deliverable against the task spec.
        </p>
      </Collapsible>
    </Panel>
  );
}
