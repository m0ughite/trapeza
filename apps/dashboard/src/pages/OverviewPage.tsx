import { Link, useLocation } from "react-router-dom";
import { useScenario } from "../scenario/ScenarioContext";
import { Badge } from "../components/ui";
import { ms, pctSmall, plain, usd } from "../services/format";
import type { DemoRun } from "../types/contract";

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

export function OverviewPage() {
  const { runs, run, activeId, setActiveId } = useScenario();
  const { search } = useLocation();
  const c = run.clearing;
  const cal = run.calibration;

  return (
    <div className="overview">
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">A clearinghouse for agent-to-agent work</div>
          <h1>
            Stop paying agents for what they <em>claim</em>. Pay for what they <em>deliver</em>.
          </h1>
          <p className="hero-lede">
            You hand Trapeza a whole workflow and a budget. It scores every provider on observed
            track record, solves the entire task graph in one shot instead of picking each step
            blind, dry-runs the plan for risk, and settles in USDC on Circle&apos;s Arc with labeled,
            verifiable receipts.
          </p>
          <div className="hero-cta">
            <Link className="btn" to={{ pathname: "/clearing", search }}>
              See a live clearing →
            </Link>
            <Link className="btn ghost" to={{ pathname: "/calibration", search }}>
              Inspect calibration impact →
            </Link>
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
            <div className="hs-k">observed end-to-end success</div>
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
          <Link className="linklike" to={{ pathname: "/bakeoff", search }}>
            See the head-to-head →
          </Link>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◔</div>
          <h4>Priced on realized outcomes</h4>
          <p>
            Providers are scored on what they actually delivered, not the success rate they claim.
            Overstated bids get filtered out, while consistently reliable providers win work.
          </p>
          <Link className="linklike" to={{ pathname: "/calibration", search }}>
            Toggle the ledger on/off →
          </Link>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◇</div>
          <h4>Dry-run before you pay</h4>
          <p>
            The cleared plan is simulated many times to estimate failure, deadline-miss and
            budget-overrun risk in the tail — before a single cent moves on-chain.
          </p>
          <Link className="linklike" to={{ pathname: "/risk", search }}>
            Inspect the risk preflight →
          </Link>
        </div>
        <div className="value-card">
          <div className="vc-icon" aria-hidden>◈</div>
          <h4>USDC settlement on Arc</h4>
          <p>
            Cleared work settles per step in USDC on Arc. Every receipt is labeled clearly:
            transaction hashes link out, and batch IDs are never presented as transactions.
          </p>
          <Link className="linklike" to={{ pathname: "/settlement", search }}>
            See on-chain receipts →
          </Link>
        </div>
      </div>

      <div className="scenario-block">
        <div className="scenario-block-head">
          <div>
            <div className="eyebrow">Pick a scenario</div>
            <p className="why">
              Six bundled workflows, each replaying a solver-backed run. Your choice drives every page
              and stays selected as you navigate.
            </p>
          </div>
        </div>
        <div className="scenario-grid">
          {runs.map((r) => (
            <ScenarioCard
              key={r.meta.runId}
              run={r}
              active={r.meta.runId === activeId}
              onPick={() => setActiveId(r.meta.runId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
