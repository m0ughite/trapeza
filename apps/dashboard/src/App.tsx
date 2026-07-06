import { useEffect, useMemo, useRef, useState } from "react";
import { MANIFEST, RUNS, RECEIPTS } from "./fixtures";
import type { DemoRun } from "./types/contract";
import { Badge, Collapsible, Panel, SectionHeader, Stat, Tooltip } from "./components/ui";
import { DagView } from "./components/DagView";
import { BakeOffPanel } from "./components/BakeOffPanel";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { ShadowPricesPanel } from "./components/ShadowPricesPanel";
import { TwinRiskPanel } from "./components/TwinRiskPanel";
import { OnchainPanel } from "./components/OnchainPanel";
import { TractionStrip } from "./components/TractionStrip";
import { LiveRunPanel } from "./components/LiveRunPanel";
import { RunTracePanel } from "./components/RunTracePanel";
import { ScenarioExplorer } from "./components/ScenarioExplorer";
import { ms, num, pctSmall, plain, usd } from "./services/format";

const SECTIONS = [
  { id: "explorer", label: "Scenarios", num: "00" },
  { id: "overview", label: "Overview", num: "01" },
  { id: "clearing", label: "Clearing", num: "02" },
  { id: "trace", label: "Run trace", num: "03" },
  { id: "bakeoff", label: "Clearing vs. Greedy", num: "04" },
  { id: "calibration", label: "Calibration Ledger", num: "05" },
  { id: "shadow", label: "Bottlenecks", num: "06" },
  { id: "twin", label: "Risk Preflight", num: "07" },
  { id: "onchain", label: "Settlement", num: "08" },
  { id: "live", label: "Run Your Own", num: "09" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function useScrollSpy(): [SectionId, (id: SectionId) => void] {
  const [active, setActive] = useState<SectionId>("overview");
  const visible = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.current[e.target.id] = e.isIntersecting;
        const first = SECTIONS.find((s) => visible.current[s.id]);
        if (first) setActive(first.id);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  const go = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  };

  return [active, go];
}

function Sidebar(props: { active: SectionId; onGo: (id: SectionId) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">T</div>
        <div>
          <div className="sidebar-name">Trapeza</div>
          <div className="sidebar-kicker">Agent work clearinghouse</div>
        </div>
      </div>
      <nav className="nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`nav-item${props.active === s.id ? " active" : ""}`}
            onClick={() => props.onGo(s.id)}
          >
            <span className="nav-num">{s.num}</span>
            <span className="nav-label">{s.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <a href="#" onClick={(e) => { e.preventDefault(); props.onGo("live"); }}>
          Run a clearing →
        </a>
      </div>
    </aside>
  );
}

function ScenarioSelect(props: {
  runs: DemoRun[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <label className="scenario-select">
      <span>Scenario</span>
      <select value={props.activeId} onChange={(e) => props.onPick(e.target.value)}>
        {props.runs.map((r) => (
          <option key={r.meta.runId} value={r.meta.runId}>
            {r.meta.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Topbar(props: {
  runs: DemoRun[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-lead">
        <span className="topbar-title">Trapeza</span>
        <span className="topbar-vp">
          Route agent work to whoever actually delivers — clear the whole workflow at once, settle
          in USDC.
        </span>
      </div>
      <div className="topbar-actions">
        <ScenarioSelect runs={props.runs} activeId={props.activeId} onPick={props.onPick} />
      </div>
    </header>
  );
}

function ScenarioCard(props: { run: DemoRun; active: boolean; onPick: () => void }) {
  const { run } = props;
  return (
    <button className={`scenario-card${props.active ? " active" : ""}`} onClick={props.onPick}>
      <div className="sc-top">
        <span className="sc-title">{run.meta.label}</span>
        {props.active ? <Badge tone="mint">viewing</Badge> : null}
      </div>
      <div className="sc-desc">{plain(run.meta.description)}</div>
      <div className="sc-meta">
        <span>{run.graph.nodes.length} steps</span>
        <span>·</span>
        <span>{run.providers.length} providers</span>
        <span>·</span>
        <span>budget {usd(run.graph.globalBudgetUsdc, 2)}</span>
      </div>
    </button>
  );
}

function Overview(props: {
  runs: DemoRun[];
  run: DemoRun;
  onPick: (id: string) => void;
  onGo: (id: SectionId) => void;
}) {
  const { run } = props;
  const c = run.clearing;
  const cal = run.calibration;
  return (
    <div className="overview">
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">A clearinghouse for agent-to-agent work</div>
          <h1>
            Stop paying agents for what they <em>claim</em>. Pay for what they{" "}
            <em>deliver</em>.
          </h1>
          <p className="hero-lede">
            You hand Trapeza a whole workflow and a budget. It scores every provider on its real
            track record, solves the entire task graph in one shot instead of picking each step
            blind, dry-runs the plan for risk, and settles in USDC on Circle&apos;s Arc — with honest,
            verifiable receipts.
          </p>
          <div className="hero-cta">
            <button className="btn" onClick={() => props.onGo("clearing")}>
              See a live clearing →
            </button>
            <button className="btn ghost" onClick={() => props.onGo("calibration")}>
              Why calibration is the moat
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hs-v mint">{c.allocations.length}</div>
            <div className="hs-k">steps cleared</div>
          </div>
          <div className="hero-stat">
            <div className="hs-v">{usd(c.totalClearedUsdc, 2)}</div>
            <div className="hs-k">cleared this run</div>
          </div>
          <div className="hero-stat">
            <div className="hs-v mint">{pctSmall(cal.on.realizedEndToEndSuccess)}</div>
            <div className="hs-k">real end-to-end success</div>
          </div>
          <div className="hero-stat">
            <div className="hs-v">{ms(run.traction.makespanMs)}</div>
            <div className="hs-k">settlement makespan</div>
          </div>
        </div>
      </div>

      <div className="value-grid">
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◧</div>
          <h4>Clears the whole graph</h4>
          <p>
            A per-task router spends greedily and starves the step that decides success. Trapeza
            solves the entire workflow together, so it can buy cheap-but-good early to afford the
            bottleneck.
          </p>
          <button className="linklike" onClick={() => props.onGo("bakeoff")}>
            See the head-to-head →
          </button>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◔</div>
          <h4>Priced on realized outcomes</h4>
          <p>
            Providers are scored on what they actually delivered, not the success rate they claim.
            Confident liars get filtered out; quiet performers get the work.
          </p>
          <button className="linklike" onClick={() => props.onGo("calibration")}>
            Toggle the ledger on/off →
          </button>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◇</div>
          <h4>Dry-run before you pay</h4>
          <p>
            The cleared plan is simulated many times to estimate failure, deadline-miss and
            budget-overrun risk in the tail — before a single cent moves on-chain.
          </p>
          <button className="linklike" onClick={() => props.onGo("twin")}>
            Inspect the risk preflight →
          </button>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◈</div>
          <h4>Real USDC settlement</h4>
          <p>
            Cleared work settles per step in USDC on Arc. Every receipt is labeled honestly — real
            transaction hashes link out; batch IDs never masquerade as transactions.
          </p>
          <button className="linklike" onClick={() => props.onGo("onchain")}>
            See on-chain receipts →
          </button>
        </div>
      </div>

      <div className="scenario-block">
        <div className="scenario-block-head">
          <div>
            <div className="eyebrow">Pick a scenario</div>
            <p className="why">
              Bundled workflows replay real solver runs. Switching here drives every section below.
            </p>
          </div>
        </div>
        <div className="scenario-grid">
          {props.runs.map((r) => (
            <ScenarioCard
              key={r.meta.runId}
              run={r}
              active={r.meta.runId === run.meta.runId}
              onPick={() => props.onPick(r.meta.runId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClearingSection(props: { run: DemoRun; activeNodeId?: string }) {
  const { run, activeNodeId } = props;
  const c = run.clearing;

  if (run.status === "rejected") {
    return (
      <Panel
        title="Clearing rejected"
        headline
        right={<Badge tone="red">{run.error?.code ?? "rejected"}</Badge>}
        sub={plain(run.meta.narrative)}
      >
        <div className="callout warn">
          <strong>Preflight blocked this run.</strong> {run.error?.message}
        </div>
        <DagView graph={run.graph} allocations={[]} activeNodeId={activeNodeId} />
      </Panel>
    );
  }

  return (
    <Panel
      title="The cleared workflow"
      headline
      right={
        <div style={{ display: "flex", gap: 6 }}>
          <Badge tone="mint">graph solver</Badge>
          {c.degraded ? <Badge tone="amber">degraded</Badge> : null}
          {c.preflightPassed ? <Badge tone="mint">preflight ok</Badge> : <Badge tone="red">blocked</Badge>}
        </div>
      }
      sub={plain(run.meta.narrative)}
    >
      <div className="stat-row" style={{ marginBottom: 14 }}>
        <Stat
          k="plan score"
          v={num(c.objectiveValue, 4)}
          tone="mint"
          note="expected value − cost − risk, summed over the plan"
        />
        <Stat k="total cleared" v={usd(c.totalClearedUsdc)} />
        <Stat k="makespan" v={ms(c.makespanMs)} small />
        <Stat k="steps" v={run.graph.nodes.length} small />
      </div>
      <DagView graph={run.graph} allocations={c.allocations} activeNodeId={activeNodeId} />
      <div className="dag-legend">
        <span><i className="chip chosen" /> chosen provider</span>
        <span><i className="chip bottleneck" /> bottleneck step</span>
        <span>each box shows <strong>step · capability · value</strong> and the hired provider</span>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px" }}>
          <div className="mini-label">
            What each step pays{" "}
            <Tooltip>
              Each step settles at the lower of the provider&apos;s ask and the requester&apos;s
              reserve, so surplus stays with the buyer.
            </Tooltip>
          </div>
          <table className="t">
            <tbody>
              {Object.entries(c.settlementPricesUsdc).map(([n, p]) => (
                <tr key={n}>
                  <td className="mono">{n}</td>
                  <td style={{ textAlign: "right" }}>{usd(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: "1 1 300px" }}>
          <div className="callout warn">
            <strong>Nothing moves until the plan is safe.</strong> The same clearing against an
            under-funded buyer is rejected before any money moves — {run.preflight.underFunded.summary}.
          </div>
        </div>
      </div>
      <Collapsible label="How the clearing works">
        <p>
          Trapeza takes the workflow as a directed graph of steps, each with a value, a capability
          and dependencies. It picks one provider per step to maximize
          <code> Σ (success × value − cost − risk)</code> subject to the shared budget, the
          deadline, per-step quality floors and provider bond limits.
        </p>
        <p>
          The reference clearings shown here are produced by an exact constraint solver running
          offline; the numbers are replayed verbatim so the demo has zero live dependency. The
          interactive <em>Run Your Own</em> section uses a lighter, instant solver.
        </p>
      </Collapsible>
    </Panel>
  );
}

export function App() {
  const [activeId, setActiveId] = useState(RUNS[0]!.meta.runId);
  const run = useMemo(() => RUNS.find((r) => r.meta.runId === activeId)!, [activeId]);
  const [active, go] = useScrollSpy();
  const [traceNodeId, setTraceNodeId] = useState<string | undefined>();

  return (
    <div className="shell">
      <Sidebar active={active} onGo={go} />
      <div className="main">
        <Topbar runs={RUNS} activeId={activeId} onPick={setActiveId} />
        <main className="content">
          <section id="explorer" className="section">
            <ScenarioExplorer manifest={MANIFEST} activeId={activeId} onPick={setActiveId} />
          </section>

          <section id="overview" className="section">
            <Overview runs={RUNS} run={run} onPick={setActiveId} onGo={go} />
          </section>

          <section id="clearing" className="section">
            <SectionHeader
              eyebrow="Clearing"
              title="See the whole workflow cleared at once"
              why="A per-task router decides each step in isolation; the clearinghouse solves the graph together, so it can trade off cheap steps to afford the one that matters."
            />
            <ClearingSection run={run} activeNodeId={traceNodeId} />
          </section>

          <section id="trace" className="section">
            <SectionHeader
              eyebrow="Run trace"
              title="Watch the clearing think, step by step"
              why="Each phase — validate, score, assign, schedule, preflight, settle — is logged from the real engine path."
            />
            <RunTracePanel trace={run.trace} onActiveNode={setTraceNodeId} />
          </section>

          <section id="bakeoff" className="section">
            <SectionHeader
              eyebrow="Clearing vs. Greedy"
              title="Graph clearing vs. picking each task greedily"
              why="Same workflow, two solvers. Greedy optimizes each step blind and busts the budget; the graph solver clears feasibly."
            />
            <BakeOffPanel bakeOff={run.bakeOff} />
          </section>

          <section id="calibration" className="section">
            <SectionHeader
              eyebrow="Calibration Ledger"
              title="Providers scored on what they delivered — not what they claimed"
              why="Trust the sales pitch and you buy lemons. Score realized outcomes and the quiet performers win the work."
            />
            <CalibrationPanel calibration={run.calibration} providers={run.providers} />
          </section>

          <section id="shadow" className="section">
            <SectionHeader
              eyebrow="Bottlenecks"
              title="Where the plan is actually constrained"
              why="The clearing exposes which resource is scarce — budget, deadline or a specific provider — and how much an extra unit would be worth."
            />
            <ShadowPricesPanel clearing={run.clearing} />
          </section>

          <section id="twin" className="section">
            <SectionHeader
              eyebrow="Risk Preflight"
              title="Dry-run the plan before you pay"
              why="Simulate the cleared plan thousands of times to see failure, deadline-miss and budget-overrun risk in the tail — before committing on-chain."
            />
            <TwinRiskPanel twin={run.twin} />
          </section>

          <section id="onchain" className="section">
            <SectionHeader
              eyebrow="Settlement"
              title="Real USDC receipts on Arc — labeled honestly"
              why="Cleared steps settle in USDC. Real transaction hashes link to the explorer; batch IDs are never dressed up as transactions."
            />
            <OnchainPanel receipts={RECEIPTS} />
          </section>

          <section id="live" className="section">
            <SectionHeader
              eyebrow="Run Your Own"
              title="Clear a workflow yourself"
              why="Set a budget and risk appetite, flip calibration on or off, and run a real clearing — server-side, or in your browser if no backend is deployed. No money moves."
            />
            <LiveRunPanel runs={RUNS} />
            <Panel
              title="What the market moved"
              hint="from the cleared plan"
              sub="Cleared volume, value delivered per USDC, settlement latency, how deep the payment chain runs and how connected the workflow is."
            >
              <TractionStrip traction={run.traction} />
            </Panel>
          </section>

          <footer className="footer">
            Historical runs are real engine output emitted offline by{" "}
            <span className="mono">demo/emit-run.ts</span>; on-chain receipts are real Arc-testnet
            transactions. Batch settlement IDs are labeled as such and never linked as transactions —
            only real 0x+64-hex hashes link to the explorer. Fixture generated{" "}
            {new Date(run.meta.generatedAt).toLocaleDateString()}. Built for the Lepton Agents
            Hackathon (Canteen × Circle).
          </footer>
        </main>
      </div>
    </div>
  );
}
