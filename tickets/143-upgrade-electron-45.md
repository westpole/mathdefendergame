# [UPGRADE] #143 Upgrade Electron to 45

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** #128 Audit npm dependencies
> **Estimate:** L
> **Branch:** `143-upgrade-electron-45`
> **Data as of:** 2026-11-04

---

## 1. Summary

Move from the end-of-life Electron 42 line to 45.2.2, bringing Chromium from M148 to M156 and getting security support again.

## 2. Why

- Electron 42 stopped receiving fixes on 2026-10-20. Electron 45 is supported until about 2027-04-27 (tentative).
- The jump covers three majors, but the app uses very little of the affected API: there is no preload, no `clipboard`, no `dialog` and no `window.open` flow.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `electron` | 42.11.18 (after #132) | 45.2.2 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

**Breaking change assessment for this repo:**

| Change | Status here |
| --- | --- |
| 44: `clipboard` removed from renderers, async API | Not used |
| 43: `dialog` `defaultPath` default | Not used |
| 45: sandboxed preload changes | No preload script |
| 45: `window.open()` children of unsandboxed windows | Window is sandboxed and has no popups |
| 45: ASAR `fs.open` descriptors | Check the packaged app, since `loadFile` reads from the archive |
| 44: Windows ia32 removed | Build target is default NSIS. Confirm x64 output |
| 44: ANGLE statically linked | Check WebGL rendering in the packaged app |

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `143-upgrade-electron-45` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D electron@^45.2.2 --ignore-scripts`.
4. Read the 43, 44 and 45 sections of the [Electron breaking changes](https://www.electronjs.org/docs/latest/breaking-changes) and confirm the assessment in Section 3 still holds.
5. After installing, run `npx install-electron`, then confirm that `node_modules/electron/dist/version` shows 45.2.2.
6. Keep `contextIsolation: true`, `nodeIntegration: false` and `sandbox: true`.
7. Confirm `electron/main.ts` still runs directly through Electron's TypeScript stripping, since `package.json` `main` points at the `.ts` file.
8. Run `npm run docs:sync-current-stack` so the Current Stack section shows Electron 45, then re-read `CLAUDE.md` for consistency.
9. If 45 fails in a way that cannot be fixed within the 3-attempt limit, try 44.10.2 and report the blocker. Do not stop at 43, which ends on about 2027-01-05.
10. Commit using `chore: #143 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:electron`
4. `npm run test:all`

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

### A. Desktop app (Electron)

**Setup:** Run `npm run build:win`, then install `dist/*.exe` on Windows. If only the unit-test flake blocks that script, run `npx vite build` and `npx electron-builder` instead.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Install and start the packaged app | The window opens at about 900x900 with the title "Math Defender", with no blank or white screen. |
| [ ] | Play one full stage in the packaged app | Rendering and keyboard input match the web build. |
| [ ] | During a game, click the window X, then cancel the confirmation | The confirmation appears and the game continues. |
| [ ] | Click the window X again and confirm | The app closes cleanly and no process stays in Task Manager. |
| [ ] | With the app open, start it a second time | The existing window is focused and no second window opens. |
| [ ] | Reopen the app after a finished game | Profile, leaderboard and history are still there. |

### B. Upgrade over an existing install

**Setup:** Install the current `master` build first, create a profile and finish one game.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Install the new build over the old one without uninstalling | The installer finishes without errors. |
| [ ] | Start the new build | The old profile, leaderboard and history are all still there. |
| [ ] | Change window size down to the 700x700 minimum | The canvas and overlays scale correctly. |

### C. Core gameplay

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

### D. Saved data

**Setup:** Finish at least one game first.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open Performance after the game | The finished game appears in the history and stats. |
| [ ] | Fully close and reopen the app | The profile, leaderboard and history are still there. |

### E. Language

**Setup:** Use the app from the previous section.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Switch from English to Ukrainian | React screens and in-game Phaser text switch language, with no raw keys such as `ui.save`. |
| [ ] | Reload the app | Ukrainian is still selected. |
| [ ] | Play one stage in Ukrainian, then switch back to English | Text fits its layout in both languages. |

## 7. Acceptance Criteria

- [ ] `npm ls electron` shows 45.2.2 and the binary reports the same version.
- [ ] The packaged x64 installer builds, installs and runs.
- [ ] `webPreferences` is unchanged.
- [ ] Existing saved data survives an install over the previous build.

## 8. Dependencies & Risks

- **Blocked by:** #132, #137
- **Blocks:** None
- Chromium moves 8 versions, so expect possible `electron-visual` screenshot changes. Differences need human review first.
- CI only runs the web e2e lane, so the local Windows Electron run is the only automated cover for this ticket.
- Electron 46 (about 2027-01-05) moves to Node 26 and removes more APIs, so plan the next upgrade by then.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
