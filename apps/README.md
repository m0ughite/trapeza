# apps/ — Trapeza app layer

The **app layer** is built on `@trapeza/core` / `assemble()` from
`@trapeza/runtime` — never re-implementing the clearing pipeline (DESIGN.md §4.3).

| Package | Role | Entry |
| --- | --- | --- |
| `@trapeza/mcp` | stdio MCP server — agent pairing surface | `npm run mcp` |
| `@trapeza/sim` | Seeded requester + provider loop | `npm run sim` |
| `@trapeza/app` | Next.js dashboard | `npm run dev -w @trapeza/app` |

## Shared database

All three surfaces default to **`~/.trapeza/trapeza.db`**. Run sim (or MCP
`submit_graph`) first, then open the dashboard — no env vars required.

```bash
npm run sim
npm run dev -w @trapeza/app
```

Override with `TRAPEZA_DB_PATH` on sim, MCP, and dashboard together.

## Package docs

- [`mcp/README.md`](mcp/README.md) — MCP install stanza + tools
- [`dashboard/README.md`](dashboard/README.md) — panels + build
- [`sim/`](sim/) — seeded lemon/workhorse/bottleneck roster
