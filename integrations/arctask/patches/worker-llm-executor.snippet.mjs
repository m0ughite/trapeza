function buildLlmPrompts(jobId, job, payload) {
  const taskProfile = getTaskProfile(payload);
  const systemPrompt = [
    "You are an autonomous ArcTask AI agent.",
    `Task profile: ${taskProfile.kind}. ${taskProfile.instruction}`,
    'Respond in plain language, then end with a single JSON line: {"summary":"your one-sentence result here"}',
  ].join(" ");

  const userPrompt =
    normalizeText(payload?.prompt) ||
    normalizeText(payload?.description) ||
    getPayloadText(payload) ||
    `Complete ArcTask job ${jobId.toString()}.`;

  return { systemPrompt, userPrompt };
}

function extractSummaryFromLlmOutput(output) {
  const text = String(output ?? "").trim();
  const jsonMatch = text.match(/\{\s*"summary"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/);
  if (jsonMatch?.[1]) return jsonMatch[1].replace(/\\"/g, '"');
  const firstParagraph = text.split(/\n\s*\n/)[0]?.trim();
  return firstParagraph || text.slice(0, 500);
}

async function runLlmAgentExecutor(jobId, job, payload) {
  const { systemPrompt, userPrompt } = buildLlmPrompts(jobId, job, payload);
  try {
    const llm = await runLlmExecutor({ systemPrompt, userPrompt });
    const summary = extractSummaryFromLlmOutput(llm.output);
    return {
      title: payload?.title ?? `ArcTask job ${jobId.toString()}`,
      summary,
      deliverable: {
        format: "application/json",
        content: JSON.stringify({ summary }),
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
