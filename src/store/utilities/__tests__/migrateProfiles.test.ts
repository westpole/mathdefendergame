import { describe, expect, it } from 'vitest';

import {
  migrateLegacyProfiles,
  migrateProfiles,
} from '../migrateProfiles';

describe('migrateProfiles', () => {
  it('normalizes persisted profile data into the canonical PlayerProfile shape', () => {
    const rawProfiles = {
      alice: {
        username: 'alice',
        password: 'StrongPass1!',
        bestScore: 900,
        highestStage: 12,
        preferredGrade: 'commander',
        createdAt: 1_000,
        updatedAt: 2_000,
      },
      bob: {
        preferredGrade: 'major-general',
        bestScore: 250,
        highestStage: 6,
      },
      carol: {
        username: 'carol',
        password: 'weak',
        bestScore: 30,
        highestStage: 3,
        preferredGrade: 'unknown-grade',
      },
    };

    const migrated = migrateProfiles(rawProfiles);

    expect(migrated.alice).toEqual({
      username: 'alice',
      password: 'StrongPass1!',
      bestScore: 900,
      highestStage: 12,
      preferredGrade: 'commander',
      createdAt: 1_000,
      updatedAt: 2_000,
    });

    expect(migrated.bob).toEqual({
      username: 'bob',
      password: '',
      bestScore: 250,
      highestStage: 6,
      preferredGrade: 'major-general',
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });

    expect(migrated.carol).toEqual({
      username: 'carol',
      password: 'weak',
      bestScore: 30,
      highestStage: 3,
      preferredGrade: 'trainee',
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
  });

  it('returns an empty map for malformed payloads and skips invalid profile entries', () => {
    expect(migrateProfiles(null)).toEqual({});
    expect(migrateProfiles('not-an-object')).toEqual({});

    expect(migrateProfiles({
      badEntry: null,
      dave: {
        preferredGrade: 'cadet',
        bestScore: 'nope',
        highestStage: 4,
      },
      erin: {
        username: 42,
        password: 99,
      },
    })).toEqual({
      dave: {
        username: 'dave',
        password: '',
        bestScore: 0,
        highestStage: 4,
        preferredGrade: 'cadet',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      },
      erin: {
        username: 'erin',
        password: '',
        bestScore: 0,
        highestStage: 1,
        preferredGrade: 'trainee',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      },
    });
  });

  it('does not read legacy preferredDifficulty in canonical migrations', () => {
    const migrated = migrateProfiles({
      alpha: {
        preferredDifficulty: 'major-general',
      },
    });

    expect(migrated.alpha?.preferredGrade).toBe('trainee');
  });
});

describe('migrateLegacyProfiles', () => {
  it('migrates legacy preferredDifficulty and reports migration details', () => {
    const { profiles, report } = migrateLegacyProfiles({
      alpha: {
        preferredDifficulty: 'major-general',
        bestScore: 400,
      },
      beta: null,
    });

    expect(profiles.alpha).toEqual({
      username: 'alpha',
      password: '',
      bestScore: 400,
      highestStage: 1,
      preferredGrade: 'major-general',
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });

    expect(report).toEqual({
      status: 'success',
      details: 'Migrated 1 profile(s). Dropped 1 invalid profile(s). Removed 1 legacy field(s).',
      migratedProfiles: 1,
      droppedProfiles: 1,
      removedLegacyFields: 1,
    });
  });

  it('returns a failed report when legacy payload is malformed', () => {
    const result = migrateLegacyProfiles('invalid');

    expect(result).toEqual({
      profiles: {},
      report: {
        status: 'failed',
        details: 'Legacy payload invalid. Reset profiles to empty map.',
        migratedProfiles: 0,
        droppedProfiles: 0,
        removedLegacyFields: 0,
      },
    });
  });
});
