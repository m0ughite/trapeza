# apps/ — Trapeza app layer (placeholder)

The **app layer** is built strictly on `@trapeza/core`'s public API and nothing
below it (DESIGN.md §4.3 hard rule). Nothing is implemented here in P0 — this
directory only reserves the boundary.

Planned packages (DESIGN.md §6 phase plan):

| Package | Phase | Role |
| --- | --- | --- |
| `@trapeza/mcp` | P4 | MCP server exposing `submit_task`, `get_quote`, `get_providers`, `get_receipt` (and later `submit_graph` per DESIGN-CLEARINGHOUSE.md). |
| `@trapeza/sim` | P4 | Seeded requester + provider agent loop generating continuous testnet-USDC volume. |
| `@trapeza/app` | P5 | Next.js 16 dashboard: tx graph, calibration curves, slash feed, CALIBRATION ON/OFF toggle. |

These import `@trapeza/core` and call the primitive; they never re-implement the
clearing pipeline.
