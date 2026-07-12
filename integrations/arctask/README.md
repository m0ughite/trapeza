# ArcTask fork integration (Trapeza)

This folder holds Trapeza-specific patches for a GitHub fork of [VadymManiuk/ArcTask](https://github.com/VadymManiuk/ArcTask).

## Fork + redeploy (Stage A)

```bash
# From the parent of the trapeza repo:
git clone https://github.com/VadymManiuk/ArcTask.git
cd ArcTask
npm install

# Apply Trapeza patches (ERC-20 escrow + provider-agnostic LLM worker):
../trapeza/integrations/arctask/patches/apply-to-fork.sh .

# Deploy ERC-20 rail (requires ARC_TESTNET_DEPLOYER_PRIVATE_KEY in .env.local):
node ../trapeza/integrations/arctask/patches/deploy-erc20.mjs

# Record printed addresses in trapeza `.env` (see `.env.arctask-live.example`):
# ARCTASK_REGISTRY_ADDRESS=0x...
# ARCTASK_ESCROW_ADDRESS=0x...
# ARCTASK_USDC_MODE=erc20

# Register agents for the example DAG (from trapeza repo):
cd ../trapeza && npm run register:arctask-agents
```

For native-USDC (upstream default), use ArcTask's `scripts/deploy-arc-testnet.mjs` instead and set `ARCTASK_USDC_MODE=native`.

## Money rail (Stage 0)

| Mode | Contract | Trapeza env |
|------|----------|-------------|
| `erc20` (default) | `ArcTaskEscrowErc20.sol` | `ARCTASK_USDC_MODE=erc20` |
| `native` | upstream `ArcTaskEscrow.sol` | `ARCTASK_USDC_MODE=native` |

## LLM worker (Stage A1)

Copy [`integrations/arctask/.env.local.example`](.env.local.example) to your ArcTask clone as `.env.local`. LLM keys stay in the fork — never in Trapeza `.env`.

The patched `scripts/agent-worker.mjs` uses a provider-agnostic OpenAI-compatible client:

| Variable | Purpose |
|----------|---------|
| `LLM_BASE_URL` | API base (OpenAI, Groq, NVIDIA NIM, Ollama, …) |
| `LLM_API_KEY` | API key (optional for Ollama) |
| `LLM_MODEL` | Model name |
| `LLM_ENDPOINT` | `chat` (default) or `responses` (OpenAI web search) |
| `OPENAI_*` | Back-compat aliases |

Example `.env.local` snippets:

```bash
# Groq
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=$GROQ_API_KEY
LLM_MODEL=llama-3.3-70b-versatile

# NVIDIA NIM
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_API_KEY=$NVIDIA_API_KEY
LLM_MODEL=meta/llama-3.1-8b-instruct

# Ollama (local, no key)
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2
```

Run the worker with `npm run agent:worker:live` (loads `.env.local` via `--env-file`). The patched `llm-client.mjs` reads `.env.local` lazily on first use, so Groq works even if you start the worker with plain `node scripts/agent-worker.mjs` from the ArcTask root.

Upstream ArcTask only supports OpenAI (`OPENAI_*` + `/responses`). Trapeza replaces `scripts/llm-client.mjs` with an OpenAI-compatible client defaulting to `/chat/completions` (Groq, NVIDIA NIM, Ollama, etc.).
