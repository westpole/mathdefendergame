# Generated tickets by agent

## Dependency upgrade plan (epic #128)

Data as of 2026-11-04, from `npm audit`, `npm outdated` and registry metadata. Run the tickets in number order unless their dependencies allow otherwise.

### Starting point

- `npm audit`: 60 vulnerable packages (4 critical, 17 high, 39 moderate), from 26 root causes.
- `npm audit --omit=dev`: 0. This is misleading, because Electron is a dev dependency but ships inside the installer.
- 46 outdated packages, all assigned to a ticket below.
- Unit tests: 535 of 536 passing, with one known `UIScene` flake. Typecheck and lint pass.
- E2E tests: no baseline recorded.

### Workflow

Every ticket follows these steps. Each ticket file gives its exact branch and file names.

1. Create the ticket branch from `dev/upgrade-npm`.
2. Complete the ticket and verify the changes.
3. Merge the ticket branch into `dev/upgrade-npm`.
4. Delete the ticket file.
5. In the table below, set the ticket's status to `Done` and remove its link.

### Manual testing

Tickets have no manual testing step, so no ticket waits for one. A person tests the `dev/upgrade-npm` branch once, after all tickets are implemented.

### Exceptions

These rules override the Workflow above and the Close the Ticket section in each ticket.

- **#148:** Merge the ticket branch into `dev/upgrade-npm` as usual, but keep the ticket file. Its acceptance criteria need a PR into `master`, because CI does not run on PRs into `dev/upgrade-npm`.
  1. Open the PR from `dev/upgrade-npm` into `master` and confirm the `Dependency audit` step passes.
  2. Prove the step fails on a throwaway branch, using a PR into `master` that is never merged.
  3. Delete the ticket file and update its status on `dev/upgrade-npm`, before that PR merges.
- **#149 and #150:** Check the ticket's Unblock Criteria when its turn comes. If they are met, follow the normal Workflow. If not, leave the ticket file in place and the status as `Blocked`. The PR into `master` does not wait for these tickets.

### Definition of done

The plan is done when #150 has been processed:

- Every ticket from #132 to #148 is `Done` and its file is deleted.
- #149 and #150 are each either `Done` with the file deleted, or still `Blocked` after their Unblock Criteria were checked.

If #149 or #150 stays `Blocked`, its file is the only ticket file left in this folder.

### CI coverage

`pr-tests-runner.yml` only runs on PRs into `master`, so CI does not check merges into `dev/upgrade-npm`. Each ticket's Agent Validation is the check for those merges.

### Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#129](129-deps-scripts-replace-audit-ci-and-ncu.md) | Make the deps scripts trustworthy and remove audit-ci and npm-check-updates | Chore | P0 | S | Done | None |
| #130 | Upgrade Storybook to 10.6.5 | Security | P0 | M | Done | #129 |
| #131 | Upgrade concurrently and wait-on | Security | P0 | S | Done | #129 |
| #132 | Upgrade Electron to 42.11.18 and electron-builder to 26.18.0 | Security | P0 | M | Done | #129 |
| #133 | Upgrade Vite to 8.3.5 with sass and vite-plugin-singlefile | Security | P1 | M | Done | #129 |
| #134 | Upgrade Vitest to 4.1.12 | Security | P1 | S | Done | #129 |
| #135 | Upgrade happy-dom to 21 | Security | P1 | S | Done | #134 |
| #136 | Refresh vulnerable transitive packages in the lockfile | Security | P0 | S | Done | #130, #131, #132, #133, #134, #135 |
| #137 | Upgrade Playwright to 1.64.1 | Maintenance | P2 | S | Done | #129 |
| #138 | Upgrade React to 19.3 with types and Testing Library | Maintenance | P2 | M | Done | #129 |
| #139 | Upgrade Phaser to 4.2.1 and Zustand to 5.0.16 | Maintenance | P2 | S | Done | #129 |
| #140 | Upgrade the i18next packages | Maintenance | P2 | S | Done | #129 |
| [#141](141-upgrade-lint-type-tooling.md) | Upgrade typescript-eslint, react-refresh plugin and type-coverage | Maintenance | P3 | S | Ready | #129 |
| [#142](142-upgrade-release-tooling.md) | Upgrade the conventional-changelog tools | Maintenance | P3 | S | Ready | #129 |
| [#143](143-upgrade-electron-45.md) | Upgrade Electron to 45 | Upgrade | P1 | L | Ready | #132, #137 |
| [#144](144-upgrade-vitest-5.md) | Upgrade Vitest to 5 | Upgrade | P2 | L | Ready | #130, #134, #135 |
| [#145](145-upgrade-vite-plugin-react-6.md) | Upgrade @vitejs/plugin-react to 6 | Upgrade | P2 | S | Ready | #133 |
| [#146](146-upgrade-jest-dom-7.md) | Upgrade @testing-library/jest-dom to 7 | Upgrade | P3 | S | Ready | #138 |
| [#147](147-upgrade-knip-6.md) | Upgrade Knip to 6 | Upgrade | P3 | S | Ready | #129 |
| [#148](148-ci-enforce-npm-audit-gate.md) | Enforce the npm audit gate in CI | Chore | P1 | S | Ready | #130, #131, #132, #133, #134, #135, #136 |
| [#149](149-upgrade-eslint-10-blocked.md) | Upgrade ESLint to 10 | Upgrade | P3 | M | Blocked | #141 |
| [#150](150-upgrade-typescript-7-blocked.md) | Upgrade TypeScript to 7 | Upgrade | P3 | L | Blocked | #141, #147 |

### Expected end state

After #136, no high or critical advisories should remain. Moderate `minimatch` and `glob` advisories stay, along with packages that inherit them, because no parent package allows a fixed version yet. This outcome is calculated from lockfile and registry data and has not been confirmed by a trial install.
