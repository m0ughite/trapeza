#!/usr/bin/env tsx
/**
 * Register ArcTask agents with capabilities matching examples/arctask-dag.json.
 *
 *   npm run register:arctask-agents
 */

import { loadEnv, ArcTaskClient, encodeJobPayloadUri, makeWallet } from "@trapeza/adapter-arc";

loadEnv();

const AGENTS = [
  { name: "Trapeza General Agent", capability: "arctask.general.v1" },
  { name: "Trapeza Code Fix Agent", capability: "code.fix.v1" },
  { name: "Trapeza Invoice Extract Agent", capability: "extract.invoice.v1" },
] as const;

function requireKey(name: string): `0x${string}` {
  const v = process.env[name];
  if (!v || v.startsWith("0xYOUR")) {
    throw new Error(`${name} is required in .env`);
  }
  return v as `0x${string}`;
}

async function main(): Promise<void> {
  const ownerKey = requireKey("OWNER_PRIVATE_KEY");
  const owner = makeWallet(ownerKey);
  const client = new ArcTaskClient();

  console.log(`\nRegistering ${AGENTS.length} agent(s) from ${owner.account.address}\n`);

  for (const agent of AGENTS) {
    const metadataURI = encodeJobPayloadUri({
      name: agent.name,
      description: `Trapeza-registered agent for ${agent.capability}`,
      capabilities: [agent.capability],
    });

    const { agentId, txHash } = await client.registerAgent(
      owner.account,
      owner.wallet,
      metadataURI,
    );

    console.log(`  agent ${agentId} (${agent.capability})`);
    console.log(`    tx: ${txHash}\n`);
  }

  const agents = await client.listAgents();
  console.log(`Registry now has ${agents.length} agent(s).\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
