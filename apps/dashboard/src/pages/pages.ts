/**
 * The information architecture, in one place. This single ordered list drives
 * the sidebar navigation, the route table, each page's header, and the
 * prev/next affordance — so they can never drift out of sync.
 */
export interface PageDef {
  /** Route path. */
  path: string;
  /** Two-digit order marker shown in the sidebar. */
  num: string;
  /** Short label for the sidebar. */
  navLabel: string;
  /** Eyebrow kicker above the page title. */
  eyebrow: string;
  /** Page title. */
  title: string;
  /** One-sentence "what this shows / why it matters", in plain language. */
  intro: string;
}

export const PAGES: PageDef[] = [
  {
    path: "/",
    num: "01",
    navLabel: "Overview",
    eyebrow: "Overview",
    title: "A clearinghouse for agent-to-agent work",
    intro:
      "The whole pitch at a glance — what Trapeza does, the headline numbers for this run, and the scenario picker that drives every other page.",
  },
  {
    path: "/clearing",
    num: "02",
    navLabel: "Clearing",
    eyebrow: "Clearing",
    title: "See the whole workflow cleared at once",
    intro:
      "The task graph solved all at once: who got hired for each step, what each step pays, and a step-by-step trace of how the plan came together.",
  },
  {
    path: "/bakeoff",
    num: "03",
    navLabel: "Clearing vs. Greedy",
    eyebrow: "Clearing vs. Greedy",
    title: "Graph clearing vs. picking each task greedily",
    intro:
      "The same workflow solved two ways — a greedy per-step router versus the whole-graph clearing — so you can see when solving jointly actually matters.",
  },
  {
    path: "/calibration",
    num: "04",
    navLabel: "Calibration Ledger",
    eyebrow: "Calibration Ledger",
    title: "Providers scored on what they delivered — not what they claimed",
    intro:
      "Flip the ledger ON and OFF to watch confident-but-unreliable providers get filtered out and the quiet performers win the work.",
  },
  {
    path: "/bottlenecks",
    num: "05",
    navLabel: "Bottlenecks",
    eyebrow: "Bottlenecks",
    title: "Where the plan is actually constrained",
    intro:
      "Which limit is holding the plan back — budget, deadline or a specific provider — and how much more value you'd capture by loosening it by one unit.",
  },
  {
    path: "/risk",
    num: "06",
    navLabel: "Risk Preflight",
    eyebrow: "Risk Preflight",
    title: "Dry-run the plan before you pay",
    intro:
      "The cleared plan replayed thousands of times before any money moves, scoring how often it fails, misses the deadline, or overruns the budget.",
  },
  {
    path: "/settlement",
    num: "07",
    navLabel: "Settlement",
    eyebrow: "Settlement",
    title: "Real USDC receipts on Arc — labeled honestly",
    intro:
      "Cleared steps settle in USDC on Circle's Arc testnet. Real transaction hashes link to the explorer; batch IDs never masquerade as transactions.",
  },
  {
    path: "/run",
    num: "08",
    navLabel: "Run Your Own",
    eyebrow: "Run Your Own",
    title: "Clear a workflow yourself",
    intro:
      "Build your own workflow in plain language, from the visual builder, or by pasting JSON — then clear it live. No money moves.",
  },
];

export function pageIndex(pathname: string): number {
  // Exact match first; fall back to prefix for nested paths.
  const exact = PAGES.findIndex((p) => p.path === pathname);
  if (exact !== -1) return exact;
  return PAGES.findIndex((p) => p.path !== "/" && pathname.startsWith(p.path));
}
