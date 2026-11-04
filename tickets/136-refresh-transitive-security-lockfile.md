# [SECURITY] #136 Refresh vulnerable transitive packages in the lockfile

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P0
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `136-refresh-transitive-security-lockfile`
> **Data as of:** 2026-11-04

---

## 1. Summary

Clear the remaining transitive advisories with a targeted lockfile refresh, including critical `tar`. No `package.json` version changes are expected.

## 2. Why

- Parent ranges already allow a fixed version for all of these packages. The lockfile just has not moved. Run this after #130 to #135 so it works from their final dependency tree.

## 3. Scope

| Package | Current | Target (highest in range) | Pulled in by |
| --- | --- | --- | --- |
| `tar` | 7.5.17 | 7.5.22 | Packaging |
| `undici` | 6.27.0, 7.28.0 | 6.29.1, 7.30.1 | jsdom, @electron/get, node-gyp |
| `@xmldom/xmldom` | 0.8.13 | 0.8.15 | plist |
| `brace-expansion` | 1.1.15 to 5.0.6 | 1.1.21, 2.1.7, 5.0.12 | via minimatch |
| `browserslist` | 4.28.4 | 4.29.5 | Babel |
| `baseline-browser-mapping` | 2.10.40 | 2.11.35 | browserslist |
| `fast-uri` | 3.1.2 | 3.1.9 | ajv |
| `js-yaml` | 4.3.0 | 4.3.2 | ESLint, electron-builder |
| `nanoid` | 3.3.15 | 3.3.20 | postcss |
| `source-map-js` | 1.2.1 | 1.2.2 | postcss, sass |
| `zod` | 4.4.3 | 4.6.7 | knip, react-hooks plugin |
| `smol-toml` | 1.8.0 | 1.9.1 | knip |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `tar` | critical | 4 | GHSA-w8wr-v893-vjvp, GHSA-23hp-3jrh-7fpw, GHSA-8x88-c5mf-7j5w, GHSA-r292-9mhp-454m |
| `undici` | high | 23 | GHSA-8xcm-r25x-g524, GHSA-4cwx-7wf7-3272, GHSA-m8rv-5g2x-5cg5, and more |
| `@xmldom/xmldom` | high | 10 | GHSA-6gmq-8vp8-gcm6, GHSA-w2rr-34g9-rvrj, GHSA-4w3w-2rp5-g8jm, and more |
| `brace-expansion` | high | 6 | GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895, and more |
| `browserslist` | high | 2 | GHSA-c83g-rgw3-j3cx, GHSA-73wf-gq98-2v4g |
| `baseline-browser-mapping` | moderate | 1 | GHSA-w5vr-8v7q-w6rv |
| `fast-uri` | high | 11 | GHSA-v2hh-gcrm-f6hx, GHSA-7p8r-x3mc-p8w7, GHSA-f65p-4m7j-42xc, and more |
| `js-yaml` | high | 2 | GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh |
| `nanoid` | high | 2 | GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 |
| `source-map-js` | high | 1 | GHSA-68fv-2mgg-jv7q |
| `zod` | high | 1 | GHSA-mrhx-c7xc-m3w5 |
| `smol-toml` | moderate | 1 | GHSA-r4xh-jqrq-34v2 |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `136-refresh-transitive-security-lockfile` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm update tar undici @xmldom/xmldom brace-expansion browserslist baseline-browser-mapping fast-uri js-yaml nanoid source-map-js zod smol-toml --ignore-scripts`.
4. Do not run a blanket `npm update`, and never run `npm audit fix --force`. Its suggested fixes are downgrades, such as `electron-builder@20.23.1` and `typescript-eslint@8.14.0`.
5. Confirm `git diff package.json` is empty.
6. If a package stays vulnerable, including nested copies, add a narrow `overrides` entry for that package only and note why in the PR.
7. Do not override `minimatch` or `glob`. Consumers need `minimatch@^3`, and moving them to 11 would be a breaking API jump.
8. Commit using `chore: #136 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:all`

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

### C. Desktop app (Electron)

**Setup:** Run `npm run build:win`, then install `dist/*.exe` on Windows. If only the unit-test flake blocks that script, run `npx vite build` and `npx electron-builder` instead.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Install and start the packaged app | The window opens at about 900x900 with the title "Math Defender", with no blank or white screen. |
| [ ] | Play one full stage in the packaged app | Rendering and keyboard input match the web build. |
| [ ] | During a game, click the window X, then cancel the confirmation | The confirmation appears and the game continues. |
| [ ] | Click the window X again and confirm | The app closes cleanly and no process stays in Task Manager. |
| [ ] | With the app open, start it a second time | The existing window is focused and no second window opens. |
| [ ] | Reopen the app after a finished game | Profile, leaderboard and history are still there. |

### D. Storybook

**Setup:** Run `npm run storybook` and open `http://localhost:6006`.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open HUDOverlay, HomeOverlay, GameOverOverlay and SettingsOverlay stories | Each renders with seeded state and no error panel. |
| [ ] | Switch between the desktop and mobile stories for one component | The layout changes as it did before the upgrade. |
| [ ] | Open the Accessibility panel on one story | The panel loads and lists results. |
| [ ] | Open the Docs page for one component | The docs page renders. |
| [ ] | Run `npm run build-storybook` | The build finishes without errors. |

## 7. Acceptance Criteria

- [ ] `npm run deps:audit:ci` exits 0, which means no high or critical advisories remain.
- [ ] Only moderate `minimatch` and `glob` advisories remain, plus packages that inherit them.
- [ ] `package.json` is unchanged, unless an override was needed.

## 8. Dependencies & Risks

- **Blocked by:** #130, #131, #132, #133, #134, #135
- **Blocks:** #148
- The in-range targets were calculated from the lockfile and registry data. A trial install was not run, so treat the exact versions as expected rather than proven.
- `minimatch` (GHSA-g3hv-75wg-m249, fixed in 11.0.1) cannot be cleared. No parent allows 11 yet, including ESLint 10 and `app-builder-lib`. It is build-time only, with patterns from our own config. Record it as accepted risk in the PR.
- `glob` (GHSA-3g3m-2fjr-6pw4) has the same status through the Storybook docgen plugin.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
