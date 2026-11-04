# [SECURITY] #134 Upgrade Vitest to 4.1.12

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `134-upgrade-vitest-4-1-12`
> **Data as of:** 2026-11-04

---

## 1. Summary

Move all Vitest packages to 4.1.12 to close the mocker advisories, staying on major 4.

## 2. Why

- `@vitest/mocker` below 4.1.12 allows arbitrary file reads and code injection through mock registration. `vitest` pins the mocker exactly, so all Vitest packages must move together.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `vitest` | 4.1.10 | 4.1.12 | Patch |
| `@vitest/browser-playwright` | 4.1.10 | 4.1.12 | Patch |
| `@vitest/coverage-v8` | 4.1.10 | 4.1.12 | Patch |
| `@vitest/ui` | 4.1.10 | 4.1.12 | Patch |
| `vitest-canvas-mock` | 1.1.4 | 1.2.0 | Minor |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `vitest` | moderate | 1 | GHSA-82fw-gwwq-j7x9 |
| `@vitest/mocker` | moderate | 2 | GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8 |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `134-upgrade-vitest-4-1-12` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D vitest@^4.1.12 @vitest/browser-playwright@^4.1.12 @vitest/coverage-v8@^4.1.12 @vitest/ui@^4.1.12 vitest-canvas-mock@^1.2.0 --ignore-scripts`.
4. Do not move to Vitest 5 here. That is #144.
5. Commit using `chore: #134 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:phaser`
4. `npm run test:react`
5. `npm run test:storybook`
6. `npm run test:electron`
7. `npm run test:all`

Expected: all pass. The baseline on 2026-11-04 was 535 of 536 tests passing across 61 files.

Known flake: `src/game/scenes/__tests__/UIScene.test.ts` > "creates the Phaser game once and reuses the singleton" can time out at 5000 ms. If it is the only failure and it fails the same way, record it as existing noise. Any other failure counts as a regression.

**Build**

1. `npm run build:web`, which also runs the full test suite.
2. If only the known flake stops it, run `npx vite build` and record that in the PR.

**End-to-end tests**

Stop any server on port 4173 first. Locally, Playwright reuses a running server, which can test a stale build. Playwright rebuilds the e2e bundle itself.

1. `npm run test:e2e:web`
2. `npm run test:e2e:electron` (local Windows only, because CI does not run this lane and snapshots exist only for `win32`)

If an e2e test fails, run the same test on `master` before blaming the upgrade. No e2e baseline was recorded for this plan.

**Security**

1. `npm run deps:audit`: compare with the table in Section 3 and confirm the expected packages are gone.
2. `npm run deps:audit:ci`: this stays red until #136 is merged, so before then treat its result as information only.

## 6. Manual Regression (Alpha Testing)

A person runs this on the PR branch before merge. Record the commit, OS, device and browser, and mark each row pass or fail. Add a screenshot for each failure.

Blocker: crash, blank screen, lost saved data, or gameplay that cannot continue. Do not merge with an open blocker. Log minor issues in the PR.

### A. Test tooling

**Setup:** Run these from a terminal.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Run `npm run test:ui` and open the printed URL | The Vitest UI loads and lists test projects. |
| [ ] | Run `npm run test:all:coverage` | The coverage report is written to `reports/unit-tests/coverage` and thresholds behave as they did on `master`. |
| [ ] | Open the HTML unit test report | The report shows the latest run. |

### B. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

## 7. Acceptance Criteria

- [ ] `npm ls vitest @vitest/mocker` shows a single 4.1.12.
- [ ] `npm audit` no longer lists `vitest`, `@vitest/mocker`, `@vitest/browser` or the other Vitest packages.
- [ ] Coverage thresholds pass as they did before.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #135, #136, #144, #148
- `vitest-canvas-mock` 1.2.0 feeds the Phaser project through `vitest-phaser.setup.ts`, so run the Phaser lane on its own too.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
