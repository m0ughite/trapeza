# Lepton Hackathon — Research & Context Cache

Local cache of all Lepton Agents Hackathon (Canteen × Circle) materials, research papers, and Arc/Circle sample code for the project. **The core target is RFB 3 — Agent-to-Agent Nanopayment Networks.**

```
context/
├── README.md                  ← this index
├── papers/
│   └── README.md              ← paper references (full texts removed; citations only)
└── samples/
    └── context-arc/           ← cloned, 8 sample repos as submodules + bundled docs
        ├── samples/           ← arc-* reference repos
        └── docs/              ← Circle/Arc docs + skills, pre-bundled as agent context
```

---

## 1. Hackathon spec

The locally cached hackathon spec was removed to avoid redistributing
third-party material. See the public hackathon sources instead:
<https://lepton.thecanteenapp.com/> and
<https://github.com/the-canteen-dev/context-arc>.

**Key facts:** Hosted by **Canteen × Circle**; settles on **Arc** (Circle's stablecoin-native L1) in **USDC**; **nanopayments down to $0.000001** via Gateway (gas-free, batched); **<500ms** settlement; **x402** protocol for pay-per-request; **Jun 15–29, 2026**; **$50k** in prizes.

**Judging:** 30% Agentic Sophistication · 30% Traction · 20% Circle tool usage · 20% Innovation.

**RFBs:** 6 Requests for Builders. RFB 3 (Agent-to-Agent Nanopayment Networks) is the core target; RFB 6 (Creator/Publisher Monetization) is the round's general emphasis. Notable: **ERC-8004** for onchain agent identity/reputation/validation; bonded broker agents (Prior Art #8) tie directly to RFB 3.

---

## 2. Research papers

Full texts were removed to avoid redistributing third-party copyrighted
material — see [`papers/README.md`](papers/README.md) for the citations (title +
arXiv URL) and consult the linked sources directly. Together the four papers form
a coherent agent-economy stack: **AEX** (market infra) → **MarketBench** (can
agents bid honestly?) → **CASTER** (spend efficiently) → **State Twins**
(simulate before settling).

| Paper | arXiv | One-line summary | Maps to project |
| --- | --- | --- | --- |
| Agent Exchange (AEX) | 2507.03904 | A central RTB-style **auction exchange** brokering tasks among agent hubs, with Shapley-value payout splitting. | **Macro auction market infrastructure** — the matchmaking + payment-splitting layer for an agent-to-agent network (RFB 3 AgentBroker/AgentMesh). |
| MarketBench | 2604.23897 | Benchmark showing LLMs are **badly miscalibrated** at forecasting their own success probability and cost, so naive market bids fail. | **Agent self-calibration / bid accuracy** — the diagnostic + quality-scoring backbone for any auction where agents price their own work; motivates reputation/escrow/slashing. |
| CASTER | 2601.19793 | A lightweight neural router doing **per-step strong-vs-weak model selection** in graph MAS; up to 72.4% cost cut at parity quality. | **Cost-aware neural routing in multi-agent graphs** — the spend-efficiency brain for a paying agent deciding which service/model is worth a nanopayment. |
| State Twins | 2605.11522 | A typed, forkable **off-chain replica** of on-chain AMM state enabling N counterfactual scenarios per single RPC read, sub-second. | **Off-chain sub-second simulation of on-chain state** — simulate Arc settlement/pricing outcomes locally before committing real USDC. |

---

## 3. Sample repos — `samples/context-arc/`

Cloned via `git clone --recursive https://github.com/the-canteen-dev/context-arc.git`. All **8 submodules cloned successfully** (from the `circlefin` org), plus the bundled `docs/`.

| Repo (under `samples/context-arc/samples/`) | One-line description |
| --- | --- |
| **`arc-nanopayments`** ⭐ | Nanopayments end-to-end: a **LangChain paying agent**, **x402-protected** seller endpoints, **Gateway batching**. Most relevant to RFB 3 — start here. |
| `arc-commerce` | USDC payments for credit purchases. |
| `arc-multichain-wallet` | Unified USDC balance + crosschain transfers. |
| `arc-escrow` | AI-powered work validation + USDC settlement (relevant to agent-to-agent escrow). |
| `arc-fintech` | Multichain treasury with crosschain capital movement. |
| `arc-p2p-payments` | Gasless peer-to-peer payments on Arc. |
| `arc-prediction-markets` | Decentralized prediction markets (powered by UMA). |
| `arc-stablecoin-fx` | USDC↔EURC FX swaps via the App Kit Swap SDK. |

> Note: `the-canteen-dev/circle-agent` (Canteen explainer companion to arc-nanopayments) and `circlefin/arc-defi-lending-and-borrowing` are referenced in the spec but are **not** part of the context-arc submodule set; clone separately if needed.

### Bundled docs — `samples/context-arc/docs/`
- `developers.circle.com/` — Circle developer docs mirror.
- `docs.arc.network/` — Arc chain docs mirror.
- `circlefin-skills/` — agent skills: `use-arc.md`, `use-gateway.md`, `use-usdc.md`, `use-circle-wallets.md`, `use-developer-controlled-wallets.md`, `use-user-controlled-wallets.md`, `use-modular-wallets.md`, `use-smart-contract-platform.md`, `bridge-stablecoin.md`.

---

## 4. Arc / Circle tooling reference

- **Circle CLI** — `npm install -g @circle-fin/cli` (Node ≥ v20.18.2). Agent wallets, x402 payments, crosschain USDC. Docs: `developers.circle.com/agent-stack/circle-cli`.
- **ARC CLI** — `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`. Canteen-hosted Arc testnet RPC + bundled Arc context. Docs: `arc-node.thecanteenapp.com`.
- **Gateway / Nanopayments** — gas-free USDC payments down to $0.000001 via batched transactions. Docs: `developers.circle.com/gateway/nanopayments`.
- **x402** — HTTP 402 "Payment Required" pay-per-request flow; live standard, shown end-to-end in `arc-nanopayments`.
- **App Kit** — multichain payment SDKs (Send, Bridge, Swap, Unified Balance, Combine) behind one type-safe interface.
- **USDC / EURC** — native settlement on Arc; multi-currency creator payments.

### Doc links
- Circle developer docs: https://developers.circle.com
- Arc developer docs: https://docs.arc.network
- Nanopayments (Gateway): https://developers.circle.com/gateway/nanopayments

> Per task constraints: nothing was installed globally and no ARC/Circle CLIs were run — this directory only collects docs and clones repos. No git repo was initialized at the workspace root.
