# [UPGRADE] #145 Upgrade @vitejs/plugin-react to 6

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `145-upgrade-vite-plugin-react-6`
> **Data as of:** 2026-11-04

---

## 1. Summary

Move to the Vite 8 native version of the React plugin, which removes Babel from this plugin.

## 2. Why

- Version 6 drops Babel and supports only Vite 8, which the repo already uses. `react()` is called with no options in `vite.config.ts` and `vitest.config.ts`, so no config change is expected.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `@vitejs/plugin-react` | 5.2.0 | 6.2.1 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `145-upgrade-vite-plugin-react-6` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D @vitejs/plugin-react@^6.2.1 --ignore-scripts`.
4. Confirm no `babel` option is passed to `react()` in either config.
5. Confirm Fast Refresh still works in `npm run dev:web`.
6. Commit using `chore: #145 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:react`
4. `npm run test:store`
5. `npm run test:storybook`
6. `npm run test:all`

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

- [ ] `npm ls @vitejs/plugin-react` shows 6.2.1.
- [ ] Production and e2e builds both succeed.
- [ ] Hot reload keeps component state on a simple edit.

## 7. Dependencies & Risks

- **Blocked by:** #133
- **Blocks:** None
- Babel may stay in the lockfile through other packages, which is fine.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `145-upgrade-vite-plugin-react-6` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/145-upgrade-vite-plugin-react-6.md`.
3. In `tickets/README.md`, set #145 to `Done` and replace its link with plain `#145`.
4. Commit steps 2 and 3 together using `chore: #145 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/145-upgrade-vite-plugin-react-6.md` deleted, so no ticket file is left, and #145 is `Done` in `tickets/README.md`
