# State Twins: An Off-Chain Substrate for Agentic Reasoning over Decentralized Finance Protocols

- **arXiv:** 2605.11522
- **Author:** Ian C. Moore, PhD (Principal, DeFiMind) — May 12, 2026
- **One-line relevance:** State Twins is the **off-chain sub-second simulation of on-chain state** piece — a typed, forkable in-memory replica of on-chain pool state that lets an agent run thousands of counterfactual "what if?" scenarios locally without an RPC round-trip per query; the same fork-and-evaluate pattern lets an Arc agent simulate payment/settlement outcomes off-chain before committing real USDC transactions.

---

## Abstract

The **State Twin** is a typed, in-memory, replayable replica of an on-chain AMM pool that serves as a substrate for agentic reasoning over DeFi. Today's agentic-DeFi stacks couple reasoning to **chain time**: every "what if?" query is a new RPC read or a real transaction, so the agent's action space is bounded by block latency and gas. The paper argues this is a **structural** problem, not a performance one, and that the missing layer is an off-chain substrate preserving the protocol's exact math while admitting what on-chain state cannot: **forking, replay, branching, counterfactual rollout**. It formalizes each AMM family (Uniswap V2/V3, Balancer, Stableswap) as a discrete-time controlled dynamical system, proves a quantitative **fidelity bound** between twin and chain, and ships the open architecture in **DeFiPy v2** (with a reference MCP server). A worked **fork-and-evaluate** example seeds N independent twins from a single live RPC read under distinct price-shock scenarios in **sub-second wall-clock time**.

**Keywords:** DeFi · AMMs · digital twin · agentic systems · LLMs · Model Context Protocol · state-space models · Python SDK.

## The core argument: reactive is the wrong default

The dominant pattern wires an LLM directly to chain reads/writes (a "reactive" architecture). Every step either returns a fresh on-chain query or commits a transaction — there's no layer in between, so counterfactual queries, multi-scenario evaluation, and "thinking before acting" aren't first-class operations; the architecture silently disallows them.

But AMM pools are **deterministic state machines**: state at block `k` + transaction `u_k` exactly determines state at `k+1` via a fully-known invariant. No hidden state, no privileged side channel. So an off-chain replica can be **mathematically faithful** to chain reality at any pinned block — exact in rational arithmetic, exact up to a known rounding bound under fixed-point arithmetic.

## AMMs as controlled dynamical systems

General form: `x_{k+1} = f(x_k, u_k, w_k)`, `y_k = h(x_k)` — `f` = protocol invariant in solver form, `h` = observation map (spot price, TVL, position value). Because `f` is a pure function, (1) is **exactly evaluable off-chain** given state and a candidate input.

- **Uniswap V2 (constant product):** invariant `r_0·r_1 = k`; fixed-point floor-rounding gives per-step bound `|K' − K| ≤ r_0^{(k+1)}`; over n swaps `|K_n − K_0| ≤ nB`.
- **Uniswap V3 (concentrated liquidity):** virtual reserves; inside a tick range structurally identical to V2 → same primitive surface against the twin.
- **Balancer (weighted geometric mean):** `r_0^{w0}·r_1^{w1}`; 50/50 reduces to V2.
- **Stableswap (amplified invariant):** Curve-style, `D` recovered via Newton iteration; closed-form depeg ↔ LP-loss relationship.

**Remark 1 (Forced Factorization):** in a reactive architecture every state-dependent query is forced to factor through the chain-read map `χ`. Counterfactual transitions (uncommitted inputs), ensemble queries over fork families, and trajectory rollouts **don't correspond to any value of χ** — so they can't be evaluated reactively *at any speed*. This is a categorical limit, not a performance gap.

## The State Twin (Definition)

A State Twin at block `k` is a typed in-memory object `x̂_k` with operations `{f, h, clone}` such that, for slack `ε_k ≥ 0`:
- **(T1) State fidelity** — isomorphic to on-chain state within `ε_k`.
- **(T2) Observational equivalence** — `|h(x̂_k) − h(x_k)| ≤ L_h·ε_k` (exact, ε=0, on real-valued arithmetic).
- **(T3) Transitional equivalence** — `|f(x̂_k,u,w) − f(x_k,u,w)| ≤ ε_{k+1}`.
- **(T4) Independent forking** — `clone(x̂_k)` yields an independent twin; ops on the clone leave the original unchanged. **This is what reactive architectures fundamentally cannot provide** (a chain has one trajectory per epoch; a twin has arbitrarily many).

**Proposition 1 (Fidelity):** twin and chain driven by the same fee-free swaps with reserve bound B satisfy `|h_K(x̂_n) − h_K(x_n)| ≤ nB` — zero without rounding, otherwise telescoped from the single-step rounding lemma. In practice relative slack `nB/K_0 ≈ 10⁻¹⁰` for realistic pools — **economically exact**.

## Provider / Builder factorization

Construct the twin via two functions:
- **Provider `π`:** external id → typed canonical **Snapshot** (varies with the *source*: synthetic recipe, live RPC, fork node, CSV, archive). DeFiPy: `StateTwinProvider` ABC with one `snapshot(pool_id)` method; `MockProvider`, `LiveProvider`, `CSVProvider`.
- **Builder `β`:** Snapshot → typed in-memory twin (varies with the *shape*: V2/V3/Balancer/Stableswap).

This reduces `|sources|×|protocols|` adapters to `|sources|+|protocols|`. Pipeline: `pool_id → Provider → Snapshot → Builder → x̂_k → Primitive → Result`. A primitive **cannot tell** whether its input came from a synthetic mock or a live mainnet read — by design.

## DeFiPy v2 (the reference implementation)

Three install profiles: `pip install defipy` (core analytics, no web3/LLM), `defipy[chain]` (LiveProvider), `defipy[agentic]` (MCP server). **The math layer stays deterministic, dependency-light, and LLM-free; LLM integration lives strictly at the agent/MCP adapter.**

- **Primitive interface (3 lines):** stateless construction → `apply(lp, *args)` → typed dataclass return. 21 analytical primitives across 9 categories (Position analysis, Price scenarios, Pool health, Risk, Optimization, Comparison, Execution, Portfolio, Break-even).
- **MCP exposure:** a curated **10 leaf primitives** exposed as Model Context Protocol tools; composition left LLM-side (frontier models compose tool calls more flexibly than pre-baked orchestration).
- **Three audiences, one surface:** notebook quant, backtest (LiveProvider pinned to a historical block), and LLM agent (via MCP) all call the *same* primitive with zero adapter code.

## Fork-and-evaluate (the payoff)

Pull live state **once**, fork the in-memory twin **N ways** under distinct scenarios, run primitives per fork, aggregate. In the v2.1 demo against the USDC/WETH 5bps V3 mainnet pool, **N=50 scenarios complete in well under one second** after the initial chain read — the dominant cost is the single RPC round trip; every additional fork is essentially free. This is impossible reactively (would need N real txs for hypotheticals, or N RPC reads at N nonexistent blocks).

Generalizes to: distributional risk (Monte Carlo over a price distribution), multi-agent ensemble reasoning (N agents on N forks), sequential reasoning (chained forks), LLM-driven scenario design, and backtesting — all on the same substrate.

## Design discipline

- **Substrate, not product** — ships typed primitives + the twin abstraction + MCP adapter, deliberately *not* an agent (avoid coupling longevity to whichever agent framework dominates next year; echoes ethers.js / web3.py).
- **Read-only by design** — `LiveProvider` has no signing; escape hatch `get_w3()` hands off to the consumer's own signing infra. Substrate stops at the chain-read boundary.
- **Math stays LLM-free** — the moment the math layer takes an LLM dependency, the stack is only as deterministic as the LLM.
- **Generalizes beyond DeFi** — any domain with a well-defined state-transition map, expensive canonical-state queries, and high-value counterfactuals (manufacturing, clinical decision support, supply chain, grid ops).

## Why it matters for the project

State Twins gives the project an **off-chain simulation layer** for Arc. Before an agent commits real (test) USDC on Arc — settling an x402 payment, splitting revenue, posting an escrow bond — it can fork a deterministic in-memory replica of the relevant on-chain state and evaluate counterfactual settlement/pricing outcomes in sub-second time, then act once. The provider/builder + MCP-leaf-primitive pattern (deterministic math layer, LLM only at the adapter) is a clean architectural template for any Arc-native agent toolkit, and the "fork N scenarios per single chain read" pattern is the right way to keep an agent's reasoning cheap when each on-chain read/settle costs latency.
