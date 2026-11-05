# [UPGRADE] #144 Upgrade Vitest to 5

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** #128 Audit npm dependencies
> **Estimate:** L
> **Branch:** `144-upgrade-vitest-5`
> **Data as of:** 2026-11-04

---

## 1. Summary

Move all Vitest packages from 4.1.12 to 5.1.0 and adapt the test config.

## 2. Why

- Vitest 4 is no longer the current major. There is no open advisory after #134, so this is planned maintenance and can follow the security work.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `vitest` | 4.1.12 (after #134) | 5.1.0 | Major |
| `@vitest/browser-playwright` | 4.1.12 (after #134) | 5.1.0 | Major |
| `@vitest/coverage-v8` | 4.1.12 (after #134) | 5.1.0 | Major |
| `@vitest/ui` | 4.1.12 (after #134) | 5.1.0 | Major |

**Out of scope:** any other package, and any feature or refactoring work.

**Breaking change assessment for this repo:**

| Change | Status here |
| --- | --- |
| `vi.mock` or `vi.hoisted` inside functions now throws | A search found no indented calls |
| `test.sequential` removed, `bench` rewritten | A search found no usage |
| Unawaited `resolves` and `rejects` now fail | May expose real test bugs. Fix them |
| `toHaveTextContent` strict in browser mode | Check Storybook play functions |
| Vitest UI needs a token | Use the printed URL for `test:ui` |

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `144-upgrade-vitest-5` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D vitest@^5.1.0 @vitest/browser-playwright@^5.1.0 @vitest/coverage-v8@^5.1.0 @vitest/ui@^5.1.0 --ignore-scripts`.
4. Read the [Vitest 5 migration guide](https://vitest.dev/guide/migration.html).
5. `vitest.config.ts`: replace `outputFile.html` with the `html` reporter's `outputDir` option, keeping output in `reports/unit-tests`.
6. Add `.vitest` to `.gitignore`, because Vitest 5 moves its artifacts there by default.
7. `clearMocks` now defaults to `true`, and the repo does not set it. If tests rely on mock calls carrying across tests, fix those tests. Set `clearMocks: false` only as a last resort.
8. Confirm `vitest-canvas-mock` and the setup files still work now that `globalThis` and `window` writes reach the DOM environment.
9. Inline projects now share one Vite server by default. Confirm `react()` and `storybookTest()` still apply only to the right projects, and use `sharedViteServer: false` only if they do not.
10. Review the coverage file list, because `coverage.exclude` matching changed.
11. Run `npm run docs:sync-current-stack`, then re-read `CLAUDE.md`. Update `.claude/skills/coverage-analysis` if report paths change.
12. Commit using `chore: #144 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:phaser`
4. `npm run test:react`
5. `npm run test:storybook`
6. `npm run test:electron`
7. `npm run test:store`
8. `npm run test:platform`
9. `npm run test:all`

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

- [ ] `npm ls vitest` shows a single 5.1.0.
- [ ] The test count is not lower than before the upgrade.
- [ ] Coverage thresholds pass and the covered file list has not shrunk unexpectedly.
- [ ] The HTML report is still written to `reports/unit-tests`.

## 7. Dependencies & Risks

- **Blocked by:** #130, #134, #135
- **Blocks:** None
- The `clearMocks` change can make tests pass for the wrong reason or fail in bulk. Investigate each failure rather than restoring the old default straight away.
- Check `@storybook/addon-vitest` against the installed version. Version 10.6.5 allows `vitest` `^4` or `^5`.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `144-upgrade-vitest-5` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/144-upgrade-vitest-5.md`.
3. In `tickets/README.md`, set #144 to `Done` and replace its link with plain `#144`.
4. Commit steps 2 and 3 together using `chore: #144 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/144-upgrade-vitest-5.md` deleted, so no ticket file is left, and #144 is `Done` in `tickets/README.md`
