import { describe, expect, it } from 'vitest';

import { migrateLeaderboard } from '../migrateLeaderboard';

describe('migrateLeaderboard', () => {
  it('normalizes legacy leaderboard buckets and keeps only the top 10 ranked entries per grade', () => {
    const rawLeaderboard = {
      trainee: [
        {
          key: 'old-trainee',
          name: 'Alice',
          score: 10,
          perfScore: 20,
          combined: 30,
          grade: 'trainee',
          date: 1_000,
        },
        {
          key: 'new-trainee',
          name: 'Bob',
          score: 90,
          perfScore: 70,
          date: 3_000,
        },
      ],
      cadet: {
        bad: 'shape',
      },
      commander: [
        {
          key: 'legacy-entry',
          name: 'Cara',
          difficulty: 'commander',
          score: 150,
          perfScore: 40,
          date: 2_000,
        },
      ],
      'major-general': [
        { key: 'm1', name: 'Dana', score: 120, perfScore: 25, combined: 145, grade: 'major-general', date: 5_000 },
        { key: 'm2', name: 'Eli', score: 110, perfScore: 35, combined: 145, grade: 'major-general', date: 4_500 },
        { key: 'm3', name: 'Faye', score: 100, perfScore: 30, combined: 130, grade: 'major-general', date: 4_000 },
        { key: 'm4', name: 'Gus', score: 95, perfScore: 20, combined: 115, grade: 'major-general', date: 3_500 },
        { key: 'm5', name: 'Hana', score: 90, perfScore: 25, combined: 115, grade: 'major-general', date: 3_000 },
        { key: 'm6', name: 'Ivy', score: 85, perfScore: 20, combined: 105, grade: 'major-general', date: 2_500 },
        { key: 'm7', name: 'Jin', score: 80, perfScore: 25, combined: 105, grade: 'major-general', date: 2_000 },
        { key: 'm8', name: 'Kai', score: 75, perfScore: 15, combined: 90, grade: 'major-general', date: 1_500 },
        { key: 'm9', name: 'Lia', score: 70, perfScore: 12, combined: 82, grade: 'major-general', date: 1_000 },
        { key: 'm10', name: 'Milo', score: 65, perfScore: 18, combined: 83, grade: 'major-general', date: 500 },
        { key: 'm11', name: 'Nia', score: 60, perfScore: 10, combined: 70, grade: 'major-general', date: 250 },
      ],
    };

    const migrated = migrateLeaderboard(rawLeaderboard);

    expect(migrated.trainee).toHaveLength(2);
    expect(migrated.trainee[0]).toMatchObject({
      key: 'new-trainee',
      name: 'Bob',
      score: 90,
      perfScore: 70,
      combined: 160,
      grade: 'trainee',
      date: 3_000,
    });
    expect(migrated.commander).toEqual([
      expect.objectContaining({
        key: 'legacy-entry',
        name: 'Cara',
        score: 150,
        perfScore: 40,
        combined: 190,
        grade: 'commander',
      }),
    ]);
    expect(migrated['major-general']).toHaveLength(10);
    expect(migrated['major-general'][0]).toMatchObject({ key: 'm1', name: 'Dana' });
    expect(migrated['major-general'][9]).toMatchObject({ key: 'm9', name: 'Lia' });
    expect(migrated.cadet).toEqual([]);
  });

  it('returns an empty leaderboard for malformed payloads and ignores non-array buckets', () => {
    expect(migrateLeaderboard(null)).toEqual({
      trainee: [],
      cadet: [],
      commander: [],
      'major-general': [],
    });

    expect(migrateLeaderboard('bad-input')).toEqual({
      trainee: [],
      cadet: [],
      commander: [],
      'major-general': [],
    });

    expect(migrateLeaderboard({
      trainee: { wrong: 'shape' },
      cadet: [
        { key: 'solo', name: 'Test', score: 7, perfScore: 3, grade: 'cadet', date: 9_000 },
      ],
      commander: 'still-bad',
    })).toEqual({
      trainee: [],
      cadet: [expect.objectContaining({ key: 'solo', name: 'Test', score: 7, perfScore: 3, grade: 'cadet' })],
      commander: [],
      'major-general': [],
    });
  });
});
