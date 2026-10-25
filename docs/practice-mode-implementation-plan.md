# Practice Mode + Home/Menu Extension Plan

## Scope update

This plan includes the additional requirement that **Practice Mode sessions are logged like Regular Play** and that users can **see Practice Mode results reflected in the Performance report** after playing.

## Feature goals

- Home screen shows two tiles:
  - Practice Mode
  - Regular Play
- Menu updates:
  - "Play Game" renamed to "Regular Play"
  - New menu option: "Practice Mode"
  - New menu option: "Weekly Report"
- Weekly report content moved from Home to a dedicated Weekly Report screen.
- Practice Mode gameplay:
  - User selects one math operation (`+`, `-`, `*`, `/`) before starting.
  - Runs indefinitely until manually ended.
  - ESC pause flow remains the same (resume or exit).
  - Speed scaling follows current behavior.
  - Turret/life model is capped to 5 with no additional life rewards.
  - When the last life is lost, speed progression and turret lives reset and the session continues.
  - Scoring remains positive/negative exactly as current behavior.
- **New addition:** Practice Mode session data is persisted and appears in Performance report calculations.

---

## Implementation plan

### 1) Extend store contracts for run mode and weekly report routing

Files:
- `src/store/types.ts`
- `src/store/constants.ts`
- `src/store/setters/createGameStoreSetters.ts`
- `src/store/transformers/session.ts`

Changes:
- Add a mode concept to the run contract:
  - `GameMode = 'regular' | 'practice'`
  - `PracticeOperation = '+' | '-' | '*' | '/'`
- Extend `ScreenView` with `'weekly-report'`.
- Add state fields to hold active run configuration (mode and selected operation for practice).
- Add/adjust actions to:
  - select a practice operation
  - launch regular play
  - launch practice play
  - route to weekly report
- Keep menu snapshot behavior coherent when transitioning to and from gameplay.

### 2) Refactor Home overlay into two gameplay tiles

Files:
- `src/ui/components/HomeOverlay/index.tsx`
- `src/ui/styles/components/_menu.scss`

Changes:
- Replace embedded weekly report panel with a tile-first home layout.
- Add:
  - **Practice Mode** tile with operation selector and Start action.
  - **Regular Play** tile that starts current/default flow.
- Ensure responsive behavior on mobile/desktop and preserve accessibility semantics.

### 3) Create dedicated Weekly Report screen

Files:
- `src/ui/components/WeeklyReportOverlay/*` (new)
- `src/App.tsx`

Changes:
- Move current weekly summary + grade progress UI from Home to a new overlay screen.
- Render this overlay when `screenView === 'weekly-report'`.
- Reuse existing selector logic from `src/store/selectors/progress.ts` where possible.

### 4) Update menu options and behavior

Files:
- `src/ui/components/MenuControls/MenuList.tsx`

Changes:
- Rename menu label:
  - "Play Game" → "Regular Play"
- Add:
  - "Practice Mode"
  - "Weekly Report"
- Keep menu close behavior and screen navigation patterns consistent with existing flow.

### 5) Add mode-aware start flow in Phaser bridge

Files:
- `src/game/scenes/UIScene.ts`
- `src/game/scenes/GameScene.ts`

Changes:
- Extend start-game bridge to pass mode config into `GameScene`.
- Keep regular mode behavior unchanged.
- Ensure practice configuration is correctly passed through scene init payload.

### 6) Implement Practice Mode rules in game core

Files:
- `src/game/main.ts`
- `src/game/utilities/mathGen.ts`

Changes:
- Add mode-aware runtime behavior:
  - Practice mode enforces selected operation during expression generation.
  - No fixed campaign terminal stage in practice mode (indefinite run).
  - No bonus/additional life grants in practice mode.
  - Life/shield and speed progression reset when the last life is lost, then continue same session.
- Keep:
  - score gain/loss logic identical
  - pause/resume/manual exit behavior intact
  - regular mode campaign rules intact

### 7) Logging + performance integration (updated requirement)

Files:
- `src/game/main.ts`
- `src/game/scenes/GameScene.ts`
- `src/store/selectors/performance.ts` (verify only; adjust if needed)

Changes:
- Persist practice-mode run results to history using the same pathways used today (`addGameHistory` / premature-end persistence flows).
- Ensure operation stats generated during practice sessions are included in history entries.
- Confirm Performance report aggregation includes those entries so users immediately see practice impact after a session.
- If distinguishing between mode types is useful for future filtering, add a typed `mode` field to history entries without changing current aggregation behavior.

### 8) Ensure pause flow parity

Files:
- `src/game/scenes/GameScene.ts`
- `src/ui/components/PauseOverlay/index.tsx`

Changes:
- Keep ESC-based pause behavior and options unchanged in both modes.
- Preserve window-close and background pause variants.

### 9) Tests and Storybook updates

Files:
- `src/ui/components/HomeOverlay/__tests__/HomeOverlay.component.test.tsx`
- `src/ui/components/__tests__/App.component.test.tsx`
- `src/ui/components/MenuControls/*.stories.tsx` (if present)
- `src/ui/components/HomeOverlay/HomeOverlay.stories.tsx`
- `src/ui/components/WeeklyReportOverlay/*.stories.tsx` (new)
- `src/game/__tests__/main.test.ts`
- `src/game/scenes/__tests__/GameScene.test.ts`What's Missing
- `src/game/utilities/__tests__/mathGen.test.ts`
- `src/ui/components/PauseOverlay/__tests__/PauseOverlay.component.test.tsx`
- `src/ui/components/PerformanceOverlay/__tests__/PerformanceOverlay.component.test.tsx`

Coverage focus:
- Home tile rendering and actions.
- Menu label and new options.
- Practice operation lock enforcement.
- Practice infinite-cycle behavior (last life lost resets and continues).
- Practice session history persistence.
- Performance overlay reflects practice entries.

### 10) Validation steps

- Run focused unit/component tests for touched modules first.
- Run broader test selection if integration points (store + scene + overlays) require confidence.
- Verify no regressions in regular-mode logging and weekly report navigation.
- Run `npm run test:all:coverage` and verify threshold coverage limits.

---

## Delivery order

1. Store contracts + state/actions
2. Home and Weekly Report overlays
3. Menu option updates
4. UIScene/GameScene mode payload wiring
5. Core game practice logic
6. Logging/performance verification
7. Tests, stories, and validation
