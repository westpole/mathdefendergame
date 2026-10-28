---
name: release-workflow
description: Use for Math Defender Game production releases, including preflight checks, version bump selection, release command execution, and HTML release report generation.
---

# Skill: Math Defender Game Release Workflow

## When to use this skill

Use this skill when a request includes:

- production release execution
- patch/minor/major version bump workflow
- changelog/tag/push release flow
- release validation and release reporting

Do not use this skill for unrelated feature development or debugging work.

## Inputs

- Release type: `patch`, `minor`, or `major`
- Optional release notes or constraints from the user

## Required assets

- Guard script: `.github/skills/release-workflow/scripts/release-guard.mjs`
- Report template: `.github/skills/release-workflow/assets/templates/prod-build-report-template.html`

## Workflow

1. **Confirm release type**
   - Require one of: `patch`, `minor`, `major`.
   - If missing or invalid, stop and ask for correction.

2. **Verify git state**
   - `git branch --show-current` must be `master`.
   - `git status --short` must be empty.
   - Run `git fetch`.
   - Verify local `master` is up to date with remote.
   - Stop at the first failing condition.

3. **Check release eligibility**
   - Run `npm run which:version` and report recommendation.
   - Ensure at least one releasable commit exists since the latest release tag.
   - Use `npm run release:guard` to enforce release checks.

4. **Run required checks in order**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:all`
   - Stop immediately if any check fails.

5. **Build artifacts**
   - Run web build first: `npm run build:web`
   - Run Windows build second: `npm run build:win`
   - Stop immediately if any build fails.

6. **Run exactly one release command**
   - `patch` → `npm run release:patch`
   - `minor` → `npm run release:minor`
   - `major` → `npm run release:major`

7. **Generate release report**
   - Remove old files in `reports/current-prod-build`.
   - Generate a new HTML report from the template asset.
   - Report must include:
     - commands executed
     - checks and outcomes
     - build status and build sizes
     - release outcome (commit/tag/push)
   - Build listing order:
     1) Primary build: web (`build` directory)
     2) Additional builds: Windows installer (`dist`, excluding `dist/win-unpacked`) and Windows portable (`dist/win-unpacked`)

## Output contract

- List exact commands executed in order.
- If blocked, report only the first blocking condition and stop.
- If successful, summarize:
  - release type used
  - resulting version bump
  - preflight/check/build results
  - commit/tag/push status
  - report output path
