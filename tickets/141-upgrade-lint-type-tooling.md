# [MAINTENANCE] #141 Upgrade typescript-eslint, react-refresh plugin and type-coverage

> **Ticket type:** Maintenance
> **Status:** Ready for Dev
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `141-upgrade-lint-type-tooling`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade the in-range lint and type-quality tools. ESLint itself stays on 9 (see #149).

## 2. Why

- These are development tools only. New lint rules can surface issues that `--max-warnings 0` turns into failures.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `typescript-eslint` | 8.64.0 | 8.72.1 | Minor |
| `eslint-plugin-react-refresh` | 0.5.3 | 0.5.7 | Patch |
| `type-coverage` | 2.30.1 | 2.31.1 | Minor |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `141-upgrade-lint-type-tooling` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D typescript-eslint@^8.72.1 eslint-plugin-react-refresh@^0.5.7 type-coverage@^2.31.1 --ignore-scripts`.
4. If rules report new issues, fix the code where the fix is small. Raise anything larger rather than disabling the rule.
5. Compare `npm run types:coverage` with its result on `master`.
6. Commit using `chore: #141 <description>` when asked to commit.

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

### A. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

## 7. Acceptance Criteria

- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run types:coverage` does not drop.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #149, #150
- `typescript-eslint@8.72.1` requires `typescript` below 6.1.0, which is what blocks #150.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
