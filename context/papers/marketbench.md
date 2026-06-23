# MarketBench: Evaluating AI Agents as Market Participants

- **arXiv:** 2604.23897
- **Authors:** Andrey Fradkin (Boston University & MIT Initiative on the Digital Economy); Rohit Krishnan (Independent Researcher)
- **One-line relevance:** MarketBench is the **agent self-calibration / bid-accuracy** piece — it shows that agents bidding in a market need calibrated beliefs about their own success probability and cost, and that current LLMs are badly miscalibrated; this is the diagnostic and quality-scoring backbone for any RFB-3 agent-to-agent auction where agents price their own work.

---

## Abstract / Thesis

Markets can coordinate AI agent activity for the same reasons they coordinate human activity — but only if agents can produce **informative signals about their own ability and cost** before a task is assigned. **MarketBench** assesses whether agents have this self-assessment capability. Using a **93-task subset of SWE-bench Lite** and **six recently released LLMs**, the authors find models are **miscalibrated** on both success probability and token usage; auctions built from these self-reports diverge from a full-information allocation. Adding prior-experience info to the context improves calibration but only modestly narrows the gap. **Self-assessment is the key bottleneck for market-style coordination of AI agents.**

## Why markets, and why this capability

Multi-agent systems (Claude Code, OpenClaw, etc.) are becoming standard but use ad-hoc routing rules. Markets simplify complexity via the price mechanism and are attractive when fit/cost/speed are **local** to the worker, not visible to a central planner — but this only works if workers can say something informative about their own likely performance. Without calibrated self-assessment, bids are noisy and allocation suffers. (Compounded by Dell'Acqua et al.'s "jagged technological frontier" — irregular, unpredictable capability boundaries.)

Counterargument addressed: even if model architectures are public, the mapping from a task to success probability and token use is not predictable ex ante; and agents = base model + execution env + scaffolding + operator state, so fit/cost info is genuinely decentralized relative to a central market maker.

## Conceptual framework

A principal gets value `v` if a task is completed. Two agents H (better, costlier `c_H`) and L (worse, cheaper `c_L`). Each task has difficulty `d`; agent `i` succeeds if `a_i + ε_i ≥ d`. Compares non-market rules (assign-best, assign-worst, run-both-in-parallel) against a **market allocation** where each agent observes its own task-specific draw and a success-contingent procurement contract pays `b_i` only on success (zero-profit bid `b_i = c_i / p_i`).

**Proposition 1:** When `v > c_H > c_L > 0`, the market allocation **weakly dominates** every non-market alternative, **strictly** when there's positive probability the alternative allocates to the wrong agent, pays a redundant agent, or pays for an unsolvable attempt. The market conditions on private, task-specific information rather than average success rates. (In practice agents only need self-assessment that's *incrementally* informative relative to the principal's own signal.)

## MarketBench design

Two task families on SWE-bench Lite (real GitHub issue-fix pairs, executable test suites, binary success; tasks cluster by repo — django, sympy, scikit-learn, sphinx — so per-repo priors are well-defined):

- **Calibration:** model forecasts `p_success` (prob it solves the task in one attempt) and `estimated_tokens_total`; compared to realized runs, with token forecasts mapped to dollar cost via model-specific pricing. Phase I = 93 tasks × 6 models = 558 rows, strict JSON, temperature 0.
- **Auction:** a reserve-price procurement sim where each model's bid is mechanically derived from its elicited estimates. Breakeven bid `b* = (token_cost + penalty·(1 − p_success)) / p_success`; $2 failure penalty; reserves ~ Uniform[0,1], 100 draws/row.

## Calibration results (the main finding: miscalibration)

| Model | Mean p | Pass rate | Brier Skill | Est. toks | Realized toks |
| --- | --- | --- | --- | --- | --- |
| Claude Opus 4.5 | 76.5% | 80.6% | **+0.060** | 14,774 | 35,820 |
| Gemini 3 Pro Preview | 92.9% | 80.6% | −0.111 | 1,801 | 55,969 |
| GPT-5.2 | 63.2% | 80.6% | −0.195 | 2,909 | 25,036 |
| GPT-5.2-pro | 66.3% | 79.6% | −0.111 | 2,647 | 3,970 |
| Claude Sonnet 4.5 | 75.8% | 77.4% | **+0.018** | 18,333 | 53,085 |
| GPT-5-mini | 61.4% | 75.3% | −0.305 | 2,595 | 28,276 |

- Pass rates cluster tightly (75.3–80.6%) while stated confidence ranges 61.4–92.9%. Gemini is sharply **overconfident**; GPT-5.2 / GPT-5-mini **underconfident**. Only the two Claude models beat a naive base-rate forecast.
- **Token estimates are severely understated** — global median estimated/actual ratio = **0.02** (i.e., ~50× under).
- A **self-history card** (prepending the model's own held-out pass rate, overconfidence gap, token-underestimation ratio) improves mean Brier 0.1835→0.1693 and ECE 0.1065→0.0616 — better, but still far from ideal.

## Reserve-price auction results

All models earn **less than the oracle** (perfect knowledge of solvability), often by a wide margin — e.g., GPT-5.2 realized **$0.006/task vs $0.385 oracle**. Gemini wins 84.6% of auctions and the largest realized profit, but via **aggressive overconfident bidding**, not signal quality. Self-knowledge intervention repairs *who wins* but not *how much the principal recovers*.

## Illustrative live scaffold experiment

A market-inspired routing scaffold over the same 6 models on a 50-task common slice. Each worker submits an ask + self-assessed `p_success` + expected time; operator assigns by `Score_i = p_i·(Utility − Ask_i) − (1−p_i)·Penalty_i − E[Cost_i]`; two attempts max, failed first attempt forces a different model.

| Execution paradigm | Pass rate | Passes |
| --- | --- | --- |
| Market (our scaffold) | 58.0% | 29/50 |
| Solo GPT-5.2 (our scaffold) | 48.0% | 24/50 |
| Solo GPT-5.2 (external scaffold) | 74.0% | 37/50 |
| Oracle ceiling (external scaffold) | 84.0% | 42/50 |

- Market beats same-scaffold solo by 10pp, but p ≈ 0.3 (not significant at this n); gains come mostly from **model diversity + retry**, not the bidding rule (a matched centralized router hits 27/50 vs market 23/50 on rerun).
- **Execution path is first-order:** the same GPT-5.2 drops 26pp moving from external (interactive shell, test feedback, multi-turn edits) to the live scaffold (one-shot patch). A codex-direct diagnostic with 1800s budget hits 35/50 but at ~55–75× the compute (321.3M tokens vs 4.37–5.82M).

## Discussion / agenda

Current agents can solve hard tasks but **can't reliably say in advance which tasks they can solve, how likely, and at what cost** — exactly the information a market must aggregate. The likely solution is **markets + AI**: a market where a centralized scorer augments bids using trustworthiness signals (held-out calibration record, domain reputation, third-party verifier acceptance) — i.e., a **scoring auction** (à la Che 1993 / Varian position auctions). Since frontier pass-rate gains can require order-of-magnitude more compute, the right bid object is closer to a **production schedule** (token budget → expected success, time, allocation) than a single scalar.

Next steps: (1) make self-assessment a training/eval target in its own right (calibration, abstention, budget discipline); (2) richer institutions (reputation, escrow); (3) extend beyond software engineering.

## Why it matters for the project

For RFB 3, agents pricing their own work is the core primitive. MarketBench is the **warning + measurement tool**: naive agent bids are miscalibrated, so any agent-to-agent nanopayment network needs (a) a held-out calibration/reputation layer scoring bids, (b) escrow + slashing for overconfident bidders (directly echoing Prior-Art #8 / ERC-8004 bonded brokers), and (c) abstention when confidence is insufficient. It supplies the quality-score inputs that AEX's auction assumes.
