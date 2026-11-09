# Using the `/release-workflow` Command

`/release-workflow` is the Claude Code command for shipping a production release of Math Defender Game. It runs preflight checks, picks the version bump, builds the Web and Windows packages, runs the release command (version bump, changelog, commit, tag, push), and generates an HTML release report.

The command is user-invoked only: Claude never starts it on its own. Its definition lives in `.claude/skills/release-workflow/`.

## When to Use It

Use it to release work that is already merged into `master`. Do not use it for gameplay changes, UI work, Phaser scene updates, or general bug fixing. Finish and merge those first, then release.

## How to Run It

Type the command in Claude Code:

```text
/release-workflow
```

You can append optional release notes or constraints:

```text
/release-workflow stop before pushing
```

```text
/release-workflow mention the new DDA tuning changes in the summary
```

You do not choose the release type. The workflow runs `npm run which:version` and uses the recommended bump (`patch`, `minor`, or `major`) based on conventional commits.

## Workflow Steps

1. Determine the bump with `npm run which:version`.
2. Verify git state: on `master`, clean worktree, up to date with the remote.
3. Check release eligibility with `npm run release:guard` (at least one releasable commit since the latest tag).
4. Run checks in order: `npm run lint`, `npm run typecheck`, `npm run test:all`.
5. Build: `npm run build:web`, then `npm run build:win`.
6. Run exactly one of `npm run release:patch`, `npm run release:minor`, or `npm run release:major`.
7. Generate the report with `npm run release:report:build`.

The workflow stops at the first failing step and reports only that blocking condition.

## Preconditions

Before running the command, make sure:

- you are on the `master` branch
- the worktree is clean and in sync with the remote
- there is at least one commit since the latest release tag
- you are clear about whether the release should push or stop for review

## Expected Outcome

A successful run leaves you with:

- updated version metadata and changelog
- built Web (`build/`) and Windows (`dist/`) artifacts
- a release commit and tag, pushed to the remote
- release report data at `reports/current-prod-build/prod-build-report.json`
- release report HTML at `reports/current-prod-build/index.html`

## Notes

- The release step (`npm run release:*`) commits, tags, and pushes in one go. If you want a review checkpoint before any irreversible git step, say so in the command arguments.
- Claude asks for permission before writing the report files.
