# Lepton Agents Hackathon — Spec & Context

> Hosted by **Canteen × Circle**. Online, 2 weeks: **Jun 15 → Jun 29, 2026**. Invite-only.
> Settles on **Arc** (Circle's stablecoin-native L1) in **USDC**, **<500ms** finality.
> **Nanopayments** as small as **$0.000001** via Gateway (gas-free, batched).
> **$50k** in prizes across four tiers.

---

## TL;DR

"Paid by the fraction." A builder series for AI agents and the creators they serve, moving value too small to have been worth moving before: per article, per listen, per call, per second — settled instantly on Arc in USDC.

The *lepton* was the smallest coin of ancient Greece (1/100 of a drachma). Nanopayments are the lepton reborn for machines: value as small as **$0.000001**, clearing in **under half a second**.

| Field | Value |
| --- | --- |
| Format | Online · 2 weeks |
| Dates | Jun 15 → Jun 29, 2026 |
| Settlement | Arc · <500ms |
| Access | Invite-only |
| Smallest payment | $0.000001 via Gateway, gas-free & batched |
| Awards | $50k across four tiers |
| Luma passphrase | `SITEx2224` |

## Hosts & Platform

- **Canteen** — Host. A research/technology firm at the intersection of crypto, AI, and payments. Curates the hackathon.
- **Circle** — Platform (NYSE: CRCL). Issuer of USDC and EURC; builds the most widely used stablecoin network.
- **Arc** — Settlement. Circle's purpose-built L1 blockchain. Native USDC gas + sub-second finality make sub-cent payments economical for the first time.

## The thesis

For as long as a payment couldn't be smaller than ~30 cents after fees, there was no way to sell a 5-cent article or a 1-cent play; bundling into subscriptions was the only move. Nanopayments remove the floor: value as small as $0.000001, gas paid in USDC (not a volatile token), settled in <500ms on Arc with gasless batching. The smallest unit becomes sellable for the first time.

People are no longer the only ones paying. **AI agents can now pay each other per call, per byte, per second** — turning "what should this cost?" into a decision an agent makes thousands of times an hour. Treat the sub-cent payment as a primitive and the agent as something that earns and spends, and the products suggest themselves.

---

## The Stack (Circle's developer platform on Arc)

Start here: **developer docs** at `developers.circle.com` and `docs.arc.network`.

- **Nanopayments (Gateway)** — `developers.circle.com/gateway/nanopayments`. Gas-free USDC payments as small as $0.000001 via batched transactions.
- **Arc Developer Docs** — `docs.arc.network`. Chain-level reference: network config, App Kit, sample apps, deployment.
- **Agent-native tooling** — give an AI agent its own wallet; let it discover and pay for x402 services and transact across chains within built-in compliance guardrails. **Circle CLI** and **Skills** wire it into Claude Code, Cursor, Codex, or any custom agent. (Fastest path from a coding agent to one that autonomously holds and spends USDC.)
- **Wallets** — embed secure wallets in any app with automated key management; a wallet per agent and per creator.
- **Smart Contracts** — pricing logic, escrow, revenue splits, streaming flows.
- **x402 Protocol** — the HTTP 402 "Payment Required" flow for pay-per-request APIs and content. Live standard; the `circlefin/arc-nanopayments` reference shows it end-to-end.
- **USDC / EURC** — the leading digital dollar and digital euro; native settlement on Arc.
- **App Kit** — multichain payment SDKs behind one type-safe interface: Send, Bridge, Swap, Unified Balance, Combine.

### CLIs (install per setup steps; do NOT install globally in this cache workspace)

- **ARC CLI** — `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`. Includes RPC access to a Canteen-hosted Arc testnet plus Arc repos/docs pre-bundled as agent context. Docs: `arc-node.thecanteenapp.com`.
- **Circle CLI** — `npm install -g @circle-fin/cli`. Unified interface for agent wallets, x402 payments, crosschain USDC transfers. Requires Node.js v20.18.2+. Docs: `developers.circle.com/agent-stack/circle-cli`.
- **Arc 101 companion repo** — `git clone https://github.com/the-canteen-dev/circle-agent` (companion to `circlefin/arc-nanopayments`).

---

## Awards — $50k total

**Grand Prizes — $40k total**
- 1st place: **$10k** · 1 team
- 2nd place: **$7.5k × 2 teams** = $15k
- 3rd place: **$5k × 3 teams** = $15k

**Standout Teams — $7.5k total**
- 10–12 teams demonstrating exceptional work, awarded in roughly equal shares (~$650–$750/team). Not ranked.

**Feedback Incentives — $500 total**
- For developers who provide the most useful product feedback on Circle's developer tooling.

**Easter Eggs — $2k total**
- Code-golf challenges, Discord puzzles, content challenges, and side quests.

---

## Requests for Builders (RFBs)

Six open problems. This round leans toward **RFB 6 (Creator & Publisher Monetization)** for the broader field, but **RFB 3 (Agent-to-Agent Nanopayment Networks) is the core target for this project.** RFBs are prompts, not tracks.

### RFB 01 — Autonomous Paying Agents
Agents that discover, evaluate, and pay for paywalled APIs, data, and compute on a budget. AI decides which resources are worth paying for (cost vs value), budget allocation, cache vs re-fetch, quality/price tradeoffs. Builds: agents paying x402-protected resources, budget systems, cost-benefit analyzers, multi-provider routing. Metrics: total autonomous payments, avg transaction size (target sub-cent), budget utilization, cost per task.

### RFB 02 — Selling Agent Services via Nanopayments
Monetize an agent's work per use: pay-per-call, no subscription. AI decides dynamic pricing, accept/negotiate, quality tiers, capacity allocation. Builds: x402-enabled agent APIs, dynamic pricing engines, agent service marketplaces, metered services. Metrics: revenue, unique paying clients, transactions/hour, avg price/request.

### RFB 03 — Agent-to-Agent Nanopayment Networks ⭐ (CORE TARGET)
Fluid, real-time economic networks where agents pay other agents for specialized work.
- **What builders create:** agent service discovery with real-time pricing; reputation systems on payment history + service quality (**ERC-8004** gives onchain identity, reputation, validation); multi-hop workflows with automatic payment splitting; escrow for complex agent-to-agent agreements.
- **Questions to explore:** Do agent pricing wars emerge (race to bottom vs quality differentiation)? Can agents form guilds/co-ops for pricing power? Do specialized broker agents emerge to match supply and demand?
- **Example builds:** *AgentMesh* (agents discover and pay each other for chained services); *NanoEscrow* (sub-cent escrow for task handoffs); *AgentBroker* (matchmaking agent taking a 0.1% fee).
- **Traction metrics:** agent-to-agent transaction volume, network graph density, avg settlement time, payment chain depth.

### RFB 04 — Streaming & Continuous Payments
Pay-per-second for compute, data, live media. Start, pause, stop a stream of value. Builds: pay-per-second infra, continuous authorization (approve a rate, not each tx), real-time usage metering, "tap to stop" streams. Use cases: GPU rental by the millisecond, live feeds per update, transcription per second, live media per second watched.

### RFB 05 — Nanopayment Infrastructure & Tooling
SDKs, wallet-fleet management, dashboards, simulators. *Note: the facilitator and starter-kit lane is already crowded — aim at applications and orchestration.* Builds: SDKs adding x402 to any agent framework, wallet management for agent fleets, analytics dashboards, testing/simulation environments. DX focus: "add nanopayments in 3 lines," one SDK across frameworks (LangChain, CrewAI, custom), testnet faucets/sim modes.

### RFB 06 — Creator & Publisher Monetization (round emphasis)
Monetize a single article, photo, or song without forcing readers into a monthly commitment. Builds: pay-per-article, micro-tipping, per-piece support, revenue splitting for collaborators, AI reading lists that auto-pay creators. See Prior Art for eight worked angles.

### OPEN — Something else!
Build whatever you want, as long as it's real and runs on Arc.

---

## How We Judge

Agency and traction are weighed **equally**. Genuine usage matters even on testnet: people actually using it, payments actually flowing in test USDC. Weightings are recommendations; judges have final say, and the best projects tend to break the rules.

| Weight | Criterion | What it means |
| --- | --- | --- |
| **30%** | **Agentic Sophistication** | How much does the AI actually *decide* vs just automate? Full autonomy > meaningful agency > AI-flavored automation. |
| **30%** | **Traction** | Genuine usage during the event: real users, payments flowing in test USDC, volume you can point to. Great founders ship and get users in 2 weeks. |
| **20%** | **Circle tool usage** | Creative, effective use of Wallets, Gateway & Nanopayments, App Kit, Contracts, x402, USDC. |
| **20%** | **Innovation** | Novel approaches, emergent behavior, research insight. New territory > polished re-runs. |

### Final delivery
No live demo day — judging is asynchronous after the deadline. Submit as many times as you like (submit early and often).
- **Video demo (required):** Loom/YouTube/Vimeo, **under 3 minutes**.
- **Live product link (encouraged):** working URL judges can use hands-on.
- **Public GitHub repo (required):** judges read the repo directly. Build for a reviewer who will click around without you in the room.

Submit via `forms.gle/SMqLaw2pMGDe58LFA`.

---

## Prior Art (nanopayments make these buildable again)

Old practices the floor priced out. Eight worked angles:

1. **Content that earns every time it's cited** — x402 settles to the origin the moment an agent grounds an answer in it. (Ties RFB 6.)
2. **Patronage the supporter can resell** — a recurring micro-pledge that converts into a transferable claim on a creator's future flow. (Ties RFB 6.)
3. **A thousand small backers outweigh one large one** — quadratic-funding pool for content + sybil resistance. (Ties RFB 6.)
4. **Royalties that follow a work back through everyone who made it** — recursive, automatic splits along a lineage graph (beets/Picard credits, immich photo origins). (Ties RFB 6.)
5. **Your money goes only to the artists you actually played** — user-centric royalties on self-hosted servers (Navidrome/Koel), play-gated. (Ties RFB 6.)
6. **You pay for the rate of flow, by the second** — continuous-authorization streaming for live media (Owncast/PeerTube). *Streaming payments are a real code gap in x402.* (Ties RFB 4.)
7. **Reward what turned out to matter, paid after the fact** — retroactive funding, quadratic by distinct engagers. (Ties RFB 6.)
8. **Reputation you post as collateral, not a score you ask to be trusted** — a broker agent posts a USDC bond; if the provider it routed underdelivers, the bond slashes automatically on resolution. Natural application of **ERC-8004**. (Ties **RFB 3**.) ⭐

---

## Distribution (the whole game)

The hard part of a payments product was never the rail — it was finding the people. For creator payments they're already gathered in open-source/self-hosted communities with large audiences and no way to move money. Each exposes webhooks/plugins/APIs to attach payments from the outside.

| Project | What a payment layer unlocks | Stars |
| --- | --- | --- |
| immich-app/immich | Licensing/tips paid to the photographer in the file | 103k |
| TryGhost/Ghost | Paid memberships, subscriptions, newsletters | 54k |
| jellyfin/jellyfin | Pay-per-view, rentals, creator subscriptions | 53k |
| mastodon/mastodon | Patronage and quadratic funding | 50k |
| discourse/discourse | Paid groups and gated categories | 47k |
| DIYgod/RSSHub | Paid feeds, citation tolls | 44k |
| navidrome/navidrome | Royalties split by what listeners actually played | 21k |
| chocobozzz/peertube | Per-view / per-second streaming | 15k |
| owncast/owncast | Live tips, pay-to-watch | 11k |
| Kareadita/Kavita | Pay-per-book / rentals | 11k |

Distribution Bootstrap for Payments Founders: `https://thecanteenapp.com/analysis/2026/05/28/distribution-bootstrap-payments-founders.html`. Eight starting points (sidecars/plugins/registries) to remix with the RFBs.

---

## Getting Started checklist

1. Register on Luma (GitHub + Discord handles accurate — used to collate submissions). Passphrase `SITEx2224`.
2. Join Canteen Discord: `https://discord.gg/rsVfYutFZg`.
3. Join Arc builder Discord: `https://discord.com/invite/buildonarc` (mention Canteen + Lepton).
4. Install ARC CLI (testnet RPC + bundled context).
5. Install Circle CLI (agent wallets, x402, crosschain USDC).
6. Walk the Arc 101 demo; clone `the-canteen-dev/circle-agent`.
7. Read the Distribution Bootstrap.
8. Submit via the form (repo link + <3min video demo; live link optional but encouraged).

---

## Reference implementations (Arc sample apps)

Open-source starting points to fork/remix (cloned under `context/samples/context-arc/samples/`):

- **`circlefin/arc-nanopayments`** ⭐ — nanopayments end-to-end: a LangChain paying agent, x402-protected seller endpoints, Gateway batching. **Start here** (most relevant to RFB 3).
- `the-canteen-dev/circle-agent` — Canteen-built explainer companion to arc-nanopayments.
- `circlefin/arc-commerce` — USDC payments for credit purchases.
- `circlefin/arc-multichain-wallet` — unified USDC balance and crosschain transfers.
- `circlefin/arc-escrow` — AI-powered work validation and USDC settlement.
- `circlefin/arc-fintech` — multichain treasury with crosschain capital movement.
- `circlefin/arc-p2p-payments` — gasless peer-to-peer payments on Arc.
- `circlefin/arc-stablecoin-fx` — USDC↔EURC FX swaps via the App Kit Swap SDK.
- `circlefin/arc-prediction-markets` — decentralized prediction markets (UMA).
- `circlefin/arc-defi-lending-and-borrowing` — DeFi lending using cirBTC as collateral to borrow USDC.

---

## FAQ highlights

- **What can I build?** Anything, as long as it runs on Arc with payments flowing in testnet USDC, you genuinely care about it, and people are already using it.
- **Match an RFB?** No. RFBs/prior-art are starting points, not categories.
- **Two weeks too short for usage?** The building is the easy part. Distribution is the test.
- **After the event?** Canteen commits long-run: funding, grants, partnership support for teams that keep going.
- **Came from Agora?** Allowed, but judged on the *delta* since Agora — new product + new users only.
