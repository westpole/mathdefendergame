# [CHORE] #148 Enforce the npm audit gate in CI

> **Ticket type:** Chore
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `148-ci-enforce-npm-audit-gate`
> **Data as of:** 2026-11-04

---

## 1. Summary

Add `npm run deps:audit:ci` to the PR workflow so new high or critical advisories cannot build up unnoticed.

## 2. Why

- No workflow runs an audit today, which is how the tree reached 60 vulnerable packages.

## 3. Scope

`.github/workflows/pr-tests-runner.yml` only. No package versions change.

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `148-ci-enforce-npm-audit-gate` and confirm `git status` is clean.
2. Run `npm ci`.
3. In `.github/workflows/pr-tests-runner.yml`, add a `Dependency audit` step that runs `npm run deps:audit:ci` straight after `npm ci`.
4. Confirm the gate passes first. If it fails, stop and finish #136.
5. Commit using `chore: #148 <description>` when asked to commit.

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

## 7. Acceptance Criteria

- [ ] A PR run shows the `Dependency audit` step passing.
- [ ] The step fails when a high advisory exists. Prove this on a throwaway branch, for example by restoring an old `package-lock.json`, and do not merge that branch.

## 8. Dependencies & Risks

- **Blocked by:** #130, #131, #132, #133, #134, #135, #136
- **Blocks:** None
- New advisories will block unrelated PRs. That is the purpose, but plan for a quick patch ticket when it happens.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
