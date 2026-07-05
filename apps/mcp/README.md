# @trapeza/mcp

Trapeza MCP server — hire the calibration-aware market from Cursor, Claude, or any MCP client.

## Install (Cursor)

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "trapeza": {
      "command": "node",
      "args": ["apps/mcp/dist/cli.js"],
      "env": {
        "TRAPEZA_MODE": "mock",
        "TRAPEZA_DB_PATH": ".trapeza/trapeza.db"
      }
    }
  }
}
```

Build first: `npm run build -w @trapeza/mcp`

## Tools

| Tool | Description |
| --- | --- |
| `register_provider` | Register a provider |
| `get_providers` | List providers for a capability |
| `get_provider_calibration` | Read calibration ledger |
| `submit_task` | Single-task broker pipeline |
| `submit_graph` | DAG clear + execute |
| `get_receipt` | Task + outcome lookup |
| `get_status` | Solver health + mode |

## Environment

- `TRAPEZA_MODE` — `mock` (default), `llm`, or `live`
- `TRAPEZA_DB_PATH` — SQLite database path
- `TRAPEZA_SOLVER_URL` — Python CP-SAT service (default `http://127.0.0.1:8000`)

## HTTP / SSE transport

For HTTP MCP clients (stateless Streamable HTTP on `/mcp`):

```bash
npm run mcp:http
# → http://127.0.0.1:3100/mcp
```

Override port with `TRAPEZA_MCP_PORT`. Use `TRAPEZA_MODE=llm` for real LLM
deliverables through `SchemaOracle`.
