# context-arc

Agent-facing developer docs and sample codebases for Arc + Circle.

See `AGENTS.md` for the layout and entry points.

## Sync into your local arc-canteen install

```bash
arc-canteen context sync
```

Drops the contents (including submodules) into `~/.arc-canteen/context/`.

## Clone directly

```bash
git clone --recursive https://github.com/the-canteen-dev/context-arc.git
```

`--recursive` is required to pull the `samples/` submodules.

## Refresh from upstream

```bash
git -C context-arc pull --recurse-submodules
git -C context-arc submodule update --remote
```

## Contents

- **docs/docs.arc.network/** — Arc chain + App Kit docs (mirror of `docs.arc.network`)
- **docs/developers.circle.com/** — Circle developer platform docs (mirror), including the Agent Stack (Circle CLI, Agent Wallets, x402 payments)
- **docs/circlefin-skills/** — LLM-optimized SKILL.md files from `circlefin/skills`
- **samples/** — 5 reference codebases as git submodules:
  - `arc-commerce`, `arc-multichain-wallet`, `arc-escrow`, `arc-fintech`, `arc-p2p-payments`
