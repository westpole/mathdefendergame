# Using the `release-win-game` Agent

The `release-win-game` agent is the repo-specific agent for shipping a Windows release of Math Defender Game. Use it when you want Copilot to handle release-oriented work such as version bumps, changelog updates, release builds, tags, and push preparation.

## When to Use It

Use this agent for requests like:

- Prepare the next patch release.
- Cut a minor release with short release notes.
- Update the version, generate release notes, and create the release commit.
- Build and validate the Windows release package before tagging.

Do not use it for gameplay changes, UI work, Phaser scene updates, or general bug fixing. Those changes should be completed first, then released.

## What the Agent Covers

The agent is intended for:

- Production release workflows
- Release builds
- Changelog generation
- Version bumps
- Git tags
- Release commits on `master`
- GitHub pushes

## Required Input

At minimum, give the agent the release type:

- `patch`
- `minor`
- `major`

You can also include optional notes or constraints, for example:

- specific release notes to include
- whether to avoid pushing automatically
- whether to stop after creating the build artifacts
- whether to verify changelog content before tagging

## Prompt Pattern

Use a direct instruction that includes the exact agent name and the release type.

```text
Use the release-win-game agent to prepare a patch release.
```

With extra constraints:

```text
Use the release-win-game agent to prepare a minor release.
Include release notes for the new DDA tuning changes, update the changelog, build the Windows package, and stop before pushing.
```

## Good Requests

```text
Use the release-win-game agent for a patch release.
```

```text
Use the release-win-game agent for a minor release and draft concise release notes from the latest completed work.
```

```text
Use the release-win-game agent for a major release. Update the changelog, create the version bump commit and tag, but ask before pushing.
```

## Recommended Preconditions

Before invoking the agent, make sure:

- the intended code changes are already merged or present in the working tree
- tests and linting have been run for the release candidate
- you know the target release type
- you are clear about whether the agent should push or stop for review

## Expected Outcome

A successful run should leave you with some or all of the following, depending on your instructions:

- updated version metadata
- updated changelog content
- built Windows release artifacts
- a release commit
- a release tag
- a prepared or completed push

## Notes

- Use the exact agent name: `release-win-game`.
- Be explicit about guardrails such as `stop before pushing` if you want a review checkpoint.
- If you want human review before any irreversible git step, say so in the prompt.
