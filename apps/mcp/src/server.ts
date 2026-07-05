import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { assemble, type TrapezaRuntime } from "@trapeza/runtime";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  calibrationQuerySchema,
  capabilityQuerySchema,
  providerInputSchema,
  receiptQuerySchema,
  taskGraphSchema,
  taskSpecSchema,
} from "./schemas.js";
import {
  getProviderCalibration,
  getProviders,
  getReceipt,
  getStatus,
  mapError,
  registerProvider,
  submitGraph,
  submitTask,
} from "./tools.js";

function defaultDbPath(): string {
  return (
    process.env.TRAPEZA_DB_PATH ??
    join(homedir(), ".trapeza", "trapeza.db")
  );
}

function toolResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
    isError,
  };
}

export function createMcpServer(rt: TrapezaRuntime): McpServer {
  const server = new McpServer(
    { name: "trapeza", version: "0.1.0" },
    {
      instructions:
        "Trapeza calibration-aware broker/clearinghouse. Use submit_graph for DAG workflows or submit_task for single tasks.",
    },
  );

  server.registerTool(
    "register_provider",
    {
      description: "Register a provider in the Trapeza market",
      inputSchema: providerInputSchema.shape,
    },
    async (args) => {
      try {
        const input = providerInputSchema.parse(args);
        return toolResult(await registerProvider(rt, input));
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "get_providers",
    {
      description: "List active providers for a capability",
      inputSchema: capabilityQuerySchema.shape,
    },
    async (args) => {
      try {
        const { capability } = capabilityQuerySchema.parse(args);
        return toolResult(await getProviders(rt, capability));
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "get_provider_calibration",
    {
      description: "Read the Beta-Binomial calibration ledger for a provider",
      inputSchema: calibrationQuerySchema.shape,
    },
    async (args) => {
      try {
        const q = calibrationQuerySchema.parse(args);
        return toolResult(
          await getProviderCalibration(rt, q.providerId, q.capability),
        );
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "submit_task",
    {
      description: "Submit and settle a single task through the broker pipeline",
      inputSchema: taskSpecSchema.shape,
    },
    async (args) => {
      try {
        const input = taskSpecSchema.parse(args);
        return toolResult(await submitTask(rt, input));
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "submit_graph",
    {
      description:
        "Clear a task DAG via the clearinghouse (CP-SAT or greedy) and execute settlement",
      inputSchema: taskGraphSchema.shape,
    },
    async (args) => {
      try {
        const input = taskGraphSchema.parse(args);
        return toolResult(await submitGraph(rt, input));
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "get_receipt",
    {
      description: "Fetch task spec and recorded outcome by task id",
      inputSchema: receiptQuerySchema.shape,
    },
    async (args) => {
      try {
        const { taskId } = receiptQuerySchema.parse(args);
        return toolResult(await getReceipt(rt, taskId));
      } catch (err) {
        const mapped = mapError(err);
        return toolResult({ code: mapped.code, message: mapped.message }, true);
      }
    },
  );

  server.registerTool(
    "get_status",
    {
      description: "Health: solver tier availability, mode, database path",
      inputSchema: {},
    },
    async () => toolResult(await getStatus(rt)),
  );

  return server;
}

export async function startStdioServer(rt?: TrapezaRuntime): Promise<void> {
  const runtime =
    rt ??
    assemble({
      mode: (process.env.TRAPEZA_MODE as "mock" | "live") ?? "mock",
      dbPath: defaultDbPath(),
    });
  const server = createMcpServer(runtime);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
