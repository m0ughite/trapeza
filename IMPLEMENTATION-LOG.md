# Trapeza — Implementation Log

A chronological record of design decisions, build phases, blockers, and outcomes for the Lepton Agents Hackathon (Canteen x Circle, Jun 15-Jul7 2026). Companion to [DESIGN.md](DESIGN.md) and [DESIGN-CLEARINGHOUSE.md](DESIGN-CLEARINGHOUSE.md).

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
- **Sample repos + docs** -> `context-for-agent/` (5 bundled samples: arc-commerce, arc-multichain-wallet, arc-escrow, arc-fintech, arc-p2p-payments; plus mirrored docs/skills). `arc-nanopayments` and `circle-agent` clone on demand — see `context-for-agent/samples/README.md`.
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

## Phase P0' - Wallets created, funded, balances verified (Jun 26)

Created the testnet keypairs and unblocked the on-chain side of P0. Deadline was extended to Jul 6, so the on-chain spikes can now run.

**Wallets generated** with Foundry `cast wallet new` (4 distinct roles, kept separable so the demo shows clean on-chain actors):

| Role | Address | Funded? |
| --- | --- | --- |
| OWNER (`OWNER_PRIVATE_KEY`) — ERC-8004 registrant | `0x75F5B96324474e6f9f6A4ef859De5F8e131B68F9` | 40 USDC |
| BUYER (`BUYER_PRIVATE_KEY`) — nanopayment payer | `0x3ec80Bb34f7b617D2E90efcd62a4A72C08b4d3bd` | 20 USDC |
| SELLER (`SELLER_ADDRESS`) — receiver, address only | `0x609b04C59525C2BD2f5C640FaE934d4AC4D3f101` | n/a (receives) |
| VALIDATOR (`VALIDATOR_PRIVATE_KEY`) — optional rater | `0x69AF9eD2cD16F40f20F454bBDD2A193364E2B925` | 20 USDC |

**Storage (both gitignored, `chmod 600`, never committed — verified with `git check-ignore`):**
- `.env` — the live spike credentials (`ARC_RPC_URL`, `BUYER_PRIVATE_KEY`, `SELLER_ADDRESS`, `OWNER_PRIVATE_KEY`, `VALIDATOR_PRIVATE_KEY`).
- `secrets/wallets.json` — full backup (address + private key + role for all four), with `chainId eip155:5042002`. Added `secrets/` to `.gitignore`.

**Correction — the "dual-token funding gotcha" (P0 mismatch #5, line 90) was WRONG.** On Arc there is a single USDC balance: USDC is the native gas asset (18-decimal native view) and the ERC-20 at `0x3600...0000` is just a 6-decimal *interface* over that same balance — not a second token to fund separately. One faucet drop covers gas and the x402 payment token simultaneously. Verified on-chain via `cast`:

```
BUYER  native = 20000000000000000000 (20 USDC, 18-dec)   erc20 0x3600 = 20000000 (20 USDC, 6-dec)
OWNER  native = 40000000000000000000 (40 USDC, 18-dec)   erc20 0x3600 = 40000000 (40 USDC, 6-dec)
VAL    native = 20000000000000000000 (20 USDC, 18-dec)   erc20 0x3600 = 20000000 (20 USDC, 6-dec)
0x3600.decimals() = 6
```

Source of truth: `context-for-agent/docs/docs.arc.network/arc/references/contract-addresses.md#usdc` ("The ERC-20 function call directly affects native USDC balance movements"). Fixed the same misstatement in `SETUP.md` §2 and `.env.example`. **Net effect: the buyer is fully funded for the nanopayment; no separate ERC-20 funding link is needed.**

**Next:** all three funded wallets are ready — run `npm install` then `npm run spike:erc8004` (OWNER, +VALIDATOR for the reputation leg) and `npm run spike:nanopayment` (BUYER → SELLER). These are the two on-chain proofs still pending from P0.

---

> **Logging habit (going forward):** every work session that touches the repo gets an entry in [ACTIVITY-LOG.md](ACTIVITY-LOG.md) (author, manual/assisted, branch, verification). Milestones — wallet/credential changes, spike runs and their tx hashes, design corrections, blockers and their resolutions — also get a phase entry here, with on-chain claims backed by verifiable evidence (explorer links or `cast` output), never fabricated.

---

## Phase P0'' - Both on-chain spikes RUN; x402 validity bug found & fixed (Jun 26)

Ran both P0 spikes against Arc testnet with the funded wallets. **ERC-8004 passed first try; the nanopayment failed, was root-caused, fixed, and now passes.**

### Spike 2 — ERC-8004 identity (PASS, 2 real txs)
```
Agent ID:   842573
Register:   https://testnet.arcscan.app/tx/0x3cc07a9310283fddc7c6c1de1aede992985fe7e89ea0de32b1cbbb40489e1735
Reputation: https://testnet.arcscan.app/tx/0x7b0d7d3a2d8574483b10ecfd5c4072274eb0ce697811ace8c5b2f16186f7f982
```
OWNER registered an identity NFT; VALIDATOR recorded one reputation event. Both are real, confirmed EVM tx hashes (0x + 64 hex).

### Spike 1 — x402 / Gateway nanopayment (FIXED, now PASS)
**Symptom:** `verify failed: authorization_validity_too_short` (only surfaced after I added the `invalidReason` logging the seller was swallowing).

**Root cause (high confidence):** Circle's facilitator advertises a per-network **`minValiditySeconds: 604800` (7 days)** for Arc at `GET https://gateway-api-testnet.circle.com/v1/x402/supported`, but the `@circle-fin/x402-batching` SDK **hardcodes `maxTimeoutSeconds: 345600` (4 days)** in both `enhancePaymentRequirements` and `createGatewayMiddleware`. The client signs `validBefore = now + maxTimeoutSeconds`, so every authorization is ~3 days short of the required window → rejected. This is an SDK/facilitator mismatch; the reference `arc-nanopayments` would fail identically today. (Clock skew ruled out: local vs chain timestamp differed by 1s. A first "fix" — padding the advertised value by 600s — confirmed it was a hard threshold, not latency.)

**Fix:** `packages/adapter-gateway/src/x402.ts` now reads `extra.minValiditySeconds` from the facilitator's `getSupported()` at seller startup and signs for `minValiditySeconds + 3600s` buffer (fallback 604800 if the field ever disappears). New exported `resolveMaxTimeoutSeconds()`; `startX402Seller` is now async.

**Result:**
```
✓ Nanopayment accepted by Gateway facilitator (437ms)
  Amount: 0.001 USDC   Gateway settlement id: 05f9f115-9837-4926-8f46-5009eb7660d7
  Deposit tx: https://testnet.arcscan.app/tx/0xb64a686acb4951a394f797d7439f1c9afc88e02655377f31240e5d2cd4fff6e0
```

**Important settlement nuance (do not overclaim):** Gateway *batches* settlements. `verify`+`settle` returning success means the authorization was accepted into a batch; the returned `05f9f115-…` is Circle's **settlement/batch UUID, NOT an EVM tx hash**, and the seller's on-chain USDC was still `0x0` immediately after. The real on-chain transfer to the seller lands when Circle flushes the batch. Evidence the payment is nonetheless real: the buyer's **Gateway available balance dropped exactly 0.001 USDC** (0.100 → 0.099) across runs. The deposit *into* Gateway (`0xb64a…`) is a genuine confirmed on-chain tx.

**Spike honesty fix:** `spike-nanopayment.ts` no longer renders the settlement UUID as an `/tx/` link. It only prints an `/tx/` link when the id matches `^0x[0-9a-fA-F]{64}$`; otherwise it labels it a Gateway settlement id and points at the seller's address page for the eventual batched transfer. (Upholds the "never present a non-tx as a confirmed tx" rule.)

**Open follow-up:** confirm the seller's balance increments after a batch flush (poll `balanceOf` on the seller), and, if needed for the demo, find/await the Gateway batch-settlement status so we can surface the real on-chain settlement tx. Tracked below.

---

## Phase A0 - Agent configuration + activity logging (Jun 27)

Wired `context-for-agent/` into persistent project agent config. Session detail: [ACTIVITY-LOG.md](ACTIVITY-LOG.md) entries `agent-config` and `activity-logging`.

**Agent config added:**
- Root [AGENTS.md](AGENTS.md) — Trapeza entry point, doc hierarchy, build commands, context routing
- `.cursor/rules/` — `trapeza-project.mdc` (always apply), `trapeza-adapters.mdc` (adapter globs)
- `.cursor/skills/` — `trapeza-build`, `arc-circle-context` (route-only to circlefin-skills)
- `.cursor/agents/` — `trapeza-builder`, `arc-circle-expert`, `onchain-verifier`
- `.cursor/mcp.json` — `arc-docs` + `circle` MCP servers
- `context-for-agent/samples/README.md` — bundled samples + on-demand clone for `arc-nanopayments`

**Collaboration logging added:**
- [ACTIVITY-LOG.md](ACTIVITY-LOG.md) — per-session log (author, manual/assisted, branch)
- [CONTRIBUTING.md](CONTRIBUTING.md) — logging contract for branch collaboration

**Path fixes:** `context/samples/context-arc/` → `context-for-agent/` in DESIGN.md, SETUP.md, context/README.md, and this log (R0).

---

## Phase E1 — TS-only algorithmic engine (Jun 29)

Implemented deterministic engine packages on `feature/deterministic-part`:

- **`@trapeza/oracle`** — `SchemaOracle`: AJV Draft 2020-12 + field-level ground-truth diff; binary pass/fail for slashing
- **`@trapeza/clearinghouse`** — HiGHS MILP graph solver, greedy+LNS degrade/bake-off, DAG scheduler (longest-path makespan), LP shadow prices, settlement preflight twin, seeded Monte Carlo
- **Core extensions** — micro-USDC integer money, `valueUsdc` on `TaskSpec`, `SettlementState`/`StateSnapshotSource` seam (read-only injected snapshot)

**Verification:** `npm test` 42/42; `npm run typecheck` exit 0. CI headline: global MILP clearing feasible on budget-vs-bottleneck instance where per-node greedy fails.

> **Superseded by Phase C (Jul 3):** the TS-only framing and the build-dependent test count are
> retracted (see ACTIVITY-LOG.md). The Tier-1 solver is now Python OR-Tools CP-SAT; the HiGHS/greedy
> TS solvers are the Tier-2 degrade path + bake-off opponent.

See [ENGINE-GUIDE.md](ENGINE-GUIDE.md) and [ALGORITHMIC-SPEC.md](ALGORITHMIC-SPEC.md).

---

## Phase C — Consolidation: Python CP-SAT boundary + docs reconciliation (Jul 3)

Finished the approved [CONSOLIDATION-PLAN.md](CONSOLIDATION-PLAN.md) (C0–C5) after a mid-flight crash.
The teammate's working TS engine is **kept**; Tier-1 optimization is **restored to Python OR-Tools
CP-SAT** behind FastAPI, with the TS greedy+LNS demoted to the Tier-2 degrade path + bake-off opponent.

- **C0 — harness honesty.** Clean, no-build `npm test` loads all 15 suites (vitest src aliases for
  `clearinghouse`/`oracle`); root `typecheck` includes both new packages.
- **C1 — enforcement.** Preflight enforced in `submitGraph` (throws `PREFLIGHT_FAILED`); 2×-budget
  fixture removed; bond decrement (`Σ bond ≤ B_p`); per-node + global log-quality floors in
  greedy/LNS; CP-SAT ≥ Tier-2 objective assertion.
- **C2 — Python CP-SAT Tier-1.** `solver/trapeza_solver/` (FastAPI + Pydantic) implements the full
  §5.4 model — assignment, budget, DAG precedence/makespan, per-node + global quality, latency caps,
  bond capacity, RCPSP concurrency (cumulative intervals) — plus GLOP LP-dual shadow prices. TS
  `solver-client.ts` validates both directions against the ONE shared
  `contract/solver-contract.schema.json` (AJV) and **degrades to TS Tier-2 on any failure**.
- **Amendment 1 — Monte Carlo (shipped, flagged).** Python NumPy `/simulate` + in-process TS fallback,
  gated by `monteCarlo: { enabled }`.
- **C3 — docs.** §4.1 risk taxonomy → `ALGORITHMIC-SPEC.md` (+ `useDefaults:false`); §5.3.1 risk
  taxonomy + §6.1.1 oracle dispute-ladder → `SOURCE-OF-TRUTH.md`; retracted the "51/51" + "TS-only"
  claims in `ACTIVITY-LOG.md`; created `ENGINE-GUIDE.md`.
- **C4 — demo.** Bake-off = CP-SAT (Python) vs greedy+LNS (TS); Monte Carlo behind the flag.
- **C5 — core-broker integration.** Core + engine suites are green in one `npm test` run; the broker
  is the clearinghouse's one-node case (§5.5). Existing `@trapeza/core` P0 spikes untouched.

**Verification (clean checkout, no prior build):**
```
npm test            → 57 passed (15 files)   [service UP; 4 live CP-SAT tests run]
                    → 53 passed / 4 skipped  [service DOWN; degradation path green]
npm run typecheck   → exit 0
cd solver && .venv/bin/python -m pytest -q → 14 passed
npm run demo        → 6 beats; greedy NO_PROVIDER where CP-SAT clears (obj 1.2849);
                      Monte Carlo via Python engine; preflight blocks under-funded plan
```

**Deviation:** risk is carried as resolved per-`(node,provider)` `candidates[].score` (computed once
in TS), not `riskMicro` on the provider as sketched in CONSOLIDATION-PLAN §3.3 — economically correct
and DRY (see `contract/README.md`).

---

## Phase D (Demo dashboard) — engine→JSON driver, on-chain wiring, Vite dashboard (Jul 5)

Built the judge-facing product surface on `feature/demo-dashboard` per
[FINAL-PHASE-PLAN.md](FINAL-PHASE-PLAN.md). The engine is untouched except two thin, additive seams
(a JSON emitter and a pluggable settlement path); everything green. **Not committed — left for review.**

**1. Engine → JSON driver + fixtures.** `demo/emit-run.ts` (+ `demo/scenarios.ts`) runs the REAL
engine (`submitGraph` / `solveCpSat` / `solveGreedyLns` / Monte-Carlo) over three scenarios and emits
one versioned `demo-run.json` each into `apps/dashboard/src/fixtures/`. The contract is defined ONCE in
`apps/dashboard/src/types/contract.ts` and imported by both the Node driver and the browser. Captured
per run: DAG, providers (claimed vs calibrated p̂ + archetype), headline clearing (allocation, schedule,
settlement prices, shadow prices, meta), **calibration ON-vs-OFF** contrast, **CP-SAT-vs-greedy bake-off**,
**twin Monte-Carlo**, preflight guard, traction metrics. Real numbers (service UP, CP-SAT Tier-1):
- `invoice-workflow` — obj 1.2359; calibration OFF picks all 6 braggarts → realized end-to-end **0.003%**,
  ON picks all workhorses → **37.2%** (lift 0.372); all 6 nodes re-route.
- `budget-bottleneck` — CP-SAT clears obj **1.2849** where greedy returns `NO_PROVIDER`; budget shadow
  dual 1.15 (binding); twin failure 76.6%.
- `research-pipeline` — 8-node, obj 2.8142; calibration lift 0.249.

**2. On-chain wiring (timeboxed → cut-line taken).** Added a PLUGGABLE settlement seam
(`demo/onchain.ts`: `NanoSettlementProvider` + `GatewayX402SettlementProvider` driving the proven
buyer→x402/Gateway path) and a driver (`demo/emit-onchain.ts`) that settles one real testnet nanopayment
per cleared node and writes `onchain-receipts.json`. The live attempt **overran the timebox and hung on
the Circle facilitator**, so per the plan's cut-line #5 the receipts fall back to the already-PROVEN P0''
spikes (Agent ID 842573; register/reputation tx; Gateway deposit `0xb64a…`; settlement UUID
`05f9f115…`), clearly labeled. Honesty rule enforced end-to-end: Gateway settlement UUIDs carry a
"UUID · not a tx" badge and are never `/tx/`-linked; only real 0x+64hex hashes link to arcscan. The
interface is ready to point at a live agentcash.dev provider (`LIVE=1` + funded `BUYER`/`SELLER` env).

**3. Dashboard (`apps/dashboard/`, Vite + React + TS).** Self-contained, Vercel-ready SPA. Historical
runs replay the bundled fixtures fully static (zero backend). "Run your own" executes the portable
Tier-2 greedy engine (`src/lib/liveEngine.ts`) via a rate-limited Vercel serverless function
(`api/run.ts`, no on-chain action) and **degrades gracefully to the identical in-browser engine** when
no backend is reachable (verified: preview run showed "ran in-browser", cleared obj 1.1819, realized
37.2% vs claimed 9.57%). Views: clearing DAG + allocation, bake-off, calibration ON/OFF (interactive
toggle), shadow prices, twin Monte-Carlo, on-chain panel, traction strip. Clean dark design system,
responsive, no chart deps (hand-rolled SVG). `vercel.json` + `apps/dashboard/README.md` included; no
secrets in the client bundle.

**Verification (real):** `npm run typecheck` → exit 0 · `npm test` → **57 passed (15 files)** ·
`npm run build --workspace @trapeza/dashboard` (`tsc && vite build`) → success (193 KB JS / 58.7 KB gzip)
· dashboard rendered + interacted in-browser (screenshots). Cut-line taken: live on-chain per-node
settlement (fell back to proven spike receipts, labeled).

---

## Phase D2 (Dashboard product overhaul) — IA, visual system, jargon strip (Jul 6)

Redesigned `apps/dashboard/` from an "internal simulation console" (every panel
stacked vertically, heavy academic voice) into a product-grade web app for the
demo, **without touching the engine, fixtures, or JSON contract**. Presentation +
information-architecture + UX only. **Not committed — left for review.**

**1. Navigation / IA.** Added a persistent **left sidebar** (Overview, Clearing,
Solver bake-off, Calibration ledger, Bottleneck prices, Risk preflight, On-chain
settlement, Run your own) with scroll-spy (IntersectionObserver) that highlights
the active section; clicking scrolls to it. Added a sticky **top bar** with the
product name, a one-line value prop, and the scenario selector. Responsive down
to a laptop/tablet (sidebar collapses to a horizontal nav < 900px).

**2. Jargon strip (UI only, data preserved).** Removed academic name-drops from
the primary interface — "MarketBench", "CASTER", "AEX", "State-Twins" (as a paper
cite), "LP duals", "Beta-Binomial", "CP-SAT/Tier-1/Tier-2", "RFB-3" — and replaced
them with plain product language ("Calibration ledger — scored on what they
delivered", "Constraint prices — value of one more dollar", "Risk preflight —
dry-run before you pay", "batch ID · not a transaction"). Fixture-authored prose
(`meta.narrative`, `bakeOff.narrative`, `meta.description`) is **sanitized at
display time** by a new `plain()` helper (`services/format.ts`) — the JSON is
untouched. Solver labels are humanized from `kind` (`greedy_lns` → "Greedy
per-task router", `cp_sat` → "Whole-graph clearing"). The full technical
vocabulary + paper mapping now lives in `apps/dashboard/README.md` ("Concepts —
plain language ↔ the technical detail").

**3. Product-grade UX.** New hero/overview (crisp value prop + headline stats +
4 differentiator cards + scenario picker), consistent `SectionHeader` (eyebrow /
title / one-sentence "why this matters"), refined dark design system (single mint
accent, restrained palette, generous spacing, tabular numerals, focus-visible
rings, DAG legend). One focused, well-framed card per section instead of a wall
of panels.

**4. Progressive disclosure.** New `Tooltip` ("?" hover/focus/tap) and
`Collapsible` ("How this works", collapsed by default) primitives. Deep
explanations (Bayesian scoring, CP-SAT, shadow-price duals, the Monte-Carlo
preflight, the honesty rule) are behind these, so the default view stays
skimmable.

**5. Functionality preserved.** Scenario switching (invoice / budget-bottleneck /
research-pipeline), Calibration ON/OFF toggle, "Run your own" live Tier-2 path
(verified in-browser fallback: cleared, plan score 1.1819, real 37.2% vs claimed
9.57%), on-chain panel with honest UUID-vs-tx-hash labeling and real arcscan links
only for real hashes, Vercel-readiness (no client secrets) — all intact. Added
empty/cold-start states (cold-start calibration note; "nothing binds" for
non-binding shadow prices; "no feasible plan" live-run state).

**Deliverable 2 — scenario demo doc.** Authored `apps/dashboard/DEMO-SCENARIOS.md`:
narrative walkthroughs for all three bundled scenarios (story, exact clicks, what
to see, the point it proves), tied to the differentiator each demonstrates —
budget-bottleneck (graph clearing beats greedy: no-feasible-plan vs 1.2849),
invoice (calibration moat: 37.2% ON vs 0.003% OFF), research (scales: 8 steps,
+24.9% lift) — plus "run your own" and on-chain honest-labels walkthroughs and a
smoke checklist.

**Verification (real):** `npm test` → **57 passed (15 files)** · `npm run
typecheck` → exit 0 · `tsc --noEmit` (dashboard) → exit 0 · `npm run build
--workspace @trapeza/dashboard` (`tsc && vite build`) → success (208 KB JS /
62.9 KB gzip; 16 KB CSS / 3.98 KB gzip) · rendered + interacted in-browser at
127.0.0.1:5173 (overview, clearing DAG, bake-off, calibration ON/OFF, on-chain,
risk preflight, live run — screenshots captured). No engine/fixture/contract
changes.

---

## Jul 7 — public submission prep (release/v1-public → main)

Prepared the repo for a clean, public hackathon submission without touching any
other branch (`feature/scenarios`, `feature/deterministic-part`, `app-layer`,
`main` all preserved unchanged).

- **Preservation (this branch):** committed the two working-tree planning docs
  that were untracked — `PLAN-TANGIBLE-DEMO.md` and
  `arctask_arc_integration_a764ed42-plan.md` — so no groundwork is lost. This
  branch remains the process-doc keeper (full history retained).
- **Release branch `release/v1-public`** (cut from this branch): moved the
  substantive design/spec docs into `docs/` (`SOURCE-OF-TRUTH`, `ALGORITHMIC-SPEC`,
  `ENGINE-GUIDE`, `PROJECT-DIAGRAMS`, `SETUP`, plus `DESIGN` and
  `DESIGN-CLEARINGHOUSE` as substantive design lineage); removed internal process
  scratch from the tree (`OLD-PLAN`, `FINAL-PHASE-PLAN`, `CONSOLIDATION-PLAN`,
  `ACTIVITY-LOG`, `IMPLEMENTATION-LOG`, `DESIGN-DRAFT-1`, the two plan docs) —
  all still preserved here. Rewrote the root `README.md` as the judge-facing
  front door.
- **Security:** confirmed no secrets published — only `.env.example` is tracked;
  `secrets/wallets.json`, `.env`, and private keys are gitignored and untracked;
  `context/samples/` (heavy third-party clones) is gitignored; tracked `context/`
  is ~51 KB of markdown reference notes only.
- **Gates (real, on the release tree):** `npm run typecheck` exit 0 · `npm test`
  → 57 passed (15 files) · `npm run build --workspace @trapeza/dashboard` → built.
- Commits authored by m0ughite with the Cursor co-author trailer stripped via
  `git commit-tree` plumbing. PR `release/v1-public` → `main` (squash-merge
  recommended). Did not change repo visibility or merge.

Decision pending (does not block builds): whether to rewrite DESIGN.md to fold in the `oracleVerify` / `QuoteSource` adjustments so it stays authoritative, vs. keeping them documented inline.

---

## Jul 9 — feature/v2 Phase 1: selective harvest + WS-A real workflows

Branch `feature/v2` cut from `origin/main` (ea6aea1). Selective harvest from
`origin/feature/scenarios` (engine hardening, trace panel, calibration cold-start
tests — **not** the 11 synthetic stress scenarios).

**Harvest (commit 4fb54eb):** `packages/clearinghouse` calibration-flag hardening
(`score.ts`, `milp.ts`, `greedy-lns.ts`, `solver-client.ts`), step-by-step
`trace.ts` + `RunTracePanel`, `calibration-coldstart.test.ts`, vitest config.

**WS-A — six real recognizable workflows:** Re-authored `demo/scenarios.ts` with
named capabilities (`doc.parse`, `data.reconcile`, `verify.claims`, …) and
believable providers (`sonnet-parser`, `budget-ocr`, `ledger-reconciler`, …).
Invoice pipeline fixes the narrative mismatch (6 steps match the story). Added
`demo/scenario-registry.ts`, shared runner `demo/run-scenario.ts`, scenario harness
`demo/test/scenarios.test.ts`, thin `demo/emit-run.ts` CLI. Re-emitted 6 CP-SAT
fixtures + manifest; wired dashboard fixture index, RunTracePanel (DAG highlight),
trace CSS. Removed legacy abstract fixtures (`invoice-workflow`, `budget-bottleneck`,
`research-pipeline`).

**Six emit fixtures:** `invoice-processing`, `research-report`,
`data-reconciliation`, `support-triage`, `code-pr-pipeline`, `rag-qa` (+ harness-only
`preflight-underfunded`).

**Verification (real):** `npm test` → **70 passed (17 files)** · `npm run typecheck`
→ exit 0 · `npm run build --workspace @trapeza/dashboard` → success · dashboard
verified at 127.0.0.1:5173 (6 scenarios in picker, trace panel 21 steps, on-chain
section).

---

## Jul 9 — feature/v2 Phase 2: per-node on-chain settlement (started)

Updated `demo/emit-onchain.ts` to load cleared allocation from
`invoice-processing` fixture (was `invoice-workflow`). Pluggable
`GatewayX402SettlementProvider` in `demo/onchain.ts` already iterates cleared
nodes; driver wraps each in try/catch with proven-spike fallback.

**Live run (real):** `npm run demo:onchain` with funded `BUYER_PRIVATE_KEY` /
`SELLER_ADDRESS` → **6 live per-node settlements** on Arc testnet (~310ms each),
`onchain-receipts.json` mode=`live`. Gateway settlement UUIDs labeled honestly
(not linked as `/tx/`); deposit tx links to arcscan. No fabricated hashes.

**Verification (real):** tests/build still green after receipt regen.

---

## Open items / remaining work (Jul 9)

1. **WS-B (Phase 3 in plan):** published input contract + paste-and-run builder — not started.
2. **On-chain:** per-node live settlement proven for invoice-processing (6 nodes). Extend to other scenarios or multi-scenario receipt bundles if demo needs it. Still TODO: surface post-batch-flush EVM settlement tx when Gateway exposes it.
3. **Deploy + record:** re-screenshot dashboard with 6 scenarios; update `DEMO-SCENARIOS.md` walkthroughs.
4. `@trapeza/adapter-arc` escrow/oracle surface — unchanged from prior open items.

---

## Jul 10 — feature/v2 correctness + analysis + cleanup pass

Corrective pass. A prior worker was to do the rag-qa fix + cleanup but died
without committing, so this reconciles the actual repo state against the log.

**Part A — investigate & explain.**

- **A1 (bake-off "always the same score").** Root cause is **legitimate ties**,
  not a bug. The objective is fully separable (`objectiveFromAssignments` = Σ of
  per-node `p̂·value − price − risk`); the only coupling is the global/per-node
  budget, deadline, quality floors and bonds. On a loosely-constrained graph the
  greedy per-node argmax **is** the global optimum, so greedy and CP-SAT return
  identical objectives (CP-SAT merely rounds to 6 dp). Per-scenario greedy vs
  CP-SAT: invoice 1.9443/1.9443, research 1.7780/1.7780, **data-reconciliation
  greedy BUSTS / cp_sat 1.5375**, support 1.4124/1.4124, code-pr 1.5741/1.5741,
  rag-qa 1.9480/1.9480. Only data-reconciliation (tight $1.00 budget) makes
  greedy bust — and it is also the only scenario with a non-zero shadow price
  (budget 1.15). Display path (`BakeOffPanel.tsx`) is clean; it renders both
  objectives independently. Cosmetic-only caveat: on a tie the panel still badges
  CP-SAT "winner" and the generated narrative calls greedy's number an "infeasible
  upper bound" — misleading copy for a UI follow-up, not an algorithm defect.
- **A2/A3.** Full per-scenario number analysis + a panel-by-panel and
  data-provenance explanation written to `docs/DASHBOARD-EXPLAINED.md`.

**Part B — fixes.**

- **B1 (HIGH, rag-qa calibration inversion).** rag-qa used
  `makeUncalibratedProvider` (zero track record), so `realizedPHat()` fell back to
  `claimedSuccessProb`: ON picked honest low-claimers, OFF trusted braggarts, and
  "realized" was computed from claimed probs — so OFF mechanically won
  (lift **−0.768**). Converted all ten rag providers to `makeProvider` +
  `trackRecord` (workhorses ~18–19/20 realized vs braggarts ~2–4/20), updated the
  scenario narrative/`proves`/tags off the stale cold-start framing, added
  `expect.minSuccessLift`. Re-emitted (never hand-edited). Now ON realized
  **0.5324** vs OFF **0.0002**, lift **+0.5322**.
- **B2.** No other algorithm fix required — the bake-off is not a bug, and
  data-reconciliation already demonstrates the greedy-vs-CP-SAT contrast, so no
  scenario budget was fabricated. Flagged (not fixed): research-report's `proves`
  promises a shadow-price readout its loose graph never delivers (all duals 0.00).
- **B3.** Re-emitted all six fixtures from the real engine with the CP-SAT
  service up. `meta.headlineSolver` = **`cp_sat`** for all six (Tier-1, not
  degraded). On-chain receipts unchanged (invoice-processing allocation identical,
  so no regen needed).

**Part C — cleanup.**

- **C1.** Removed the 3 orphan legacy fixtures `invoice-workflow.json`,
  `budget-bottleneck.json`, `research-pipeline.json`. **Log reconciliation:** the
  Jul 9 Phase-1 entry claimed these were "Removed," but they were still on disk —
  they are now actually deleted. Confirmed unreferenced (only stale docstrings in
  `emit-run.ts` / `emit-onchain.ts` / `contract.ts` mentioned the names); build
  stays green.
- **C2.** Rewrote `apps/dashboard/DEMO-SCENARIOS.md` for the current six scenarios
  with real run IDs, real re-emitted numbers, the simple-mode "Run Your Own"
  walkthrough, and the on-chain settlement walkthrough.
- **C4.** This entry.

**Verification (real, Jul 10).** `npm test` → **89 passed (19 files)** (was 70 /
17 files at Jul 9 Phase 1) · `npm run typecheck` → exit 0 · `npm run build
--workspace apps/dashboard` → success. CP-SAT solver healthy on 127.0.0.1:8000
throughout.
