import { describe, expect, it } from "vitest";
import {
  decodeJobPayloadUri,
  encodeJobPayloadUri,
  jobToTaskSpec,
  SimulatedArcTaskClient,
  parseUsdcToWei,
} from "../src/index.js";
import { ARCTASK_USDC_MODE } from "../src/constants.js";
// The brain orchestrator lives at the harness/orchestration layer (not in the
// adapter). We import it here to prove the shipped loop, not a reimplementation.
import { runArcBrain, DEFAULT_SIM_ROSTER } from "../../../scripts/arc-brain.js";

describe("ArcTask adapter surface", () => {
  it("exports arctask-client surface", async () => {
    const client = await import("../src/arctask-client.js");
    expect(client.ArcTaskClient).toBeDefined();
    expect(client.arctaskEscrowAbi).toBeDefined();
    expect(client.ArcTaskJobStatus.Funded).toBe(0);
  });

  it("decodes jobURI payloads", () => {
    const payload = { title: "test", description: "desc" };
    const uri = encodeJobPayloadUri(payload);
    expect(decodeJobPayloadUri(uri)).toEqual(payload);
  });

  it("maps jobs to TaskSpec", () => {
    const job = {
      jobId: 1n,
      client: "0x1111111111111111111111111111111111111111",
      agentId: 1n,
      agentOwner: "0x2222222222222222222222222222222222222222",
      evaluator: "0x3333333333333333333333333333333333333333",
      rewardAmount: parseUsdcToWei("0.01", ARCTASK_USDC_MODE),
      deadline: 9_999_999_999n,
      jobURI: encodeJobPayloadUri({ title: "T", description: "D" }),
      deliverableHash: `0x${"0".repeat(64)}` as `0x${string}`,
      status: 0,
      createdAt: 1n,
      updatedAt: 1n,
    };
    const spec = jobToTaskSpec(job);
    expect(spec.id).toBe("arctask:job:1");
    expect(spec.capability).toBe("arctask.general.v1");
  });
});

describe("Trapeza = clearing + evaluator brain over ArcTask", () => {
  const fixedNow = Date.parse("2026-07-13T00:00:00.000Z");

  async function runBrain(client: SimulatedArcTaskClient) {
    return runArcBrain({
      simulated: true,
      usdcMode: "native",
      seedJob: true,
      useCalibration: true,
      clientKey: ("0x" + "11".repeat(32)) as `0x${string}`,
      evaluatorKey: ("0x" + "33".repeat(32)) as `0x${string}`,
      ownerKey: ("0x" + "22".repeat(32)) as `0x${string}`,
      arctaskClient: client,
      now: () => fixedNow,
      generatedAt: "2026-07-13T00:00:00.000Z",
    });
  }

  it("reads the registry into a calibrated directory", async () => {
    const client = new SimulatedArcTaskClient();
    const { receipt } = await runBrain(client);
    expect(receipt.registry).toHaveLength(DEFAULT_SIM_ROSTER.length);
    // Directory carries calibrated (realized) success, distinct from claims.
    const workhorse = receipt.registry.find((r) => r.archetype === "workhorse")!;
    const braggart = receipt.registry.find((r) => r.archetype === "braggart")!;
    expect(workhorse.calibratedSuccessProb).toBeGreaterThan(braggart.calibratedSuccessProb);
    expect(braggart.claimedSuccessProb).toBeGreaterThan(workhorse.claimedSuccessProb);
  });

  it("clears to the calibrated winner, not the loudest bidder", async () => {
    const client = new SimulatedArcTaskClient();
    const { receipt, winnerProviderId } = await runBrain(client);
    // Calibration ON hires the workhorse; trusting the bids (OFF) would hire the braggart.
    expect(receipt.clearing.calibratedWinner).not.toBe(receipt.clearing.claimedWinner);
    expect(receipt.clearing.winnerProviderId).toBe(receipt.clearing.calibratedWinner);
    const winnerRow = receipt.registry.find((r) => r.providerId === winnerProviderId)!;
    expect(winnerRow.archetype).toBe("workhorse");
    // The pick is the top-ranked candidate.
    expect(receipt.clearing.ranked[0].hired).toBe(true);
    expect(receipt.clearing.ranked[0].providerId).toBe(winnerProviderId);
    expect(receipt.clearing.ranked[0].source).toBe("calibrated");
  });

  it("never submits the deliverable itself; the worker is external", async () => {
    const client = new SimulatedArcTaskClient();
    const { receipt } = await runBrain(client);
    expect(receipt.execution.submittedByTrapeza).toBe(false);
    expect(receipt.execution.submitted).toBe(true);
    expect(receipt.execution.worker).toBe("simulated-external-worker");
  });

  it("evaluates as a distinct evaluator and settles the escrow", async () => {
    const client = new SimulatedArcTaskClient();
    const { receipt, jobId, winnerAgentId } = await runBrain(client);

    // Evaluator (Trapeza) is a different wallet than the worker/agent owner.
    const winnerRow = receipt.registry.find(
      (r) => r.agentId === winnerAgentId.toString(),
    )!;
    expect(receipt.meta.evaluator.toLowerCase()).not.toBe(winnerRow.wallet.toLowerCase());

    // Oracle verified → escrow released → reputation written.
    expect(receipt.evaluation.passed).toBe(true);
    expect(receipt.evaluation.settlement).toBe("release");
    expect(receipt.evaluation.reputation).not.toBeNull();

    // On-chain job reached Accepted (2) via acceptWork.
    const job = await client.getJob(jobId);
    expect(job.status).toBe(2);
    // The escrow evaluator on the job is Trapeza's evaluator wallet.
    expect(job.evaluator.toLowerCase()).toBe(receipt.meta.evaluator.toLowerCase());
  });

  it("emits a simulated receipt whose refs never link out", async () => {
    const client = new SimulatedArcTaskClient();
    const { receipt } = await runBrain(client);
    expect(receipt.meta.mode).toBe("simulated");
    for (const step of receipt.evaluation.steps) {
      expect(step.ref.linkable).toBe(false);
      expect(step.ref.url).toBeNull();
    }
  });
});
