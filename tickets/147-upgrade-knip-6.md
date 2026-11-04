# [UPGRADE] #147 Upgrade Knip to 6

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `147-upgrade-knip-6`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade Knip to 6.44.1, which replaces its TypeScript backend with oxc and no longer needs the compiler API.

## 2. Why

- This also removes one blocker for #150, because Knip no longer relies on the TypeScript JS API for parsing.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `knip` | 5.88.1 | 6.44.1 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `147-upgrade-knip-6` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D knip@^6.44.1 --ignore-scripts`.
4. Compare `npm run quality:unused` before and after the upgrade.
5. Removed: the `classMembers` issue type, `--include-libs`, `--isolate-workspaces` and `--experimental-tags`. None appear in the repo scripts, so confirm `knip.json` from #129 does not use them.
6. Do not fix existing unused exports here. Report new findings in the PR.
7. Commit using `chore: #147 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:all`

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

### A. Dependency scripts

**Setup:** Run these from a terminal.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Run `npm run deps:audit:ci` | It exits non-zero while any high or critical advisory remains, and exits 0 once none remain. |
| [ ] | Run `npm run deps:outdated` | A table of outdated packages is printed. |
| [ ] | Run `npm run deps:unused` | Only dependency issues are reported, and `conventional-changelog-conventionalcommits` is not listed. |
| [ ] | Run `npm run deps:signatures` | Registry signatures verify without errors. |

### B. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

## 7. Acceptance Criteria

- [ ] `npm run deps:unused` reports no new issues compared with its result before the upgrade.
- [ ] Any difference in `npm run quality:unused` output is explained in the PR.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #150
- `npm run quality:unused` already exits non-zero on `master`: 3 unused files, 4 exports and 3 exported types. Treat these as existing findings.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
