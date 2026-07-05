---
name: Phase D dashboard gaps
overview: "Close the three remaining Phase D dashboard deltas: emit shadow prices into the events feed, then surface a shadow-price readout, a CALIBRATION ON/OFF toggle, and a result-per-USDC/second panel in the Next.js dashboard."
todos:
  - id: emit-shadow-prices
    content: Add shadowPricesUsdc + settlementPricesUsdc to the clearing event in execute-clearing.ts; update executor test assertion
    status: completed
  - id: shadow-panel
    content: Render shadow-price readout card in dashboard page.tsx from latest clearing event
    status: completed
  - id: result-metrics-panel
    content: Aggregate resultPerUsdc/resultPerSecond from outcome events into a per-provider dashboard panel
    status: completed
  - id: calibration-toggle
    content: Add CALIBRATION ON/OFF toggle to dashboard + document sim-driven authority in dashboard README
    status: completed
  - id: verify-d
    content: Build dashboard, keep test/coverage/demo green, manual four-panel check, log ACTIVITY-LOG
    status: completed
isProject: false
---

## Phase D dashboard gap closure

All 8 plan todos are implemented and green (typecheck, 83 tests, 97.4% coverage, demo, solver). The only deltas vs the plan are three dashboard panels plus one missing event field feeding one of them.

## Building the project

### Command surface (root [package.json](package.json))

- `npm install` — installs all workspaces (`packages/*` + `apps/*`).
- `npm run build` = `npm run build --workspaces --if-present` — builds every workspace that defines a `build` script.
- `npm run typecheck` = `tsc -b packages/core packages/oracle packages/clearinghouse packages/adapter-arc packages/adapter-gateway packages/store-sqlite packages/runtime apps/mcp apps/sim` — note this list does NOT include `apps/dashboard`.
- `npm test` / `npm run test:coverage` — vitest over `packages/**` + `apps/**/test`; no dashboard suite.
- `npm run demo`, `npm run solver:test` — regression gates, untouched by this plan.

### Does `npm run build` build the Next.js dashboard? Yes.

`@trapeza/app` defines `"build": "next build"` ([apps/dashboard/package.json](apps/dashboard/package.json)), so `--if-present` runs it as part of root `npm run build`. Three things make this work and are the likely failure points to watch:

- **Build order.** The dashboard imports `@trapeza/store-sqlite`, whose `exports` resolve to `./dist`. npm iterates workspaces in config order (`packages/*` before `apps/*`), so store-sqlite's `dist` is built before `next build` runs. [apps/dashboard/next.config.mjs](apps/dashboard/next.config.mjs) also lists it under `transpilePackages`.
- **Native module.** `better-sqlite3` is native and only touched server-side in [apps/dashboard/src/lib/db.ts](apps/dashboard/src/lib/db.ts) (route handlers). The page is `"use client"`, so there is no DB access at build time — but this is the most probable `next build` break, so it is verified explicitly below.
- **Dashboard is otherwise uncovered.** Since typecheck and vitest both exclude the dashboard, `next build` (via `npm run build -w @trapeza/app`) is the ONLY compile/type gate for the dashboard code — the tsconfig sets `noEmit: true` + `jsx: preserve` for editor typing only.

### Build/verify sequence for this plan

1. `npm run build -w @trapeza/store-sqlite` (ensure `dist` exists for dashboard resolution).
2. `npm run build -w @trapeza/app` — compile the dashboard with the new panels; this is the authoritative dashboard gate.
3. `npm run typecheck && npm test && npm run test:coverage` — engine + runtime executor change (step 1 of gap closure) stays green and >=85%.
4. `npm run demo` — unchanged regression.

### 1. Emit shadow prices into the events feed (root-cause fix)

In [packages/runtime/src/execute-clearing.ts](packages/runtime/src/execute-clearing.ts), the `clearing` event payload currently drops `shadowPricesUsdc`. Extend it:

```ts
payload: {
  solver: clearing.meta.solver,
  objectiveValue: clearing.meta.objectiveValue,
  degraded: clearing.meta.degraded ?? false,
  shadowPricesUsdc: clearing.shadowPricesUsdc,   // add
  settlementPricesUsdc: clearing.settlementPricesUsdc, // add
},
```

Update the existing executor event-emission assertion in [packages/runtime/test/execute-clearing.test.ts](packages/runtime/test/execute-clearing.test.ts) to assert the `clearing` event carries `shadowPricesUsdc`. Keeps coverage gate intact.

### 2. Shadow-price readout panel

In [apps/dashboard/src/app/page.tsx](apps/dashboard/src/app/page.tsx), read the latest `clearing` event and render its `shadowPricesUsdc` map (key -> USDC) in a new card. Data already arrives via `/api/events`; no API change needed after step 1.

### 3. result-per-USDC / result-per-second panel

The `outcome` events already carry `resultPerUsdc` / `resultPerSecond` in their payload ([apps/sim/src/loop.ts](apps/sim/src/loop.ts) L170-186). Aggregate per `providerId` in the page and render a small table. No API change required.

### 4. CALIBRATION ON/OFF toggle

- Add a client toggle in [apps/dashboard/src/app/page.tsx](apps/dashboard/src/app/page.tsx) whose state is a display/query filter (mock DBs are seeded per-mode; the sim owns the real ON/OFF via `TRAPEZA_CALIBRATION`).
- The toggle sets a label and filters/annotates the shown run; document in [apps/dashboard/README.md](apps/dashboard/README.md) that authoritative ON/OFF is driven by the sim env var, matching the plan's "existing route(useCalibration) flag" note.

### Verification

- `npm run build -w @trapeza/app` — dashboard's authoritative gate (typecheck excludes it); must exit 0 with the new panels.
- `npm run typecheck` (dashboard is not in the tsc project list; the store-sqlite/runtime/mcp/sim packages still typecheck).
- `npm test` + `npm run test:coverage` stay >=85% (executor test updated in step 1).
- `npm run demo` stays green (untouched).
- Manual: `TRAPEZA_DB_PATH=.trapeza/sim.db npm run sim` then `npm run dev -w @trapeza/app`, confirm all four panels populate.
- Append an [ACTIVITY-LOG.md](ACTIVITY-LOG.md) entry.

### Non-goals

- Live on-chain deploy (Phase E) stays manual per plan sequencing.
- No change to the module boundary; dashboard keeps reading via `SqliteStore` route handlers only.