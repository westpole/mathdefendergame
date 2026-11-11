# Using the `/release-workflow` Command

`/release-workflow` is the Claude Code command for shipping a production release of Math Defender Game. Claude runs the release steps in order using the existing npm scripts. The steps cover the preflight checks, picking the version bump, building the Web and Windows packages, and running the release command (version bump, changelog, commit, tag, push). Claude writes a JSON release report as it goes.

The command is user-invoked only: Claude never starts it on its own. Its definition lives in `.claude/skills/release-workflow/` (`SKILL.md`, plus the report template in `assets/release-report.template.json`).

## When to Use It

Use it to release work that is already merged into `master`. Do not use it for gameplay changes, UI work, Phaser scene updates, or general bug fixing. Finish and merge those first, then release.

## How to Run It

From Claude Code:

```text
/release-workflow
/release-workflow dry run
/release-workflow stop before pushing
```

You do not choose the release type. Claude runs `npm run which:version` and uses the recommended bump (`patch`, `minor`, or `major`) based on conventional commits.

## Pipeline Steps

1. `bump`: determine the bump with `npm run which:version`.
2. `git-branch`, `git-clean`, `git-sync`: on `master`, clean worktree, in sync with the remote.
3. `guard`: `npm run release:guard` requires at least one releasable commit since the latest tag.
4. `lint`, `typecheck`, `test-all`.
5. `build-web` (`npm run build:web:bundle`), then `build-win` (`npm run build:win:package`, stamped with the next version).
6. `release`: exactly one of `npm run release:patch`, `release:minor`, or `release:major`, then a check of the version, tag, and push.

The pipeline stops at the first failing step. In a dry run, git preflight failures are recorded as warnings, so you can test the checks and builds from a feature branch.

## Output

- `reports/current-prod-build/release-report.json`: the single result file. Claude rewrites it after every step.
- `reports/current-prod-build/logs/<step>.log`: full output of each npm command.

To view the report, run `npm run release:report` and open http://localhost:4784 (see `tools/release-report/README.md`).

## Notes

- The release step commits, tags, and pushes in one go. Use "stop before pushing" if you want a review checkpoint before publishing.
- "Stop before pushing" runs `npm version`, `npm run changelog`, and `npm run git:commit`. Push later with `npm run git:push`.
