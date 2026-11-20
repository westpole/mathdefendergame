---
name: coverage-analysis
description: Use when asked to raise Vitest coverage, fix a failing coverage threshold, or find untested code paths. Locates uncovered statements, branches, and functions from coverage-final.json, then hands test writing to the layer's unit-test skill. Do not use for Playwright e2e coverage or type coverage (npm run types:coverage).
---

# Skill: Vitest Coverage Analysis & Gap Resolution

## Overview

This skill finds coverage gaps and checks they are closed. Write the tests themselves with the skill for the file's layer:

| Source path | Test lane | Test-writing skill |
| --- | --- | --- |
| `src/ui/**`, `src/App.tsx` | `--project=react` | `react-unit-tests` |
| `src/game/**` | `--project=phaser` | `phaser-unit-tests` |
| `src/store/**` | `--project=store` | `zustand-unit-tests` |
| `electron/**` | `--project=electron` | `electron-unit-tests` |
| `src/platform/**` | `--project=platform` | (follow nearby tests) |

## Windows: run Vitest from the uppercase drive

From a lowercase `e:\` cwd, tests that `import ... from 'vitest'` can fail (two module instances). Run every Vitest command through cmd with the uppercase path:

```sh
cmd //c "cd /d E:\Dev\personal\mathDefenderGame && npm run test:all:coverage"
```

## Guardrails

Never do these to make a threshold pass:

- lower values in `coverage.thresholds`;
- add files to `coverage.exclude`;
- add `/* v8 ignore */` (or `istanbul ignore`) comments;
- write tests that execute lines without asserting behavior.

If code is truly unreachable, report it to the user instead of hiding it.

## Thresholds

Thresholds live in `defaultCoverageThresholds` in `vitest.config.ts` and differ by glob. Read the file for current values; at the time of writing:

- global fallback: 60% for all metrics;
- `src/ui/**`, `src/App.tsx`: 90 / 85 branches;
- `src/utilities/**`: 100;
- `src/game/**`: 95 statements, 90 branches, 100 functions;
- `src/game/scenes/**`: 20;
- `electron/**`: 90;
- `src/store/**`: 90 branches.

A run with `--project=electron` swaps in `electronCoverageThresholds` (90 everywhere).

## Workflow

### 1. Baseline (full suite, once)

```sh
cmd //c "cd /d E:\Dev\personal\mathDefenderGame && npm run test:all:coverage"
```

This runs every project, including the Storybook browser tests (needs Playwright Chromium), so it is slow. The console `text` table flags failing thresholds and has an "Uncovered Line #s" column. Use it to pick target files, then work with scoped runs (step 4).

Every unit lane script (`test:react`, `test:phaser`, `test:store`, `test:platform`, `test:electron`, `test:all`) collects coverage too. A lane run measures only its own layers (the `projectCoverageInclude` map in `vitest.config.ts`) and overwrites `coverage-final.json` with just those files, so a fresh lane report is enough when the gaps are all inside that lane.

### 2. List gaps for a file

Report: `reports/unit-tests/coverage/coverage-final.json` (not the HTML). Use the helper instead of hand-parsing:

```sh
node .claude/skills/coverage-analysis/scripts/uncovered.mjs src/ui/components/HUDOverlay/InputPanel.tsx
```

It prints each unhit statement, branch path, and function with its line number. Keys in the JSON are absolute Windows paths (`E:\Dev\...\electron\main.ts`), so the script matches on a normalized path suffix.

### 3. Target the gaps

Read the source at each reported line, then:

- **Branches**: force the opposite outcome. Types you may see:
  - `if`: the else / false side;
  - `cond-expr`: the other side of `a ? b : c`;
  - `binary-expr`: short-circuit `&&`, `||`, `??` (path #1 is the right-hand operand);
  - `default-arg`: call without the argument;
  - `switch`: the missing case or `default`.
- **Functions**: event handlers, callback props, lifecycle hooks, cleanup functions, helpers.
- **Statements**: catch blocks, thrown errors, early returns, error boundaries.

Write the tests with the layer's skill from the table above.

### 4. Verify with a scoped run

Run only the owning project and measure only the target file:

```sh
cmd //c "cd /d E:\Dev\personal\mathDefenderGame && npx vitest run src/ui/components/HUDOverlay --project=react --coverage --coverage.include=src/ui/components/HUDOverlay/InputPanel.tsx"
```

- `--coverage.include` limits measurement to the target, so other files the tests load don't fail thresholds. The target's glob threshold still applies, which is the check you want.
- Re-run the step 2 script to confirm the gaps are gone.
- A scoped run overwrites `coverage-final.json` (Vitest cleans the coverage directory), so the report then holds only the target file. To list gaps in other files afterwards, re-run the step 1 baseline, or copy the baseline report before scoped runs and pass the copy as the script's second argument.
- Finish with the narrowest lane (`npm run test:react`, etc.), and `npm run test:all:coverage` if the change crossed layers.

## coverage-final.json reference

Per-file entry (istanbul format produced by `@vitest/coverage-v8`):

```jsonc
{
  "E:\\Dev\\personal\\mathDefenderGame\\src\\utils\\math.ts": {
    "statementMap": { "0": { "start": { "line": 10, "column": 2 }, "end": { "line": 12, "column": 3 } } },
    "s": { "0": 0 },          // statement 0 (line 10) hit 0 times
    "fnMap": { "0": { "name": "add", "loc": { "start": { "line": 9 } } } },
    "f": { "0": 3 },          // function 0 called 3 times
    "branchMap": { "0": { "type": "if", "loc": { }, "locations": [ { }, { } ] } },
    "b": { "0": [1, 0] }      // branch 0: path #1 (else / false) never taken
  }
}
```
