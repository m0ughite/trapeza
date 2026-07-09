# Run-Your-Own Input Contract

Bring your own workflow and clear it live. There are **two ways** to describe a run:

1. **Simple mode (start here).** A short, plain-language description of your steps.
   Trapeza fills in the providers, prices, bonds and calibration data for you.
2. **Full contract (advanced).** You supply the entire market yourself — every
   provider, price, bond and calibration row. Documented at the [end](#advanced-full-contract).

Both are validated before running the same live Tier-2 clearing (serverless first,
in-browser fallback). **No money moves.**

---

## Simple mode

You describe **what** the workflow does; Trapeza figures out **who** can do it.

### Minimal copy-paste example

This is exactly what the dashboard pre-loads, so you can run it with one click:

```json
{
  "name": "my-workflow",
  "budgetUsdc": "2.84",
  "deadlineMs": 800,
  "risk": "medium",
  "calibration": "on",
  "steps": [
    { "id": "parse",     "capability": "doc.parse" },
    { "id": "extract",   "capability": "data.extract",   "dependsOn": ["parse"] },
    { "id": "reconcile", "capability": "data.reconcile", "dependsOn": ["extract"] }
  ]
}
```

Even shorter — the only truly required field is `steps` (everything else is defaulted):

```json
{ "steps": [ { "capability": "doc.parse" }, { "capability": "data.extract" } ] }
```

### Fields and what they mean

| Field | Required | Type | Meaning / default |
| --- | --- | --- | --- |
| `steps` | **yes** | array | The workflow steps, in order. Must be non-empty. |
| `steps[].capability` | **yes** | string | What the step does — pick from the [catalog](#capability-catalog). |
| `steps[].id` | no | string | Stable id for the step (e.g. `"parse"`). Auto-generated (`step-1`, …) if omitted. Slugified to lowercase-with-dashes. |
| `steps[].label` | no | string | Human name; used as the `id` when `id` is absent. |
| `steps[].dependsOn` | no | array | Steps this one waits on — by **step id** (`"parse"`) or **0-based index** (`0`). Omit for steps with no prerequisites. |
| `name` | no | string | Friendly workflow name → becomes the graph id. Default `custom-workflow`. |
| `budgetUsdc` | no | string/number | Shared spend cap for the whole workflow. **Auto-sized** if omitted so the run clears. |
| `deadlineMs` | no | integer | Deadline in milliseconds. Default `800`. |
| `risk` | no | enum | `low` \| `medium` \| `high`. Default `medium`. See [risk mapping](#risk-mapping). |
| `calibration` | no | enum | `on` (route on realized track record) or `off` (trust bids). Default `on`. |

### What gets filled in automatically

You never supply a provider, a price, a bond or a calibration number. The transform
([`src/lib/simpleInput.ts` → `expandSimpleInput()`](./src/lib/simpleInput.ts)) does it
deterministically from the catalog:

- **Providers** — every catalog provider that advertises a step's capability is added
  as a candidate (deduped across steps, sorted by id). The clearing then picks the best
  one per step.
- **Prices, bonds, calibration rows** — copied verbatim from the catalog provider.
- **Step value** — defaulted to `2 ×` the priciest candidate's ask (min `$0.25`).
- **Bond ratio** — `0.1` per step.
- **Budget** — if omitted, sized to comfortably clear (`Σ(maxAsk + value·0.1) × 1.35`).
- **`riskAversion`** — derived from `risk` (below).

### Risk mapping

| `risk` | `riskAversion` (engine lever, 0–3) |
| --- | --- |
| `low` | `0.5` |
| `medium` | `1.0` |
| `high` | `2.0` |

Higher risk aversion penalizes providers with volatile realized outcomes more heavily.

---

## Capability catalog

Choose each step's `capability` from this list. The **backing providers** are added for
you — you don't name them. (Prices/archetypes shown for context only; sourced from the
bundled reference runs.)

| Capability | What it does | Backed by |
| --- | --- | --- |
| `answer.generate` | Generate a grounded answer from retrieved context | grounded-answerer, confident-answerer |
| `code.generate` | Produce a code change for the task | codegen-pro, autocomplete-hero |
| `code.review` | Review a code change | senior-reviewer, lgtm-bot |
| `data.aggregate` | Combine parallel inputs into one dataset | aggregator |
| `data.extract` | Pull line-items / fields out of content | budget-extractor, sonnet-extractor, flash-extractor, premium-extractor |
| `data.reconcile` | Match records against a source of truth | quick-reconciler, ledger-reconciler, premium-reconciler |
| `doc.chunk` | Split a long document into passages | splitter, megachunk |
| `doc.extract` | Pull findings out of a source document | sonnet-reader, skim-bot |
| `doc.parse` | Turn a raw file into machine-readable text | sonnet-parser, budget-ocr |
| `embed.index` | Embed chunks into a searchable index | embed-small, embed-xl |
| `entitlement.check` | Verify the requester's plan / permissions | plan-checker |
| `kb.lookup` | Find relevant knowledge-base articles | kb-retriever, stale-kb |
| `report.format` | Render the result into a clean report | report-formatter, template-bot |
| `response.draft` | Write a reply from gathered context | reply-writer, autoresponder |
| `retrieve.topk` | Fetch the most relevant passages | bm25-retriever, vector-retriever |
| `security.scan` | Scan a change for vulnerabilities | sast-scanner, regex-scanner |
| `sentiment.analyze` | Gauge sentiment / urgency | mood-reader |
| `test.run` | Run the test suite | ci-runner, flaky-runner |
| `ticket.classify` | Route/label a support ticket | intent-router |
| `verify.claims` | Fact-check claims against evidence | claim-auditor, rubber-stamp |
| `verify.grounding` | Confirm an answer is supported by sources | citation-checker, vibe-checker |
| `verify.rules` | Check the result against a rule set | rules-validator, skip-check |
| `verify.tone` | Tone-check drafted text | tone-guard |
| `web.research` | Gather sources/evidence for a topic | web-scout, headline-grabber |

> The catalog is generated at runtime from the bundled runs, so it always matches the
> providers the dashboard ships with. The UI shows the same table under
> **Run Your Own → Simple → "Available capabilities"**.

---

## Validation and error behavior

Simple input is expanded and validated in one pass. Issues have a `severity`:

- **`error`** — blocks the run. The payload is not produced.
- **`warning`** — advisory (e.g. a budget hint). The run still proceeds.

Checks include:

- `steps` present and non-empty (`empty-steps`)
- each `capability` exists in the catalog (`unknown-capability` — the message lists the
  valid ones)
- each `dependsOn` entry resolves to a real step id or in-range index
  (`unknown-dependency`), no step depends on itself (`self-dependency`)
- dependencies form a DAG — no cycles (`cyclic-dependency`)
- unique step ids (`duplicate-step-id`); valid `risk` / `calibration` / `deadlineMs` /
  `budgetUsdc`
- **budget hint** (`budget-too-low`, warning): budget below the cheapest feasible plan;
  the message suggests a sufficient amount

The expanded payload is then re-checked against the full contract as a safety net, so a
successfully produced payload is always contract-valid.

### API behavior

`POST /api/run` accepts **either** shape. A body with a top-level `steps` array and no
`graph` is treated as simple mode; it is expanded and run. Invalid simple input returns
`400`:

```json
{
  "error": "invalid simple input",
  "issues": [
    {
      "code": "unknown-capability",
      "path": "$.steps[1].capability",
      "severity": "error",
      "message": "Unknown capability \"foo\". Valid capabilities: answer.generate, code.generate, ..."
    }
  ]
}
```

---

## Advanced: full contract

Power users can bypass simple mode and supply the entire market directly. The source
types are `LiveRunInput`, `LiveRunOptions`, `GraphView`, and `ProviderView` in
[`src/types/contract.ts`](./src/types/contract.ts). The dashboard's **Builder** and
**Full JSON** tabs both emit this shape.

### Shape

```json
{
  "graph": {
    "id": "string",
    "globalBudgetUsdc": "decimal string",
    "globalDeadlineMs": 600,
    "globalQualityFloor": null,
    "riskAversion": 1.0,
    "nodes": [
      {
        "nodeId": "string",
        "capability": "string",
        "valueUsdc": "decimal string",
        "budgetUsdc": "decimal string",
        "bondRatio": 0.5,
        "qualityFloor": 0.7,
        "bottleneck": false
      }
    ],
    "edges": [ { "from": "node-id", "to": "node-id" } ]
  },
  "providers": [
    {
      "id": "string",
      "capabilities": ["string"],
      "priceUsdc": "decimal string",
      "bondOfferedUsdc": "decimal string",
      "claimedSuccessProb": 0.8,
      "claimedLatencyMs": 120,
      "calibratedSuccessProb": 0.74,
      "pSuccessStdDev": 0.1,
      "successAlpha": 18,
      "successBeta": 6,
      "costMeanUsdc": 0.19,
      "latencyMeanMs": 130,
      "nObservations": 24,
      "archetype": "workhorse"
    }
  ],
  "run": {
    "budgetUsdc": "decimal string",
    "deadlineMs": 700,
    "riskAversion": 1.2,
    "calibration": "on"
  }
}
```

- `run` is the execution-time override block; `run.budgetUsdc`, `run.deadlineMs` and
  `run.riskAversion` are copied onto the graph before execution.
- `run.calibration` controls whether routing uses calibrated outcomes (`"on"`) or
  claimed bids (`"off"`).

### Full-contract validation

Enforced by [`src/lib/liveRunContract.ts`](./src/lib/liveRunContract.ts) in both the UI
and API paths:

- payload has `graph`, `providers`, and `run`; non-empty graph and providers
- decimal-string money fields are finite and in range; `riskAversion` in `[0, 3]`;
  `deadlineMs` a positive integer
- node ids and provider ids are unique; all edge references point to known nodes
- graph is acyclic (DAG only); every node capability has at least one provider

Invalid full payloads return `400` with `{ "error": "invalid run payload", "issues": [...] }`.
