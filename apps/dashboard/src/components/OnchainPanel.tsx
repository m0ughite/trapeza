import type { OnchainRef, OnchainReceipts } from "../types/contract";
import { Badge, Collapsible, Panel, Tooltip } from "./ui";
import { shortHash, usd } from "../services/format";

function Ref(props: { r: OnchainRef | null; fallback?: string }) {
  const r = props.r;
  if (!r) return <span style={{ color: "var(--text-muted)" }}>{props.fallback ?? "—"}</span>;
  return (
    <div className="ref-line">
      <span style={{ color: "var(--text-muted)", minWidth: 92 }}>{r.label}</span>
      {r.linkable && r.url ? (
        <a href={r.url} target="_blank" rel="noreferrer" className="mono">
          {shortHash(r.value)} ↗
        </a>
      ) : (
        <span className="val">
          {shortHash(r.value, 12, 6)}{" "}
          <Badge tone="amber">batch ID · not a transaction</Badge>
        </span>
      )}
    </div>
  );
}

export function OnchainPanel(props: { receipts: OnchainReceipts }) {
  const { receipts } = props;
  const modeTone = receipts.meta.mode === "live" ? "mint" : "amber";
  const modeLabel = receipts.meta.mode === "live" ? "live" : "proven receipts";
  return (
    <Panel
      title="Settlement receipts"
      right={
        <Badge tone={modeTone}>
          {receipts.meta.network} · {modeLabel}
        </Badge>
      }
      sub="Cleared steps settle in USDC on Arc. Verified transaction hashes link to the block explorer; a batch settlement ID is not a transaction and is never shown as one."
    >
      {receipts.identity ? (
        <div className="receipt">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14 }}>
              Agent identity{" "}
              <Tooltip>
                On-chain agent identity and reputation, written to Arc via the ERC-8004 registries.
              </Tooltip>
            </strong>
            <Badge tone="blue">Agent ID {receipts.identity.agentId}</Badge>
          </div>
          <Ref r={receipts.identity.register} />
          <Ref r={receipts.identity.reputation} fallback="no reputation event" />
        </div>
      ) : null}

      {receipts.settlements.map((s, i) => (
        <div className="receipt" key={`${s.nodeId}-${i}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14 }}>
              step <span className="mono">{s.nodeId}</span> → {s.providerId}{" "}
              <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {usd(s.amountUsdc, 3)}</span>
            </strong>
            <Badge tone={s.live ? "mint" : "amber"}>{s.live ? "live" : "proven prior"}</Badge>
          </div>
          <Ref r={s.depositTx} fallback="no deposit tx" />
          <Ref r={s.gatewaySettlementId} fallback="no settlement id" />
          {s.settlementTx ? <Ref r={s.settlementTx} /> : null}
          {s.note ? (
            <div style={{ color: "var(--text-muted)", fontSize: 11.5, marginTop: 8 }}>{s.note}</div>
          ) : null}
        </div>
      ))}

      <Collapsible label="Why labeling matters">
        <p>{receipts.meta.honestyNote}</p>
        <p>
          A funded deposit into the shared USDC balance is an on-chain transaction and links out.
          The batch settlement ID is a Circle Gateway identifier for a transfer that settles when the
          batch flushes — it is not itself a transaction hash, so it is labeled and never linked as
          one. Clear labeling here is essential, and the receipts stay precise by design.
        </p>
      </Collapsible>
    </Panel>
  );
}
