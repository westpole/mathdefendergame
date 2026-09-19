---
name: coverage-analysis
description: "Instructions for running Vitest coverage, reading coverage-final.json, and targeting uncovered lines and branches to meet repo thresholds."
---

# Skill: Vitest Coverage Analysis & Gap Resolution

## Overview
Use this skill whenever tasked with increasing test coverage, hitting coverage thresholds, or finding untested code paths in the repository.

## Workflow

### 1. Run Coverage
Execute the Vitest coverage script to generate updated report artifacts:
```bash
npm run test:coverage
```

### 2. Inspect Missing Coverage Data
Do not read HTML files directly. Instead, inspect `./reports/coverage/coverage-final.json` or run a targeted summary parse.

  1. Locate the target source file entry in ./reports/coverage/coverage-final.json.

  2. Extract the unhit metrics from the JSON structure:
    - `s` (Statements): Keys with a value of 0 indicate unexecuted statements.
    - `f` (Functions): Keys with a value of 0 indicate uncalled functions.
    - `b` (Branches): Array values containing 0 indicate unexecuted conditional paths (e.g., if/else, switch cases, optional chaining ?., default parameter fallbacks).

  3. Cross-reference statement/branch IDs with the statementMap, fnMap, and branchMap objects in the same file entry to identify exact source code line and column numbers.

### 3. Target Uncovered Code Paths
For each identified line or branch gap:

  - Uncovered Branches (b): Identify the logical condition. Write a test case explicitly forcing the boolean opposite, nullish fallback, or default branch execution.

  - Uncovered Functions (f): Check for un-tested event handlers, callback props, lifecycle hooks, or utility helpers.

  - Uncovered Statements (s): Check for un-handled error boundaries, thrown exceptions, catch blocks, or early returns.

### 4. Author & Verify Tests

  1. Add test cases in the corresponding test file using Vitest assertions (expect(), vi.fn(), vi.spyOn()).

  2. Re-run coverage for the specific file to confirm resolution:

```sh
npx vitest run path/to/file.test.ts --coverage
```

  3. Confirm that missing lines/branches in ./reports/coverage/coverage-final.json are now cleared and metrics meet the required threshold.

## Vitest & JSON Parsing Reference Quick-Guide

- File path: `./reports/coverage/coverage-final.json`

- Structure example:

```json
{
  "/absolute/path/to/src/utils/math.ts": {
    "statementMap": { "0": { "start": { "line": 10, "column": 2 }, "end": { "line": 12, "column": 3 } } },
    "s": { "0": 0 }, // <-- Statement '0' at line 10 was hit 0 times
    "branchMap": { "0": { "loc": { ... }, "type": "if", "locations": [...] } },
    "b": { "0": [1, 0] } // <-- Branch index 1 was hit 0 times (uncovered else/false condition)
  }
}
```
