import { useEffect, useMemo, useState } from "react";
import type { AgentView } from "../types/contract";
import { agentsToProviders, agentCapabilities } from "../lib/agentProviders";
import {
  buildGraph,
  graphViewToTaskGraph,
  linearEdges,
  nextNodeId,
  WORKFLOW_TEMPLATES,
  type BuilderNode,
  type WorkflowTemplate,
} from "../lib/workflowBuilder";
import { runClearing, type LiveRunResponse } from "../services/liveClient";
import { settleViaArcTask, type ArcTaskSettleResponse } from "../services/arctaskClient";
import { runArcTaskDagLive, type ArcTaskDagRunResponse } from "../services/arctaskDagClient";
import { fetchArcTaskStatus, type ArcTaskStatusResponse } from "../services/arctaskStatusClient";
import { Badge, Collapsible, Panel, Stat } from "./ui";
import { DagView } from "./DagView";
import { ArcTaskSettlementPanel } from "./ArcTaskSettlementPanel";
import { pctSmall, shortHash, usd } from "../services/format";

const ARCSCAN_TX = "https://testnet.arcscan.app/tx";

function TxLine(props: { label: string; tx: string; live: boolean }) {
  const { tx, live } = props;
  const linkable = live && tx.startsWith("0x") && tx.length === 66;
  return (
    <div className="mono" style={{ fontSize: 12 }}>
      {props.label}{" "}
      {linkable ? (
        <a href={`${ARCSCAN_TX}/${tx}`} target="_blank" rel="noreferrer">
          {shortHash(tx)} ↗
        </a>
      ) : (
        shortHash(tx, 18, 6)
      )}
    </div>
  );
}

export function AgentWorkflowPanel(props: { agents: AgentView[] }) {
  const caps = useMemo(() => agentCapabilities(props.agents), [props.agents]);
  const providers = useMemo(() => agentsToProviders(props.agents), [props.agents]);

  const [template, setTemplate] = useState<WorkflowTemplate>("linear-3");
  const [nodes, setNodes] = useState<BuilderNode[]>(() => [...WORKFLOW_TEMPLATES["linear-3"].nodes]);
  const [edges, setEdges] = useState(() => [...WORKFLOW_TEMPLATES["linear-3"].edges]);

  const [budget, setBudget] = useState(2);
  const [risk, setRisk] = useState(1);
  const [calibration, setCalibration] = useState<"on" | "off">("on");
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<LiveRunResponse | null>(null);
  const [settling, setSettling] = useState(false);
  const [settleResp, setSettleResp] = useState<ArcTaskSettleResponse | null>(null);
  const [liveRunning, setLiveRunning] = useState(false);
  const [liveResp, setLiveResp] = useState<ArcTaskDagRunResponse | null>(null);
  const [runMode, setRunMode] = useState<"simulated" | "live">("simulated");
  const [arctaskStatus, setArctaskStatus] = useState<ArcTaskStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchArcTaskStatus().then((s) => {
      if (!cancelled) setArctaskStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const graph = useMemo(
    () => buildGraph(nodes, edges, { budgetUsdc: budget, riskAversion: risk }),
    [nodes, edges, budget, risk],
  );

  function applyTemplate(t: WorkflowTemplate) {
    setTemplate(t);
    const preset = WORKFLOW_TEMPLATES[t];
    setNodes(preset.nodes.map((n) => ({ ...n })));
    setEdges(
      t === "custom" ? linearEdges(preset.nodes) : preset.edges.map((e) => ({ ...e })),
    );
    setResp(null);
    setSettleResp(null);
    setLiveResp(null);
  }

  function updateNode(idx: number, patch: Partial<BuilderNode>) {
    setNodes((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
    setResp(null);
    setSettleResp(null);
    setLiveResp(null);
  }

  function addStep() {
    const cap = caps[0] ?? "arctask.general.v1";
    setNodes((prev) => {
      const id = nextNodeId(prev);
      const next = [...prev, { nodeId: id, capability: cap, valueUsdc: "0.50", prompt: "Describe this step." }];
      if (template === "custom") setEdges(linearEdges(next));
      return next;
    });
    setResp(null);
    setSettleResp(null);
  }

  function removeStep(idx: number) {
    setNodes((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      if (template === "custom") setEdges(linearEdges(next));
      return next;
    });
    setResp(null);
    setSettleResp(null);
  }

  async function run() {
    setRunning(true);
    try {
      const out = await runClearing(graph, providers, {
        budgetUsdc: budget.toFixed(2),
        riskAversion: risk,
        calibration,
      });
      setResp(out);
    } finally {
      setRunning(false);
    }
  }

  async function runLive() {
    setLiveRunning(true);
    setLiveResp(null);
    try {
      const taskGraph = graphViewToTaskGraph(nodes, edges, {
        budgetUsdc: budget,
        riskAversion: risk,
      });
      const out = await runArcTaskDagLive(taskGraph, { simulated: runMode === "simulated" });
      setLiveResp(out);
    } finally {
      setLiveRunning(false);
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
        agents: props.agents,
        runId: "user-arctask-workflow",
      });
      setSettleResp(out);
    } finally {
      setSettling(false);
    }
  }

  const r = resp?.result;
  const liveBlocked = runMode === "live" && !arctaskStatus?.liveReady;

  return (
    <Panel
      title="Build a workflow from ArcTask agents"
      right={<Badge tone="violet">compose + clear</Badge>}
      sub="Pick steps, prompts, and capabilities; clear against the registry; run the full ArcTask loop (escrow → worker → pay) via the server API when live env is configured."
    >
      <div className="callout warn" style={{ marginBottom: 14 }}>
        <strong>Live ArcTask runs</strong> need the ArcTask <code>agent-worker</code> running with your{" "}
        <code>LLM_BASE_URL</code> / <code>LLM_API_KEY</code> in the <em>ArcTask fork</em> env — never in
        this dashboard. See <code>docs/ARCTASK-DAG-RUNNER.md</code>.
      </div>
      <div className="controls" style={{ marginBottom: 14 }}>
        <div className="field">
          <label>template</label>
          <select value={template} onChange={(e) => applyTemplate(e.target.value as WorkflowTemplate)}>
            {(Object.keys(WORKFLOW_TEMPLATES) as WorkflowTemplate[]).map((k) => (
              <option key={k} value={k}>
                {WORKFLOW_TEMPLATES[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>global budget · {usd(budget, 2)}</label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={budget}
            onChange={(e) => {
              setBudget(Number(e.target.value));
              setResp(null);
              setSettleResp(null);
            }}
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
            onChange={(e) => {
              setRisk(Number(e.target.value));
              setResp(null);
              setSettleResp(null);
            }}
          />
        </div>
        <div className="field">
          <label>calibration</label>
          <select
            value={calibration}
            onChange={(e) => {
              setCalibration(e.target.value as "on" | "off");
              setResp(null);
              setSettleResp(null);
            }}
          >
            <option value="on">ON (realized outcomes)</option>
            <option value="off">OFF (trust bids)</option>
          </select>
        </div>
        <div className="field">
          <label>ArcTask run mode</label>
          <select
            value={runMode}
            onChange={(e) => {
              setRunMode(e.target.value as "simulated" | "live");
              setLiveResp(null);
            }}
          >
            <option value="simulated">simulated (no chain)</option>
            <option value="live">live (on-chain + worker)</option>
          </select>
        </div>
      </div>

      <div className="workflow-steps">
        <div className="workflow-steps-head">
          <strong>Steps</strong>
          {template === "custom" ? (
            <button type="button" className="btn ghost" onClick={addStep}>
              + Add step
            </button>
          ) : null}
        </div>
        {nodes.map((n, idx) => (
          <div key={n.nodeId} className="workflow-step-block">
            <div className="workflow-step-row">
              <span className="mono workflow-step-id">{n.nodeId}</span>
              <select
                value={n.capability}
                onChange={(e) => updateNode(idx, { capability: e.target.value })}
              >
                {caps.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0.1}
                max={2}
                step={0.05}
                value={n.valueUsdc}
                onChange={(e) => updateNode(idx, { valueUsdc: e.target.value })}
                title="step value (USDC)"
                className="workflow-value"
              />
              {template === "custom" && nodes.length > 1 ? (
                <button type="button" className="btn ghost" onClick={() => removeStep(idx)}>
                  Remove
                </button>
              ) : null}
            </div>
            <input
              type="text"
              className="workflow-prompt"
              value={n.prompt}
              onChange={(e) => updateNode(idx, { prompt: e.target.value })}
              placeholder="Prompt for the ArcTask worker LLM"
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <DagView graph={graph} allocations={[]} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" onClick={run} disabled={running}>
          {running ? <span className="spinner" /> : "Clear (preview) ▸"}
        </button>
        <button
          className="btn ghost"
          onClick={runLive}
          disabled={liveRunning || liveBlocked}
          title={liveBlocked ? arctaskStatus?.hints?.join(" ") : undefined}
        >
          {liveRunning ? (
            <span className="spinner" />
          ) : runMode === "live" ? (
            "Run on ArcTask (live) ▸"
          ) : (
            "Run on ArcTask (simulated) ▸"
          )}
        </button>
      </div>
      {liveBlocked ? (
        <div className="callout warn" style={{ marginTop: 10 }}>
          Live mode blocked — check the readiness panel above.{" "}
          {arctaskStatus?.missing?.length ? (
            <span className="mono">Missing: {arctaskStatus.missing.join(", ")}</span>
          ) : null}
        </div>
      ) : null}

      {liveResp ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Badge tone={liveResp.source === "serverless" ? "mint" : "amber"}>
              {liveResp.source === "serverless" ? "DAG ran on server" : "API unavailable"}
            </Badge>
            <Badge tone="blue">{liveResp.result.mode}</Badge>
          </div>
          {liveResp.error ? <div className="callout warn">{liveResp.error}</div> : null}
          {liveResp.progress.length > 0 ? (
            <div className="callout" style={{ marginBottom: 12, maxHeight: 160, overflow: "auto" }}>
              {liveResp.progress.map((p, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                  <span className="mono">{p.phase}</span>
                  {p.nodeId ? ` [${p.nodeId}]` : ""}: {p.message}
                </div>
              ))}
            </div>
          ) : null}
          {liveResp.result.nodes.map((n) => (
            <div key={n.nodeId} className="receipt" style={{ marginBottom: 10 }}>
              <strong>
                {n.nodeId} · job #{n.jobId} · {n.settleAction}
              </strong>
              <TxLine label="fund" tx={n.fundTx} live={liveResp.result.mode === "live"} />
              <TxLine label="settle" tx={n.settleTx} live={liveResp.result.mode === "live"} />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                {n.deliverablePreview}
              </div>
            </div>
          ))}
          <div className="callout">{liveResp.result.honestyNote}</div>
        </div>
      ) : null}

      {r ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <Badge tone={resp!.source === "serverless" ? "mint" : "amber"}>
              {resp!.source === "serverless" ? "ran on the server" : "ran in your browser"}
            </Badge>
            <Badge tone={calibration === "on" ? "mint" : "amber"}>calibration {calibration}</Badge>
            <Badge>{r.ok ? "cleared" : "no feasible plan"}</Badge>
            <Badge tone="blue">{props.agents.length} agents in market</Badge>
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
                graph={graph}
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

      <Collapsible label="How agent matching works">
        <p>
          Each step declares a <strong>capability</strong> (for example <code>code.fix.v1</code>).
          Clearing only considers agents from the registry that list that capability. With calibration
          ON, Trapeza picks the agent with the best realized track record; OFF trusts advertised
          claims.
        </p>
        <p>
          Fork templates use fixed edges; custom templates chain steps left-to-right. Adjust the
          budget if clearing fails — greedy routing spends in dependency order.
        </p>
      </Collapsible>
    </Panel>
  );
}
