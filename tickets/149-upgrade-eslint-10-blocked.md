# [UPGRADE] #149 Upgrade ESLint to 10

> **Ticket type:** Upgrade
> **Status:** Blocked
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** M
> **Branch:** `149-upgrade-eslint-10-blocked`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade `eslint` and `@eslint/js` to 10 once #151 has replaced `eslint-plugin-react`.

## 2. Why

- `eslint-plugin-react@7.37.5` is the latest release and its peer range stops at `^9.7`. Installing would need `--force`, which the upgrade rules forbid.
- It also fails at runtime. Reports show `contextOrFilename.getFilename is not a function` on load with ESLint 10. The maintainer said on 2026-06-11 to stay on ESLint 9. The fix, PR #4022, was still open when checked.
- There is no security reason to rush: ESLint 10 still uses a vulnerable `minimatch` range.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `eslint` | 9.39.5 | 10.14.0 | Major |
| `@eslint/js` | 9.39.5 | 10.0.1 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Unblock Criteria

Do not start until these are met:

- [ ] #151 is `Done`: `eslint-plugin-react` is replaced with `@eslint-react/eslint-plugin`, which accepts any ESLint version.

Decision on 2026-11-07: replace the plugin (#151) instead of waiting for an `eslint-plugin-react` release with `^10` in its peer range ([#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977), [PR #4022](https://github.com/jsx-eslint/eslint-plugin-react/pull/4022)). On that date, 7.37.5 was still the latest release.

## 5. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `149-upgrade-eslint-10-blocked` and confirm `git status` is clean.
2. Run `npm ci`.
3. Confirm `npm ls eslint-plugin-react` shows nothing, and check `npm view @eslint-react/eslint-plugin peerDependencies`, `npm view eslint-plugin-react-hooks peerDependencies` and `npm view eslint-plugin-react-refresh peerDependencies` all allow ESLint 10.
4. Read the [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0).
5. Handle the three new recommended rules: `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`.
6. Remove `/* eslint-env node */` from `tools/sync-current-stack.mjs`, because these comments are now errors.
7. Check that `--ext` in the `lint*` scripts still works. The migration guide does not cover it, so confirm against the CLI docs.
8. Run `npm install -D eslint@^10.14.0 @eslint/js@^10.0.1 --ignore-scripts`.
9. Commit using `chore: #149 <description>` when asked to commit.

## 6. Agent Validation

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

## 7. Acceptance Criteria

- [ ] `npm run lint` passes with zero warnings, without `--force` or a patched plugin.
- [ ] Lint config still covers the same files.

## 8. Dependencies & Risks

- **Blocked by:** #141, #151
- **Blocks:** None
- JSX references are now tracked, which may add `no-unused-vars` reports.

## 9. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `149-upgrade-eslint-10-blocked` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/149-upgrade-eslint-10-blocked.md`.
3. In `tickets/README.md`, set #149 to `Done` and replace its link with plain `#149`.
4. Commit steps 2 and 3 together using `chore: #149 close ticket`.

## 10. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/149-upgrade-eslint-10-blocked.md` deleted, so no ticket file is left, and #149 is `Done` in `tickets/README.md`
