# Run-Your-Own Input Contract

This document defines **who builds the graph** and **what shape it must have** for the dashboard's live "Run Your Own" clearing.

- You (or your app) build the payload.
- The dashboard builder UI and JSON paste mode both emit the same payload.
- `api/run` validates this payload before executing the live Tier-2 clearing.

The source types are `LiveRunInput`, `LiveRunOptions`, `GraphView`, and `ProviderView` in `src/types/contract.ts`.

## JSON Shape

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
    "edges": [
      { "from": "node-id", "to": "node-id" }
    ]
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

### Notes

- `run` is the execution-time override block.
- `run.budgetUsdc`, `run.deadlineMs`, and `run.riskAversion` are copied onto the graph before live execution.
- `run.calibration` controls whether routing uses calibrated outcomes (`"on"`) or claimed bids (`"off"`).

## Valid Example Payload

```json
{
  "graph": {
    "id": "custom-invoice",
    "globalBudgetUsdc": "1.20",
    "globalDeadlineMs": 700,
    "globalQualityFloor": null,
    "riskAversion": 1.1,
    "nodes": [
      {
        "nodeId": "extract",
        "capability": "ocr",
        "valueUsdc": "0.30",
        "budgetUsdc": "0.30",
        "bondRatio": 0.5,
        "qualityFloor": null,
        "bottleneck": false
      },
      {
        "nodeId": "classify",
        "capability": "classification",
        "valueUsdc": "0.45",
        "budgetUsdc": "0.45",
        "bondRatio": 0.5,
        "qualityFloor": 0.7,
        "bottleneck": false
      },
      {
        "nodeId": "pay",
        "capability": "settlement",
        "valueUsdc": "0.55",
        "budgetUsdc": "0.55",
        "bondRatio": 0.6,
        "qualityFloor": 0.8,
        "bottleneck": true
      }
    ],
    "edges": [
      { "from": "extract", "to": "classify" },
      { "from": "classify", "to": "pay" }
    ]
  },
  "providers": [
    {
      "id": "ops-ocr",
      "capabilities": ["ocr"],
      "priceUsdc": "0.17",
      "bondOfferedUsdc": "0.05",
      "claimedSuccessProb": 0.82,
      "claimedLatencyMs": 110,
      "calibratedSuccessProb": 0.79,
      "pSuccessStdDev": 0.08,
      "successAlpha": 38,
      "successBeta": 10,
      "costMeanUsdc": 0.16,
      "latencyMeanMs": 118,
      "nObservations": 48,
      "archetype": "workhorse"
    },
    {
      "id": "ops-classifier",
      "capabilities": ["classification"],
      "priceUsdc": "0.24",
      "bondOfferedUsdc": "0.05",
      "claimedSuccessProb": 0.85,
      "claimedLatencyMs": 130,
      "calibratedSuccessProb": 0.74,
      "pSuccessStdDev": 0.12,
      "successAlpha": 28,
      "successBeta": 10,
      "costMeanUsdc": 0.22,
      "latencyMeanMs": 136,
      "nObservations": 38,
      "archetype": "neutral"
    },
    {
      "id": "ops-settler",
      "capabilities": ["settlement"],
      "priceUsdc": "0.31",
      "bondOfferedUsdc": "0.09",
      "claimedSuccessProb": 0.9,
      "claimedLatencyMs": 150,
      "calibratedSuccessProb": 0.83,
      "pSuccessStdDev": 0.09,
      "successAlpha": 41,
      "successBeta": 8,
      "costMeanUsdc": 0.3,
      "latencyMeanMs": 158,
      "nObservations": 49,
      "archetype": "workhorse"
    }
  ],
  "run": {
    "budgetUsdc": "1.20",
    "deadlineMs": 700,
    "riskAversion": 1.1,
    "calibration": "on"
  }
}
```

## Validation and Error Behavior

Validation is enforced by `src/lib/liveRunContract.ts` in both UI and API paths.

Validation checks include:

- payload has `graph`, `providers`, and `run`
- non-empty graph (`nodes.length > 0`) and non-empty providers
- decimal-string money fields are finite and in range
- `riskAversion` is in `[0, 3]`, `deadlineMs` is a positive integer
- node IDs and provider IDs are unique
- all edge references point to known nodes
- graph is acyclic (DAG only)
- every node capability has at least one selected provider

When invalid:

- **Builder mode**: run button stays usable, but run is blocked and structured issues are shown inline.
- **JSON mode**: parse and contract issues are shown inline with JSON paths.
- **`api/run`**: responds `400` with:

```json
{
  "error": "invalid run payload",
  "issues": [
    {
      "code": "cyclic-graph",
      "path": "$.graph.edges",
      "message": "Dependencies must form a DAG (no cycles)."
    }
  ]
}
```
