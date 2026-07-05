/**
 * Deterministic mock LLM — canned Q&A with a quality gate for lemon divergence.
 */

import type { LlmClient, LlmCompletionRequest } from "./client.js";
import { lookupAnswer } from "./roster.js";

export interface MockLlmOptions {
  /** Probability of returning the correct answer (0..1). */
  quality?: number;
}

export class MockLlmClient implements LlmClient {
  private seq = 0;

  constructor(private options: MockLlmOptions = {}) {}

  async complete(request: LlmCompletionRequest): Promise<string> {
    const user = request.messages.find((m) => m.role === "user")?.content ?? "";
    const correct = lookupAnswer(user);
    const quality = this.options.quality ?? 0.9;
    const pass = (this.seq++ % 100) / 100 < quality;
    const answer = pass && correct ? correct : pickWrong(correct, this.seq);
    if (request.jsonMode) {
      return JSON.stringify({ answer });
    }
    return answer;
  }
}

function pickWrong(correct: string | undefined, seq: number): string {
  const wrongs = ["unknown", "maybe", "error", "n/a", "incorrect"];
  if (correct && wrongs.includes(correct.toLowerCase())) {
    return "wrong";
  }
  return wrongs[seq % wrongs.length]!;
}
