# Math Defender Game

Keep changes minimal and aligned with the current repo structure. Prefer updating the owning layer instead of spreading logic across Phaser, React, and Electron.

## Use Local Skills For Framework Details

- Use `.github/skills/phaser-best-practices/SKILL.md` for Phaser 4 scene, rendering, input, and gameplay architecture guidance.
- Use `.github/skills/react-frontend-zustand-expert/SKILL.md` for React 19 and Zustand patterns.
- Use `.github/skills/storybook-zustand-expert/SKILL.md` for `*.stories.tsx` and store seeding in Storybook.
- Use `.github/skills/electron-best-practices/SKILL.md` when changing the Electron shell.

## Current Stack

- Phaser 4.2 for gameplay rendering.
- React 19 for DOM overlays.
- Zustand 5 for shared UI state and persisted leaderboard data.
- Vite + TypeScript for the renderer build.
- Electron for the desktop wrapper.
- Storybook 10 and Vitest 4 for component work and testing.

## Code Ownership

- `src/game.ts` owns gameplay rules and mutable game state: score, lives, shield, stages, meteors, answer checking, stage transitions, and final accuracy.
- `src/scenes/GameScene.ts` owns Phaser rendering and keyboard input, and bridges gameplay events into the store.
- `src/scenes/BootScene.ts` waits for fonts, then marks the UI ready.
- `src/store/useGameStore.ts` is the single shared app store. Only the leaderboard is persisted to `localStorage`.
- `src/App.tsx` mounts the Phaser container and React overlays, switching UI by store `phase` and `menuView`.
- `src/phaserGame.ts` manages the singleton Phaser instance and menu/start/continue transitions.
- `electron/main.js` owns the desktop window and app menu, dispatching `electron-menu-action` events to the renderer.

## Repo-Specific Patterns

- Phaser owns the canvas. React owns menu, HUD, stage-message, game-over, rules, high-score, and loading overlays.
- Put gameplay rule changes in `src/game.ts`; keep `GameScene` focused on rendering, input, and store synchronization.
- Treat Zustand as the integration boundary between Phaser and React. Avoid duplicate state or parallel sources of truth.
- Overlay flow is driven by `phase` (`booting | start | playing | stage-message | gameover`) and `menuView` (`home | high-score | rules`).
- Stories live beside components in `src/ui/components/**`; use the Storybook skill instead of inventing a new store-mocking pattern.
- Preserve the existing Electron security posture: `contextIsolation: true` and `nodeIntegration: false`.
