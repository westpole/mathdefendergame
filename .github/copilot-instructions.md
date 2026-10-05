# Math Defender Game

Keep changes minimal and aligned with the current repo structure. Prefer updating the owning layer instead of spreading logic across Phaser, React, and Electron.

## Use Local Skills For Framework Details

- Use `.github/skills/phaser-best-practices/SKILL.md` for Phaser 4 scene, rendering, input, and gameplay architecture guidance.
- Use `.github/skills/phaser-unit-tests/SKILL.md` for guidance on writing and structuring unit tests for Phaser scenes and game logic.
- Use `.github/skills/react-frontend-expert/SKILL.md` for guidance on  generating game UI layouts.
- Use `.github/skills/storybook-expert/SKILL.md` for `*.stories.tsx` and store seeding in Storybook.
- Use `.github/skills/electron-best-practices/SKILL.md` when changing the Electron shell.
- Use `.github/skills/coverage-analysis/SKILL.md` for guidance on running and interpreting test coverage reports.
- Use `.github/skills/zustand-unit-tests/SKILL.md` for guidance on writing and structuring unit tests for Zustand stores.
- Use `.github/skills/file-organization/SKILL.md` for guidance on organizing types, constants, and utilities across the project.


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
- `electron/main.js` owns the desktop window and app menu, including the close-confirmation flow that dispatches events to the renderer.

## Repo-Specific Patterns

- Phaser owns the canvas. React owns menu, HUD, login, pause, stage-message, game-over, profile, performance, rules, and loading overlays.
- Put gameplay rule changes in `src/game/main.ts`; keep `GameScene` focused on rendering, input, and store synchronization.
- Treat Zustand as the integration boundary between Phaser and React. Do not duplicate gameplay state in React local state if it already exists in the game core or store.
- Before editing, identify the owning layer; if a change crosses layers, update shared store contracts first, then adapters and consumers.
- Overlay flow is driven by `phase` (`booting | login | start | playing | paused | stage-message | gameover`) and `screenView` (`home | profile | performance | rules`). Gameplay-driven transitions should originate from game logic/store updates; view-only transitions can originate from React UI actions.
- Stories live beside components in `src/ui/components/**`; use the Storybook skill instead of inventing a new store-mocking pattern.
- Preserve the existing Electron security posture: `contextIsolation: true` and `nodeIntegration: false`, unless an explicit security-reviewed requirement says otherwise.
- When UI behavior, states, or visuals change, add or update desktop and mobile device stories.
- Make sure new and modified components, hooks, and utilities are properly documented and tested.

## Utilities

- run `npm run docs:sync-current-stack` to update the Current Stack section in this file.
- revisit this instructions file after updating the Current Stack section to ensure consistency.
