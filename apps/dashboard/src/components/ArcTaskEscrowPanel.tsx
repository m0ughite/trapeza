import type { ArcTaskEscrowReceipt } from "../types/contract";
import { Badge, Collapsible, Panel, Tooltip } from "./ui";
import { shortHash, usd } from "../services/format";

/**
 * Live external-marketplace escrow lifecycle. ArcTask supplies the job market
 * and on-chain escrow; Trapeza plugs in as the clearing + evaluator brain and
 * settles the escrow. Each step links to a real Arc-testnet transaction.
 */
export function ArcTaskEscrowPanel(props: { receipt: ArcTaskEscrowReceipt }) {
  const { meta, steps } = props.receipt;
  return (
    <Panel
      title="ArcTask marketplace escrow"
      right={<Badge tone="mint">{meta.network} · live</Badge>}
      sub="Trapeza plugs into ArcTask, an Arc-native job marketplace: it discovers registry agents, funds escrow, verifies the deliverable, and releases or refunds — settling through the same chain-agnostic seam as every other provider."
    >
      <div className="receipt">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 14 }}>
            Job #{meta.jobId} → provider agent #{meta.agentId}{" "}
            <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>
              · {usd(meta.rewardUsdc, 3)} escrow
            </span>
          </strong>
          <Badge tone={meta.settlement === "release" ? "mint" : "amber"}>
            {meta.settlement === "release" ? "released" : "refunded"}
          </Badge>
        </div>

        {steps.map((s, i) => (
          <div className="ref-line" key={s.key}>
            <span style={{ color: "var(--text-muted)", minWidth: 92 }}>
              {i + 1}. {s.label}
            </span>
            {s.ref.linkable && s.ref.url ? (
              <a href={s.ref.url} target="_blank" rel="noreferrer" className="mono">
                {shortHash(s.ref.value)} ↗
              </a>
            ) : (
              <span className="val mono">{shortHash(s.ref.value)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="receipt">
        <div className="ref-line">
          <span style={{ color: "var(--text-muted)", minWidth: 92 }}>Escrow</span>
          <span className="val mono">{meta.escrowAddress}</span>
        </div>
        <div className="ref-line">
          <span style={{ color: "var(--text-muted)", minWidth: 92 }}>Registry</span>
          <span className="val mono">{meta.registryAddress}</span>
        </div>
        <div className="ref-line">
          <span style={{ color: "var(--text-muted)", minWidth: 92 }}>USDC rail</span>
          <span className="val">
            {meta.usdcRail}{" "}
            <Tooltip>
              The live ArcTask deployment escrows native USDC via msg.value; a self-hosted fork can
              use the ERC-20 rail instead.
            </Tooltip>
          </span>
        </div>
      </div>

      <Collapsible label="How Trapeza settles an ArcTask job">
        <p>{meta.note}</p>
      </Collapsible>
    </Panel>
  );
}
