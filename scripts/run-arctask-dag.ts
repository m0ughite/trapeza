#!/usr/bin/env tsx
/**
 * Run a TaskGraph through the ArcTask DAG orchestrator.
 *
 *   npm run run:arctask-dag -- --graph examples/arctask-dag.json
 *   ARCTASK_SIMULATED=true npm run run:arctask-dag -- --graph examples/arctask-dag.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { TaskGraph } from "@trapeza/core";
import { loadEnv, runArcTaskDag } from "@trapeza/adapter-arc";

loadEnv();

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

function parseArgs(argv: string[]): { graphPath: string; outPath: string | null } {
  let graphPath = join(ROOT, "examples/arctask-dag.json");
  let outPath: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--graph" && argv[i + 1]) graphPath = resolve(argv[++i]!);
    else if (a === "--out" && argv[i + 1]) outPath = resolve(argv[++i]!);
  }
  return { graphPath, outPath };
}

function requireKey(name: string): `0x${string}` | undefined {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) return undefined;
  return v as `0x${string}`;
}

async function main(): Promise<void> {
  const { graphPath, outPath } = parseArgs(process.argv.slice(2));
  const graph = JSON.parse(readFileSync(graphPath, "utf8")) as TaskGraph;

  const simulated = process.env.ARCTASK_SIMULATED !== "false";
  console.log(`\nArcTask DAG runner`);
  console.log(`  graph: ${graphPath}`);
  console.log(`  mode:  ${simulated ? "simulated" : "live"}`);
  console.log(`  nodes: ${graph.nodes.length}  edges: ${graph.edges.length}\n`);

  const result = await runArcTaskDag({
    graph,
    simulated,
    clientPrivateKey: requireKey("BUYER_PRIVATE_KEY"),
    evaluatorPrivateKey: requireKey("VALIDATOR_PRIVATE_KEY"),
    onProgress: (e) => {
      const prefix = e.nodeId ? `[${e.nodeId}] ` : "";
      console.log(`  · ${e.phase}: ${prefix}${e.message}`);
    },
  });

  console.log(`\nDone — ${result.mode} · ${result.nodes.length} node(s) settled`);
  for (const n of result.nodes) {
    console.log(
      `  ${n.nodeId}: agent=${n.agentId} job=${n.jobId} ${n.settleAction} passed=${n.passed}`,
    );
    console.log(`    fund ${n.fundTx}`);
    if (n.submitTx) console.log(`    submit ${n.submitTx}`);
    console.log(`    settle ${n.settleTx}`);
  }
  console.log(`\n${result.honestyNote}\n`);

  if (outPath) {
    writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
