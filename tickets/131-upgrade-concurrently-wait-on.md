# [SECURITY] #131 Upgrade concurrently and wait-on

> **Ticket type:** Security
> **Status:** Ready for Dev
> **Priority:** P0
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `131-upgrade-concurrently-wait-on`
> **Data as of:** 2026-11-04

---

## 1. Summary

Upgrade the two tools behind `npm run dev:electron`. This removes a critical `shell-quote` advisory and the `axios`, `joi` and `follow-redirects` advisories.

## 2. Why

- `concurrently@10.0.3` pins `shell-quote` to exactly 1.8.4, so only a `concurrently` upgrade can fix it. Version 10.0.6 moves to 1.12.0.
- `wait-on@9.5.1` raises its minimums to `axios@^1.20.0` and `joi@^18.2.9`, which are the fixed lines.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `concurrently` | 10.0.3 | 10.0.6 | Patch |
| `wait-on` | 9.0.10 | 9.5.1 | Minor |

**Advisories closed by this ticket:**

| Package | Highest severity | Advisories | IDs |
| --- | --- | --- | --- |
| `shell-quote` | critical | 2 | GHSA-395f-4hp3-45gv, GHSA-pqg4-j6r4-53mv |
| `axios` | high | 12 | GHSA-vh66-26gq-q6x8, GHSA-9fr6-4gfg-395g, GHSA-c29m-xwm3-cm6r, and more |
| `joi` | high | 5 | GHSA-6w3j-5fw6-r9vr, GHSA-gg4h-3hg2-grpc, GHSA-wr44-6hxh-3jwq, and more |
| `follow-redirects` | high | 3 | GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c, GHSA-mrwp-f3q8-3g9p |

**Out of scope:** any other package, and any feature or refactoring work.

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `master`, create branch `131-upgrade-concurrently-wait-on` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D concurrently@^10.0.6 wait-on@^9.5.1 --ignore-scripts`.
4. If `follow-redirects` stays at 1.16.0 or 1.16.1 after the install, run `npm update follow-redirects --ignore-scripts`.
5. Commit using `chore: #131 <description>` when asked to commit.

## 5. Agent Validation

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

## 6. Manual Regression (Alpha Testing)

A person runs this on the PR branch before merge. Record the commit, OS, device and browser, and mark each row pass or fail. Add a screenshot for each failure.

Blocker: crash, blank screen, lost saved data, or gameplay that cannot continue. Do not merge with an open blocker. Log minor issues in the PR.

### A. Developer workflow

**Setup:** Stop any running dev servers first.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Run `npm run dev:electron` | Vite starts, then the Electron window opens only once `http://localhost:5173` responds. |
| [ ] | Change a visible string in a component, then undo it | The window updates through hot reload. |
| [ ] | Press Ctrl+C in the terminal | Both Vite and Electron stop, and port 5173 is free. |

### B. Web smoke (desktop browser)

**Setup:** Run `npm run dev:web` and open `http://localhost:5173`. Use a fresh private window so no old `localStorage` is reused.

| Done | Action | Expected result |
| --- | --- | --- |
| [ ] | Load the app | The loading screen clears and the login screen appears. No errors in the browser console. |
| [ ] | Create a profile and log in | The home screen opens and shows the new profile. |
| [ ] | Open Profile, Performance, Rules and Settings, returning home each time | Each screen renders fully, with no clipped or unstyled content. |
| [ ] | Reload the page | The app starts again without errors. |

## 7. Acceptance Criteria

- [ ] `npm ls shell-quote axios joi follow-redirects` shows shell-quote 1.12.0 or later, axios 1.20.0 or later, joi 18.3.1 or later and follow-redirects 1.16.2 or later.
- [ ] `npm audit` no longer lists those four packages.
- [ ] `npm run dev:electron` still starts and stops cleanly.

## 8. Dependencies & Risks

- **Blocked by:** #129
- **Blocks:** #136, #148
- Optional simplification: `wait-on` is only used to wait for one URL and accounts for 40 packages. A short `fetch` loop in `tools/` would remove `axios`, `joi` and `follow-redirects` for good. Raise it as a separate ticket if wanted, and keep this ticket a plain upgrade.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] Manual regression signed off by a person
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
