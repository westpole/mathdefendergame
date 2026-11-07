# [UPGRADE] #151 Replace eslint-plugin-react with @eslint-react/eslint-plugin

> **Ticket type:** Upgrade
> **Status:** Ready for Dev
> **Priority:** P3
> **Epic:** #128 Audit npm dependencies
> **Estimate:** S
> **Branch:** `151-replace-eslint-plugin-react`
> **Data as of:** 2026-11-07

---

## 1. Summary

Replace `eslint-plugin-react` with `@eslint-react/eslint-plugin` while staying on ESLint 9, so #149 can move to ESLint 10.

## 2. Why

- `eslint-plugin-react@7.37.5` is still the latest release, and its peer range stops at ESLint `^9.7`. Its last release was in April 2025. This is the only package blocking #149.
- `@eslint-react/eslint-plugin@5.28.8` accepts any ESLint version (`eslint: "*"`) and is actively maintained.
- Option B in #149's Unblock Criteria. Chosen on 2026-11-07 instead of waiting for an upstream fix.
- Do this on ESLint 9, so the rule set change and the ESLint major upgrade land in separate branches.

## 3. Scope

| Package | Current | Target | Change |
| --- | --- | --- | --- |
| `eslint-plugin-react` | 7.37.5 | removed | Removed |
| `@eslint-react/eslint-plugin` | none | 5.28.8 | Added |

Files: `eslint.config.js`, `package.json`, `package-lock.json`.

**Out of scope:** any other package, ESLint itself (#149), and any feature or refactoring work. Keep `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. Both already accept ESLint 10.

**Trial run on 2026-11-07:** the `recommended-typescript` preset was run against `src` with the current config and ESLint 9.39.5, without changing dependencies.

- Result: 0 findings, with all 65 `@eslint-react` rules active. A probe file with a missing `key` was reported, so the rules did run.
- No code changes are expected. If new findings appear, the codebase or the preset has changed since this date.

**Rule set change for this repo:**

| Change | Status here |
| --- | --- |
| Preset grows from about 19 active `react/*` rules to 65 `@eslint-react/*` rules | Trial found 0 findings |
| `@eslint-react` hook rules overlap `eslint-plugin-react-hooks` | Turn off the overlapping `@eslint-react` rules (step 6) |
| `react/no-unescaped-entities` and `react/jsx-no-target-blank` have no equivalent in the preset | No `target="_blank"` in `src`. Accept the loss of `no-unescaped-entities` |
| `react/jsx-no-undef`, `react/jsx-no-duplicate-props` and `react/no-unknown-property` dropped | TypeScript already reports these |
| `react/prop-types: 'off'` override | Remove it, because the new plugin has no such rule |
| `settings.react.version` | Remove it. The preset sets `settings['react-x']` itself |

## 4. Agent Implementation Steps

Follow the rules in `.claude/skills/npm-upgrade/SKILL.md`. A person starts that skill with `/npm-upgrade`. Never use `--force` or `--legacy-peer-deps`, and stop and ask if peer dependencies conflict.

1. From an up-to-date `dev/upgrade-npm`, create branch `151-replace-eslint-plugin-react` and confirm `git status` is clean.
2. Run `npm ci`.
3. Run `npm install -D @eslint-react/eslint-plugin@^5.28.8 --ignore-scripts`.
4. Run `npm uninstall eslint-plugin-react --ignore-scripts`.
5. In `eslint.config.js`:
   - Replace `import reactPlugin from 'eslint-plugin-react'` with `import eslintReact from '@eslint-react/eslint-plugin'`.
   - In the `src/**/*.{ts,tsx}` block, replace `react: reactPlugin` in `plugins` with `...eslintReact.configs['recommended-typescript'].plugins`.
   - Remove the `settings.react` block.
   - Replace the `reactPlugin.configs.recommended.rules` and `reactPlugin.configs['jsx-runtime'].rules` spreads with `...eslintReact.configs['recommended-typescript'].rules`.
   - Remove `'react/prop-types': 'off'`.
6. Keep `eslint-plugin-react-hooks` as the only source of hook rules, so hook behavior does not change. Directly after the `@eslint-react` rules spread, set these overlapping rules to `'off'`:
   - `@eslint-react/rules-of-hooks`
   - `@eslint-react/exhaustive-deps`
   - `@eslint-react/error-boundaries`
   - `@eslint-react/purity`
   - `@eslint-react/set-state-in-effect`
   - `@eslint-react/set-state-in-render`
   - `@eslint-react/static-components`
   - `@eslint-react/unsupported-syntax`
   - `@eslint-react/use-memo`

   Do not use the `disable-conflict-eslint-plugin-react-hooks` preset. It turns off the `react-hooks/*` rules instead, which changes hook behavior.
7. Confirm with `npx eslint --print-config src/App.tsx` that no `react/*` rules remain, the `@eslint-react/*` rules are active, and the `react-hooks/*` rules are unchanged.
8. Search for `eslint-plugin-react` in `docs/`, `.claude/` and `package.json`, and update any reference outside `package-lock.json`. Do not edit `.github/copilot-instructions.md`, `.github/agents/**` or `.github/skills/**/SKILL.md`.
9. Commit using `chore: #151 <description>` when asked to commit.

## 5. Agent Validation

Run in this order. If a step fails, fix it and restart from step 1, with up to 3 attempts. After that, stop and write a diagnostic report.

**Static checks and unit tests**

1. `npm run typecheck`
2. `npm run lint`
3. `npm run quality:unused`: confirm `eslint-plugin-react` is not reported, and no new unused files or dependencies appear
4. `npm run test:all`

Expected: all pass. The baseline on 2026-11-07 was 536 of 536 tests passing across 61 files.

Known flake: `src/game/scenes/__tests__/UIScene.test.ts` > "creates the Phaser game once and reuses the singleton" can time out at 5000 ms. If it is the only failure and it fails the same way, record it as existing noise. Any other failure counts as a regression.

**Build**

1. `npm run build:web`, which also runs the full test suite.
2. If only the known flake stops it, run `npx vite build` and record that in the PR.

**Security**

1. `npm run deps:audit:ci`: must pass. The baseline on 2026-11-07 was 15 moderate advisories and no high or critical ones.

End-to-end tests are not needed, because only lint tooling changes.

## 6. Acceptance Criteria

- [ ] `npm ls eslint-plugin-react` shows nothing.
- [ ] `npm run lint` passes with zero warnings, without new `eslint-disable` comments.
- [ ] Lint config still covers the same files.
- [ ] `react-hooks/*` and `react-refresh/*` rules behave as before.
- [ ] `npm view @eslint-react/eslint-plugin@<installed> peerDependencies` allows ESLint 10.

## 7. Dependencies & Risks

- **Blocked by:** None. #141 is `Done`.
- **Blocks:** #149
- The preset may add rules in later 5.x releases. Keep the `^5.28.8` range, and treat new findings after an update as normal lint work.
- The hook overlap list in step 6 matches 5.28.8. If the installed version differs, compare it with the `disable-conflict-eslint-plugin-react-hooks` preset and adjust.

## 8. Close the Ticket

Do these in order, once Agent Validation passes.

1. Merge `151-replace-eslint-plugin-react` into `dev/upgrade-npm`.
2. On `dev/upgrade-npm`, delete `tickets/151-replace-eslint-plugin-react.md`.
3. In `tickets/README.md`, set #151 to `Done` and replace its link with plain `#151`.
4. In `tickets/149-upgrade-eslint-10-blocked.md`, tick the Unblock Criteria and set its status to `Ready for Dev`. Set #149 to `Ready` in `tickets/README.md`.
5. Commit steps 2 to 4 together using `chore: #151 close ticket`.

## 9. Definition of Done

- [ ] Acceptance criteria met
- [ ] Agent validation passed, with any known flake recorded
- [ ] `package-lock.json` committed with `package.json`
- [ ] `code-reviewer` agent run before committing
- [ ] PR uses the output format from the `npm-upgrade` skill
- [ ] Ticket branch merged into `dev/upgrade-npm`
- [ ] `tickets/151-replace-eslint-plugin-react.md` deleted, so no ticket file is left, and #151 is `Done` in `tickets/README.md`
- [ ] #149 is `Ready` in `tickets/README.md`
