import type {
  ArcRankedCandidate,
  ArcRegistryAgentView,
  ArcTaskClearingReceipt,
  ArcTaskStep,
  OnchainRef,
} from "../types/contract";
import { Badge, Bar, Collapsible, Panel, Stat, Tooltip, type Tone } from "./ui";
import { pct, shortHash, usd } from "../services/format";

const ARCHETYPE_TONE: Record<ArcRegistryAgentView["archetype"], Tone> = {
  workhorse: "mint",
  braggart: "amber",
  neutral: "blue",
};

/** A single on-chain reference line. Only real 0x+64-hex refs link out. */
function RefLine(props: { r: OnchainRef; note?: string }) {
  const { r } = props;
  return (
    <div className="ref-line">
      <span style={{ color: "var(--text-muted)", minWidth: 96 }}>{r.label}</span>
      {r.linkable && r.url ? (
        <a href={r.url} target="_blank" rel="noreferrer" className="mono">
          {shortHash(r.value)} ↗
        </a>
      ) : (
        <span className="val mono">
          {shortHash(r.value)}{" "}
          <Badge tone="violet">{props.note ?? "simulated ref"}</Badge>
        </span>
      )}
    </div>
  );
}

/** (a) What this is — Trapeza as clearing + evaluator brain over ArcTask. */
export function ArcOverviewPanel(props: { receipt: ArcTaskClearingReceipt }) {
  const { meta } = props.receipt;
  const flow = [
    { k: "Registry", d: "read the ArcTask agent directory" },
    { k: "Clear", d: "rank by calibrated EV, pick the winner" },
    { k: "Worker", d: "ArcTask's own agent executes" },
    { k: "Evaluate", d: "oracle verifies the deliverable" },
    { k: "Settle", d: "release or refund escrow + reputation" },
  ];
  return (
    <Panel
      title="Clearing + evaluator brain over ArcTask"
      right={<Badge tone={meta.mode === "live" ? "mint" : "violet"}>{meta.network} · {meta.mode}</Badge>}
      sub="ArcTask is an Arc-native job marketplace (USDC escrow + an agent registry + an autonomous worker). Trapeza plugs in as the brain: it decides who should do each job and whether the finished work is good enough to pay for. Trapeza never does the work itself."
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 14px" }}>
        {flow.map((s, i) => (
          <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 12px",
                background: "var(--panel-2, rgba(255,255,255,0.02))",
                minWidth: 150,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {i + 1}. {s.k}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>{s.d}</div>
            </div>
            {i < flow.length - 1 ? (
              <span aria-hidden style={{ color: "var(--text-dim)" }}>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="callout">
        <strong>Trapeza is never the worker.</strong> Steps 1–2 and 4–5 are Trapeza (clearing +
        evaluator). Step 3 is ArcTask's own autonomous worker running as the chosen agent. In
        product mode Trapeza never submits a deliverable — it only routes, verifies, and settles.
      </div>
    </Panel>
  );
}

/** (b) Provider registry — the calibrated agent directory read from ArcTask. */
export function ArcRegistryPanel(props: {
  registry: ArcRegistryAgentView[];
  winnerProviderId: string;
}) {
  const { registry, winnerProviderId } = props;
  return (
    <Panel
      title="Provider registry"
      right={<Badge tone="blue">{registry.length} agents</Badge>}
      sub="The agent directory read from the ArcTask registry, scored by what each agent has actually delivered (a Bayesian tally of realized wins and losses) — not by what it claims in its bid. Bars show claimed (amber) vs. delivered (mint)."
    >
      <table className="t">
        <thead>
          <tr>
            <th>agent</th>
            <th>type</th>
            <th style={{ width: "20%" }}>
              claims{" "}
              <Tooltip>Self-reported success rate from the agent&apos;s registry metadata — a prior, never the routing signal.</Tooltip>
            </th>
            <th style={{ width: "20%" }}>
              delivers{" "}
              <Tooltip>Calibrated success rate from this agent&apos;s realized track record on ArcTask jobs.</Tooltip>
            </th>
            <th>jobs seen</th>
            <th>price</th>
            <th>bond</th>
            <th>hired</th>
          </tr>
        </thead>
        <tbody>
          {registry.map((a) => {
            const hired = a.providerId === winnerProviderId;
            return (
              <tr key={a.providerId} style={hired ? { background: "rgba(61,220,151,0.05)" } : undefined}>
                <td className="mono">
                  #{a.agentId} · {a.providerId}
                </td>
                <td>
                  <Badge tone={ARCHETYPE_TONE[a.archetype]}>{a.archetype}</Badge>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 42 }}>{pct(a.claimedSuccessProb, 0)}</span>
                    <div style={{ flex: 1 }}>
                      <Bar value={a.claimedSuccessProb} tone="amber" />
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 42 }}>{pct(a.calibratedSuccessProb, 0)}</span>
                    <div style={{ flex: 1 }}>
                      <Bar value={a.calibratedSuccessProb} tone="mint" />
                    </div>
                  </div>
                </td>
                <td>{a.nObservations}</td>
                <td>{usd(a.priceUsdc, 3)}</td>
                <td>{usd(a.bondUsdc, 3)}</td>
                <td>{hired ? <span style={{ color: "var(--accent)" }}>★</span> : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function RankRow(props: { c: ArcRankedCandidate }) {
  const { c } = props;
  return (
    <tr style={c.hired ? { background: "rgba(61,220,151,0.05)" } : undefined}>
      <td>{c.rank}</td>
      <td className="mono">
        #{c.agentId} · {c.providerId}
      </td>
      <td>{usd(c.score, 5)}</td>
      <td>
        {pct(c.pSuccessUsed, 0)}{" "}
        <Badge tone={c.source === "calibrated" ? "mint" : "amber"}>{c.source}</Badge>
      </td>
      <td>{usd(c.priceUsdc, 3)}</td>
      <td>{usd(c.riskPremium, 5)}</td>
      <td>{c.hired ? <span style={{ color: "var(--accent)" }}>★ hired</span> : ""}</td>
    </tr>
  );
}

/** (c) Clearing decision — ranked agents + the pick + calibrated-EV rationale. */
export function ArcClearingPanel(props: { receipt: ArcTaskClearingReceipt }) {
  const { clearing, job } = props.receipt;
  const divergent = clearing.calibratedWinner !== clearing.claimedWinner;
  return (
    <Panel
      title="Clearing decision"
      right={<Badge tone="violet">{clearing.mechanism}</Badge>}
      sub="The differentiator. For this job Trapeza ranks every registered agent by calibrated expected net value and picks the winner, then assigns the job to that agent on-chain. Score = success × value − price − risk premium, with the success rate taken from the realized-outcome ledger."
    >
      <div className="stat-row" style={{ marginBottom: 14 }}>
        <Stat k="job" v={job.title} small />
        <Stat k="budget" v={usd(job.budgetUsdc, 3)} />
        <Stat k="winner" v={`#${clearing.winnerAgentId} · ${clearing.winnerProviderId}`} tone="mint" small />
        <Stat k="signal" v={clearing.useCalibration ? "calibrated (ON)" : "bids (OFF)"} small />
      </div>

      {divergent ? (
        <div className="callout" style={{ marginBottom: 12 }}>
          <strong>Routing matters here.</strong> Calibration hires{" "}
          <span className="mono">{clearing.calibratedWinner}</span> on its realized track record;
          trusting the self-reported bids would hire{" "}
          <span className="mono">{clearing.claimedWinner}</span>, which over-claims. Trapeza routes
          on delivered results, not the loudest bid.
        </div>
      ) : null}

      <table className="t">
        <thead>
          <tr>
            <th>#</th>
            <th>agent</th>
            <th>
              net value{" "}
              <Tooltip>Expected net value to the requester: success × value − price − risk premium.</Tooltip>
            </th>
            <th>success used</th>
            <th>price</th>
            <th>
              risk{" "}
              <Tooltip>Priced-in expected unrecovered loss on failure plus a penalty for thin/uncertain track records.</Tooltip>
            </th>
            <th>pick</th>
          </tr>
        </thead>
        <tbody>
          {clearing.ranked.map((c) => (
            <RankRow key={c.providerId} c={c} />
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-dim)" }}>{clearing.rationale}</div>
    </Panel>
  );
}

function StepList(props: { steps: ArcTaskStep[]; simulated: boolean }) {
  return (
    <div className="receipt">
      {props.steps.map((s, i) => (
        <div key={s.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ fontSize: 13 }}>
              {i + 1}. {s.label}
            </strong>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5, margin: "2px 0 4px" }}>{s.detail}</div>
          <RefLine r={s.ref} note={props.simulated ? "simulated ref" : "on-chain"} />
        </div>
      ))}
    </div>
  );
}

/** (d) Evaluation + settlement — oracle verdict → accept/reject → escrow + reputation. */
export function ArcSettlementPanel(props: { receipt: ArcTaskClearingReceipt }) {
  const { evaluation, execution, meta, provenLive } = props.receipt;
  const released = evaluation.settlement === "release";
  return (
    <Panel
      title="Evaluation + settlement"
      right={
        <Badge tone={released ? "mint" : "amber"}>{released ? "released" : "refunded"}</Badge>
      }
      sub="Trapeza is the job's registered evaluator. It verifies the worker's deliverable with a deterministic oracle, then releases escrow to the worker (acceptWork) or refunds the client (rejectWork), and writes the realized outcome to reputation and the calibration ledger."
    >
      <div className="callout" style={{ marginBottom: 12 }}>
        <strong>Execution is ArcTask&apos;s own worker.</strong> {execution.note}
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, margin: "4px 0 6px" }}>
        This run{" "}
        <Badge tone={meta.mode === "live" ? "mint" : "violet"}>{meta.mode}</Badge>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
        {evaluation.verdictNote}
      </div>
      <StepList steps={evaluation.steps} simulated={meta.mode !== "live"} />

      {provenLive ? (
        <>
          <div style={{ fontWeight: 600, fontSize: 13, margin: "16px 0 6px" }}>
            Proven on-chain lifecycle{" "}
            <Badge tone="mint">real Arc-testnet txs</Badge>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
            {provenLive.note}
          </div>
          <StepList steps={provenLive.steps} simulated={false} />
          <div className="receipt">
            <div className="ref-line">
              <span style={{ color: "var(--text-muted)", minWidth: 96 }}>Escrow</span>
              <span className="val mono">{provenLive.escrowAddress}</span>
            </div>
            <div className="ref-line">
              <span style={{ color: "var(--text-muted)", minWidth: 96 }}>Registry</span>
              <span className="val mono">{provenLive.registryAddress}</span>
            </div>
            <div className="ref-line">
              <span style={{ color: "var(--text-muted)", minWidth: 96 }}>USDC rail</span>
              <span className="val">
                {meta.usdcRail}{" "}
                <Tooltip>
                  The live ArcTask deployment escrows native USDC via msg.value; a self-hosted fork
                  can use the ERC-20 rail instead.
                </Tooltip>
              </span>
            </div>
          </div>
        </>
      ) : null}

      <Collapsible label="How this is wired (technical detail)">
        <p>
          <strong>Boundary discipline.</strong> All chain and marketplace I/O lives in{" "}
          <code>@trapeza/adapter-arc</code> (escrow, agent registry, event/REST job discovery). The
          clearing decision uses the <code>@trapeza/core</code> EV router and the evaluation uses{" "}
          <code>@trapeza/oracle</code>, composed at the orchestration layer —{" "}
          <code>@trapeza/core</code> stays chain-agnostic.
        </p>
        <p>
          <strong>The loop.</strong> discover + calibrate (read registry → provider profiles +
          realized-outcome ledger) → get job (seeded demo client behind{" "}
          <code>ARCTASK_SEED_JOB</code>, or organic <code>JobCreated</code> ingestion) → clear (rank
          + pick + <code>createJob</code> with the chosen agent) → execute (ArcTask&apos;s worker
          submits) → evaluate + settle (<code>acceptWork</code>/<code>rejectWork</code> → ERC-8004
          reputation → calibration update).
        </p>
        <p>
          <strong>What&apos;s real vs. illustrative.</strong> The &quot;proven on-chain
          lifecycle&quot; hashes are real, verified Arc-testnet transactions and are the only refs
          that link to the explorer. The current-run clearing above is a representative{" "}
          {meta.mode} decision; its refs are labeled and never linked as transactions unless they
          are real 0x+64-hex hashes.
        </p>
      </Collapsible>
    </Panel>
  );
}
