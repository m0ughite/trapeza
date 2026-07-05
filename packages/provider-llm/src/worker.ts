/**
 * Run an LLM task and return a schema-shaped deliverable.
 */

import type { TaskSpec } from "@trapeza/core";
import type { LlmClient } from "./client.js";
import { lookupAnswer } from "./roster.js";

export interface LlmDeliverable {
  answer: string;
}

export async function runLlmTask(
  client: LlmClient,
  task: TaskSpec,
  _quality = 0.9,
): Promise<LlmDeliverable> {
  const question =
    typeof task.input === "object" &&
    task.input !== null &&
    "question" in task.input
      ? String((task.input as { question: string }).question)
      : JSON.stringify(task.input);

  const system = [
    "You answer factual questions concisely.",
    'Respond with JSON only: {"answer":"<your answer>"}.',
    "No markdown, no explanation.",
  ].join(" ");

  const raw = await client.complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Question: ${question}` },
    ],
    jsonMode: true,
  });

  const parsed = parseDeliverable(raw);
  if (parsed) return parsed;

  const fallback = lookupAnswer(question);
  return { answer: fallback ?? "unknown" };
}

function parseDeliverable(raw: string): LlmDeliverable | null {
  try {
    const obj = JSON.parse(raw) as { answer?: unknown };
    if (typeof obj.answer === "string") {
      return { answer: obj.answer };
    }
  } catch {
    const trimmed = raw.trim();
    if (trimmed) return { answer: trimmed };
  }
  return null;
}
