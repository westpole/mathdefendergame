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
      achievements: [],
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
      achievements: [],
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
      achievements: [],
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
        achievements: [],
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
        achievements: [],
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      },
    });
  });

  it('keeps a valid lastPracticeOperation and drops missing or malformed values', () => {
    const migrated = migrateProfiles({
      valid: { lastPracticeOperation: '/' },
      malformed: { lastPracticeOperation: 'x' },
      missing: {},
    });

    expect(migrated.valid?.lastPracticeOperation).toBe('/');
    expect(migrated.malformed).not.toHaveProperty('lastPracticeOperation');
    expect(migrated.missing).not.toHaveProperty('lastPracticeOperation');
  });

  it('keeps well-formed saved awards and drops malformed ones', () => {
    const migrated = migrateProfiles({
      pilot: {
        achievements: [
          { id: 'weekly-streak-bronze', earnedAt: 100, weekKey: '2026-W46' },
          { id: 'mastery-mul', earnedAt: 200, operation: '*' },
          { id: 'focus-of-the-week', earnedAt: 300, weekKey: '2026-W47', operation: 'x' },
          { id: 'unknown-award', earnedAt: 1 },
          { id: 'weekly-goal-met', earnedAt: 'yesterday' },
          { id: 'weekly-goal-met', earnedAt: Number.NaN },
          { id: 'weekly-goal-met', earnedAt: 400 },
          { id: 'weekly-streak-bronze', earnedAt: 500, weekKey: '2026-W50' },
          { id: 'focus-of-the-week', earnedAt: 600, weekKey: '2026-W48' },
          null,
          'bad',
        ],
      },
      notAnArray: { achievements: { id: 'weekly-streak-bronze' } },
    });

    expect(migrated.pilot?.achievements).toEqual([
      { id: 'weekly-streak-bronze', earnedAt: 100, weekKey: '2026-W46' },
      { id: 'mastery-mul', earnedAt: 200, operation: '*' },
      { id: 'focus-of-the-week', earnedAt: 300, weekKey: '2026-W47' },
      { id: 'focus-of-the-week', earnedAt: 600, weekKey: '2026-W48' },
    ]);
    expect(migrated.notAnArray?.achievements).toEqual([]);
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
