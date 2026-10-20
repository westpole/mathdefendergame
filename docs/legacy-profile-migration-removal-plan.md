# Legacy Profile Migration Removal Plan

## Goal

Remove temporary legacy profile migration code after confirming active players have safely transitioned to the canonical persisted profile schema.

## Current Context

- Persisted store migration is versioned in [src/store/useGameStore.ts](E:/Dev/personal/mathDefenderGame/src/store/useGameStore.ts).
- Legacy profile conversion and reporting currently live in [src/store/utilities/migrateProfiles.ts](E:/Dev/personal/mathDefenderGame/src/store/utilities/migrateProfiles.ts).
- Canonical profile normalization is handled by `migrateProfiles`.
- One-time legacy compatibility is handled by `migrateLegacyProfiles`.

## Exit Criteria Before Removal

1. **Release window elapsed**
   - Keep legacy migration for at least 2 stable releases after introducing persist version `4`.

2. **No meaningful legacy usage**
   - Migration telemetry (or equivalent startup report logging) shows near-zero legacy conversions over a full release cycle.
   - No active bug reports tied to missing profile data after startup.

3. **Data integrity verified**
   - Sample profile payload audits confirm only canonical keys are persisted:
     - `username`
     - `password`
     - `bestScore`
     - `highestStage`
     - `preferredGrade`
     - `createdAt`
     - `updatedAt`

4. **QA sign-off**
   - Manual startup verification on existing local profiles and clean installs passes.
   - Store test suite and migration tests pass in CI.

## Removal Scope

When exit criteria are met, make these changes together:

1. In [src/store/utilities/migrateProfiles.ts](E:/Dev/personal/mathDefenderGame/src/store/utilities/migrateProfiles.ts):
   - Remove:
     - `LegacyProfileMigrationReport`
     - `LegacyProfileMigrationResult`
     - `migrateLegacyProfiles`
   - Keep and retain tests for strict canonical `migrateProfiles`.

2. In [src/store/useGameStore.ts](E:/Dev/personal/mathDefenderGame/src/store/useGameStore.ts):
   - Remove version-conditional branch that calls `migrateLegacyProfiles`.
   - Use `migrateProfiles` as the only profile migrator in `persist.migrate`.
   - Optionally bump persist version if needed for cleanup tracking.

3. In [src/store/utilities/__tests__/migrateProfiles.test.ts](E:/Dev/personal/mathDefenderGame/src/store/utilities/__tests__/migrateProfiles.test.ts):
   - Remove tests dedicated to `migrateLegacyProfiles`.
   - Keep coverage for malformed payload handling in canonical migration.

4. In [src/store/README.md](E:/Dev/personal/mathDefenderGame/src/store/README.md):
   - Update persistence section to remove references to temporary legacy migration handling.

## Safety Checklist for the Removal PR

- [ ] Verify current branch includes no other persistence-schema changes mixed into this PR.
- [ ] Run targeted store tests:
  - `npm run test:store -- src/store/utilities/__tests__/migrateProfiles.test.ts src/store/__tests__/useGameStore.test.ts`
- [ ] Confirm startup succeeds with:
  - a fresh localStorage state
  - an existing canonical profile state
- [ ] Confirm no runtime errors in boot/login flow.

## Rollback Plan

If unexpected profile loss or login regressions appear after removal:

1. Reintroduce `migrateLegacyProfiles` branch from the previous known-good commit.
2. Ship a patch release restoring compatibility.
3. Extend legacy window and gather additional migration telemetry before retrying removal.

## Owner Notes

- Keep this plan aligned with future wizard/upgrade-step work so migration responsibilities stay in one owning layer.
- Do not duplicate profile-schema migration logic across multiple startup systems.
