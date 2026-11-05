# [MAINTENANCE] #138 Upgrade React to 19.3 with types and Testing Library

> **Ticket type:** Maintenance
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** M
> **Branch:** `138-upgrade-react-19-3`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade React, its types and the Testing Library companions together, because these versions need to stay aligned.

## 2. Why

- React owns every overlay in the app and this is a minor runtime upgrade, so it needs a full UI pass.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `react` | 19.2.7 | 19.3.1 | Minor |
| `react-dom` | 19.2.7 | 19.3.1 | Minor |
| `@types/react` | 19.2.17 | 19.3.0 | Minor |
| `@types/react-dom` | 19.2.3 | 19.3.0 | Minor |
| `@testing-library/react` | 16.3.2 | 16.3.3 | Patch |
| `@testing-library/user-event` | 14.6.1 | 14.6.8 | Patch |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `138-upgrade-react-19-3` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install react@^19.3.1 react-dom@^19.3.1 --ignore-scripts`.
4. Run `npm install -D @types/react@^19.3.0 @types/react-dom@^19.3.0 @testing-library/react@^16.3.3 @testing-library/user-event@^14.6.8 --ignore-scripts`.
5. Keep `react` and `react-dom` on the same version.
6. Fix any new type errors from `@types/react` 19.3 at the call site. Do not add `any` or suppressions.
7. Watch the test output for new `act()` and deprecation warnings.
8. Commit using `chore: #138 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:react`
4. `npm run test:storybook`
5. `npm run test:all`

Expected: all pass. The baseline on 2026-11-04 was 535 of 536 tests passing across 61 files.

Known flake: `src/game/scenes/__tests__/UIScene.test.ts` > "creates the Phaser game once and reuses the singleton" can time out at 5000 ms. If it is the only failure and it fails the same way, record it as existing noise. Any other failure counts as a regression.

**Build**

1. `npm run build:win`, which also runs the full test suite.
2. If only the known flake stops it, run `npx vite build` and `npx electron-builder`, and record that in the PR.

**End-to-end tests**

Stop any server on port 4173 first. Locally, Playwright reuses a running server, which can test a stale build. Playwright rebuilds the e2e bundle itself.

1. `npm run test:e2e:web`
2. `npm run test:e2e:electron` (local Windows only, because CI does not run this lane and snapshots exist only for `win32`)

If an e2e test fails, run the same test on `dev/upgrade-npm` before blaming the upgrade. No e2e baseline was recorded for this plan.

If `electron-visual` fails, inspect the diff in `test-results/` first. Run `npm run test:e2e:update-snapshots` only after a person confirms the change is expected, and list each updated snapshot in the PR.

**Security**

1. `npm run deps:audit`: compare with the table in Section 3 and confirm the expected packages are gone.
2. `npm run deps:audit:ci`: this stays red until #136 is merged, so before then treat its result as information only.

## 6. Manual Regression (Alpha Testing)

A person runs this on the PR branch before merge. Record the commit, OS, device and browser, and mark each row pass or fail. Add a screenshot for each failure.

Blocker: crash, blank screen, lost saved data, or gameplay that cannot continue. Do not merge with an open blocker. Log minor issues in the PR.

### A. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

### B. Core gameplay

**Setup:** Use the app from the previous section (or start it with `npm run dev:web`).

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Start a regular game | Meteors fall smoothly and the HUD shows score, lives and stage. |
| [ ] | Type a correct answer and press Enter | The meteor is destroyed and the score rises. |
| [ ] | Type digits, press Backspace, then finish the answer | The input edits correctly and the answer is accepted. |
| [ ] | Submit a wrong answer, then let a meteor reach the base | The game reacts to the wrong answer and a life or shield is lost when the meteor lands. |
| [ ] | Press Esc, wait a few seconds, then resume | The game pauses (meteors stop), then continues from the same state. |
| [ ] | Clear a stage | The stage message appears and the next stage starts. |
| [ ] | Lose all lives | The game-over screen shows final score and accuracy. |
| [ ] | Start practice mode once each for `+`, `-`, `*` and `/` | Each run only asks questions for the chosen operation. |

### C. Saved data

**Setup:** Finish at least one game first.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open Performance after the game | The finished game appears in the history and stats. |
| [ ] | Fully close and reopen the app | The profile, leaderboard and history are still there. |

### D. Language

**Setup:** Use the app from the previous section.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Switch from English to Ukrainian | React screens and in-game Phaser text switch language, with no raw keys such as `ui.save`. |
| [ ] | Reload the app | Ukrainian is still selected. |
| [ ] | Play one stage in Ukrainian, then switch back to English | Text fits its layout in both languages. |

### E. Storybook

**Setup:** Run `npm run storybook` and open `http://localhost:6006`.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open HUDOverlay, HomeOverlay, GameOverOverlay and SettingsOverlay stories | Each renders with seeded state and no error panel. |
| [ ] | Switch between the desktop and mobile stories for one component | The layout changes as it did before the upgrade. |
| [ ] | Open the Accessibility panel on one story | The panel loads and lists results. |
| [ ] | Open the Docs page for one component | The docs page renders. |
| [ ] | Run `npm run build-storybook` | The build finishes without errors. |

### F. Android phone

**Setup:** Follow [mobile-device-testing.md](../docs/mobile-device-testing.md): run `npx vite build`, then `npm run preview:web:mobile`, and open `http://<lan-ip>:4173` in Chrome.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Log in and start a game in portrait | The layout fits the screen and on-screen input works. |
| [ ] | Rotate to landscape during a game | The game and HUD adapt without losing state. |
| [ ] | Pause, resume and finish a game by touch | All controls respond and nothing overlaps. |

### G. Desktop app (Electron)

**Setup:** Run `npm run build:win`, then install `dist/*.exe` on Windows. If only the unit-test flake blocks that script, run `npx vite build` and `npx electron-builder` instead.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Install and start the packaged app | The window opens at about 900x900 with the title "Math Defender", with no blank or white screen. |
| [ ] | Play one full stage in the packaged app | Rendering and keyboard input match the web build. |
| [ ] | During a game, click the window X, then cancel the confirmation | The confirmation appears and the game continues. |
| [ ] | Click the window X again and confirm | The app closes cleanly and no process stays in Task Manager. |
| [ ] | With the app open, start it a second time | The existing window is focused and no second window opens. |
| [ ] | Reopen the app after a finished game | Profile, leaderboard and history are still there. |

## 7. Acceptance Criteria

- [ ] `npm ls react react-dom` shows a single 19.3.1.
- [ ] No new console warnings appear in the app or the test output.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #146
- Effect timing changes can show up as Zustand and Phaser sync issues, which `e2e/integration` covers.

## 9. Close the Ticket

Do these in order, once Agent Validation and Manual Regression pass with no open blocker.

1. Merge `138-upgrade-react-19-3` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/138-upgrade-react-19-3.md`.
3. In `tickets/README.md`, set #138 to `Done` and replace its link with plain `#138`.
4. Commit steps 2 and 3 together using `chore: #138 close ticket`.

## 10. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/138-upgrade-react-19-3.md` deleted, so no ticket file is left, and #138 is `Done` in `tickets/README.md`
