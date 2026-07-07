# Trapeza — Tangible-Demo Plan (scenarios + input layer)

> **Status:** plan only, nothing implemented. Companion to `FINAL-PHASE-PLAN.md` (which covered the
> wiring/dashboard build, now done). This doc addresses the two credibility gaps raised after the
> baseline shipped. Branch `feature/demo-dashboard`. Window: ~1 day to the cutoff.

---

## 0. What this fixes (the two concerns, taken as correct)

1. **The scenarios are semantically hollow.** They are internally-consistent but abstract: capabilities
  `cap.1/2/3/logo/code`, nodes `n1…n6`, providers `workhorse-N/braggart-N`, flat `$0.50` values, ~`$1 `totals. A dev reads this as a synthetic benchmark, not a product they'd use. There is also a real  **credibility bug**: the dashboard narrates the six-node graph as an "invoice workflow  (extraction → reconcile → fact-check → format)" while the data is`n1…n6`with cycled`cap.N`. That
   mismatch, if a judge notices, reads as fabricated. Must fix.
2. **There is no input/translation layer.** The pitch says "requesters submit the task graph," but never
  answers *who builds the graph and how*. Today the only way to see value is our three baked runs — which
   does not convince anyone they can use it. We need to (a) show recognizable, real multi-step agentic
   workflows, and (b) give people a concrete **shape/contract** their agent emits, plus a way to try their
   own graph live.

## 1. Revised position (I was too conservative — partially)

My earlier "freeze, don't build" was **right about one thing and wrong about the scope.**

- **Still holds (high confidence):** an *unconstrained* natural-language-todo → typed DAG **LLM planner**
stays out of the deadline. Free-form planners emit malformed/garbage graphs, and a flaky auto-generator
moments before submission is exactly the "AI slop" failure mode to avoid. → **P2, post-submission,
teammate branch.**
- **Was wrong (concede):** re-authoring the scenarios into believable workflows, and exposing a concrete
**input contract + a paste-your-own-graph path** (and optionally a constrained form builder), are *not*
the risky LLM feature. They are low-risk, high-credibility quick wins that directly answer "how do I use
this," and they should ship before the deadline.

The dividing line: **deterministic, schema-validated input = safe and in-scope; probabilistic
LLM-generated input = out-of-scope for now.**

---

## 2. Workstreams (prioritized, timeboxed, with cut-lines)

### WS-A — Re-author scenarios into real, recognizable workflows  ·  MUST  ·  ~2–3h  ·  confidence: high

Replace abstract identifiers with named, believable ones in `demo/data.ts` + `demo/scenarios.ts`, then
re-emit fixtures via `npm run demo:emit`. **No engine/contract/math change** — only the semantic content
(labels, capabilities, provider identities, values). The calibration contrast (braggart vs workhorse) is
preserved; we just make it legible.

Concrete redesign of the three scenarios:

1. **Invoice processing pipeline** (fixes the mismatch bug). 6 steps that match the narrative:
  `ingest (doc.parse) → extract-line-items (data.extract) → extract-totals (data.extract) →  reconcile (data.reconcile) → validate (verify.rules) → export (report.format)`. Providers get real
   archetype names, e.g. `sonnet-extractor`, `budget-ocr`, `ledger-reconciler`, and the braggart is a
   plausible "claims 98% accuracy, delivers 18%" OCR vendor. Values scaled to be tangible (steps ~$0.30–
   $1.50; total a few dollars) — see §3 honesty note.
2. **Budget bottleneck** (keep the shape; rename for realism). Reframe `logo→code` as
  `brand-asset (design.image) → landing-page (code.web)` under a tight budget; the greedy router spends
   on the cheap asset and can't afford the page → `NO_PROVIDER`; the graph solver reserves budget and
   clears. This is the money-shot; keep it, just make names/values recognizable.
3. **Research → report pipeline** (already the densest; just rename). 8 steps:
  `search (web.research) → extract×3 (doc.extract) + gather (data.aggregate) → reconcile (data.reconcile)  → fact-check (verify.claims) → format (report.format)`. Real provider identities; realistic values.

**Cut-line:** if time is short, fix **only scenario 1** (the mismatch bug is the credibility risk) and
rename providers/capabilities across all three (cheap, pure find/replace in the generators).

### WS-B — "Bring your own workflow": the input contract + paste-and-run  ·  SHOULD  ·  ~2–4h  ·  confidence: high

Answer "who builds the graph" concretely and safely. Two parts:

1. **Publish the input contract.** The task-graph JSON shape already exists (`@trapeza/core` `TaskGraph` +
  `SolverProvider`). Surface it as *the integration contract an agent emits*: a documented, copy-pasteable
   JSON schema + a worked example, in both the dashboard ("Bring your own workflow" section) and the README.
   Message: *your orchestrator already decomposes work into steps — emit this shape and Trapeza clears it.*
2. **Paste-and-run.** In "Run Your Own," add a JSON editor prefilled with the current scenario's graph +
  providers. User edits (add steps, change budget/values/deps/providers), we **validate against the schema**
   (reuse the existing AJV oracle infra), and clear it in-browser via the existing Tier-2 engine. Invalid
   input → inline errors, never a crash. Zero LLM, zero keys, zero money.

**Cut-line:** if the editor overruns, ship **part 1 only** (documented contract + example) — that alone
answers the integration question for a technical judge.

### WS-C — Constrained form/visual builder  ·  COULD (stretch)  ·  ~2–3h  ·  confidence: moderate

A form to assemble a graph without writing JSON: add a step (pick capability from a **known list**, set
value/budget/deadline, pick upstream deps), repeat, then Clear. Deterministic, no LLM. Only if WS-A+WS-B
land with time to spare. **First to cut.**

### WS-D — Constrained NL → graph  ·  P2, POST-SUBMISSION  ·  teammate branch  ·  confidence: low for deadline

The eventual "type a todo, get a workflow" magic — but done safely: LLM restricted to known capability
types, output **schema-validated with template fallback and sane defaults**, never trusted raw. Explicitly
**out of scope** for the deadline; hand to the teammate on a branch that cannot affect the demo.

---

## 3. Honesty constraint on scaled values (do not skip)

Scaling workflow values up to look tangible must not contradict the on-chain panel. The on-chain receipts
are real Arc-testnet events settling sub-cent amounts (the proven spikes). Rule: **the cleared-workflow
dollars are the workflow economics (clearly labeled testnet/illustrative); the on-chain panel shows the
real settlement proof separately and honestly.** Never imply the big cleared total was moved on-chain in
one tx. Keep the existing UUID-vs-tx-hash labeling. A judge rewards this discipline; a fabricated `/tx/`
link or an implied-but-false settlement is a credibility death.

---

## 4. Sequencing (fits the remaining ~day)


| Order | Workstream                                                                | Effort | Gate                                      |
| ----- | ------------------------------------------------------------------------- | ------ | ----------------------------------------- |
| 1     | WS-A scenarios re-authored + `demo:emit` re-run + tests/build green       | 2–3h   | fixtures legible; `npm test`, build green |
| 2     | WS-B part 1 (contract + example in dashboard + README)                    | ~1h    | contract visible + copyable               |
| 3     | WS-B part 2 (paste-and-run with schema validation)                        | 1.5–3h | edit → validate → clear in-browser        |
| 4     | Re-screenshot + update `DEMO-SCENARIOS.md` walkthroughs to the new names  | ~1h    | doc matches UI                            |
| 5     | WS-C form builder *(only if ahead)*                                       | 2–3h   | stretch                                   |
| —     | Then rejoin `FINAL-PHASE-PLAN.md` critical path: deploy → record → submit | —      | —                                         |


**Freeze rule (unchanged):** never let deploy + record + submit get squeezed. If WS-B part 2 or WS-C
threaten the freeze, cut them — WS-A + WS-B part 1 already close both credibility gaps.

## 5. Definition of done

- No abstract `cap.N` / `n1…n6` / `workhorse-N` in the UI; every scenario is a recognizable multi-step
agentic workflow with a matching narrative (invoice mismatch bug gone).
- A technical viewer can see **the exact JSON shape their agent emits** and **run their own edited graph
live** (schema-validated, in-browser).
- `npm test` 57/57, `npm run typecheck` exit 0, dashboard build green; `DEMO-SCENARIOS.md` + screenshots
updated; honesty constraints in §3 intact; `IMPLEMENTATION-LOG.md` appended.
- Unconstrained NL→DAG explicitly deferred (WS-D) — not in the shipped demo.

