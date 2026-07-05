/**
 * LLM-backed settlement adapter — pays endpoint, runs LLM, returns deliverable.
 */

import type { SettlementAdapter, TaskSpec } from "@trapeza/core";
import type { LlmClient } from "./client.js";
import { MockLlmClient } from "./mock-llm.js";
import { runLlmTask } from "./worker.js";

export interface LlmProviderConfig {
  providerId: string;
  priceUsdc: string;
  quality: number;
}

export type TaskLookup = (taskId: string) => Promise<TaskSpec | null>;

export class LlmSettlementAdapter implements SettlementAdapter {
  private seq = 0;
  private readonly endpointClients = new Map<string, LlmClient>();

  constructor(
    private registry: Map<string, LlmProviderConfig>,
    private defaultClient: LlmClient,
    private getTask: TaskLookup,
    private usePerEndpointMock = false,
  ) {}

  registerEndpoint(endpoint: string, config: LlmProviderConfig): void {
    this.registry.set(endpoint, config);
    if (this.usePerEndpointMock) {
      this.endpointClients.set(
        endpoint,
        new MockLlmClient({ quality: config.quality }),
      );
    }
  }

  async pay(
    endpoint: string,
    body?: unknown,
  ): Promise<{ amountUsdc: string; txHash: string; result?: unknown }> {
    const config = this.registry.get(endpoint);
    if (!config) {
      throw new Error(`unknown LLM endpoint: ${endpoint}`);
    }

    const input = body as { taskId?: string; question?: string } | undefined;
    const taskId = input?.taskId;
    if (!taskId) {
      throw new Error("LLM settlement requires taskId in request body");
    }

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`unknown task for LLM settlement: ${taskId}`);
    }

    const client = this.endpointClients.get(endpoint) ?? this.defaultClient;
    const deliverable = await runLlmTask(client, task, config.quality);
    const txHash = `0xllm${(++this.seq).toString(16).padStart(8, "0")}`;

    return {
      amountUsdc: config.priceUsdc,
      txHash,
      result: deliverable,
    };
  }
}
