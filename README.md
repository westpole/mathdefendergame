# Math Defender

The player defends a base from falling meteors containing math expressions by typing the correct answer and pressing Enter. The game features score-based grade progression, dynamic difficulty adjustment (DDA), and a persistent score ledger that is surfaced in the overlay flow.

## TOC

* Development and Release:
  - [General information](/docs/general.md)
  - [Mobile device testing](/docs/mobile-device-testing.md)
  - [Using the `release-game` agent](/docs/release-game-agent.md)
  - [Tips and Tricks](/docs/tips-and-tricks.md)
  - [Game Overview on engine and wiring](/docs/ui-overlay-game-engine-wiring.md)
  - [Feature Flags](/tools/feature-flags/README.md)
* Useful resources:
  - [Game preview](https://westpole.github.io/mathdefendergame/)

## Agents

`.github\agents` contains project's agents that were designed to help in development of each game components.

## Skill validation

This repo includes a lightweight validation workflow for custom skills.

- `npm run skill:smoke` validates modified skill metadata, required frontmatter, and referenced assets.
- `npm run skill:bench` runs the curated trigger/non-trigger benchmark suite under `benchmark/skills`.
- The Git hook in `.githooks/pre-commit` runs the smoke test automatically when a skill file changes.

To enable the repo hook locally:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

On Windows, use Git Bash or a shell that honors executable bits for the hook script.
