# Trapeza — Implementation Log

A chronological record of design decisions, build phases, blockers, and outcomes for the Lepton Agents Hackathon (Canteen x Circle, Jun 15-29 2026). Companion to [DESIGN.md](DESIGN.md) and [DESIGN-CLEARINGHOUSE.md](DESIGN-CLEARINGHOUSE.md).

Project: **Trapeza** — a calibration-aware, bonded broker/clearinghouse primitive for agent-to-agent nanopayment networks (targets RFB 3). The decision signal is calibrated `p_success x value - price - risk_premium` from realized outcomes, not self-reported bids; providers post slashable USDC bonds; settlement is per-task in USDC via Circle Gateway/x402 on Arc.

---

## Phase R0 - Research & context loading (Jun 20)

Loaded the full hackathon spec, four research papers, and the Arc/Circle reference repos into a local cache under `context/`.

- **Hackathon spec** -> `context/hackathon/lepton-hackathon-spec.md`. Key facts: settle on Arc in USDC, nanopayments to $0.000001 via Gateway, <500ms settlement, x402 for pay-per-request, $50k prizes. Judging weights: 30% Agentic Sophistication / 30% Traction / 20% Circle tool usage / 20% Innovation. RFB 3 (Agent-to-Agent Nanopayment Networks) flagged as the core target.
- **Papers** -> `context/papers/`:
  - **Agent Exchange (AEX)**, arXiv 2507.03904 — macro auction-market infra; but simulation-only and assumes honest reporting / perfect info / static capabilities.
  - **MarketBench**, arXiv 2604.23897 — empirically shows agents are miscalibrated on their own success probability and cost; auctions built from self-reports diverge from optimal allocation. Self-assessment is *the* bottleneck.
  - **CASTER**, arXiv 2601.19793 — cost-aware neural routing in multi-agent graphs; -72.4% cost matching strong-model success.
  - **State Twins**, arXiv 2605.11522 — off-chain, sub-second, forkable/replayable simulation of on-chain state.
- **Sample repos** -> `context/samples/context-arc/` (recursive clone, all 8 submodules: arc-nanopayments, arc-commerce, arc-multichain-wallet, arc-escrow, arc-fintech, arc-p2p-payments, arc-prediction-markets, arc-stablecoin-fx) plus a bundled `docs/` folder. Not in the submodule set: `circle-agent`, `arc-defi-lending-and-borrowing`.
- **Index** -> `context/README.md`.

---

## Phase D1 - Core design & thesis (Jun 20)

Wrote [DESIGN.md](DESIGN.md). Central argument pushed back on the initial "auctions solve this" framing:

- AEX gives auction infra on paper but assumes honest reporting; MarketBench destroys that assumption empirically.
- Therefore a broker that trusts bids produces garbage. The bid is not the allocation signal — calibrated realized-outcome estimates are.
- **VCG / combinatorial auctions are traps at nanopayment scale**: VCG truthfulness requires bidders know their own valuations (they don't); combinatorial is NP-hard *and* needs even-worse-calibrated bundle bids; and mechanism overhead must stay below trade value, which heavy auctions violate for $0.001 tasks.
- Right design is **value-tiered**: posted-price/FCFS for cheap commodity tasks, score-adjusted second-price (Vickrey) for scarce mid-value, Dutch for time-critical, per-hop for bundles. The auction is a thin shell around a calibration engine.

---

## Phase D2 - Locked decisions & build plan (Jun 20)

Refined [DESIGN.md](DESIGN.md) with a locked-decisions table, primitive-vs-app architecture, the `@trapeza/core` public API, a reuse-maximizing tech stack, a 9-day phase plan, and a demo script.

**Locked decisions:**
1. **v1 capability + oracle: structured data extraction**, validated by JSON Schema + field-level ground-truth match (deterministic -> credible slashing). Oracle is a pluggable `verify(task, result) -> {passed, score, evidenceURI}`. Capability #2 (code-fix + failing-test oracle) plugs into the same interface later.
2. **Traction = BOTH** an MCP server (one-line external adoption) and a seeded requester/provider loop generating continuous testnet-USDC volume + ledger data from day one.
3. **Scope = layered**: forkable `@trapeza/core` primitive + a non-throwaway app (MCP + loop + dashboard) on top. Hard rule: core has no UI/MCP/chain-SDK inline; all Circle/Arc specifics live in adapters (`adapter-arc`, `adapter-gateway`).
4. **Name = Trapeza** (Greek banker's table; ties to prior-art #08 trapezitai).

**Grounding wins from the cache:** ERC-8004 is already deployed on Arc testnet (Identity/Reputation/Validation registries) — call them, don't rebuild. Fork `arc-escrow/RefundProtocol.sol` for bond escrow + slash. Copy x402 plumbing from `arc-nanopayments`. Use Circle Developer-Controlled Wallets + Gas Station for the agent fleet.

**Phase plan:** P0 spike (Jun 20-21) -> P1 core skeleton (Jun 22) -> P2 EV router + mechanism shell (Jun 23) -> P3 oracle + on-chain bond slash (Jun 24) -> P4 MCP + seeded loop (Jun 25) -> P5 dashboard + calibration on/off contrast (Jun 26) -> P6 harden + external usage (Jun 27) -> P7 video + submit (Jun 28, +29 buffer).

---

## Phase D3 - Clearinghouse reframe (Jun 20)

Wrote [DESIGN-CLEARINGHOUSE.md](DESIGN-CLEARINGHOUSE.md), generalizing the per-task broker into a graph-level clearinghouse/solver.

- **Reframe:** decision unit moves from one edge (task -> provider) to a whole task DAG. Requester submits a workflow + global budget/deadline/quality/risk constraints; the clearinghouse solves one joint constrained allocation + price-clearing and settles the winning clearing as one batch. The per-task broker becomes the single-node special case — a strict generalization, not a competitor.
- **Reconciliation (the intellectual core):** this is NOT the combinatorial *auction* D1 rejected. (1) No bundle bids exist — the clearinghouse synthesizes calibrated bundle success/cost from its own ledger; bids are priors. (2) NP-hardness is defanged — bounded RCPSP-over-DAG, and we need a good feasible clearing, not the optimum. (3) Nano-economics objection *inverts* into an advantage — solve once per graph, settle one Gateway batch, so mechanism cost falls as graphs grow.
- **Solver ladder:** Tier 1 OR-Tools CP-SAT (provably optimal at demo scale, ship this); Tier 2 greedy-topo + LNS scored on State Twins; Tier 3 windowed multi-graph clearing (future). Graceful degradation to the per-task CASTER broker is the risk valve.
- **Mapping:** State Twins promoted from stretch to core (fork N candidate clearings off-chain, commit one batch). Each cleared node = one Arc ERC-8183 job with the `hook` carrying bond/slash logic; the cleared allocation *is* a Gateway batch. MCP gains `submit_graph()` beside `submit_task()`.

---

## Phase P0 - Monorepo scaffold + on-chain spike (Jun 20)

Scaffolded the monorepo to the locked boundary and wired two ready-to-run spike scripts. **Both on-chain proofs BLOCKED on missing credentials/funds — no tx hashes fabricated.**

Directory created:
```
lepton-hackathon/
- package.json (npm workspaces, type=module, tsx + tsc)
- tsconfig.base.json, .gitignore, .env.example, SETUP.md, README.md
- apps/ (placeholder: MCP/sim/dashboard, P4-P5)
- packages/
  - core/ (@trapeza/core - interfaces-only, NO chain SDK; models/interfaces/pipeline/graph)
  - adapter-arc/ (Arc + ERC-8004; scripts/spike-erc8004-identity.ts)
  - adapter-gateway/ (Gateway/x402; scripts/spike-nanopayment.ts)
```

**Credentials the user must supply to complete the on-chain proofs** (no Circle API key needed for the default path):
1. `OWNER_PRIVATE_KEY` — funded with native Arc-testnet USDC (gas) for ERC-8004 registration.
2. `BUYER_PRIVATE_KEY` — funded with BOTH native USDC (gas) and ERC-20 USDC at `0x3600000000000000000000000000000000000000` (payment token) for the nanopayment.
3. `SELLER_ADDRESS` — any receive address.
4. (optional) `VALIDATOR_PRIVATE_KEY` — separate funded wallet for a reputation event (ERC-8004 forbids self-rating).
Funding: `cast wallet new`, then https://faucet.circle.com/ -> Arc Testnet.

**DESIGN-vs-reality mismatches found:**
1. Missing transitive deps — `@circle-fin/x402-batching` needs `@x402/core` + `@x402/evm` as separate packages (DESIGN named only the batching pkg).
2. Node version — DESIGN said Node 22; machine has 21.5.0; switched scripts to `tsx` (works >=20.6).
3. `giveFeedback` ABI arity — DESIGN listed 4 args; real contract takes 8. Adapter maps the 4 semantic args onto the full call.
4. No Circle API key for nanopayments — x402 path uses `BatchFacilitatorClient` with no credentials + self-managed wallet. `CIRCLE_API_KEY`/`CIRCLE_ENTITY_SECRET` only for the alternative Dev-Controlled-Wallets path.
5. Arc dual-token funding gotcha — gas is native USDC (18 decimals); x402/Gateway payments use ERC-20 USDC at `0x3600...` (6 decimals). Buyer needs both.
6. Minor compatible version drift — viem 2.53.1 (ref ^2.47.1), x402-batching 2.1.0 (ref ^2.0.4); `arcTestnet` defined locally via `defineChain`.

Confirmed consistent across DESIGN/docs/reference: USDC `0x3600...`, Gateway Wallet `0x0077777d...`, ERC-8004 registries `0x8004A.../B.../Cb...`, network `eip155:5042002`. `RefundProtocol.sol` present (not yet forked).

---

## Phase P1-P3 - Core pipeline, calibration, router (mock-backed) (Jun 22)

Implemented and tested the entire credential-independent core of `@trapeza/core` against in-memory mocks. (Two worker runs crashed on infrastructure errors — "WritableIterable is closed", "PING timed out" — leaving partial files; a fresh worker reconciled and finished.)

**On disk (intact / completed):**
- `models.ts` — 8 canonical models (`ProviderProfile`, `TaskSpec`, `Quote`, `CalibrationRecord`, `Bond`, `Outcome`, `Allocation`) + `Capability`/`MechanismId`/`PriceSurface`.
- `interfaces.ts` — `TrapezaCore` + injected boundaries `Oracle`, `SettlementAdapter`, `ChainAdapter`, `Store`, `QuoteSource`.
- `calibration.ts` — Bayesian Beta-Binomial ledger (Beta(1,1) prior, posterior mean/variance, Welford online cost/latency). Self-reports excluded from the ledger by design.
- `router.ts` — EV scoring `p_success*value - price - risk_premium`, calibration ON/OFF switch, grounded risk premium, value-tiered mechanism shell (posted / second_price / dutch).
- `pipeline.ts` — `createTrapezaCore` with real logic for every step.
- `graph.ts` — clearinghouse seam (types only, unimplemented).
- `testing/` — `InMemoryStore`, `MockSettlementAdapter`, `MockChainAdapter`, `MockOracle`, `MockQuoteSource` (all credential-free).

**Crash artifact fixed (1 real defect):** `pipeline.test.ts` called `core.oracleVerify(...)` (the canonical `verify(Oracle)` step) but the method existed on neither the interface nor the pipeline. Invisible to `tsc` (test dir not in any tsconfig; vitest esbuild strips types). Fixes: added `oracleVerify(spec, result): Promise<Outcome>` to `TrapezaCore`; implemented it as thin delegation to injected `Oracle.verify`; added `"test": "vitest run"` to root `package.json`.

**Real test output:**
```
- calibration.test.ts (5 tests)
- router.test.ts (5 tests)
- pipeline.test.ts (3 tests)
Test Files  3 passed (3)
Tests       13 passed (13)
```
`npm run typecheck` -> exit 0. `npm test` -> exit 0. Covered: posterior updates over a sequence; router picks higher-EV; calibration OFF picks the liar / ON picks the honest provider (lemons collapse at router + pipeline level); bond slashes on scripted oracle failure; happy-path `submitTask` settles via mocks + writes a calibration record.

**Interface adjustments vs DESIGN.md (documented inline, not yet rewritten into DESIGN.md):**
- `oracleVerify` added to `TrapezaCore` — genuine gap: DESIGN §4.2 jumped `execute -> settle`, but `settle()` consumes an `Outcome` nothing produced. Named `oracleVerify` to avoid collision with `Oracle.verify`.
- `QuoteSource` boundary — keeps `collectQuotes` network-free; consistent with the injected-dependency rule.

---

## Open items / remaining work

Needs the user's funded wallets + live adapters before an on-chain end-to-end demo (each drops into an injected boundary with zero changes to `@trapeza/core`):
1. `@trapeza/adapter-arc` — implement `ChainAdapter` (`mintIdentity`/`giveFeedback`/`openEscrow`/`resolveEscrow`) against deployed ERC-8004 + forked `RefundProtocol.sol` on Arc testnet (`eip155:5042002`).
2. `@trapeza/adapter-gateway` — implement `SettlementAdapter.pay` via real x402/Circle Gateway.
3. A real `Oracle` for the v1 extraction capability (JSON-Schema + ground-truth diff).
4. Funded wallets + secrets (broker + seeded provider/requester wallets, populated `.env`). This is the P4 risk (wallet nonce/funding).
5. A real `Store` (e.g. Supabase/Postgres) swapped in for `InMemoryStore` if persistence across the seeded loop is wanted.

Decision pending (does not block builds): whether to rewrite DESIGN.md to fold in the `oracleVerify` / `QuoteSource` adjustments so it stays authoritative, vs. keeping them documented inline.
