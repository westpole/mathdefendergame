# [SECURITY] #132 Upgrade Electron to 42.11.18 and electron-builder to 26.18.0

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P0
> **Epic:** #128 Audit npm dependencies
> **Estimate:** M
> **Branch:** `132-upgrade-electron-42-11-electron-builder`
> **Data as of:** 2026-11-04

---

## 1. Summary

Take the last Electron 42 patch and the latest electron-builder. This is the fastest way to fix the runtime that actually ships to players.

## 2. Why

- Electron is the highest-value fix here. `npm audit --omit=dev` reports 0 only because `electron` is a dev dependency, as electron-builder requires, yet it ships inside the installer.
- Electron 42 reached end of life on 2026-10-20, so 42.11.18 is a stopgap. #143 moves to a supported major.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `electron` | 42.5.0 | 42.11.18 | Minor |
| `electron-builder` | 26.15.3 | 26.18.0 | Minor |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `electron` | high | 14 | GHSA-r4w5-6pfg-jxp5, GHSA-hq2x-r82h-9wj4, GHSA-gr2m-v5gq-v685, and more |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `132-upgrade-electron-42-11-electron-builder` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D electron@^42.11.18 electron-builder@^26.18.0 --ignore-scripts`.
4. The `electron` package has no install script. After installing, run `npx install-electron`, then confirm that `node_modules/electron/dist/version` shows 42.11.18.
5. Do not change the `webPreferences` security settings in `electron/main.ts`.
6. Commit using `chore: #132 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:electron`
4. `npm run test:all`

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

- [ ] `npm ls electron electron-builder` shows 42.11.18 and 26.18.0.
- [ ] `npm audit` no longer lists `electron`.
- [ ] The packaged installer builds and runs.

## 7. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #136, #143, #148
- Moderate advisories through `app-builder-lib` stay. `app-builder-lib@26.18.0` still pins `@electron/asar@3.4.1`, which depends on `minimatch@^3`. This is an expected leftover.
- Several Electron 45 behaviour changes were backported to 42.11.3, so this is not a no-op. The app has no preload script or workers, so none are expected to affect it.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `132-upgrade-electron-42-11-electron-builder` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/132-upgrade-electron-42-11-electron-builder.md`.
3. In `tickets/README.md`, set #132 to `Done` and replace its link with plain `#132`.
4. Commit steps 2 and 3 together using `chore: #132 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/132-upgrade-electron-42-11-electron-builder.md` deleted, so no ticket file is left, and #132 is `Done` in `tickets/README.md`
