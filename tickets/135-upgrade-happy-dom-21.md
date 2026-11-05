# [SECURITY] #135 Upgrade happy-dom to 21

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `135-upgrade-happy-dom-21`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade happy-dom to 21.0.4. This is the only way to clear its high advisories, because no 20.x release contains all the fixes.

## 2. Why

- Every happy-dom release through 21.0.3 is affected by at least one advisory, so 21.0.4 is the minimum safe version. It is used only as a test environment and never ships.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `happy-dom` | 20.11.0 | 21.0.4 | Major |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `happy-dom` | high | 3 | GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8, GHSA-5fpq-26gf-qwcr |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `135-upgrade-happy-dom-21` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D happy-dom@^21.0.4 --ignore-scripts`.
4. Version 21 turns off CSS file and iframe page loading by default. A search of `src` found no `<link>` or `<iframe>` usage, so no settings change is expected.
5. If a test does depend on them, set `enableCSSFileLoading` or `enableIframePageLoading` only for that test. Do not enable them globally.
6. Four Vitest projects use happy-dom: `react`, `platform`, `store` and `shared`.
7. Commit using `chore: #135 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:react`
4. `npm run test:store`
5. `npm run test:platform`
6. `npm run test:all`

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

- [ ] `npm ls happy-dom` shows 21.0.4 or later.
- [ ] `npm audit` no longer lists `happy-dom`.

## 7. Dependencies & Risks

- **Blocked by:** #134
- **Blocks:** #136, #144, #148

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `135-upgrade-happy-dom-21` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/135-upgrade-happy-dom-21.md`.
3. In `tickets/README.md`, set #135 to `Done` and replace its link with plain `#135`.
4. Commit steps 2 and 3 together using `chore: #135 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/135-upgrade-happy-dom-21.md` deleted, so no ticket file is left, and #135 is `Done` in `tickets/README.md`
