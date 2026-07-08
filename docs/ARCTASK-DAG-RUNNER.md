# ArcTask DAG Runner

End-to-end pipeline: **TaskGraph → clearinghouse → ArcTask escrow per node → worker LLM → oracle verify → accept/reject on-chain**.

## Prerequisites

1. **Fork + deploy ArcTask** — see [`integrations/arctask/README.md`](../integrations/arctask/README.md)
2. **Start the ArcTask worker** — copy [`integrations/arctask/.env.local.example`](../integrations/arctask/.env.local.example) to your ArcTask clone as `.env.local`:

```bash
cp integrations/arctask/.env.local.example .env.local
# edit LLM_API_KEY, contract addresses after deploy
```

3. **Fund Trapeza wallets** — copy [`.env.arctask-live.example`](../.env.arctask-live.example) to `.env`:

| Variable | Role |
|----------|------|
| `BUYER_PRIVATE_KEY` | Client — funds escrow jobs |
| `VALIDATOR_PRIVATE_KEY` | Evaluator — accept/reject work |
| `OWNER_PRIVATE_KEY` | Agent owner (if registering new agents) |

4. **Live mode env**:

```bash
TRAPEZA_LIVE_ONCHAIN=1
ARCTASK_SIMULATED=false
ARCTASK_USDC_MODE=erc20   # or native for upstream ArcTask deploy
ARCTASK_REGISTRY_ADDRESS=0x...
ARCTASK_ESCROW_ADDRESS=0x...
ARCTASK_API_BASE=https://your-arctask-app.example
```

Trapeza **never** accepts LLM keys in API requests. The worker reads `LLM_*` from its own environment.

## TaskGraph schema

Reuse `@trapeza/core` `TaskGraph` (same as [`demo/run-clearing.ts`](../demo/run-clearing.ts)):

- `nodes[].task.capability` — must match registry agent capabilities (`arctask.general.v1`, `code.fix.v1`, `extract.invoice.v1`, …)
- `nodes[].task.input.prompt` — passed to the worker via `jobURI`
- `nodes[].task.oracleSpec` — JSON schema for deliverable verification
- `globalBudgetUsdc`, `globalDeadlineMs`, `edges`

Example: [`examples/arctask-dag.json`](../examples/arctask-dag.json)

## CLI

```bash
# Simulated dry-run (no chain, auto-submits deliverables)
ARCTASK_SIMULATED=true npm run run:arctask-dag -- --graph examples/arctask-dag.json

# Live (worker must be running)
TRAPEZA_LIVE_ONCHAIN=1 ARCTASK_SIMULATED=false npm run run:arctask-dag -- --graph examples/arctask-dag.json

# Save result JSON
npm run run:arctask-dag -- --graph examples/arctask-dag.json --out /tmp/run.json
```

## Dashboard

1. From `apps/dashboard`, run **`npm run dev:full`** (not plain `dev`) so `/api/*` routes work locally.
2. Open **Agents** → check **ArcTask live readiness** (registry, API, worker).
3. **Build a workflow** — set **ArcTask run mode** to `simulated` or `live`.
4. **Clear (preview)** — simulated greedy clearing (unchanged).
5. **Run on ArcTask (simulated)** or **Run on ArcTask (live)** — calls `POST /api/run-arctask-dag`.

Live mode is disabled in the UI until the status panel reports `live ready` (server env + ArcTask API reachable). Groq keys are configured only in the ArcTask worker env.

## Manual verification

1. Terminal A: ArcTask worker with `LLM_*` configured
2. Terminal B: `npm run run:arctask-dag -- --graph examples/arctask-dag.json`
3. Confirm arcscan txs and accepted job statuses
4. Dashboard: compose the same graph → **Run live on ArcTask**

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Timeout waiting for Submitted | Start the ArcTask `agent-worker.mjs` with `LLM_*` set |
| Preflight failed | Increase `globalBudgetUsdc` or fund `BUYER_PRIVATE_KEY` |
| No feasible provider | Register agents with matching capabilities on your fork |
| 501 from dashboard API | Set `TRAPEZA_LIVE_ONCHAIN=1` + wallet env on the server |
