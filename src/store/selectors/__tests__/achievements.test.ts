import { STREAK_TIERS } from '@store/constants';

import {
  addLocalDays,
  buildActiveDaysByWeek,
  buildWeekDays,
  computeWeeklyStreak,
  findNextStreakTier,
  startOfLocalWeek,
  toDayKey,
  toWeekKey,
} from '../achievements';
import { activeWeek, at, makeRun, mondayWeeksBefore } from './achievementTestUtils';

// Monday 9 Nov 2026 is the start of ISO week 2026-W46.
const MONDAY = at(2026, 11, 9);

describe('achievement selectors', () => {
  describe('toDayKey / toWeekKey', () => {
    it('builds local day keys', () => {
      expect(toDayKey(at(2026, 1, 5, 0, 0))).toBe('2026-01-05');
      expect(toDayKey(at(2026, 12, 31, 23, 59))).toBe('2026-12-31');
    });

    it('keeps Sunday 23:59 in the ending week and moves Monday 00:00 to the new one', () => {
      expect(toWeekKey(at(2026, 11, 15, 23, 59))).toBe('2026-W46');
      expect(toWeekKey(at(2026, 11, 16, 0, 0))).toBe('2026-W47');
      expect(toWeekKey(MONDAY)).toBe('2026-W46');
    });

    it('uses the ISO week-year across the year boundary', () => {
      // 2026 has 53 ISO weeks: Mon 28 Dec 2026 is W53, Mon 4 Jan 2027 is W01.
      expect(toWeekKey(at(2026, 12, 28))).toBe('2026-W53');
      expect(toWeekKey(at(2027, 1, 3))).toBe('2026-W53');
      expect(toWeekKey(at(2027, 1, 4))).toBe('2027-W01');
      // 31 Dec 2024 (Tuesday) belongs to 2025-W01; 29 Dec 2025 (Monday) to 2026-W01.
      expect(toWeekKey(at(2024, 12, 31))).toBe('2025-W01');
      expect(toWeekKey(at(2025, 12, 29))).toBe('2026-W01');
      expect(toWeekKey(at(2025, 12, 28))).toBe('2025-W52');
    });
  });

  describe('week helpers', () => {
    it('finds local Monday 00:00 for any day of the week', () => {
      expect(startOfLocalWeek(at(2026, 11, 15, 23, 59))).toBe(at(2026, 11, 9, 0, 0));
      expect(startOfLocalWeek(at(2026, 11, 9, 0, 0))).toBe(at(2026, 11, 9, 0, 0));
    });

    it('lists Monday to Sunday for the current week', () => {
      expect(buildWeekDays(at(2026, 11, 12)).map(({ dayKey }) => dayKey)).toEqual([
        '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
      ]);
    });

    it('returns the next tier or null once every tier is reached', () => {
      expect(findNextStreakTier(0, STREAK_TIERS)).toEqual({ index: 0, weeks: 3 });
      expect(findNextStreakTier(3, STREAK_TIERS)).toEqual({ index: 1, weeks: 6 });
      expect(findNextStreakTier(11, STREAK_TIERS)).toEqual({ index: 2, weeks: 12 });
      expect(findNextStreakTier(12, STREAK_TIERS)).toBeNull();
    });
  });

  describe('DST', () => {
    const originalTimeZone = process.env.TZ;

    beforeAll(() => {
      process.env.TZ = 'Europe/Kyiv';
    });

    afterAll(() => {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    });

    it('keeps day and week keys on local dates across the spring and autumn changes', () => {
      // Clocks go forward on Sun 29 Mar 2026 and back on Sun 25 Oct 2026 in Kyiv.
      expect(new Date(at(2026, 3, 30)).getTimezoneOffset()).not.toBe(new Date(at(2026, 3, 23)).getTimezoneOffset());
      expect(toDayKey(at(2026, 3, 29, 23, 30))).toBe('2026-03-29');
      expect(toWeekKey(at(2026, 3, 29, 23, 59))).toBe('2026-W13');
      expect(toWeekKey(at(2026, 3, 30, 0, 0))).toBe('2026-W14');
      expect(toWeekKey(at(2026, 10, 25, 23, 59))).toBe('2026-W43');
      expect(toWeekKey(at(2026, 10, 26, 0, 0))).toBe('2026-W44');
      expect(addLocalDays(at(2026, 3, 23, 0, 0), 7)).toBe(at(2026, 3, 30, 0, 0));
    });

    it('treats weeks around a DST change as consecutive', () => {
      const history = [
        ...activeWeek(at(2026, 3, 16)),
        ...activeWeek(at(2026, 3, 23)),
        ...activeWeek(at(2026, 3, 30)),
      ];

      expect(computeWeeklyStreak(history, at(2026, 4, 1)).streakWeeks).toBe(3);
    });
  });

  describe('buildActiveDaysByWeek', () => {
    it('counts a day once when its runs total at least 10 correct answers', () => {
      const history = [
        makeRun(at(2026, 11, 9, 9), { correctAnswers: 6 }),
        makeRun(at(2026, 11, 9, 18), { correctAnswers: 5 }),
        makeRun(at(2026, 11, 10, 9), { correctAnswers: 9 }),
        makeRun(at(2026, 11, 11, 9), { correctAnswers: 30, mode: 'practice' }),
      ];

      expect([...(buildActiveDaysByWeek(history).get('2026-W46') ?? [])].sort()).toEqual(['2026-11-09', '2026-11-11']);
    });
  });

  describe('computeWeeklyStreak', () => {
    it('returns an empty streak with no history', () => {
      expect(computeWeeklyStreak([], MONDAY)).toEqual({
        streakWeeks: 0,
        thisWeekActiveDays: 0,
        thisWeekActiveDayKeys: [],
        daysNeeded: 3,
      });
    });

    it('shows Mon and Wed as active mid-week and needs one more day', () => {
      const history = activeWeek(MONDAY, [0, 2]);
      const streak = computeWeeklyStreak(history, at(2026, 11, 12));

      expect(streak.thisWeekActiveDayKeys).toEqual(['2026-11-09', '2026-11-11']);
      expect(streak.thisWeekActiveDays).toBe(2);
      expect(streak.daysNeeded).toBe(1);
    });

    it('counts two complete streak weeks without breaking on the unfinished current week', () => {
      const history = [
        ...activeWeek(mondayWeeksBefore(MONDAY, 2)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 1)),
        ...activeWeek(MONDAY, [0]),
      ];

      expect(computeWeeklyStreak(history, at(2026, 11, 15, 23, 59)).streakWeeks).toBe(2);
    });

    it('adds the current week once it reaches three active days', () => {
      const history = [
        ...activeWeek(mondayWeeksBefore(MONDAY, 2)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 1)),
        ...activeWeek(MONDAY),
      ];

      const streak = computeWeeklyStreak(history, at(2026, 11, 12));

      expect(streak.streakWeeks).toBe(3);
      expect(streak.daysNeeded).toBe(0);
    });

    it('breaks the streak after a completed short week', () => {
      const history = [
        ...activeWeek(mondayWeeksBefore(MONDAY, 3)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 2), [0, 1]),
        ...activeWeek(mondayWeeksBefore(MONDAY, 1)),
      ];

      expect(computeWeeklyStreak(history, MONDAY).streakWeeks).toBe(1);
    });

    it('breaks the streak after a week with no runs at all', () => {
      const history = [
        ...activeWeek(mondayWeeksBefore(MONDAY, 3)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 2)),
      ];

      expect(computeWeeklyStreak(history, MONDAY).streakWeeks).toBe(0);
    });

    it('treats W53 and W01 as consecutive weeks', () => {
      const history = [
        ...activeWeek(at(2026, 12, 21)),
        ...activeWeek(at(2026, 12, 28)),
        ...activeWeek(at(2027, 1, 4)),
      ];

      expect(computeWeeklyStreak(history, at(2027, 1, 8)).streakWeeks).toBe(3);
    });

    it('counts a Sunday 23:59 run in the ending week', () => {
      const history = [
        makeRun(at(2026, 11, 13)),
        makeRun(at(2026, 11, 14)),
        makeRun(at(2026, 11, 15, 23, 59)),
      ];

      expect(computeWeeklyStreak(history, at(2026, 11, 16, 0, 0)).streakWeeks).toBe(1);
      expect(computeWeeklyStreak([...history, makeRun(at(2026, 11, 16, 0, 0))], at(2026, 11, 16, 0, 0)).thisWeekActiveDays).toBe(1);
    });

    it('ignores runs after the reference time when finding the first week', () => {
      expect(computeWeeklyStreak([makeRun(at(2026, 12, 1))], MONDAY).streakWeeks).toBe(0);
    });

    it('ignores later runs in the current week', () => {
      const history = activeWeek(MONDAY, [0, 1, 2, 3]);
      const streak = computeWeeklyStreak(history, at(2026, 11, 10, 18));

      expect(streak.thisWeekActiveDayKeys).toEqual(['2026-11-09', '2026-11-10']);
      expect(streak.streakWeeks).toBe(0);
    });

    it('counts W52, W01 and W02 as consecutive from a mid-week reference time', () => {
      const history = [
        ...activeWeek(at(2025, 12, 22)),
        ...activeWeek(at(2025, 12, 29)),
        ...activeWeek(at(2026, 1, 5)),
      ];

      expect(toWeekKey(at(2025, 12, 22))).toBe('2025-W52');
      expect(computeWeeklyStreak(history, at(2026, 1, 8, 15)).streakWeeks).toBe(3);
    });
  });
});
