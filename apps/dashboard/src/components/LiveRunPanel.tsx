import { useMemo, useRef, useState } from "react";
import {
  canApplyDependencies,
  normalizeRunPayload,
  parseRunPayloadJson,
  payloadFromDemo,
  validateRunPayload,
  type ValidationIssue,
} from "../lib/liveRunContract";
import { buildCapabilityCatalog } from "../lib/capabilityCatalog";
import {
  buildDefaultSimpleInput,
  parseSimpleInputJson,
  RISK_AVERSION,
  RISK_LEVELS,
  type SimpleIssue,
} from "../lib/simpleInput";
import type { DemoRun, GraphNodeView, LiveRunInput, ProviderView } from "../types/contract";
import { runClearingInput, type LiveRunResponse } from "../services/liveClient";
import { Badge, Collapsible, Panel, Stat, Tooltip } from "./ui";
import { DagView } from "./DagView";
import { pctSmall, usd } from "../services/format";

type Mode = "simple" | "builder" | "json";
type BuilderSection = "setup" | "providers" | "workflow";

const INPUT_CONTRACT_URL = "/input-contract.md";

export function LiveRunPanel(props: { runs: DemoRun[] }) {
  const { runs } = props;
  const catalog = useMemo(() => buildCapabilityCatalog(runs), [runs]);
  const [mode, setMode] = useState<Mode>("simple");
  const [builderSection, setBuilderSection] = useState<BuilderSection>("setup");
  const [templateId, setTemplateId] = useState(runs[0]!.meta.runId);
  const [builderPayload, setBuilderPayload] = useState<LiveRunInput>(() => payloadFromDemo(runs[0]!));
  const [jsonPayload, setJsonPayload] = useState(() => JSON.stringify(payloadFromDemo(runs[0]!), null, 2));
  const [simpleText, setSimpleText] = useState(() => JSON.stringify(buildDefaultSimpleInput(catalog), null, 2));
  const [simpleIssues, setSimpleIssues] = useState<SimpleIssue[]>([]);
  const [builderIssues, setBuilderIssues] = useState<ValidationIssue[]>([]);
  const [jsonIssues, setJsonIssues] = useState<ValidationIssue[]>([]);
  const [depError, setDepError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<LiveRunResponse | null>(null);
  const [lastRunPayload, setLastRunPayload] = useState<LiveRunInput | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const providerCatalog = useMemo(() => buildProviderCatalog(runs), [runs]);
  const capabilityCatalog = useMemo(() => catalog.map((c) => c.capability), [catalog]);
  const template = useMemo(() => runs.find((r) => r.meta.runId === templateId)!, [runs, templateId]);
  const currentPayload = mode === "builder" ? builderPayload : lastRunPayload ?? builderPayload;

  function loadTemplate() {
    const next = payloadFromDemo(template);
    setBuilderPayload(next);
    setJsonPayload(JSON.stringify(next, null, 2));
    setBuilderIssues([]);
    setJsonIssues([]);
    setDepError(null);
    setResp(null);
  }

  function startFromScratch() {
    const next: LiveRunInput = {
      graph: {
        id: "custom-workflow",
        globalBudgetUsdc: "1.00",
        globalDeadlineMs: 600,
        globalQualityFloor: null,
        riskAversion: 1,
        nodes: [],
        edges: [],
      },
      providers: providerCatalog.slice(0, Math.min(4, providerCatalog.length)).map(cloneProvider),
      run: {
        budgetUsdc: "1.00",
        deadlineMs: 600,
        riskAversion: 1,
        calibration: "on",
      },
    };
    setBuilderPayload(next);
    setJsonPayload(JSON.stringify(next, null, 2));
    setBuilderIssues([]);
    setJsonIssues([]);
    setDepError(null);
    setResp(null);
  }

  function patchRun(changes: Partial<LiveRunInput["run"]>) {
    setBuilderPayload((prev) => ({ ...prev, run: { ...prev.run, ...changes } }));
  }

  function patchGraphMeta(changes: Partial<LiveRunInput["graph"]>) {
    setBuilderPayload((prev) => ({ ...prev, graph: { ...prev.graph, ...changes } }));
  }

  function toggleProvider(provider: ProviderView) {
    setBuilderPayload((prev) => {
      const has = prev.providers.some((p) => p.id === provider.id);
      const providers = has
        ? prev.providers.filter((p) => p.id !== provider.id)
        : [...prev.providers, cloneProvider(provider)];
      return { ...prev, providers };
    });
  }

  function patchProvider(
    providerId: string,
    field: "priceUsdc" | "bondOfferedUsdc" | "capabilities",
    value: string,
  ) {
    setBuilderPayload((prev) => ({
      ...prev,
      providers: prev.providers.map((provider) => {
        if (provider.id !== providerId) return provider;
        if (field === "capabilities") {
          return { ...provider, capabilities: splitCsv(value) };
        }
        return { ...provider, [field]: normalizeCurrencyInput(value) };
      }),
    }));
  }

  function patchNode(nodeId: string, patch: Partial<GraphNodeView>) {
    setBuilderPayload((prev) => ({
      ...prev,
      graph: {
        ...prev.graph,
        nodes: prev.graph.nodes.map((node) => (node.nodeId === nodeId ? { ...node, ...patch } : node)),
      },
    }));
  }

  function renameNode(nodeId: string, nextId: string) {
    const trimmed = nextId.trim();
    if (!trimmed) return;
    setBuilderPayload((prev) => ({
      ...prev,
      graph: {
        ...prev.graph,
        nodes: prev.graph.nodes.map((node) => (node.nodeId === nodeId ? { ...node, nodeId: trimmed } : node)),
        edges: prev.graph.edges.map((edge) => ({
          from: edge.from === nodeId ? trimmed : edge.from,
          to: edge.to === nodeId ? trimmed : edge.to,
        })),
      },
    }));
  }

  function setNodeDependencies(nodeId: string, raw: string) {
    const deps = splitCsv(raw).filter((dep) => dep !== nodeId);
    const nodeIds = builderPayload.graph.nodes.map((node) => node.nodeId);
    const issues = canApplyDependencies(nodeIds, builderPayload.graph.edges, nodeId, deps);
    if (issues.length > 0) {
      setDepError(issues[0]!.message);
      return;
    }
    setDepError(null);
    setBuilderPayload((prev) => ({
      ...prev,
      graph: {
        ...prev.graph,
        edges: [
          ...prev.graph.edges.filter((edge) => edge.to !== nodeId),
          ...deps.map((dep) => ({ from: dep, to: nodeId })),
        ],
      },
    }));
  }

  function addNode() {
    const idx = builderPayload.graph.nodes.length + 1;
    const nextId = `step-${idx}`;
    const cap = capabilityCatalog[0] ?? "custom-capability";
    setBuilderPayload((prev) => ({
      ...prev,
      graph: {
        ...prev.graph,
        nodes: [
          ...prev.graph.nodes,
          {
            nodeId: nextId,
            capability: cap,
            valueUsdc: "0.25",
            budgetUsdc: "0.25",
            bondRatio: 0.5,
            qualityFloor: null,
            bottleneck: false,
          },
        ],
      },
    }));
  }

  function removeNode(nodeId: string) {
    setBuilderPayload((prev) => ({
      ...prev,
      graph: {
        ...prev.graph,
        nodes: prev.graph.nodes.filter((node) => node.nodeId !== nodeId),
        edges: prev.graph.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
      },
    }));
  }

  function syncJsonDraft() {
    setJsonPayload(JSON.stringify(builderPayload, null, 2));
  }

  async function execute(payload: LiveRunInput) {
    setRunning(true);
    try {
      const out = await runClearingInput(payload);
      setResp(out);
      setLastRunPayload(payload);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            resultsRef.current?.focus({ preventScroll: true });
          });
        });
      }
    } finally {
      setRunning(false);
    }
  }

  async function runBuilder() {
    const issues = validateRunPayload(builderPayload);
    setBuilderIssues(issues);
    if (issues.length > 0) return;
    setJsonPayload(JSON.stringify(builderPayload, null, 2));
    await execute(builderPayload);
  }

  async function runJson() {
    const parsed = parseRunPayloadJson(jsonPayload);
    setJsonIssues(parsed.issues);
    if (!parsed.payload) return;
    await execute(parsed.payload);
  }

  async function runSimple() {
    const { payload, issues } = parseSimpleInputJson(simpleText, catalog);
    setSimpleIssues(issues);
    // Warnings (e.g. budget hints) don't block; only error-severity issues do.
    if (!payload) return;
    await execute(payload);
  }

  function resetSimpleExample() {
    setSimpleText(JSON.stringify(buildDefaultSimpleInput(catalog), null, 2));
    setSimpleIssues([]);
    setResp(null);
  }

  const draftIssues = mode === "builder" ? builderIssues : jsonIssues;
  const r = resp?.result;
  const normalized = currentPayload ? normalizeRunPayload(currentPayload) : null;
  const baseBudget = Number(builderPayload.graph.globalBudgetUsdc || "1");

  return (
    <Panel
      title="Configure and clear a workflow"
      right={<Badge tone="violet">interactive</Badge>}
      sub={(
        <>
          Describe a workflow in a few plain lines (<strong>Simple</strong>) — Trapeza fills in the
          providers, prices and bonds for you. Power users can still use the visual{" "}
          <strong>Builder</strong> or paste a <strong>Full JSON</strong> payload. Every path runs the
          same live clearing (serverless first, browser fallback). No funds move.{" "}
          <a href={INPUT_CONTRACT_URL} target="_blank" rel="noreferrer">
            Input contract &amp; capability catalog
          </a>
          .
        </>
      )}
    >
      <div className="toggle" style={{ marginBottom: 14 }}>
        <button className={`toggle-btn${mode === "simple" ? " active" : ""}`} onClick={() => setMode("simple")}>
          Simple ✦
        </button>
        <button
          className={`toggle-btn${mode === "builder" ? " active" : ""}`}
          onClick={() => {
            setMode("builder");
            setBuilderSection("setup");
          }}
        >
          Builder
        </button>
        <button className={`toggle-btn${mode === "json" ? " active" : ""}`} onClick={() => setMode("json")}>
          Full JSON
        </button>
      </div>

      {mode === "simple" ? (
        <SimpleMode
          catalog={catalog}
          text={simpleText}
          onChange={setSimpleText}
          onReset={resetSimpleExample}
          running={running}
        />
      ) : null}

      {mode === "builder" ? (
        <>
          <div className="toggle live-builder-tabs" role="group" aria-label="builder sections" style={{ marginBottom: 14, flexWrap: "wrap" }}>
            <button
              className={`toggle-btn${builderSection === "setup" ? " active" : ""}`}
              onClick={() => setBuilderSection("setup")}
            >
              Run setup
            </button>
            <button
              className={`toggle-btn${builderSection === "providers" ? " active" : ""}`}
              onClick={() => setBuilderSection("providers")}
            >
              Providers
            </button>
            <button
              className={`toggle-btn${builderSection === "workflow" ? " active" : ""}`}
              onClick={() => setBuilderSection("workflow")}
            >
              Workflow
            </button>
          </div>

          {builderSection === "setup" ? (
            <div className="controls">
              <div className="field">
                <label>template</label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {runs.map((rn) => (
                    <option key={rn.meta.runId} value={rn.meta.runId}>
                      {rn.meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>
                  global budget · {usd(builderPayload.run.budgetUsdc, 2)}
                  <Tooltip>Budget is the shared spend cap for the whole workflow.</Tooltip>
                </label>
                <input
                  type="range"
                  min={0.2}
                  max={Math.max(0.5, baseBudget * 2).toFixed(2)}
                  step={0.05}
                  value={Number(builderPayload.run.budgetUsdc)}
                  onChange={(e) => patchRun({ budgetUsdc: Number(e.target.value).toFixed(2) })}
                />
              </div>
              <div className="field">
                <label>deadline (ms)</label>
                <input
                  type="text"
                  value={String(builderPayload.run.deadlineMs)}
                  onChange={(e) => patchRun({ deadlineMs: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="field">
                <label>risk aversion · {builderPayload.run.riskAversion.toFixed(1)}</label>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={builderPayload.run.riskAversion}
                  onChange={(e) => patchRun({ riskAversion: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>calibration</label>
                <select
                  value={builderPayload.run.calibration}
                  onChange={(e) => patchRun({ calibration: e.target.value as "on" | "off" })}
                >
                  <option value="on">ON (observed outcomes)</option>
                  <option value="off">OFF (trust bids)</option>
                </select>
              </div>
              <div className="field">
                <label>actions</label>
                <button className="btn ghost" onClick={loadTemplate} disabled={running}>
                  Load template
                </button>
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button className="btn ghost" onClick={startFromScratch} disabled={running}>
                  Start from scratch
                </button>
              </div>
            </div>
          ) : null}

          {builderSection === "providers" ? (
            <div className="live-builder-col" style={{ marginTop: 14 }}>
              <div className="mini-label">Provider catalog</div>
              <table className="t">
                <thead>
                  <tr>
                    <th>Use</th>
                    <th>Provider</th>
                    <th>Capabilities</th>
                    <th>Ask</th>
                  </tr>
                </thead>
                <tbody>
                  {providerCatalog.map((provider) => {
                    const selected = builderPayload.providers.some((p) => p.id === provider.id);
                    return (
                      <tr key={provider.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleProvider(provider)}
                            aria-label={`Select ${provider.id}`}
                          />
                        </td>
                        <td className="mono">{provider.id}</td>
                        <td>{provider.capabilities.join(", ")}</td>
                        <td>{usd(provider.priceUsdc, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {builderPayload.providers.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <div className="mini-label">Selected providers (editable)</div>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Capabilities</th>
                        <th>Ask</th>
                        <th>Bond</th>
                      </tr>
                    </thead>
                    <tbody>
                      {builderPayload.providers.map((provider) => (
                        <tr key={provider.id}>
                          <td className="mono">{provider.id}</td>
                          <td>
                            <input
                              type="text"
                              value={provider.capabilities.join(", ")}
                              onChange={(e) => patchProvider(provider.id, "capabilities", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={provider.priceUsdc}
                              onChange={(e) => patchProvider(provider.id, "priceUsdc", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={provider.bondOfferedUsdc}
                              onChange={(e) => patchProvider(provider.id, "bondOfferedUsdc", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {builderSection === "workflow" ? (
            <div className="live-builder-col" style={{ marginTop: 14 }}>
              <div className="mini-label">Workflow steps and dependencies</div>
              <table className="t">
                <thead>
                  <tr>
                    <th>Step ID</th>
                    <th>Capability</th>
                    <th>Value</th>
                    <th>Quality floor</th>
                    <th>Depends on</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {builderPayload.graph.nodes.map((node) => (
                    <tr key={node.nodeId}>
                      <td>
                        <input
                          type="text"
                          value={node.nodeId}
                          onChange={(e) => renameNode(node.nodeId, e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={node.capability}
                          onChange={(e) => patchNode(node.nodeId, { capability: e.target.value })}
                        >
                          {capabilityCatalog.map((cap) => (
                            <option key={cap} value={cap}>
                              {cap}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={node.valueUsdc}
                          onChange={(e) => patchNode(node.nodeId, { valueUsdc: normalizeCurrencyInput(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={node.qualityFloor == null ? "" : String(node.qualityFloor)}
                          placeholder="optional"
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            patchNode(node.nodeId, { qualityFloor: v ? Number(v) : null });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={dependenciesForNode(builderPayload, node.nodeId).join(", ")}
                          onChange={(e) => setNodeDependencies(node.nodeId, e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn ghost" onClick={() => removeNode(node.nodeId)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn ghost" onClick={addNode}>
                  + Add step
                </button>
                <button className="btn ghost" onClick={syncJsonDraft}>
                  Sync JSON draft
                </button>
              </div>
              {depError ? <div className="callout warn" style={{ marginTop: 10 }}>{depError}</div> : null}
              <div className="field" style={{ marginTop: 14 }}>
                <label>graph id</label>
                <input
                  type="text"
                  value={builderPayload.graph.id}
                  onChange={(e) => patchGraphMeta({ id: e.target.value })}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : mode === "json" ? (
        <div className="field" style={{ marginTop: 14 }}>
          <label>paste full run payload JSON</label>
          <textarea
            className="json-editor"
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            spellCheck={false}
          />
        </div>
      ) : null}

      {mode === "simple" && simpleIssues.length > 0 ? (
        <SimpleIssues issues={simpleIssues} />
      ) : null}

      {mode !== "simple" && draftIssues.length > 0 ? (
        <div className="callout warn" style={{ marginTop: 14 }}>
          <strong>Fix these inputs before running:</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            {draftIssues.map((issue, idx) => (
              <li key={`${issue.path}:${idx}`}>
                <span className="mono">{issue.path}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <button
          className="btn"
          onClick={mode === "simple" ? runSimple : mode === "builder" ? runBuilder : runJson}
          disabled={running}
        >
            {running ? <span className="spinner" /> : "Run clearing ▸"}
        </button>
      </div>

      {r ? (
        <div ref={resultsRef} tabIndex={-1} style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <Badge tone={resp!.source === "serverless" ? "mint" : "amber"}>
              {resp!.source === "serverless" ? "ran on the server" : "ran in your browser"}
            </Badge>
            <Badge tone={normalized?.run.calibration === "on" ? "mint" : "amber"}>
              calibration {normalized?.run.calibration}
            </Badge>
            <Badge>{r.ok ? "cleared" : "no feasible plan"}</Badge>
          </div>

          {r.ok ? (
            <>
              <div className="stat-row" style={{ marginBottom: 14 }}>
                <Stat k="plan score" v={r.objectiveValue.toFixed(4)} tone="mint" />
                <Stat k="total spend" v={usd(r.totalSpendUsdc)} small />
                <Stat k="observed end-to-end success" v={pctSmall(r.realizedEndToEndSuccess)} tone="mint" />
                <Stat k="claimed success" v={pctSmall(r.claimedEndToEndSuccess)} small />
              </div>
              <DagView
                graph={normalized!.graph}
                allocations={r.allocations.map((a) => ({
                  nodeId: a.nodeId,
                  taskId: "",
                  providerId: a.providerId,
                  score: a.score,
                }))}
              />
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
          This path accepts a full payload you define (graph + providers + run options). The same
          payload can come from the builder or direct JSON paste. Contract doc:{" "}
          <a href={INPUT_CONTRACT_URL} target="_blank" rel="noreferrer">INPUT-CONTRACT.md</a>.
        </p>
        <p>
          It uses a fast greedy solver so it can run instantly anywhere (serverless if available,
          browser fallback if not). The historical runs above remain the canonical whole-graph
          clears with exact solver output and Arc receipts.
        </p>
      </Collapsible>
    </Panel>
  );
}

function SimpleMode(props: {
  catalog: ReturnType<typeof buildCapabilityCatalog>;
  text: string;
  onChange: (v: string) => void;
  onReset: () => void;
  running: boolean;
}) {
  const { catalog } = props;
  return (
    <div style={{ marginTop: 14 }}>
      <p className="why" style={{ marginTop: 0 }}>
        List your steps, pick a capability for each from the catalog below, and optionally say which
        steps depend on which. Everything else — providers, prices, bonds, calibration — is filled in
        automatically. The box is pre-loaded with a working example, so you can just hit{" "}
        <strong>Run clearing</strong>.
      </p>
      <div className="field">
        <label>describe your workflow (simple JSON)</label>
        <textarea
          className="json-editor"
          value={props.text}
          onChange={(e) => props.onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn ghost" onClick={props.onReset} disabled={props.running}>
          Reset example
        </button>
      </div>

      <div className="callout" style={{ marginTop: 12 }}>
        <strong>risk</strong> maps to how cautious the router is:{" "}
        {RISK_LEVELS.map((lvl, i) => (
          <span key={lvl} className="mono">
            {i > 0 ? " · " : ""}
            {lvl} → {RISK_AVERSION[lvl].toFixed(1)}
          </span>
        ))}
        . <strong>budgetUsdc</strong> and <strong>deadlineMs</strong> are optional (auto-sized if
        omitted). Steps run in the order listed unless <span className="mono">dependsOn</span> says
        otherwise.
      </div>

      <Collapsible label={`Available capabilities (${catalog.length}) and who backs each`}>
        <table className="t">
          <thead>
            <tr>
              <th>Capability</th>
              <th>What it does</th>
              <th>Backed by</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((entry) => (
              <tr key={entry.capability}>
                <td className="mono">{entry.capability}</td>
                <td>{entry.description}</td>
                <td className="mono">{entry.providers.map((p) => p.id).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Collapsible>
    </div>
  );
}

function SimpleIssues(props: { issues: SimpleIssue[] }) {
  const errors = props.issues.filter((i) => i.severity === "error");
  const warnings = props.issues.filter((i) => i.severity === "warning");
  return (
    <>
      {errors.length > 0 ? (
        <div className="callout warn" style={{ marginTop: 14 }}>
          <strong>Fix these before running:</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            {errors.map((issue, idx) => (
              <li key={`${issue.path}:${idx}`}>
                <span className="mono">{issue.path}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="callout" style={{ marginTop: 12 }}>
          <strong>Heads up:</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            {warnings.map((issue, idx) => (
              <li key={`${issue.path}:${idx}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function buildProviderCatalog(runs: DemoRun[]): ProviderView[] {
  const byId = new Map<string, ProviderView>();
  for (const run of runs) {
    for (const provider of run.providers) {
      if (!byId.has(provider.id)) byId.set(provider.id, cloneProvider(provider));
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function cloneProvider(provider: ProviderView): ProviderView {
  return { ...provider, capabilities: [...provider.capabilities] };
}

function splitCsv(raw: string): string[] {
  return raw.split(",").map((part) => part.trim()).filter(Boolean);
}

function normalizeCurrencyInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "0";
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return trimmed;
  return n.toFixed(2);
}

function dependenciesForNode(payload: LiveRunInput, nodeId: string): string[] {
  return payload.graph.edges.filter((edge) => edge.to === nodeId).map((edge) => edge.from);
}
