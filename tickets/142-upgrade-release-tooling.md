# [MAINTENANCE] #142 Upgrade the conventional-changelog tools

> **Ticket type:** Maintenance
> **Status:** Ready for Dev
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `142-upgrade-release-tooling`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade the three packages behind `npm run changelog` and `npm run which:version`.

## 2. Why

- These tools run only during a release, so a failure would appear at the worst moment unless checked now.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `conventional-changelog` | 8.1.0 | 8.1.3 | Patch |
| `conventional-changelog-conventionalcommits` | 10.2.1 | 10.4.1 | Minor |
| `conventional-recommended-bump` | 12.1.0 | 12.1.1 | Patch |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `142-upgrade-release-tooling` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D conventional-changelog@^8.1.3 conventional-changelog-conventionalcommits@^10.4.1 conventional-recommended-bump@^12.1.1 --ignore-scripts`.
4. Do not run any `release:*` script.
5. Commit using `chore: #142 <description>` when asked to commit.

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

If an e2e test fails, run the same test on `dev/upgrade-npm` before blaming the upgrade. No e2e baseline was recorded for this plan.

**Security**

1. `npm run deps:audit`: compare with the table in Section 3 and confirm the expected packages are gone.
2. `npm run deps:audit:ci`: this stays red until #136 is merged, so before then treat its result as information only.

## 6. Acceptance Criteria

- [ ] `npm run changelog` output matches the existing `CHANGELOG.md` layout.
- [ ] `npm run which:version` prints a recommendation.

## 7. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** None
- `.github/skills/release-workflow/scripts` also depend on commit message formats. Do not edit them unless this upgrade forces it, and flag it first if so.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `142-upgrade-release-tooling` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/142-upgrade-release-tooling.md`.
3. In `tickets/README.md`, set #142 to `Done` and replace its link with plain `#142`.
4. Commit steps 2 and 3 together using `chore: #142 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/142-upgrade-release-tooling.md` deleted, so no ticket file is left, and #142 is `Done` in `tickets/README.md`
