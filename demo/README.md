# Trapeza Clearinghouse Demo

Runnable, deterministic walkthrough of the `@trapeza/clearinghouse` engine. No chain calls, no secrets, no build step required.

## Run

```bash
npm run demo
```

## What it shows

1. **Scenario** — a six-node workflow DAG with budget and deadline constraints.
2. **Calibration vs bragging** — providers whose self-reported success rates diverge from their realized track records (lemons vs workhorses).
3. **Clearing** — `submitGraph()` returns allocations, schedule, settlement prices, shadow prices, and preflight verdict.
4. **Bake-off** — greedy fails on a budget-vs-bottleneck graph; MILP finds a feasible joint plan.
5. **Twin Monte Carlo** — stochastic failure, budget overrun, and deadline breach probabilities on the cleared plan.
6. **Preflight guard** — the settlement twin rejects a plan when the requester balance is too low.

## Files

| File | Purpose |
| --- | --- |
| `data.ts` | Demo providers (calibrated from synthetic outcomes), graphs, snapshots |
| `format.ts` | Console formatting helpers |
| `run-clearing.ts` | Main narrated entrypoint |
| `tsconfig.json` | Path aliases to package `src/` (build-free via `tsx`) |

## Notes

- Fixed seed (`42`) everywhere — output is reproducible.
- Imports only public `@trapeza/core` and `@trapeza/clearinghouse` APIs.
- Demo data is separate from unit tests; tweak `data.ts` to explore other scenarios.
