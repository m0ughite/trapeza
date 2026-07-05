# Contributing to Trapeza

This repo is built collaboratively on feature branches. Keep a clear record of who
did what so manual work and assisted sessions are both traceable.

## Logging (required)

Before pushing or opening a PR, append an entry to **[ACTIVITY-LOG.md](ACTIVITY-LOG.md)**
for every session that:

- Changed code, config, or docs
- Ran spikes or tests (pass or fail)
- Updated wallets or env (say "updated `.env`" — never log keys)
- Found or resolved a blocker

Skip logging for read-only exploration with no file changes.

### Entry fields

- **Author:** your handle (e.g. `mindsmith`)
- **Mode:** `manual` (you drove it) or `assisted` (you directed an AI session)
- **Branch:** current git branch name
- **Done / Files / Verification / Notes:** see template in ACTIVITY-LOG.md

Promote to **[IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md)** when a sprint phase completes,
a spike passes or fails with evidence, a design decision locks, or open items change.

## Branch workflow

- Work on feature branches; include branch name in every ACTIVITY-LOG entry.
- Git commits are the diff-of-record; optional `Commit:` line in Notes when pushed.

## Security

- Never commit `.env`, `secrets/`, or private keys.
- Never log secret values in ACTIVITY-LOG or IMPLEMENTATION-LOG.
- Arc testnet only unless explicitly agreed otherwise.

## Build checks

After core changes:

```bash
npm run typecheck
npm test
```

On-chain work: follow [SETUP.md](SETUP.md); record real tx hashes or explorer links in Verification.

## Agent context

See [AGENTS.md](AGENTS.md) for monorepo layout, module boundary, and Arc/Circle doc routing.
