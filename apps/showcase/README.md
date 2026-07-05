# @trapeza/showcase

One-command visual demo: LLM providers run real work through the Trapeza pipeline,
`SchemaOracle` judges deliverables, mock settlement records payments, and the
dashboard updates live.

## Run

```bash
npm run showcase
```

Opens http://localhost:3000 automatically. Console narrates each beat:
quotes → route → LLM answer → pay → verify → release/slash → calibration update.

## Real LLM (OpenAI-compatible)

```bash
LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3 npm run showcase
```

Works with OpenAI, NVIDIA NIM, Groq, Ollama — any `/v1/chat/completions` API.

## Honest limitations

- **Settlement/escrow are simulated** in `llm` mode — no real USDC moves (use
  `TRAPEZA_MODE=live` + Arc credentials for on-chain).
- **`SchemaOracle` scores exact ground-truth** on deterministic Q&A — great for
  the demo, not open-ended creative tasks. An LLM-judge oracle is the documented
  follow-up.
- **Mock LLM is canned** when `LLM_BASE_URL` is unset — quality divergence is
  scripted. Real quality signal needs a real endpoint.
- **Real endpoint = one model for all providers** — with `LLM_BASE_URL` set,
  accurate/lemon/mid roster entries all call the same client and model, so
  quality divergence (and the calibration win over lemons) is only meaningful
  in mock mode. Per-provider real model routing is the documented follow-up.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `TRAPEZA_DB_PATH` | `~/.trapeza/trapeza.db` | Shared ledger |
| `TRAPEZA_CALIBRATION` | `on` | Routing uses calibration posteriors |
| `TRAPEZA_SHOWCASE_INTERVAL_MS` | `2500` | Task interval |
| `TRAPEZA_SHOWCASE_ITERATIONS` | `12` | Tasks per run |
| `TRAPEZA_SHOWCASE_NO_DASHBOARD` | — | Set `1` to skip spawning Next.js |
| `LLM_BASE_URL` | — | OpenAI-compatible API base |
| `LLM_API_KEY` | — | Bearer token |
| `LLM_MODEL` | `gpt-4o-mini` | Model name |
