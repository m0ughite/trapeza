/**
 * LLM client factory — mock by default, OpenAI-compatible when LLM_BASE_URL is set.
 */

import { MockLlmClient } from "./mock-llm.js";
import { OpenAiCompatClient } from "./openai-compat.js";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompletionRequest {
  messages: LlmMessage[];
  jsonMode?: boolean;
}

export interface LlmClient {
  complete(request: LlmCompletionRequest): Promise<string>;
}

export interface LlmClientEnv {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export function createLlmClient(env: LlmClientEnv = {}): LlmClient {
  const baseUrl = env.baseUrl ?? process.env.LLM_BASE_URL?.trim();
  if (baseUrl) {
    return new OpenAiCompatClient({
      baseUrl,
      apiKey: env.apiKey ?? process.env.LLM_API_KEY?.trim() ?? "not-needed",
      model: env.model ?? process.env.LLM_MODEL?.trim() ?? "gpt-4o-mini",
    });
  }
  return new MockLlmClient();
}
