# Generated tickets by agent

## Dependency upgrade plan (epic #128)

Data as of 2026-11-04, from `npm audit`, `npm outdated` and registry metadata. Run the tickets in number order unless their dependencies allow otherwise.

### Starting point

- `npm audit`: 60 vulnerable packages (4 critical, 17 high, 39 moderate), from 26 root causes.
- `npm audit --omit=dev`: 0. This is misleading, because Electron is a dev dependency but ships inside the installer.
- 46 outdated packages, all assigned to a ticket below.
- Unit tests: 535 of 536 passing, with one known `UIScene` flake. Typecheck and lint pass.
- E2E tests: no baseline recorded.

### Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#129](129-deps-scripts-replace-audit-ci-and-ncu.md) | Make the deps scripts trustworthy and remove audit-ci and npm-check-updates | Chore | P0 | S | Ready | None |
| #130 | Upgrade Storybook to 10.6.5 | Security | P0 | M | Done | #129 |
| [#131](131-upgrade-concurrently-wait-on.md) | Upgrade concurrently and wait-on | Security | P0 | S | Ready | #129 |
| [#132](132-upgrade-electron-42-11-electron-builder.md) | Upgrade Electron to 42.11.18 and electron-builder to 26.18.0 | Security | P0 | M | Ready | #129 |
| [#133](133-upgrade-vite-8-3-build-tools.md) | Upgrade Vite to 8.3.5 with sass and vite-plugin-singlefile | Security | P1 | M | Ready | #129 |
| [#134](134-upgrade-vitest-4-1-12.md) | Upgrade Vitest to 4.1.12 | Security | P1 | S | Ready | #129 |
| [#135](135-upgrade-happy-dom-21.md) | Upgrade happy-dom to 21 | Security | P1 | S | Ready | #134 |
| [#136](136-refresh-transitive-security-lockfile.md) | Refresh vulnerable transitive packages in the lockfile | Security | P0 | S | Ready | #130, #131, #132, #133, #134, #135 |
| [#137](137-upgrade-playwright-1-64.md) | Upgrade Playwright to 1.64.1 | Maintenance | P2 | S | Ready | #129 |
| [#138](138-upgrade-react-19-3.md) | Upgrade React to 19.3 with types and Testing Library | Maintenance | P2 | M | Ready | #129 |
| [#139](139-upgrade-phaser-zustand-patches.md) | Upgrade Phaser to 4.2.1 and Zustand to 5.0.16 | Maintenance | P2 | S | Ready | #129 |
| [#140](140-upgrade-i18next-group.md) | Upgrade the i18next packages | Maintenance | P2 | S | Ready | #129 |
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
