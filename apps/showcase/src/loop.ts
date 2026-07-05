/**
 * Narrated LLM market loop for the visual showcase.
 */

import type { TrapezaRuntime } from "@trapeza/runtime";
import {
  makeQaTask,
  nextDemoQa,
  seedLlmProviders,
  type SeededLlmMarket,
} from "@trapeza/provider-llm";

export interface ShowcaseLoopOptions {
  intervalMs?: number;
  useCalibration?: boolean;
  maxIterations?: number;
  onBeat?: (line: string) => void;
}

function beat(line: string, onBeat?: (line: string) => void): void {
  const msg = `[showcase] ${line}`;
  onBeat?.(msg);
  console.log(msg);
}

export async function runShowcaseLoop(
  rt: TrapezaRuntime,
  market: SeededLlmMarket,
  options: ShowcaseLoopOptions = {},
): Promise<void> {
  if (!rt.llm) {
    throw new Error("showcase requires assemble({ mode: 'llm' })");
  }

  const intervalMs = options.intervalMs ?? 2500;
  const useCalibration = options.useCalibration ?? true;
  const maxIterations = options.maxIterations ?? 12;
  let i = 0;

  const runIteration = async (): Promise<void> => {
    if (i >= maxIterations) {
      beat("loop complete — dashboard still live", options.onBeat);
      return;
    }

    const iteration = i;
    i += 1;

    try {
      const qa = nextDemoQa(iteration);
      const task = makeQaTask(`showcase-${iteration}`, qa, iteration);
      beat(`task ${task.id}: "${qa.question}"`, options.onBeat);

      await rt.core.submitTask(task);
      const quotes = await rt.core.collectQuotes(task.id);
      beat(
        `quotes: ${quotes.map((q) => `${q.providerId}@$${q.priceUsdc}`).join(", ")}`,
        options.onBeat,
      );

      const allocation = await rt.core.route(task.id, quotes, useCalibration);
      beat(
        `route → ${allocation.providerId} (${allocation.mechanism}, score=${allocation.score.toFixed(3)})`,
        options.onBeat,
      );

      await rt.core.postBond(allocation);
      const started = Date.now();
      const execResult = (await rt.core.execute(allocation)) as {
        receipt: { amountUsdc: string; txHash: string; result?: { answer?: string } };
      };
      const answer = execResult.receipt.result?.answer ?? "?";
      beat(
        `paid $${execResult.receipt.amountUsdc} tx=${execResult.receipt.txHash} answer="${answer}"`,
        options.onBeat,
      );

      const deliverable = execResult.receipt.result ?? execResult;
      const verdict = await rt.core.oracleVerify(task, deliverable);
      const outcome = {
        ...verdict,
        providerId: allocation.providerId,
        realizedCostUsdc: execResult.receipt.amountUsdc,
        realizedLatencyMs: Date.now() - started,
      };
      const { action, txHash } = await rt.core.settle(task.id, outcome);
      await rt.core.recordOutcome(outcome);

      beat(
        `oracle ${outcome.passed ? "PASS" : "FAIL"} → ${action} (${txHash})`,
        options.onBeat,
      );

      const role = [...market.byRole.entries()].find(
        ([, id]) => id === allocation.providerId,
      )?.[0];

      await rt.store.appendEvent({
        ts: Date.now(),
        kind: "outcome",
        taskId: task.id,
        providerId: allocation.providerId,
        payload: {
          passed: outcome.passed,
          answer,
          expected: qa.answer,
          role,
          resultPerUsdc:
            outcome.passed && Number(outcome.realizedCostUsdc) > 0
              ? 1 / Number(outcome.realizedCostUsdc)
              : 0,
          resultPerSecond:
            outcome.passed && outcome.realizedLatencyMs > 0
              ? 1000 / outcome.realizedLatencyMs
              : 0,
          calibrationOn: useCalibration,
        },
      });

      if (allocation.providerId === market.lemonId) {
        beat("lemon won this round", options.onBeat);
      }
    } catch (err) {
      beat(`error: ${String(err)}`, options.onBeat);
    }

    if (i < maxIterations) {
      setTimeout(() => {
        void runIteration();
      }, intervalMs);
    } else {
      beat("loop complete — dashboard still live", options.onBeat);
    }
  };

  void runIteration();
}

export async function bootstrapLlmMarket(
  rt: TrapezaRuntime,
): Promise<SeededLlmMarket> {
  if (!rt.llm) throw new Error("assemble mode must be llm");
  return seedLlmProviders(rt.core, rt.store, rt.llm.settlement, rt.llm.quotes);
}
