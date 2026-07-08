/**
 * Provider-agnostic OpenAI-compatible LLM client for ArcTask worker.
 *
 * Configure via LLM_BASE_URL + LLM_API_KEY + LLM_MODEL (Groq, OpenAI, Ollama, …).
 * OPENAI_* env vars are back-compat aliases. Defaults to /chat/completions.
 */

import fs from "node:fs";
import path from "node:path";

let envLoaded = false;

function ensureEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function getEnv(key, fallback = "") {
  ensureEnvLoaded();
  return process.env[key] ?? fallback;
}

function getBooleanEnv(key, fallback = false) {
  ensureEnvLoaded();
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

function getOptionalPositiveIntegerEnv(key, fallback) {
  ensureEnvLoaded();
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function getLlmConfig() {
  ensureEnvLoaded();
  return {
    baseUrl:
      getEnv("LLM_BASE_URL") ||
      getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    apiKey: getEnv("LLM_API_KEY") || getEnv("OPENAI_API_KEY", ""),
    model: getEnv("LLM_MODEL") || getEnv("OPENAI_MODEL", "gpt-4.1-mini"),
    endpoint: (getEnv("LLM_ENDPOINT", "chat") || "chat").toLowerCase(),
    timeoutMs: getOptionalPositiveIntegerEnv(
      "LLM_TIMEOUT_MS",
      getOptionalPositiveIntegerEnv("OPENAI_TIMEOUT_MS", 60_000),
    ),
    maxOutputTokens: getOptionalPositiveIntegerEnv(
      "LLM_MAX_OUTPUT_TOKENS",
      getOptionalPositiveIntegerEnv("OPENAI_MAX_OUTPUT_TOKENS", 1_800),
    ),
    webSearchEnabled: getBooleanEnv("ARC_AGENT_ENABLE_WEB_SEARCH", false),
    webSearchContext: getEnv("ARC_AGENT_WEB_SEARCH_CONTEXT", "low"),
  };
}

/** @deprecated use getLlmConfig() */
export const llmConfig = new Proxy(
  {},
  {
    get(_target, prop) {
      return getLlmConfig()[prop];
    },
  },
);

function isKeylessProvider(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function isLlmConfigured() {
  const cfg = getLlmConfig();
  if (!cfg.baseUrl || !cfg.model) return false;
  return isKeylessProvider(cfg.baseUrl) || Boolean(cfg.apiKey);
}

export function llmExecutorLabel() {
  if (!isLlmConfigured()) return "deterministic-fallback";
  const cfg = getLlmConfig();
  return `${cfg.endpoint}:${cfg.model}@${new URL(cfg.baseUrl).host}`;
}

function authHeaders(cfg) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  return headers;
}

export function extractChatText(body) {
  const choice = body?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

export function extractResponsesText(body) {
  const output = body?.output;
  if (!Array.isArray(output)) return "";
  const chunks = [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function buildChatBody({ systemPrompt, userPrompt, maxTokens, model }) {
  const messages = [];
  const sys = String(systemPrompt ?? "").trim();
  if (sys) {
    messages.push({ role: "system", content: sys });
  }
  messages.push({ role: "user", content: userPrompt });
  return {
    model,
    max_tokens: maxTokens,
    messages,
  };
}

function buildResponsesBody({ systemPrompt, userPrompt, maxTokens, model, tools }) {
  return {
    model,
    max_output_tokens: maxTokens,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    ...(tools ? { tools } : {}),
  };
}

/**
 * Run the configured LLM executor.
 * Defaults to /chat/completions (Groq, OpenAI, NVIDIA NIM, Ollama).
 * Use LLM_ENDPOINT=responses for OpenAI-only web-search path.
 */
export async function runLlmExecutor({ systemPrompt, userPrompt }) {
  const llmConfig = getLlmConfig();
  const useResponses =
    llmConfig.endpoint === "responses" ||
    (llmConfig.webSearchEnabled && llmConfig.endpoint !== "chat");

  if (useResponses && !llmConfig.apiKey) {
    throw new Error("LLM_ENDPOINT=responses requires LLM_API_KEY / OPENAI_API_KEY");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), llmConfig.timeoutMs);

  try {
    const tools =
      useResponses && llmConfig.webSearchEnabled
        ? [{ type: "web_search", search_context_size: llmConfig.webSearchContext }]
        : undefined;

    const apiPath = useResponses ? "/responses" : "/chat/completions";
    const body = useResponses
      ? buildResponsesBody({
          systemPrompt,
          userPrompt,
          maxTokens: llmConfig.maxOutputTokens,
          model: llmConfig.model,
          tools,
        })
      : buildChatBody({
          systemPrompt,
          userPrompt,
          maxTokens: llmConfig.maxOutputTokens,
          model: llmConfig.model,
        });

    const response = await fetch(`${llmConfig.baseUrl.replace(/\/$/, "")}${apiPath}`, {
      method: "POST",
      headers: authHeaders(llmConfig),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`LLM returned non-JSON (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const message = parsed?.error?.message ?? `LLM request failed with HTTP ${response.status}`;
      throw new Error(message);
    }

    const output = useResponses
      ? extractResponsesText(parsed)
      : extractChatText(parsed);

    if (!output) {
      throw new Error("LLM response did not include output text");
    }

    return {
      mode: useResponses ? "responses" : "chat",
      model: llmConfig.model,
      baseUrl: llmConfig.baseUrl,
      output,
    };
  } finally {
    clearTimeout(timeout);
  }
}
