# @trapeza/app

Next.js dashboard for Trapeza market observability.

## Run

```bash
# Populate data first (mock sim or MCP) — writes ~/.trapeza/trapeza.db
npm run sim

# Dashboard (same default DB; no env vars required)
npm run dev -w @trapeza/app
```

Open http://localhost:3000

Override the shared database path on both commands:

```bash
TRAPEZA_DB_PATH=.trapeza/custom.db npm run sim
TRAPEZA_DB_PATH=.trapeza/custom.db npm run dev -w @trapeza/app
```

## Build

```bash
npm run build -w @trapeza/store-sqlite   # dist required by dashboard imports
npm run build -w @trapeza/app              # next build — authoritative dashboard gate
```

Root `npm run build` also builds the dashboard via workspace `--if-present`.

## Panels

- Status / solver health
- CALIBRATION ON/OFF toggle (display mode; see below)
- Cumulative USDC volume
- Slash feed
- CP-SAT vs greedy bake-off (from `clearing` events)
- Shadow prices (from latest `clearing` event `shadowPricesUsdc`)
- Result-per-USDC / result-per-second (aggregated from `outcome` event payloads)
- Calibration posteriors (Beta mean table)
- Event stream (tx graph feed)

## CALIBRATION toggle

The dashboard toggle is a **display annotation** only. Authoritative calibration routing is controlled when seeding data:

```bash
# ON (default)
npm run sim

# OFF — lemon wins more share; compare ledgers
TRAPEZA_CALIBRATION=off npm run sim
```

Re-run sim with a different `TRAPEZA_CALIBRATION` value to compare ON vs OFF
outcomes. Use separate `TRAPEZA_DB_PATH` values to keep both ledgers side by side.
