/**
 * OpenAI-compatible chat completions client (OpenAI, NIM, Groq, Ollama).
 */

import type { LlmClient, LlmCompletionRequest } from "./client.js";

export interface OpenAiCompatOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class OpenAiCompatClient implements LlmClient {
  constructor(private options: OpenAiCompatOptions) {}

  async complete(request: LlmCompletionRequest): Promise<string> {
    const url = `${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: request.messages,
      temperature: 0,
    };
    if (request.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM response missing content");
    }
    return content;
  }
}
