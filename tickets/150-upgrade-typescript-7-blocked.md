# [UPGRADE] #150 Upgrade TypeScript to 7

> **Ticket type:** Upgrade
> **Status:** Blocked
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** L
> **Branch:** `150-upgrade-typescript-7-blocked`
> **Data as of:** 2026-11-04

---

## 1. Summary

Adopt TypeScript 7 once the tools that use the compiler API support it.

## 2. Why

- `typescript-eslint@8.72.1` requires `typescript` below 6.1.0.
- TypeScript 7.0 ships no JS compiler API. The announcement expects a new, different API in 7.1.
- `type-coverage` and the Storybook docgen plugin are also likely to need that API. That is an inference from how they work, so confirm it when this ticket is picked up.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `typescript` | 6.0.3 | 7.0.2 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Unblock Criteria

Do not start until these are met:

- [ ] TypeScript 7.1 or later ships its API.
- [ ] `typescript-eslint` publishes a peer range that includes 7.
- [ ] `type-coverage` and `@storybook/react-vite` docgen work with it.

## 5. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `150-upgrade-typescript-7-blocked` and confirm `git status` is clean.
2. Run `npm ci`.
3. Check with `npm view typescript-eslint peerDependencies`.
4. Read the [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
5. Current `tsconfig.json` sets `strict` and `types` explicitly and uses `moduleResolution: bundler`, so the changed defaults and hard errors listed there are not expected to apply. Re-check when picked up.
6. Run `npm run docs:sync-current-stack` only if that stack list starts to include TypeScript.
7. Run `npm install -D typescript@^7.0.2 --ignore-scripts`.
8. Commit using `chore: #150 <description>` when asked to commit.

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

## 7. Manual Regression (Alpha Testing)

A person runs this on the PR branch before merge. Record the commit, OS, device and browser, and mark each row pass or fail. Add a screenshot for each failure.

Blocker: crash, blank screen, lost saved data, or gameplay that cannot continue. Do not merge with an open blocker. Log minor issues in the PR.

### A. Storybook

**Setup:** Run `npm run storybook` and open `http://localhost:6006`.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Open HUDOverlay, HomeOverlay, GameOverOverlay and SettingsOverlay stories | Each renders with seeded state and no error panel. |
| [ ] | Switch between the desktop and mobile stories for one component | The layout changes as it did before the upgrade. |
| [ ] | Open the Accessibility panel on one story | The panel loads and lists results. |
| [ ] | Open the Docs page for one component | The docs page renders. |
| [ ] | Run `npm run build-storybook` | The build finishes without errors. |

### B. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

## 8. Acceptance Criteria

- [ ] `npm run typecheck` passes on TypeScript 7.
- [ ] Lint, `types:coverage` and Storybook docs all still work.

## 9. Dependencies & Risks

- **Blocked by:** #141, #147
- **Blocks:** None
- Earlier option, if faster type checks become worthwhile: the announcement supports a side-by-side setup, with `typescript` aliased to `@typescript/typescript6` for tools and `@typescript/native` for `tsc`. It adds complexity and is not recommended for now.

## 10. Close the Ticket

Do these in order, once Agent Validation and Manual Regression pass with no open blocker.

1. Merge `150-upgrade-typescript-7-blocked` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/150-upgrade-typescript-7-blocked.md`.
3. In `tickets/README.md`, set #150 to `Done` and replace its link with plain `#150`.
4. Commit steps 2 and 3 together using `chore: #150 close ticket`.

## 11. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/150-upgrade-typescript-7-blocked.md` deleted, so no ticket file is left, and #150 is `Done` in `tickets/README.md`
