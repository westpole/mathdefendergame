import { describe, expect, it } from 'vitest';

import { migrateProfiles } from '../migrateProfiles';

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
        preferredDifficulty: 'major-general',
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
        preferredDifficulty: 'cadet',
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
});
