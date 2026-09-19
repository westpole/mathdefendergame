# Package Scripts

This document describes each script defined in `package.json` and when to use it.

## Development

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run dev:web` | Starts the Vite development server for the web renderer. | Use during normal browser-based development of the game UI and renderer code. |
| `npm run dev:web:mobile` | Starts the Vite development server on `0.0.0.0:5173` so other devices on the network can reach it. | Use when testing on a phone, tablet, or another machine on the same network. |
| `npm run dev:electron` | Runs the Vite dev server and then launches Electron once the renderer is available. | Use when developing the desktop shell and the renderer together. |
| `npm run start:electron` | Launches Electron against the built app entry configured by the project. | Use for a quick local smoke check of the desktop app without the dev server workflow. |
| `npm run start:electron:debug` | Launches Electron with the Node inspector enabled. | Use when debugging Electron main-process behavior with DevTools or an attached debugger. |

## Testing

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run test:ui` | Opens the Vitest UI for interactive test runs. | Use when exploring failures, rerunning tests interactively, or watching test state in the browser UI. |
| `npm run test:watch` | Starts Vitest in watch mode using the shared config. | Use during active development when you want tests to rerun after file changes. |
| `npm run test:all` | Runs all Vitest projects once. | Use before commits or whenever you want the standard unit and integration test pass. |
| `npm run test:all:coverage` | Runs all Vitest projects and collects coverage. | Use when validating coverage-sensitive changes or before broader quality checks. |
| `npm run test:electron` | Runs only the Electron Vitest project. | Use when changes are limited to the desktop shell or Electron-specific behavior. |
| `npm run test:phaser` | Runs only the Phaser Vitest project. | Use when changing gameplay, scenes, rendering, or other Phaser-owned code. |
| `npm run test:react` | Runs only the React Vitest project. | Use when changing overlays, components, or Zustand-connected UI behavior. |
| `npm run test:storybook` | Runs the Storybook-related Vitest project. | Use when validating Storybook stories or story-driven component coverage. |
| `npm run test:e2e` | Runs the full Playwright end-to-end suite. | Use before releases or when a change may affect complete user flows across targets. |
| `npm run test:e2e:web` | Runs the mobile web Playwright projects only. | Use when validating browser behavior and responsive mobile flows. |
| `npm run test:e2e:electron` | Runs the Electron-focused Playwright projects, including smoke, UI, integration, game, and visual coverage. | Use when desktop behavior, packaging assumptions, or Electron rendering flows changed. |
| `npm run test:e2e:ui` | Opens the Playwright UI runner. | Use when debugging end-to-end tests interactively. |
| `npm run test:e2e:update-snapshots` | Re-records snapshots for the Electron visual test project. | Use only when visual changes are intentional and the new snapshots should become the baseline. |

## Build And Preview

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run build:web:e2e` | Builds the web app in the `e2e` mode used by Playwright and packaging flows. | Use when a test or packaging workflow needs the E2E-targeted web build. |
| `npm run preview:web:mobile` | Serves the built app on `0.0.0.0:4173` for network-accessible previewing. | Use when checking a production-style build on mobile devices over the local network. |
| `npm run build:e2e` | Builds the web app in E2E mode and then creates an unpacked Electron application directory. | Use when Playwright or manual checks need an Electron build artifact without creating an installer. |
| `npm run build:web` | Runs the full Vitest suite, runs TypeScript type checking, and then builds the web app with Vite. | Use before production web builds or before packaging when you want the standard gate to run first. |
| `npm run build:win` | Removes `dist`, runs the validated web build, and then packages the Windows Electron app with `electron-builder`. | Use when producing a Windows installer or distributable package. This script assumes a shell that supports `rm -Rf`. |
| `npm run build-storybook` | Builds the static Storybook site. | Use when publishing, reviewing, or validating the production Storybook output. |

## Linting And Static Analysis

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run lint` | Runs ESLint on the `src` tree and fails on any warning. | Use as the standard lint gate before commits or merges. |
| `npm run lint:fix` | Runs ESLint on the `src` tree and applies auto-fixable changes. | Use when you want ESLint to clean up formatting or straightforward rule violations. |
| `npm run lint:report` | Generates both HTML and JSON ESLint reports. | Use when you need shareable lint artifacts instead of console-only output. |
| `npm run lint:report:html` | Writes an HTML ESLint report to `reports/eslint-report.html` and does not fail the shell if lint errors exist. | Use when you want a browser-friendly lint report for inspection. |
| `npm run lint:report:json` | Writes a JSON ESLint report to `reports/eslint-report.json` and does not fail the shell if lint errors exist. | Use when another tool or script needs machine-readable lint output. |
| `npm run typecheck` | Runs the TypeScript compiler in no-emit mode. | Use when validating types without producing build output. |
| `npm run types:coverage` | Reports type coverage details. | Use when tracking or improving the percentage of typed code. |
| `npm run quality:unused` | Runs Knip to detect unused files, exports, and dependencies. | Use when cleaning dead code or checking for unused project surface area. |
| `npm run quality:all` | Runs lint, typecheck, coverage-enabled tests, type coverage, and unused-code analysis in one pass. | Use as the broadest local quality gate before a release or major merge. |

## Dependency Maintenance

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run deps:audit` | Runs `npm audit` against installed dependencies. | Use for a quick local security audit of the dependency tree. |
| `npm run deps:audit:ci` | Runs `audit-ci` for CI-friendly dependency vulnerability enforcement. | Use when you want stricter audit behavior aligned with automated pipelines. |
| `npm run deps:outdated` | Lists outdated packages with additional version details. | Use when planning dependency updates. |
| `npm run deps:unused` | Runs Knip to detect unused dependencies and related dead references. | Use when trimming dependencies or validating package cleanup work. |
| `npm run deps:check-updates` | Uses `npm-check-updates` to show available package.json upgrades. | Use when reviewing what dependency versions could be bumped. |

## Storybook

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run storybook` | Starts the Storybook development server on port `6006`. | Use when building or reviewing isolated UI component stories locally. |

## Release Workflow

| Script | What it does | When to use it |
| --- | --- | --- |
| `npm run release:guard` | Runs the project release guard checks from `scripts/release-guard.mjs`. | Use before versioning or pushing a release to ensure release prerequisites are satisfied. |
| `npm run changelog` | Regenerates `CHANGELOG.md` from conventional commits. | Use when preparing release notes from commit history. |
| `npm run git:commit` | Stages all changes and creates a release-style commit. | Use only inside the existing release workflow when all pending changes are intended for that commit. |
| `npm run git:push` | Pushes `master` and all tags to `origin`. | Use only when the local release commit and tags are ready to publish. |
| `npm run which:version` | Asks `conventional-recommended-bump` which semantic version bump is recommended. | Use when deciding whether the next release should be patch, minor, or major. |
| `npm run release:commit` | Regenerates the changelog, creates the release commit, and pushes commits and tags. | Use only as part of the release flow when you are ready to publish the release state. |
| `npm run prerelease:major` | Runs the release guard before a major release. | Use immediately before `npm run release:major`. |
| `npm run release:major` | Bumps the major version and then runs the release commit flow. | Use when shipping breaking changes that require a major semantic version increase. |
| `npm run prerelease:minor` | Runs the release guard before a minor release. | Use immediately before `npm run release:minor`. |
| `npm run release:minor` | Bumps the minor version and then runs the release commit flow. | Use when shipping backward-compatible features. |
| `npm run prerelease:patch` | Runs the release guard before a patch release. | Use immediately before `npm run release:patch`. |
| `npm run release:patch` | Bumps the patch version and then runs the release commit flow. | Use when shipping backward-compatible fixes. |
