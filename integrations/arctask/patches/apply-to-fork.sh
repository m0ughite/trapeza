#!/usr/bin/env bash
# Apply Trapeza LLM patches to a local ArcTask fork clone.
# Usage: ./apply-to-fork.sh /path/to/ArcTask

set -euo pipefail
TARGET="${1:?ArcTask clone path required}"
PATCH_DIR="$(cd "$(dirname "$0")" && pwd)"

cp "$PATCH_DIR/llm-client.mjs" "$TARGET/scripts/llm-client.mjs"
cp "$PATCH_DIR/../contracts/ArcTaskEscrowErc20.sol" "$TARGET/contracts/ArcTaskEscrowErc20.sol"

# Worker scripts: load .env.local before the worker runs (Node 20.6+).
PKG="$TARGET/package.json"
if ! grep -q '\-\-env-file=.env.local' "$PKG"; then
  sed -i 's|"agent:worker": "node scripts/agent-worker.mjs"|"agent:worker": "node --env-file=.env.local scripts/agent-worker.mjs"|' "$PKG"
  sed -i 's|"agent:worker:once": "ARC_AGENT_ONCE=true node scripts/agent-worker.mjs"|"agent:worker:once": "ARC_AGENT_ONCE=true node --env-file=.env.local scripts/agent-worker.mjs"|' "$PKG"
  sed -i 's|"agent:worker:live": "ARC_AGENT_DRY_RUN=false node scripts/agent-worker.mjs"|"agent:worker:live": "ARC_AGENT_DRY_RUN=false node --env-file=.env.local scripts/agent-worker.mjs"|' "$PKG"
fi

# Patch agent-worker.mjs imports + executor wiring if not already patched.
WORKER="$TARGET/scripts/agent-worker.mjs"
if ! grep -q "llm-client.mjs" "$WORKER"; then
  python3 - "$WORKER" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
insert = 'import { isLlmConfigured, llmExecutorLabel, runLlmExecutor } from "./llm-client.mjs";\n'
if insert.strip() not in text:
    text = insert + text
text = text.replace(
    'if (!openAiApiKey) {\n    return buildFallbackAgentResult(jobId, payload, "OPENAI_API_KEY is not configured.");',
    'if (!isLlmConfigured()) {\n    return buildFallbackAgentResult(jobId, payload, "LLM is not configured (set LLM_BASE_URL + LLM_MODEL).");',
)
text = text.replace(
    'return await runOpenAiExecutor(jobId, job, payload);',
    'return await runLlmAgentExecutor(jobId, job, payload);',
)
text = text.replace(
    'executor: openAiApiKey ? `openai:${openAiModel}` : "deterministic-fallback",',
    'executor: llmExecutorLabel(),',
)
text = text.replace(
    'webSearchEnabled: Boolean(openAiApiKey && openAiWebSearchEnabled),',
    'webSearchEnabled: Boolean(isLlmConfigured()),',
)
text = text.replace(
    'console.log(`executor: ${openAiApiKey ? `openai:${openAiModel}` : "deterministic-fallback"}`);',
    'console.log(`executor: ${llmExecutorLabel()}`);',
)
if "async function runLlmAgentExecutor" not in text:
    helper = '''

async function runLlmAgentExecutor(jobId, job, payload) {
  const taskProfile = getTaskProfile(payload);
  const systemPrompt = taskProfile.systemPrompt;
  const userPrompt = taskProfile.userPrompt;
  try {
    const llm = await runLlmExecutor({ systemPrompt, userPrompt });
    return {
      title: payload?.title ?? `ArcTask job ${jobId.toString()}`,
      summary: llm.output,
      deliverable: {
        format: "text/markdown",
        content: llm.output,
      },
      metadata: {
        executor: llmExecutorLabel(),
        mode: llm.mode,
        model: llm.model,
        baseUrl: llm.baseUrl,
        jobId: jobId.toString(),
        agentId: job.agentId?.toString?.() ?? String(job.agentId),
      },
    };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "LLM executor failed.";
    return {
      ...buildFallbackAgentResult(jobId, payload, message),
      metadata: { executor: llmExecutorLabel(), error: message },
    };
  }
}
'''
    text = text.replace('async function runOpenAiExecutor', helper + '\nasync function runOpenAiExecutor')
path.write_text(text)
print('patched', path)
PY
fi

echo "Applied Trapeza patches to $TARGET"

# Always refresh LLM executor helpers (fixes empty systemPrompt → Groq 400).
python3 - "$WORKER" "$PATCH_DIR/worker-llm-executor.snippet.mjs" <<'PY'
import pathlib, sys

path = pathlib.Path(sys.argv[1])
snippet = pathlib.Path(sys.argv[2]).read_text().rstrip() + "\n\n"
text = path.read_text()

text = text.replace(
    "  return [payload?.title, payload?.description].map(normalizeText).filter(Boolean).join(\"\\n\\n\");",
    "  return [payload?.title, payload?.description, payload?.prompt].map(normalizeText).filter(Boolean).join(\"\\n\\n\");",
)

marker = "async function runOpenAiExecutor"
idx = text.find(marker)
if idx == -1:
    raise SystemExit(f"{marker} not found in agent-worker.mjs")

for start_marker in ("function buildLlmPrompts", "async function runLlmAgentExecutor"):
    start = text.find(start_marker)
    if start != -1 and start < idx:
        text = text[:start] + snippet + text[idx:]
        break
else:
    text = text[:idx] + snippet + text[idx:]

path.write_text(text)
print("refreshed LLM executor in", path)
PY
