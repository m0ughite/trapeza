import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useScenario } from "../scenario/ScenarioContext";
import { PAGES, pageIndex } from "../pages/pages";
import { plain, usd } from "../services/format";

/** Scenario dropdown — lives in the top bar, drives every page via context. */
function ScenarioSelect() {
  const { runs, activeId, setActiveId } = useScenario();
  return (
    <label className="scenario-select">
      <span>Scenario</span>
      <select value={activeId} onChange={(e) => setActiveId(e.target.value)}>
        {runs.map((r) => (
          <option key={r.meta.runId} value={r.meta.runId}>
            {r.meta.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Sidebar() {
  const { search } = useLocation();
  return (
    <aside className="sidebar">
      <Link to={{ pathname: "/", search }} className="sidebar-brand" aria-label="Trapeza home">
        <div className="logo" aria-hidden>
          T
        </div>
        <div>
          <div className="sidebar-name">Trapeza</div>
          <div className="sidebar-kicker">Agent work clearinghouse</div>
        </div>
      </Link>
      <nav className="nav" aria-label="Sections">
        {PAGES.map((p) => (
          <NavLink
            key={p.path}
            to={{ pathname: p.path, search }}
            end={p.path === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-num">{p.num}</span>
            <span className="nav-label">{p.navLabel}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <Link to={{ pathname: "/run", search }}>Run a clearing →</Link>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-lead">
          <span className="topbar-title">Trapeza</span>
          <span className="topbar-vp">
            Route agent work to whoever actually delivers — clear the whole workflow at once, settle
            in USDC.
          </span>
        </div>
        <div className="topbar-actions">
          <ScenarioSelect />
        </div>
      </div>
    </header>
  );
}

/** Prev / next affordance so pages read as an ordered story, not a maze. */
function PageNav() {
  const { pathname, search } = useLocation();
  const { run } = useScenario();
  const idx = pageIndex(pathname);
  if (idx === -1) return null;
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;
  return (
    <nav className="page-nav" aria-label="Section pagination">
      {prev ? (
        <Link className="page-nav-link prev" to={{ pathname: prev.path, search }}>
          <span className="page-nav-dir">← Previous</span>
          <span className="page-nav-label">{prev.navLabel}</span>
        </Link>
      ) : (
        <span />
      )}
      <span className="page-nav-scenario" title="Selected scenario">
        {plain(run.meta.label)} · budget {usd(run.graph.globalBudgetUsdc, 2)}
      </span>
      {next ? (
        <Link className="page-nav-link next" to={{ pathname: next.path, search }}>
          <span className="page-nav-dir">Next →</span>
          <span className="page-nav-label">{next.navLabel}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function Layout() {
  const { run } = useScenario();
  const { pathname } = useLocation();

  // Land at the top of each page on navigation, not wherever the last one scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar />
      <div className="main">
        <Topbar />
        <main className="content" id="main-content" tabIndex={-1}>
          <div className="shell-column">
            <div className="page" key={pathname}>
              <Outlet />
            </div>
            <PageNav />
            <footer className="footer">
              Historical runs are engine output emitted offline by{" "}
              <span className="mono">demo/emit-run.ts</span>; on-chain receipts are Arc-testnet
              transactions. Batch settlement IDs are labeled as such and never linked as transactions —
              only verified 0x+64-hex hashes link to the explorer. Fixture generated{" "}
              {new Date(run.meta.generatedAt).toLocaleDateString()}. Built for the Lepton Agents
              Hackathon (Canteen × Circle).
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
