# [CHORE] #129 Make the deps scripts trustworthy and remove audit-ci and npm-check-updates

> **Ticket type:** Chore
> **Status:** Ready for Dev
> **Priority:** P0
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `129-deps-scripts-replace-audit-ci-and-ncu`
> **Data as of:** 2026-11-04

---

## 1. Summary

Replace `audit-ci` and `npm-check-updates` with npm built-ins, and fix the `deps:*` scripts so a security check can actually fail. Every later ticket relies on `deps:audit:ci`.

## 2. Why

- `npm run deps:audit:ci` currently prints "Passed npm security audit" and exits 0 with 60 vulnerable packages, 4 of them critical. `audit-ci` has no config file and no level flag, so nothing fails it.
- `npm audit --audit-level=high` gives the same gate with no dependency. `audit-ci` brings 44 packages into the tree.
- `deps:check-updates` overlaps `deps:outdated`, and `npm-check-updates` is itself 4 majors behind (18.3.1, latest 22.2.9). Removing it is cheaper than upgrading it.
- `deps:unused` is an exact copy of `quality:unused`, and Knip reports `conventional-changelog-conventionalcommits` as unused even though the `changelog` script loads it through `-p conventionalcommits`.

## 3. Scope

| Package | Current | Action | Notes |
| --- | --- | --- | --- |
| `audit-ci` | 7.1.0 | Remove | Replaced by `npm audit --audit-level=high` |
| `npm-check-updates` | 18.3.1 | Remove | Replaced by `npm outdated --long` |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `129-deps-scripts-replace-audit-ci-and-ncu` and confirm `git status` is clean.
2. Run `npm ci`.
3. In `package.json`, set `"deps:audit:ci": "npm audit --audit-level=high"`. Keep the script name, because the `npm-upgrade` skill and `.claude/settings.json` already use it.
4. Delete the `deps:check-updates` script.
5. Set `"deps:unused": "knip --dependencies"`. Leave `quality:unused` as plain `knip`.
6. Add `"deps:signatures": "npm audit signatures"`.
7. Add `knip.json` with `{ "ignoreDependencies": ["conventional-changelog-conventionalcommits"] }`. Check that Knip keeps its current default entry detection, and add only what is needed if it does not.
8. Run `npm uninstall audit-ci npm-check-updates --ignore-scripts`.
9. Update the Dependency Maintenance table in `docs/package-scripts.md`.
10. Do not add the audit step to CI here. That is #148, because the gate stays red until #130 to #136 land.
11. Commit using `chore: #129 <description>` when asked to commit.

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

- [ ] `npm run deps:audit:ci` exits non-zero on this branch, because high and critical advisories still exist.
- [ ] `audit-ci` and `npm-check-updates` are gone from `package.json` and `package-lock.json`.
- [ ] `npm run deps:unused` no longer reports `conventional-changelog-conventionalcommits`.
- [ ] `docs/package-scripts.md` matches the scripts in `package.json`.

## 8. Dependencies & Risks

- **Blocked by:** None
- **Blocks:** All other tickets in this plan
- `npm audit` has no allowlist, which is the main feature `audit-ci` adds. That is acceptable because the expected leftovers (`minimatch`, `glob`) are moderate and sit below the high gate. If a high advisory ever needs an accepted exception, bring `audit-ci` back with an `audit-ci.jsonc` config.
- Keep Knip: npm has no built-in unused-dependency check.
- Optional follow-up after this plan finishes: set `min-release-age` in `.npmrc` as a supply-chain cooldown (available in the installed npm 11.21.1). Do not add it now, because it would hold back recently published security fixes.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
