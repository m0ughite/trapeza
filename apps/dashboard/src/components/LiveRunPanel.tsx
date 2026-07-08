import { useMemo, useState } from "react";
import type { DemoRun } from "../types/contract";
import { runClearing, type LiveRunResponse } from "../services/liveClient";
import { settleViaArcTask, type ArcTaskSettleResponse } from "../services/arctaskClient";
import { AGENTS } from "../fixtures";
import { Badge, Collapsible, Panel, Stat } from "./ui";
import { DagView } from "./DagView";
import { ArcTaskSettlementPanel } from "./ArcTaskSettlementPanel";
import { pctSmall, usd } from "../services/format";

export function LiveRunPanel(props: { runs: DemoRun[] }) {
  const { runs } = props;
  const [baseId, setBaseId] = useState(runs[0]!.meta.runId);
  const base = useMemo(() => runs.find((r) => r.meta.runId === baseId)!, [runs, baseId]);
  const baseBudget = Number(base.graph.globalBudgetUsdc);

  const [budget, setBudget] = useState(baseBudget);
  const [risk, setRisk] = useState(base.graph.riskAversion);
  const [calibration, setCalibration] = useState<"on" | "off">("on");
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<LiveRunResponse | null>(null);
  const [settling, setSettling] = useState(false);
  const [settleResp, setSettleResp] = useState<ArcTaskSettleResponse | null>(null);

  function onBase(id: string) {
    setBaseId(id);
    const r = runs.find((x) => x.meta.runId === id)!;
    setBudget(Number(r.graph.globalBudgetUsdc));
    setRisk(r.graph.riskAversion);
    setResp(null);
    setSettleResp(null);
  }

  async function run() {
    setRunning(true);
    try {
      const out = await runClearing(base.graph, base.providers, {
        budgetUsdc: budget.toFixed(2),
        riskAversion: risk,
        calibration,
      });
      setResp(out);
    } finally {
      setRunning(false);
    }
  }

  async function settle() {
    if (!resp?.result?.ok) return;
    setSettling(true);
    try {
      const out = await settleViaArcTask({
        allocations: resp.result.allocations.map((a) => ({
          nodeId: a.nodeId,
          providerId: a.providerId,
        })),
        agents: AGENTS,
        runId: baseId,
      });
      setSettleResp(out);
    } finally {
      setSettling(false);
    }
  }

  const r = resp?.result;

  return (
    <Panel
      title="Configure and clear a workflow"
      right={<Badge tone="violet">interactive</Badge>}
      sub="Set the budget and risk appetite, flip calibration on or off, and run a real clearing. It runs server-side if a backend is deployed, otherwise right here in your browser (clearly labeled). No money moves — the reference runs above hold the exact solver results and real receipts."
    >
      <div className="controls">
        <div className="field">
          <label>base workflow</label>
          <select value={baseId} onChange={(e) => onBase(e.target.value)}>
            {runs.map((rn) => (
              <option key={rn.meta.runId} value={rn.meta.runId}>
                {rn.meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            global budget · {usd(budget, 2)}
          </label>
          <input
            type="range"
            min={0.2}
            max={(baseBudget * 2).toFixed(2)}
            step={0.05}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>risk aversion · {risk.toFixed(1)}</label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>calibration</label>
          <select value={calibration} onChange={(e) => setCalibration(e.target.value as "on" | "off")}>
            <option value="on">ON (realized outcomes)</option>
            <option value="off">OFF (trust bids)</option>
          </select>
        </div>
        <div className="field">
          <label>&nbsp;</label>
          <button className="btn" onClick={run} disabled={running}>
            {running ? <span className="spinner" /> : "Run clearing ▸"}
          </button>
        </div>
      </div>

      {r ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <Badge tone={resp!.source === "serverless" ? "mint" : "amber"}>
              {resp!.source === "serverless" ? "ran on the server" : "ran in your browser"}
            </Badge>
            <Badge tone={calibration === "on" ? "mint" : "amber"}>calibration {calibration}</Badge>
            <Badge>{r.ok ? "cleared" : "no feasible plan"}</Badge>
          </div>

          {r.ok ? (
            <>
              <div className="stat-row" style={{ marginBottom: 14 }}>
                <Stat k="plan score" v={r.objectiveValue.toFixed(4)} tone="mint" />
                <Stat k="total spend" v={usd(r.totalSpendUsdc)} small />
                <Stat k="real end-to-end success" v={pctSmall(r.realizedEndToEndSuccess)} tone="mint" />
                <Stat k="claimed success" v={pctSmall(r.claimedEndToEndSuccess)} small />
              </div>
              <DagView
                graph={base.graph}
                allocations={r.allocations.map((a) => ({
                  nodeId: a.nodeId,
                  taskId: "",
                  providerId: a.providerId,
                  score: a.score,
                }))}
              />
              <div style={{ marginTop: 14 }}>
                <button className="btn ghost" onClick={settle} disabled={settling}>
                  {settling ? <span className="spinner" /> : "Settle via ArcTask (simulated) ▸"}
                </button>
              </div>
              {settleResp ? (
                <div style={{ marginTop: 16 }}>
                  <ArcTaskSettlementPanel
                    receipts={settleResp.receipts}
                    live
                    source={settleResp.source}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="callout warn">{r.reason}</div>
          )}
          <div className="callout" style={{ marginTop: 12 }}>
            {r.note}
          </div>
        </div>
      ) : null}

      <Collapsible label="What runs here vs. the reference runs">
        <p>
          This interactive path uses a fast greedy solver so it can run instantly anywhere — on a
          serverless function, or entirely in your browser if no backend is deployed (no keys, no
          money, no on-chain action).
        </p>
        <p>
          The reference scenarios above are the exact whole-graph clearings, plus the real Arc
          on-chain receipts. Use this section to poke at the levers; use those for the canonical
          results.
        </p>
      </Collapsible>
    </Panel>
  );
}
