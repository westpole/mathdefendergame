---
name: release-workflow
description: Use for Math Defender Game production releases. Runs the release pipeline step by step (preflight, checks, builds, version bump) and writes the JSON release report. Do not use this skill for unrelated feature development or debugging work.
argument-hint: "[optional: dry run | no push | release notes]"
disable-model-invocation: true
allowed-tools: Read, Write(./reports/current-prod-build/**), Bash(npm run:*), Bash(git branch:*), Bash(git status:*), Bash(git fetch:*), Bash(git rev-list:*), Bash(git rev-parse:*), Bash(git describe:*), Bash(git ls-remote:*), Bash(date:*), Bash(du:*), Bash(find:*), Bash(tail:*), Bash(mkdir -p reports/current-prod-build/logs), Bash(rm -rf reports/current-prod-build), Bash(rm -rf dist)
---

# Skill: Math Defender Game Release Workflow

You are the release agent for Math Defender Game. You run the release steps yourself, in order, and keep one JSON result file up to date: `reports/current-prod-build/release-report.json`. The report viewer (`npm run release:report`) reads that file.

User arguments: $ARGUMENTS

## Rules

1. Release work is high risk. Stop at the first failed step. Do not retry failed steps or work around them.
2. Run commands from the repo root. Use the existing npm scripts only; do not invent release commands.
3. Do not edit source files. The only files you write are under `reports/current-prod-build/`.
4. Never ask the user for a version number or bump. The bump comes from `npm run which:version`.
5. On Windows, the working directory's drive letter must be uppercase. A lowercase `e:` makes Vitest load modules twice, which fails `test-all`. Git Bash paths (`/e/...`) are fine.

## Options

Choose the options from the arguments:

- "dry run", "test", "don't release" → `dryRun: true`. Run preflight, checks, and builds, and skip the release step. Git preflight failures (`git-branch`, `git-clean`, `git-sync`, `guard`) become `warning` and do not stop the run.
- "stop before pushing", "no push", "local only" → `noPush: true`.
- Otherwise: a full release, including the push.

## Report file

Start from `.claude/skills/release-workflow/assets/release-report.template.json`. Write the whole file with the Write tool **after every step**, so it is always current, including when the run stops early.

- Top level: `startedAt` / `finishedAt` are ISO timestamps (`date -u +%Y-%m-%dT%H:%M:%S.%3NZ`). `durationMs` is the time from `startedAt` to now. `status` is `running`, then one of `success`, `failed`, `dry-run`, or `dry-run-with-warnings`. `failedStep` is the id of the failed step, or `null`.
- `git`: `branch` (`git branch --show-current`), `commit` (`git rev-parse --short HEAD`), `latestTag` (`git describe --tags --abbrev=0`).
- `releaseType`, `previousVersion` (the `version` in `package.json` before the release), `nextVersion` (computed from the bump).
- Each `steps[]` entry: `{ "id", "label", "command", "status", "durationMs", "message", "log" }`.
  - `status`: `passed`, `failed`, `warning`, or `skipped`.
  - `message`: a short result (`"minor: 1.5.0 -> 1.6.0"`, `"clean"`, `"exit code 1: <last log line>"`), or `null`.
  - `log`: a repo-relative log path, or `null` for git-only steps.
- Each `builds[]` entry: `{ "id", "label", "role", "path", "sizeBytes", "fileCount" }`. The installer entry also has `files` (an array of file names).
- `release`: `{ "performed", "version", "tag", "tagCreated", "commit", "pushed" }`.

### Running and timing a logged step

For npm steps, send output to the step log and capture the exit code and duration in one call:

```bash
s=$(date +%s%3N); <command> > reports/current-prod-build/logs/<id>.log 2>&1; c=$?; echo "exit=$c ms=$(( $(date +%s%3N) - s ))"; tail -n 40 reports/current-prod-build/logs/<id>.log
```

A non-zero exit code means the step failed. Its `message` is `exit code <n>: <last non-empty log line>`.

## Pipeline

0. **Reset**: `rm -rf reports/current-prod-build`, then `mkdir -p reports/current-prod-build/logs`. Write the initial report: `status: "running"`, `startedAt`, `options`, `previousVersion`.

| # | id | label | command | passes when |
|---|----|-------|---------|-------------|
| 1 | `bump` | Determine release bump | `npm run --silent which:version` (logged) | The last output line is `patch`, `minor`, or `major`. Set `releaseType` and `nextVersion`. |
| 2 | `git-branch` | Branch is master | `git branch --show-current` | The output is `master`. Also fill in `git.branch` and `git.commit`. |
| 3 | `git-clean` | Worktree is clean | `git status --porcelain` | The output is empty (`message: "clean"`). |
| 4 | `git-sync` | Up to date with remote | `git fetch && git rev-list --left-right --count HEAD...@{u}` | Run `git fetch --quiet`, then the rev-list. Passes when ahead and behind are both `0` (`message: "in sync"`). |
| 5 | `guard` | Releasable commits since latest tag | `npm run release:guard` (logged) | Exit code 0. Fill in `git.latestTag` first. |
| 6 | `lint` | Lint | `npm run lint` (logged) | Exit code 0. |
| 7 | `typecheck` | Typecheck | `npm run typecheck` (logged) | Exit code 0. |
| 8 | `test-all` | Unit tests | `npm run test:all` (logged) | Exit code 0. |
| 9 | `build-web` | Web build | `npm run build:web:bundle` (logged) | Exit code 0. |
| 10 | `build-win` | Windows build | `rm -rf dist`, then `npm run build:win:package -- -c.extraMetadata.version=<nextVersion>` (logged) | Exit code 0. |
| 11 | `release` | Version bump, changelog, commit, tag, push | `npm run release:<releaseType>` (logged) | See step 11. |

Steps 2–5 use `warning` instead of `failed` in a dry run.

### After step 10: collect builds

Fill in `builds` for each output that exists. List the primary build first.

- `web`, label "Web", role `primary`, path `build`. `sizeBytes`: `du -sb build | cut -f1`. `fileCount`: `find build -type f | wc -l`.
- `win-installer`, label "Windows installer", role `additional`, path `dist`. Count only the top-level files: `find dist -maxdepth 1 -type f -printf '%s %f\n'`. Sum the sizes, count the files, and list the names in `files`.
- `win-portable`, label "Windows portable", role `additional`, path `dist/win-unpacked`. Measure it the same way as `web`.

### Step 11: release

- **Dry run**: add the step with `status: "skipped"` and `message: "dry run"`. Finish with `dry-run`, or `dry-run-with-warnings` if any step is `warning`.
- **No push**: the command is `npm version <releaseType> && npm run changelog && npm run git:commit`, and the label is "Version bump, changelog, commit (no push)".
- Set `release.performed: true` before running the command. Afterwards, fill in:
  - `version`: the new `package.json` version. `tag`: `v<version>`.
  - `tagCreated`: whether `git rev-parse -q --verify refs/tags/<tag>` succeeds.
  - `commit`: `git rev-parse --short HEAD`.
  - `pushed` (full release only): `git ls-remote --tags origin <tag>` is not empty, and `git rev-list --count @{u}..HEAD` is `0`.
- The step fails if: the exit code is non-zero, `version` ≠ `nextVersion`, the tag was not created, or (full release only) the push was not confirmed. On success, `message` is `"<tag> at <commit> pushed"` (or `"(not pushed)"`).

### Finish

Set `status`, `failedStep`, `finishedAt`, and `durationMs`, and write the report one last time. Do this on failure too.

## Output to the user

- List the commands you ran, in order.
- On failure: the failed step, its message, the relevant log excerpt, and the log path. Nothing else.
- On success: release type, `previous → next` version, tag, commit, push status, and a one-line summary of the checks and builds.
- Always end with: "Report: `reports/current-prod-build/release-report.json`. View it with `npm run release:report` → http://localhost:4784".
