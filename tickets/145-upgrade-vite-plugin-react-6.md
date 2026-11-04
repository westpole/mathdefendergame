# [UPGRADE] #145 Upgrade @vitejs/plugin-react to 6

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `145-upgrade-vite-plugin-react-6`
> **Data as of:** 2026-11-04

---

## 1. Summary

Move to the Vite 8 native version of the React plugin, which removes Babel from this plugin.

## 2. Why

- Version 6 drops Babel and supports only Vite 8, which the repo already uses. `react()` is called with no options in `vite.config.ts` and `vitest.config.ts`, so no config change is expected.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `@vitejs/plugin-react` | 5.2.0 | 6.2.1 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `145-upgrade-vite-plugin-react-6` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D @vitejs/plugin-react@^6.2.1 --ignore-scripts`.
4. Confirm no `babel` option is passed to `react()` in either config.
5. Confirm Fast Refresh still works in `npm run dev:web`.
6. Commit using `chore: #145 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:react`
4. `npm run test:store`
5. `npm run test:storybook`
6. `npm run test:all`

Expected: all pass. The baseline on 2026-11-04 was 535 of 536 tests passing across 61 files.

Known flake: `src/game/scenes/__tests__/UIScene.test.ts` > "creates the Phaser game once and reuses the singleton" can time out at 5000 ms. If it is the only failure and it fails the same way, record it as existing noise. Any other failure counts as a regression.

**Build**

1. `npm run build:win`, which also runs the full test suite.
2. If only the known flake stops it, run `npx vite build` and `npx electron-builder`, and record that in the PR.

**End-to-end tests**

Stop any server on port 4173 first. Locally, Playwright reuses a running server, which can test a stale build. Playwright rebuilds the e2e bundle itself.

1. `npm run test:e2e:web`
2. `npm run test:e2e:electron` (local Windows only, because CI does not run this lane and snapshots exist only for `win32`)

If an e2e test fails, run the same test on `master` before blaming the upgrade. No e2e baseline was recorded for this plan.

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

### C. Storybook

**Setup:** Run `npm run storybook` and open `http://localhost:6006`.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open HUDOverlay, HomeOverlay, GameOverOverlay and SettingsOverlay stories | Each renders with seeded state and no error panel. |
| [ ] | Switch between the desktop and mobile stories for one component | The layout changes as it did before the upgrade. |
| [ ] | Open the Accessibility panel on one story | The panel loads and lists results. |
| [ ] | Open the Docs page for one component | The docs page renders. |
| [ ] | Run `npm run build-storybook` | The build finishes without errors. |

## 7. Acceptance Criteria

- [ ] `npm ls @vitejs/plugin-react` shows 6.2.1.
- [ ] Production and e2e builds both succeed.
- [ ] Hot reload keeps component state on a simple edit.

## 8. Dependencies & Risks

- **Blocked by:** #133
- **Blocks:** None
- Babel may stay in the lockfile through other packages, which is fine.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
