import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR_ID } from '@shared/avatarCatalog';

import { migrateProfiles } from '../migrateProfiles';

describe('migrateProfiles', () => {
  it('normalizes persisted profile data into the canonical PlayerProfile shape', () => {
    const rawProfiles = {
      alice: {
        username: 'alice',
        password: 'StrongPass1!',
        avatarId: DEFAULT_AVATAR_ID,
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
      avatarId: DEFAULT_AVATAR_ID,
      bestScore: 900,
      highestStage: 12,
      preferredGrade: 'commander',
      createdAt: 1_000,
      updatedAt: 2_000,
    });

    expect(migrated.bob).toEqual({
      username: 'bob',
      password: '',
      avatarId: DEFAULT_AVATAR_ID,
      bestScore: 250,
      highestStage: 6,
      preferredGrade: 'major-general',
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });

    expect(migrated.carol).toEqual({
      username: 'carol',
      password: 'weak',
      avatarId: DEFAULT_AVATAR_ID,
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
        avatarId: DEFAULT_AVATAR_ID,
        bestScore: 0,
        highestStage: 4,
        preferredGrade: 'cadet',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      },
      erin: {
        username: 'erin',
        password: '',
        avatarId: DEFAULT_AVATAR_ID,
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
