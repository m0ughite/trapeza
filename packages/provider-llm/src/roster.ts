/**
 * Demo Q&A bank + LLM provider roster for the showcase.
 */

import type { ProviderProfile, Quote, TaskSpec } from "@trapeza/core";

export interface DemoQa {
  question: string;
  answer: string;
}

export const DEMO_QA: DemoQa[] = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "What is 17 + 25?", answer: "42" },
  { question: "What is the chemical symbol for gold?", answer: "Au" },
  { question: "How many continents are there?", answer: "7" },
  { question: "What planet is known as the Red Planet?", answer: "Mars" },
  { question: "What is the square root of 144?", answer: "12" },
  { question: "Who wrote Romeo and Juliet?", answer: "Shakespeare" },
  { question: "What is the largest ocean?", answer: "Pacific" },
];

export function lookupAnswer(prompt: string): string | undefined {
  const q = extractQuestion(prompt);
  const hit = DEMO_QA.find(
    (item) => item.question.toLowerCase() === q.toLowerCase(),
  );
  return hit?.answer;
}

function extractQuestion(prompt: string): string {
  const match = prompt.match(/Question:\s*(.+)/i);
  return match?.[1]?.trim() ?? prompt.trim();
}

export type LlmProviderRole = "accurate" | "lemon" | "mid";

export interface LlmProviderSpec {
  id: string;
  role: LlmProviderRole;
  wallet: `0x${string}`;
  endpoint: string;
  priceUsdc: string;
  quality: number;
  claimedSuccessProb: number;
  claimedLatencyMs: number;
  historySamples: number;
  realizedPassRate: number;
}

export const LLM_ROSTER: LlmProviderSpec[] = [
  {
    id: "llm-accurate",
    role: "accurate",
    wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    endpoint: "https://llm.accurate/qa",
    priceUsdc: "0.18",
    quality: 0.95,
    claimedSuccessProb: 0.7,
    claimedLatencyMs: 120,
    historySamples: 20,
    realizedPassRate: 0.92,
  },
  {
    id: "llm-lemon",
    role: "lemon",
    wallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    endpoint: "https://llm.lemon/qa",
    priceUsdc: "0.12",
    quality: 0.15,
    claimedSuccessProb: 0.98,
    claimedLatencyMs: 50,
    historySamples: 20,
    realizedPassRate: 0.12,
  },
  {
    id: "llm-mid",
    role: "mid",
    wallet: "0xcccccccccccccccccccccccccccccccccccccccc",
    endpoint: "https://llm.mid/qa",
    priceUsdc: "0.15",
    quality: 0.55,
    claimedSuccessProb: 0.85,
    claimedLatencyMs: 90,
    historySamples: 20,
    realizedPassRate: 0.55,
  },
];

const ANSWER_SCHEMA = {
  type: "object",
  properties: { answer: { type: "string" } },
  required: ["answer"],
  additionalProperties: false,
};

export function makeQaTask(id: string, qa: DemoQa, index: number): TaskSpec {
  return {
    id,
    capability: "cap.qa",
    input: { question: qa.question, taskId: id },
    oracleSpec: {
      schema: ANSWER_SCHEMA,
      groundTruth: { answer: qa.answer },
    },
    valueUsdc: "0.50",
    budgetUsdc: "0.80",
    preference: { price: 0.25, latency: 0.25, quality: 0.25, risk: 0.25 },
    deadlineMs: 60_000,
    bondRatio: 0.05,
  };
}

export function nextDemoQa(index: number): DemoQa {
  return DEMO_QA[index % DEMO_QA.length]!;
}

export function providerProfileFromSpec(
  spec: LlmProviderSpec,
): Omit<ProviderProfile, "id" | "agentId"> {
  return {
    wallet: spec.wallet,
    capabilities: ["cap.qa"],
    endpoint: spec.endpoint,
    priceSurface: () => spec.priceUsdc,
    bondBalanceUsdc: "5.00",
    status: "active",
  };
}

export function quoteFromSpec(
  spec: LlmProviderSpec,
  providerId: string,
): Quote {
  return {
    providerId,
    priceUsdc: spec.priceUsdc,
    claimedSuccessProb: spec.claimedSuccessProb,
    claimedLatencyMs: spec.claimedLatencyMs,
    bondOfferedUsdc: "0.05",
  };
}
