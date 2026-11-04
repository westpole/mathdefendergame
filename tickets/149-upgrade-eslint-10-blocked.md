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

Upgrade `eslint` and `@eslint/js` to 10 once `eslint-plugin-react` supports it.

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

- [ ] `eslint-plugin-react` publishes a release with `^10` in its peer range ([#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977), [PR #4022](https://github.com/jsx-eslint/eslint-plugin-react/pull/4022)).
- [ ] Alternative needing a decision: replace it with `@eslint-react/eslint-plugin`. This changes the rule set, so assess it separately.

## 5. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `149-upgrade-eslint-10-blocked` and confirm `git status` is clean.
2. Run `npm ci`.
3. Check with `npm view eslint-plugin-react peerDependencies`.
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

If an e2e test fails, run the same test on `master` before blaming the upgrade. No e2e baseline was recorded for this plan.

**Security**

1. `npm run deps:audit`: compare with the table in Section 3 and confirm the expected packages are gone.
2. `npm run deps:audit:ci`: this stays red until #136 is merged, so before then treat its result as information only.

## 7. Manual Regression (Alpha Testing)

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

## 8. Acceptance Criteria

- [ ] `npm run lint` passes with zero warnings, without `--force` or a patched plugin.
- [ ] Lint config still covers the same files.

## 9. Dependencies & Risks

- **Blocked by:** #141
- **Blocks:** None
- JSX references are now tracked, which may add `no-unused-vars` reports.

## 10. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
