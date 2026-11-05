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

1. From an up-to-date `dev/upgrade-npm`, create branch `134-upgrade-vitest-4-1-12` and confirm `git status` is clean.
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

If an e2e test fails, run the same test on `dev/upgrade-npm` before blaming the upgrade. No e2e baseline was recorded for this plan.

**Security**

1. `npm run deps:audit`: compare with the table in Section 3 and confirm the expected packages are gone.
2. `npm run deps:audit:ci`: this stays red until #136 is merged, so before then treat its result as information only.

## 6. Acceptance Criteria

- [ ] `npm ls vitest @vitest/mocker` shows a single 4.1.12.
- [ ] `npm audit` no longer lists `vitest`, `@vitest/mocker`, `@vitest/browser` or the other Vitest packages.
- [ ] Coverage thresholds pass as they did before.

## 7. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #135, #136, #144, #148
- `vitest-canvas-mock` 1.2.0 feeds the Phaser project through `vitest-phaser.setup.ts`, so run the Phaser lane on its own too.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `134-upgrade-vitest-4-1-12` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/134-upgrade-vitest-4-1-12.md`.
3. In `tickets/README.md`, set #134 to `Done` and replace its link with plain `#134`.
4. Commit steps 2 and 3 together using `chore: #134 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/134-upgrade-vitest-4-1-12.md` deleted, so no ticket file is left, and #134 is `Done` in `tickets/README.md`
