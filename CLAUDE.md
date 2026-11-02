# Math Defender Game

Keep changes minimal and aligned with the current repo structure. Prefer updating the owning layer instead of spreading logic across Phaser, React, and Electron.

> This project keeps two AI setups side by side for learning purposes: GitHub Copilot (`.github/`) and Claude Code (`CLAUDE.md`, `.claude/`). Claude Code uses only the files under `.claude/`; do not edit `.github/copilot-instructions.md`, `.github/agents/**`, or `.github/skills/**/SKILL.md` unless explicitly asked.

## Skills, Agents, and Commands

Project skills live in `.claude/skills/` and load automatically based on their descriptions:

- `phaser-expert` — Phaser 4 scene, rendering, input, and gameplay architecture.
- `phaser-unit-tests` — unit tests for Phaser scenes and game logic.
- `react-frontend-expert` — game UI overlay layouts with React and Zustand.
- `react-unit-tests` — Vitest + React Testing Library tests for UI components and hooks.
- `storybook-expert` — `*.stories.tsx` and Zustand store seeding in Storybook.
- `electron-expert` — changes to the Electron shell.
- `electron-unit-tests` — unit tests for the Electron main/renderer code.
- `e2e-test-expert` — Playwright end-to-end tests under `e2e/`.
- `zustand-unit-tests` — unit tests for Zustand stores and migrations.
- `coverage-analysis` — running and interpreting coverage reports.
- `file-organization` — organizing types, constants, and utilities.

User-invoked only (never start these on your own):

- `/release-workflow` — production release (preflight, checks, builds, version bump, report).
- `/npm-upgrade <package>` — isolated, verified dependency upgrade.

Subagents in `.claude/agents/`:

- `code-reviewer` — strict review of the current changes; run it before committing.

## Current Stack

- Phaser 4 for gameplay rendering.
- React 19 for DOM overlays.
- Zustand 5 for shared UI state and persisted leaderboard data.
- Vite 8 + TypeScript for the renderer build.
- Electron 42 for the desktop wrapper.
- Storybook 10 and Vitest 4 for component work and testing.

## Code Ownership

- `src/game/main.ts` owns gameplay rules and mutable game state: score, lives, shield, stages, meteors, answer checking, stage transitions, and final accuracy.
- `src/game/scenes/GameScene.ts` owns Phaser rendering, keyboard input, and the bridge between gameplay events and the store.
- `src/game/scenes/BootScene.ts` waits for fonts, then marks the UI ready.
- `src/game/scenes/UIScene.ts` owns the singleton Phaser game instance and the menu/start/continue/pause lifecycle helpers.
- `src/store/useGameStore.ts` is the single shared app store. Only the leaderboard is persisted to `localStorage`.
- `src/App.tsx` mounts the Phaser container and React overlays, switching UI by store `phase` and `screenView`.
- `electron/main.ts` owns the desktop window and app menu, including the close-confirmation flow that dispatches events to the renderer.

## Repo-Specific Patterns

- Phaser owns the canvas. React owns menu, HUD, login, pause, stage-message, game-over, profile, performance, rules, and loading overlays.
- Put gameplay rule changes in `src/game/main.ts`; keep `GameScene` focused on rendering, input, and store synchronization.
- Treat Zustand as the integration boundary between Phaser and React. Do not duplicate gameplay state in React local state if it already exists in the game core or store.
- Before editing, identify the owning layer; if a change crosses layers, update shared store contracts first, then adapters and consumers.
- Overlay flow is driven by `phase` (`booting | login | start | playing | paused | stage-message | gameover`) and `screenView` (`home | profile | performance | rules`). Gameplay-driven transitions should originate from game logic/store updates; view-only transitions can originate from React UI actions.
- Stories live beside components in `src/ui/components/**`; use the `storybook-expert` skill instead of inventing a new store-mocking pattern.
- Preserve the existing Electron security posture: `contextIsolation: true` and `nodeIntegration: false`, unless an explicit security-reviewed requirement says otherwise.
- When UI behavior, states, or visuals change, add or update desktop and mobile device stories.
- Make sure new and modified components, hooks, and utilities are properly documented and tested.

## Verification

- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Narrowest test lane first: `npm run test:react`, `npm run test:phaser`, `npm run test:store`, `npm run test:electron`, `npm run test:storybook`; then `npm run test:all` for cross-cutting changes.
- Full script reference: `docs/package-scripts.md`.

## Commits

- Format: `<type>: #<ticket> <description>` (for example `feat: #30 add settings overlay`). Take the ticket number from the branch name (`118-...` → `#118`).

## Utilities

- Run `npm run docs:sync-current-stack` to update the Current Stack section in both `CLAUDE.md` and `.github/copilot-instructions.md`.
- Revisit this file after updating the Current Stack section to ensure consistency.
