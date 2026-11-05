# [MAINTENANCE] #138 Upgrade React to 19.3 with types and Testing Library

> **Ticket type:** Maintenance
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** M
> **Branch:** `138-upgrade-react-19-3`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade React, its types and the Testing Library companions together, because these versions need to stay aligned.

## 2. Why

- React owns every overlay in the app and this is a minor runtime upgrade, so it needs a full UI pass.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `react` | 19.2.7 | 19.3.1 | Minor |
| `react-dom` | 19.2.7 | 19.3.1 | Minor |
| `@types/react` | 19.2.17 | 19.3.0 | Minor |
| `@types/react-dom` | 19.2.3 | 19.3.0 | Minor |
| `@testing-library/react` | 16.3.2 | 16.3.3 | Patch |
| `@testing-library/user-event` | 14.6.1 | 14.6.8 | Patch |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `138-upgrade-react-19-3` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install react@^19.3.1 react-dom@^19.3.1 --ignore-scripts`.
4. Run `npm install -D @types/react@^19.3.0 @types/react-dom@^19.3.0 @testing-library/react@^16.3.3 @testing-library/user-event@^14.6.8 --ignore-scripts`.
5. Keep `react` and `react-dom` on the same version.
6. Fix any new type errors from `@types/react` 19.3 at the call site. Do not add `any` or suppressions.
7. Watch the test output for new `act()` and deprecation warnings.
8. Commit using `chore: #138 <description>` when asked to commit.

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

## 6. Acceptance Criteria

- [ ] `npm ls react react-dom` shows a single 19.3.1.
- [ ] No new console warnings appear in the app or the test output.

## 7. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #146
- Effect timing changes can show up as Zustand and Phaser sync issues, which `e2e/integration` covers.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `138-upgrade-react-19-3` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/138-upgrade-react-19-3.md`.
3. In `tickets/README.md`, set #138 to `Done` and replace its link with plain `#138`.
4. Commit steps 2 and 3 together using `chore: #138 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/138-upgrade-react-19-3.md` deleted, so no ticket file is left, and #138 is `Done` in `tickets/README.md`
