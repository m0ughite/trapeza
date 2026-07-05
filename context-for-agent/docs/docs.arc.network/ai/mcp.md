> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Arc MCP server

> Connect your AI coding tools to Arc documentation using the Model Context Protocol (MCP) server for search and full-page retrieval.

The Arc Model Context Protocol (MCP) server gives AI tools direct access to Arc
documentation so they can search for relevant content and retrieve full pages
during conversations. It is hosted at `https://docs.arc.network/mcp` and
requires no authentication.

The server exposes two tools:

* **Search** — finds relevant documentation snippets based on a query.
* **Get page** — retrieves the full content of a specific documentation page.

<Tip>
  For a machine-readable index of all documentation pages, see the [`llms.txt`
  file](https://docs.arc.network/llms.txt).
</Tip>

## Claude Code

Run the following command to add the Arc MCP server:

```bash theme={null}
claude mcp add --transport http arc-docs https://docs.arc.network/mcp
```

Claude Code automatically discovers the server's tools on the next conversation.

## Claude Desktop

1. Open **Settings** and navigate to **Connectors**.
2. Select **Add custom connector**.
3. Enter `Arc Docs` as the name and `https://docs.arc.network/mcp` as the URL.
4. During a chat, use the attachments button to select the Arc Docs connector.

## Cursor

Add the following to your `mcp.json` file (accessible via **Cursor Settings >
MCP**):

```json theme={null}
{
  "mcpServers": {
    "arc-docs": {
      "url": "https://docs.arc.network/mcp"
    }
  }
}
```

## VS Code (Copilot)

Create or update `.vscode/mcp.json` in your project root:

```json theme={null}
{
  "servers": {
    "arc-docs": {
      "type": "http",
      "url": "https://docs.arc.network/mcp"
    }
  }
}
```

## Windsurf

Add the following to your Windsurf MCP configuration:

```json theme={null}
{
  "mcpServers": {
    "arc-docs": {
      "serverUrl": "https://docs.arc.network/mcp"
    }
  }
}
```

## Other MCP clients

Any MCP-compatible client can connect using the HTTP transport at
`https://docs.arc.network/mcp`. Most clients require only the server URL and
transport type (`http`). Refer to your client's documentation for the exact
configuration format.

## Verify the connection

After adding the server, confirm the connection by asking your AI tool a
question about Arc, such as "What smart contract standards does Arc support?"
The tool should return content sourced from Arc documentation. If it does not:

* **Check the URL** — confirm it is exactly `https://docs.arc.network/mcp` with
  no trailing path.
* **Check network access** — the server must be reachable over HTTPS from your
  machine.
* **Restart the client** — some tools only detect new MCP servers after a
  restart or new session.
