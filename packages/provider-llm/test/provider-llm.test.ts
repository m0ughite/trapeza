import { afterEach, describe, expect, it, vi } from "vitest";
import { createLlmClient } from "../src/client.js";
import { OpenAiCompatClient } from "../src/openai-compat.js";
import { MockLlmClient } from "../src/mock-llm.js";
import { LlmSettlementAdapter } from "../src/settlement.js";
import { LlmQuoteSource } from "../src/quotes.js";
import { calibrationFromSpec } from "../src/calibration.js";
import { seedLlmProviders } from "../src/seed.js";
import {
  LLM_ROSTER,
  lookupAnswer,
  makeQaTask,
  nextDemoQa,
  providerProfileFromSpec,
  quoteFromSpec,
} from "../src/roster.js";
import { runLlmTask } from "../src/worker.js";
import { assemble } from "@trapeza/runtime";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("createLlmClient", () => {
  const prev = process.env.LLM_BASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.LLM_BASE_URL;
    else process.env.LLM_BASE_URL = prev;
  });

  it("returns MockLlmClient when LLM_BASE_URL is unset", () => {
    delete process.env.LLM_BASE_URL;
    expect(createLlmClient()).toBeInstanceOf(MockLlmClient);
  });

  it("returns OpenAiCompatClient when LLM_BASE_URL is set", () => {
    process.env.LLM_BASE_URL = "https://api.example.com/v1";
    expect(createLlmClient()).toBeInstanceOf(OpenAiCompatClient);
  });
});

describe("OpenAiCompatClient", () => {
  it("posts chat completions and returns content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"answer":"Paris"}' } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenAiCompatClient({
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "gpt-test",
    });
    const raw = await client.complete({
      messages: [{ role: "user", content: "Question: capital of France?" }],
      jsonMode: true,
    });
    expect(raw).toBe('{"answer":"Paris"}');
    expect(fetchMock).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});

describe("LlmQuoteSource", () => {
  it("seeds and returns quotes for registered providers", async () => {
    const quotes = new LlmQuoteSource();
    const byEndpoint = new Map([[LLM_ROSTER[0]!.endpoint, "prov_1"]]);
    quotes.seed(LLM_ROSTER, byEndpoint);
    const spec = LLM_ROSTER[0]!;
    const list = await quotes.quotesFor(makeQaTask("t", nextDemoQa(0), 0), [
      {
        id: "prov_1",
        agentId: 1n,
        wallet: spec.wallet,
        capabilities: ["cap.qa"],
        endpoint: spec.endpoint,
        priceSurface: () => spec.priceUsdc,
        bondBalanceUsdc: "1",
        status: "active",
      },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]?.priceUsdc).toBe(spec.priceUsdc);
  });
});

describe("calibrationFromSpec", () => {
  it("builds posterior from realized pass rate", () => {
    const spec = LLM_ROSTER[0]!;
    const cal = calibrationFromSpec({ ...spec, id: "prov_1" });
    expect(cal.nObservations).toBe(spec.historySamples);
    expect(cal.successAlpha).toBeGreaterThan(1);
  });
});

describe("seedLlmProviders", () => {
  it("registers roster and wires settlement", async () => {
    const dir = mkdtempSync(join(tmpdir(), "trapeza-llm-seed-"));
    const dbPath = join(dir, "seed.db");
    const rt = assemble({ mode: "llm", dbPath });
    const market = await seedLlmProviders(
      rt.core,
      rt.store,
      rt.llm!.settlement,
      rt.llm!.quotes,
    );
    expect(market.lemonId).toMatch(/^prov_/);
    const providers = await rt.core.listProviders("cap.qa");
    expect(providers.length).toBe(3);
    rt.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("MockLlmClient", () => {
  it("returns correct answer at high quality", async () => {
    const client = new MockLlmClient({ quality: 1 });
    const raw = await client.complete({
      messages: [{ role: "user", content: "Question: What is the capital of France?" }],
      jsonMode: true,
    });
    expect(JSON.parse(raw)).toEqual({ answer: "Paris" });
  });

  it("lookupAnswer resolves demo bank", () => {
    expect(lookupAnswer("Question: What is 17 + 25?")).toBe("42");
  });
});

describe("LlmSettlementAdapter", () => {
  it("returns deliverable in pay result", async () => {
    const qa = nextDemoQa(0);
    const task = makeQaTask("t1", qa, 0);
    const registry = new Map();
    const adapter = new LlmSettlementAdapter(
      registry,
      new MockLlmClient({ quality: 1 }),
      async (id) => (id === task.id ? task : null),
      true,
    );
    adapter.registerEndpoint("https://llm.test/qa", {
      providerId: "p1",
      priceUsdc: "0.12",
      quality: 1,
    });

    const receipt = await adapter.pay("https://llm.test/qa", {
      taskId: task.id,
      question: qa.question,
    });
    expect(receipt.result).toEqual({ answer: qa.answer });
    expect(receipt.amountUsdc).toBe("0.12");
  });

  it("rejects unknown endpoint and missing taskId", async () => {
    const registry = new Map();
    const adapter = new LlmSettlementAdapter(
      registry,
      new MockLlmClient(),
      async () => null,
      true,
    );
    await expect(adapter.pay("https://missing/qa", { taskId: "x" })).rejects.toThrow(
      /unknown LLM endpoint/,
    );
    adapter.registerEndpoint("https://llm.test/qa", {
      providerId: "p1",
      priceUsdc: "0.10",
      quality: 1,
    });
    await expect(adapter.pay("https://llm.test/qa", {})).rejects.toThrow(/taskId/);
  });
});

describe("runLlmTask", () => {
  it("produces schema-shaped deliverable", async () => {
    const qa = nextDemoQa(1);
    const task = makeQaTask("t2", qa, 1);
    const deliverable = await runLlmTask(
      new MockLlmClient({ quality: 1 }),
      task,
    );
    expect(deliverable.answer).toBe(qa.answer);
  });

  it("handles non-JSON raw responses", async () => {
    const task = makeQaTask("t4", nextDemoQa(0), 0);
    const client: import("../src/client.js").LlmClient = {
      complete: async () => "plain text answer",
    };
    const deliverable = await runLlmTask(client, task);
    expect(deliverable.answer).toBe("plain text answer");
  });
});

describe("lemon divergence", () => {
  it("low-quality mock often returns wrong answers", async () => {
    const qa = nextDemoQa(0);
    const task = makeQaTask("t3", qa, 0);
    const client = new MockLlmClient({ quality: 0.1 });
    let wrong = 0;
    for (let i = 0; i < 20; i++) {
      const d = await runLlmTask(client, task);
      if (d.answer !== qa.answer) wrong++;
    }
    expect(wrong).toBeGreaterThan(5);
  });
});

describe("roster helpers", () => {
  it("exports provider profile and quote shapes", () => {
    const spec = LLM_ROSTER[1]!;
    expect(providerProfileFromSpec(spec).endpoint).toBe(spec.endpoint);
    expect(quoteFromSpec(spec, "prov_x").providerId).toBe("prov_x");
  });
});

describe("LlmQuoteSource setQuote", () => {
  it("overrides seeded quotes", async () => {
    const quotes = new LlmQuoteSource();
    quotes.setQuote("prov_1", {
      priceUsdc: "0.99",
      claimedSuccessProb: 0.5,
      claimedLatencyMs: 100,
      bondOfferedUsdc: "0.01",
    });
    const list = await quotes.quotesFor(makeQaTask("t", nextDemoQa(0), 0), [
      {
        id: "prov_1",
        agentId: 1n,
        wallet: "0x1111111111111111111111111111111111111111",
        capabilities: ["cap.qa"],
        endpoint: "https://x.example",
        priceSurface: () => "0.99",
        bondBalanceUsdc: "1",
        status: "active",
      },
    ]);
    expect(list[0]?.priceUsdc).toBe("0.99");
  });
});
