# [SECURITY] #133 Upgrade Vite to 8.3.5 with sass and vite-plugin-singlefile

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** #128 Audit npm dependencies
> **Estimate:** M
> **Branch:** `133-upgrade-vite-8-3-build-tools`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade the renderer build tools. This closes Vite dev-server advisories, including one specific to Windows.

## 2. Why

- Vite up to 8.1.5 has `launch-editor` issues on Windows, which is this project's development platform. The exposure is higher here because `server.host` is `true` and `dev:web:mobile` binds to `0.0.0.0`.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `vite` | 8.1.0 | 8.3.5 | Minor |
| `vite-plugin-singlefile` | 2.3.3 | 2.3.4 | Patch |
| `sass` | 1.102.0 | 1.107.1 | Minor |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `vite` | high | 5 | GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, and more |
| `postcss` | high | 2 | GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `133-upgrade-vite-8-3-build-tools` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D vite@^8.3.5 vite-plugin-singlefile@^2.3.4 sass@^1.107.1 --ignore-scripts`.
4. `vite.config.ts` sets both `rolldownOptions` and `rollupOptions`. Check for deprecation warnings in the build output and confirm that `__mocks__`, `__tests__` and stories stay out of the bundle.
5. If `postcss` stays at 8.5.22 or lower, run `npm update postcss --ignore-scripts`.
6. Commit using `chore: #133 <description>` when asked to commit.

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

### C. Storybook

**Setup:** Run `npm run storybook` and open `http://localhost:6006`.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open HUDOverlay, HomeOverlay, GameOverOverlay and SettingsOverlay stories | Each renders with seeded state and no error panel. |
| [ ] | Switch between the desktop and mobile stories for one component | The layout changes as it did before the upgrade. |
| [ ] | Open the Accessibility panel on one story | The panel loads and lists results. |
| [ ] | Open the Docs page for one component | The docs page renders. |
| [ ] | Run `npm run build-storybook` | The build finishes without errors. |

### D. Android phone

**Setup:** Follow [mobile-device-testing.md](../docs/mobile-device-testing.md): run `npx vite build`, then `npm run preview:web:mobile`, and open `http://<lan-ip>:4173` in Chrome.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Log in and start a game in portrait | The layout fits the screen and on-screen input works. |
| [ ] | Rotate to landscape during a game | The game and HUD adapt without losing state. |
| [ ] | Pause, resume and finish a game by touch | All controls respond and nothing overlaps. |

## 7. Acceptance Criteria

- [ ] `npm audit` no longer lists `vite` or `postcss`.
- [ ] `npx vite build` produces one self-contained `build/index.html`, which the Electron `file://` load depends on.
- [ ] `npm run build:web:e2e` still produces split vendor chunks.
- [ ] No new Sass deprecation warnings appear in the build output.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #136, #145, #148
- A Sass change can alter styling without failing a test, so compare the overlays visually.

## 9. Close the Ticket

Do these in order, once Agent Validation and Manual Regression pass with no open blocker.

1. Merge `133-upgrade-vite-8-3-build-tools` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/133-upgrade-vite-8-3-build-tools.md`.
3. In `tickets/README.md`, set #133 to `Done` and replace its link with plain `#133`.
4. Commit steps 2 and 3 together using `chore: #133 close ticket`.

## 10. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/133-upgrade-vite-8-3-build-tools.md` deleted, so no ticket file is left, and #133 is `Done` in `tickets/README.md`
