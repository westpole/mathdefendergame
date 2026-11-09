---
name: release-workflow
description: Use for Math Defender Game production releases. Runs the scripted release pipeline (preflight, checks, builds, version bump, JSON report). Do not use this skill for unrelated feature development or debugging work.
argument-hint: "[optional: dry run | no push | release notes]"
disable-model-invocation: true
allowed-tools: Read, Bash(npm run release:run:*)
---

# Skill: Math Defender Game Release Workflow

The whole release is scripted in `npm run release:run` (`.claude/skills/release-workflow/scripts/release.mjs`). Your job is to run it once and relay the outcome. Do not run release steps by hand, retry failed steps, or edit source files.

User arguments: $ARGUMENTS

## Run

1. Choose flags from the arguments:
   - "dry run", "test", "don't release" → `--dry-run` (checks and builds only; git preflight failures become warnings)
   - "stop before pushing", "no push", "local only" → `--no-push`
   - otherwise no flags (full release, including push)
2. Run exactly one command: `npm run release:run -- [flags]`
3. Do not run anything else. The script decides the bump with `which:version`, then stops at the first failure.

## What the script does, in order

`bump` → `git-branch` (master) → `git-clean` → `git-sync` (fetch, not ahead or behind) → `guard` (releasable commits since the last tag) → `lint` → `typecheck` → `test-all` → `build-web` → `build-win` (stamped with the next version) → `release` (`npm run release:<bump>`) → verify the version, tag, and push.

## Reading the result

- The console prints one `[status] step (time) - message` line per step, then `RESULT <status> [step=<id>] report=<path>`.
- A non-zero exit code means the release failed. Report only the failed step, its message, and the log excerpt the script printed. Then stop.
- Read `reports/current-prod-build/release-report.json` only if you need detail the console did not give.
- Full command output lives in `reports/current-prod-build/logs/<step>.log`. Read a log only when the printed excerpt is not enough.

## Output to the user

- On failure: the failed step, its reason, and the log path.
- On success: release type, `previous → next` version, tag, commit, push status, and a one-line check/build summary.
- Always close with: "View the report: `npm run release:report` → http://localhost:4784".
