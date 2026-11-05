# [MAINTENANCE] #140 Upgrade the i18next packages

> **Ticket type:** Maintenance
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `140-upgrade-i18next-group`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade `i18next`, its language detector and `react-i18next` together.

## 2. Why

- All three ship in the app and interact closely. Language detection order and saved language are the main risks.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `i18next` | 26.5.11 | 26.7.1 | Minor |
| `i18next-browser-languagedetector` | 8.2.3 | 8.3.0 | Minor |
| `react-i18next` | 17.1.9 | 17.1.12 | Patch |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `140-upgrade-i18next-group` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install i18next@^26.7.1 i18next-browser-languagedetector@^8.3.0 react-i18next@^17.1.12 --ignore-scripts`.
4. Review `src/i18n/config.ts` against any option deprecations shown in the console.
5. Language resources are typed from the JSON files, so fix any new type errors properly.
6. Commit using `chore: #140 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:react`
4. `npm run test:all`

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

- [ ] English and Ukrainian both load.
- [ ] The `math-defender-language` key still controls the saved language, which e2e fixtures rely on.

## 7. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** None
- Missing translations can fail silently and show raw keys, so check for raw keys during the final manual test on `dev/upgrade-npm`.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `140-upgrade-i18next-group` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/140-upgrade-i18next-group.md`.
3. In `tickets/README.md`, set #140 to `Done` and replace its link with plain `#140`.
4. Commit steps 2 and 3 together using `chore: #140 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/140-upgrade-i18next-group.md` deleted, so no ticket file is left, and #140 is `Done` in `tickets/README.md`
