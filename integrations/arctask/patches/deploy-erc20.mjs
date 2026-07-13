/**
 * Deploy ArcTaskAgentRegistry + ArcTaskEscrowErc20 to Arc testnet.
 *
 * Run from an ArcTask clone (after apply-to-fork.sh):
 *   node ../trapeza/integrations/arctask/patches/deploy-erc20.mjs
 *
 * Requires ARC_TESTNET_DEPLOYER_PRIVATE_KEY in ArcTask/.env.local or shell.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const rootDir = process.cwd();
const require = createRequire(path.join(rootDir, "package.json"));
const solc = require("solc");
const { createPublicClient, createWalletClient, defineChain, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
const envPath = path.join(rootDir, ".env.local");

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = parts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Add it to .env.local or export it in your shell.`);
  }
  return value;
}

function normalizePrivateKey(value) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function readContractSource(fileName) {
  const filePath = path.join(rootDir, "contracts", fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Contract not found: ${filePath} — run apply-to-fork.sh first`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function compileContracts() {
  const input = {
    language: "Solidity",
    sources: {
      "ArcTaskAgentRegistry.sol": {
        content: readContractSource("ArcTaskAgentRegistry.sol"),
      },
      "ArcTaskEscrowErc20.sol": {
        content: readContractSource("ArcTaskEscrowErc20.sol"),
      },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatalErrors = errors.filter((error) => error.severity === "error");

  for (const error of errors) {
    const log = error.severity === "error" ? console.error : console.warn;
    log(error.formattedMessage);
  }

  if (fatalErrors.length > 0) {
    throw new Error("Solidity compilation failed.");
  }

  return {
    registry: output.contracts["ArcTaskAgentRegistry.sol"].ArcTaskAgentRegistry,
    escrow: output.contracts["ArcTaskEscrowErc20.sol"].ArcTaskEscrowErc20,
  };
}

async function deployContract({ walletClient, publicClient, contract, args }) {
  const hash = await walletClient.deployContract({
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    args,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Deployment failed: ${hash}`);
  }

  return receipt.contractAddress;
}

loadLocalEnv();

if (process.argv.includes("--compile-only")) {
  compileContracts();
  console.log("Solidity contracts compiled successfully.");
  process.exit(0);
}

const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const explorerUrl = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";
const privateKey = normalizePrivateKey(requiredEnv("ARC_TESTNET_DEPLOYER_PRIVATE_KEY"));
const deployEscrowOnly = process.argv.includes("--escrow-only");

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "testnet USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: "Arcscan", url: explorerUrl } },
  testnet: true,
});

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http(rpcUrl) });
const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(rpcUrl),
});

console.log(`Deploying ERC-20 rail from ${account.address} to ${arcTestnet.name} (${arcTestnet.id})`);
console.log(`USDC token: ${ARC_TESTNET_USDC}`);

const compiled = compileContracts();

const registryAddress = deployEscrowOnly
  ? requiredEnv("NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS")
  : await deployContract({
      walletClient,
      publicClient,
      contract: compiled.registry,
      args: [],
    });

if (!deployEscrowOnly) {
  console.log(`Agent registry deployed: ${registryAddress}`);
} else {
  console.log(`Using existing agent registry: ${registryAddress}`);
}

const escrowAddress = await deployContract({
  walletClient,
  publicClient,
  contract: compiled.escrow,
  args: [registryAddress, ARC_TESTNET_USDC],
});
console.log(`ERC-20 escrow deployed: ${escrowAddress}`);

console.log("\n--- ArcTask .env.local ---");
console.log("NEXT_PUBLIC_ARC_MODE=onchain");
console.log(`NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS=${registryAddress}`);
console.log(`NEXT_PUBLIC_ERC8183_ESCROW_ADDRESS=${escrowAddress}`);
console.log(`NEXT_PUBLIC_USDC_ADDRESS=${ARC_TESTNET_USDC}`);

console.log("\n--- Trapeza .env ---");
console.log(`ARCTASK_REGISTRY_ADDRESS=${registryAddress}`);
console.log(`ARCTASK_ESCROW_ADDRESS=${escrowAddress}`);
console.log("ARCTASK_USDC_MODE=erc20");
console.log("ARCTASK_SIMULATED=false");
console.log("ARCTASK_API_BASE=http://localhost:3000");

console.log(`\nExplorer: ${explorerUrl}/address/${escrowAddress}`);
