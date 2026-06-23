# CASTER: Breaking the Cost-Performance Barrier in Multi-Agent Orchestration via Context-Aware Strategy for Task Efficient Routing

- **arXiv:** 2601.19793
- **Authors:** Shanyu Liu, Xuyang Yuan, Tao Chen, Zijun Zhan, Zhu Han, Danyang Zheng, Weishan Zhang, Shaohua Cao
- **One-line relevance:** CASTER is the **cost-aware neural routing in multi-agent graphs** piece — a lightweight router that decides, per step, whether a sub-task needs an expensive vs cheap model; this is exactly the budget/cost-vs-value routing logic an RFB-3 paying agent (or broker) needs to spend nanopayments efficiently across a network of agent services.

---

## Abstract

Graph-based Multi-Agent Systems (MAS) enable complex cyclic workflows but suffer from inefficient **static model allocation** — deploying strong models uniformly wastes compute on trivial sub-tasks. **CASTER** is a lightweight router for **dynamic model selection** in graph-based MAS. It uses a **Dual-Signal Router** combining semantic embeddings with structural meta-features to estimate task difficulty, and self-optimizes via a **Cold Start → Iterative Evolution** paradigm, learning from its own routing failures (on-policy negative feedback). Across Software Engineering, Data Analysis, Scientific Discovery, and Cybersecurity (LLM-as-a-Judge), CASTER **reduces inference cost up to 72.4%** vs strong-model baselines while matching success rates, and beats both heuristic routing and FrugalGPT in every domain.

## Problem: the Cost-Performance Paradox

MAS workflows accumulate context exponentially, forcing a binary choice: **Strong Models** (e.g., GPT-4o) → prohibitive cost/latency; **Weak Models** → "fragility of logic" where a single upstream error cascades to total failure.

Existing routing is ill-suited:
- **Heuristics** (query length) miss semantic complexity (a short logic-heavy prompt can be harder than a long summary).
- **Cascading** (FrugalGPT) "try-and-fail" adds latency and pollutes shared context with erroneous intermediate steps.
- **Preference-based** (RouteLLM, RLHF/arena data) lacks the objective precision needed for rigorous multi-step agentic chains.

## Method

Built on **LangGraph** (stateful cyclic graph). CASTER is a **dynamic interceptor**: before control enters any agent node it analyzes the real-time shared state and picks the model backend (e.g., GPT-4o vs GPT-4o-mini). Step-level routing; on failure (e.g., Reviewer rejection) the workflow rolls back with an adjusted strategy.

### Dual-Branch Feature Fusion Network
- **Text branch (semantic):** input embedding `x_sem ∈ ℝ^1536` (text-embedding-3-small) → Dropout(ReLU(W_t·x + b_t)) → `D_sem=128`.
- **Meta branch (structural):** sparse meta-vector `v_meta ∈ ℝ^6` (4-dim one-hot agent role {PM, Architect, Engineer, Reviewer} + normalized context length + high-risk keyword indicator) → ReLU → `D_struct=16`.
- **Fusion:** concat (144) → ReLU(W_fuse·h + b_fuse) bottleneck `D_fuse=64` → `p(Strong|x) = σ(w_out^T · …)`.

### Training: Cold Start → Iterative Evolution
- **Cold Start (supervised pre-training):** heuristic data augmentation. Seed tasks in Easy (≈0.1), Medium (≈0.5), Hard (≈0.9) tiers; augmentation engine expands each seed into 4–6 paraphrases; uniform label noise `ε ~ U(−0.05, 0.05)`; simulated meta-features. 200 epochs, BCE loss, lr 1e-3.
- **Iterative Fine-tuning via Negative Feedback:** the crux. If the system chose **Weak** and the task **FAILED**, forcibly re-label ground truth to **Strong (1.0)** — "you saved cost and failed; next time pick strong." Success+Strong → 1.0, Success+Weak → 0.0 (encourage low-cost). Adam lr 1e-4, StepLR γ=0.5 every 50 epochs to avoid catastrophic forgetting.
- **On-policy, not random:** random exploration introduces noise (strong models trivially solving easy tasks) that makes the router overly conservative/expensive; CASTER targets **high-value boundary samples** (misjudgment failures, successful cost reductions). A Dynamic Adversarial Task Generator (GPT-4o teacher, Hard Mode p=0.7) builds the trajectory dataset in a sandbox.

## Results

- **Cost:** 23.1–54.4% total cost reduction across domains vs Force Strong; e.g., Software avg cost $0.039→$0.018/task; up to **72.4%** reduction for OpenAI in Software (cross-provider).
- **Quality parity (and sometimes better):** matches/surpasses Force Strong — Science 95.3 vs 95.2, Security 86.2 vs 85.5 — by avoiding strong-model "over-thinking" on simple sub-tasks. Recovers weak-model catastrophic drops (Web Security 48→86, Concurrency 67→83).
- **vs FrugalGPT:** Pareto-superior. CASTER predicts complexity **a priori** ("one-shot routing"), avoiding FrugalGPT's "double-billing" penalty (paying for a failed weak call *then* a strong call). 20.7–48.0% cheaper **and** +0.7 to +1.2 quality points across domains.
- **Cross-provider:** robust over OpenAI, Claude, Gemini, Qwen, DeepSeek. Savings largest where the strong/weak price gap is wide; DeepSeek (identical strong/weak pricing) shows "cost inversion."

## Why it matters for the project

CASTER is the **spend-efficiency brain** for a paying agent. In an RFB-3 agent-to-agent nanopayment network, an agent (or broker) must decide *which* downstream service/model is worth paying for given task difficulty — the cost-vs-value decision the hackathon explicitly calls out (RFB 1: "is this $0.001 call worth it?", RFB 3 multi-hop routing). CASTER's dual-signal difficulty estimator + negative-feedback learning maps directly onto routing nanopayments to the cheapest sufficient provider, reserving expensive strong models / premium agent services only for hard sub-tasks — turning routing decisions into real sub-cent USDC settlement on Arc.
