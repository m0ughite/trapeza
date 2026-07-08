/**
 * ArcJobWatcher — discover funded ArcTask jobs via on-chain events and/or REST.
 */

import { parseAbiItem } from "viem";
import type { TaskSpec } from "@trapeza/core";
import { ARCTASK_API_BASE, ARCTASK_ESCROW_ADDRESS } from "./constants.js";
import {
  ArcTaskClient,
  decodeJobPayloadUri,
  jobToTaskSpec,
  type ArcTaskJob,
} from "./arctask.js";

export interface NetworkJobRow {
  jobId: string;
  agentId: string;
  client: string;
  evaluator: string;
  rewardAmount: string;
  deadline: string;
  jobURI: string;
  status: string;
}

export interface WatcherOptions {
  escrowAddress?: `0x${string}`;
  apiBase?: string;
  fromBlock?: bigint;
  /** Only return jobs in Funded (0) or Submitted (1) status. */
  activeOnly?: boolean;
}

export class ArcJobWatcher {
  private readonly client: ArcTaskClient;
  private readonly apiBase: string;
  private readonly fromBlock: bigint;
  private readonly activeOnly: boolean;

  constructor(client?: ArcTaskClient, opts: WatcherOptions = {}) {
    this.client = client ?? new ArcTaskClient({ escrowAddress: opts.escrowAddress });
    this.apiBase = opts.apiBase ?? ARCTASK_API_BASE;
    this.fromBlock = opts.fromBlock ?? 0n;
    this.activeOnly = opts.activeOnly ?? true;
  }

  /** Poll ArcTask REST API for network jobs. */
  async fetchNetworkJobs(): Promise<NetworkJobRow[]> {
    const url = `${this.apiBase.replace(/\/$/, "")}/api/network/jobs`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ArcTask API ${res.status}: ${await res.text()}`);
    }
    const body = (await res.json()) as { jobs?: NetworkJobRow[] } | NetworkJobRow[];
    return Array.isArray(body) ? body : (body.jobs ?? []);
  }

  /** Subscribe to JobCreated logs from a block range. */
  async watchJobCreated(
    toBlock: bigint = "latest" as unknown as bigint,
  ): Promise<ArcTaskJob[]> {
    const logs = await this.client.publicClient.getLogs({
      address: this.client.escrowAddress ?? ARCTASK_ESCROW_ADDRESS,
      event: parseAbiItem(
        "event JobCreated(uint256 indexed jobId, uint256 indexed agentId, address indexed client, address evaluator, uint256 rewardAmount, uint64 deadline, string jobURI)",
      ),
      fromBlock: this.fromBlock,
      toBlock,
    });

    const jobs: ArcTaskJob[] = [];
    for (const log of logs) {
      if (!log.args.jobId) continue;
      const job = await this.client.getJob(log.args.jobId);
      if (this.activeOnly && job.status > 1) continue;
      jobs.push(job);
    }
    return jobs;
  }

  /** Merge REST + on-chain discovery; REST rows are enriched via getJob. */
  async discoverJobs(): Promise<ArcTaskJob[]> {
    const seen = new Map<string, ArcTaskJob>();

    try {
      const rows = await this.fetchNetworkJobs();
      for (const row of rows) {
        const jobId = BigInt(row.jobId);
        const job = await this.client.getJob(jobId);
        if (this.activeOnly && job.status > 1) continue;
        seen.set(jobId.toString(), job);
      }
    } catch {
      // REST optional — fall back to events only
    }

    try {
      const fromEvents = await this.watchJobCreated();
      for (const job of fromEvents) {
        seen.set(job.jobId.toString(), job);
      }
    } catch {
      // events optional in simulated mode
    }

    return [...seen.values()];
  }

  /** Map discovered jobs to Trapeza TaskSpecs. */
  async discoverTaskSpecs(capability?: string): Promise<TaskSpec[]> {
    const jobs = await this.discoverJobs();
    return jobs.map((job) => jobToTaskSpec(job, { capability }));
  }
}

export { decodeJobPayloadUri, jobToTaskSpec };
