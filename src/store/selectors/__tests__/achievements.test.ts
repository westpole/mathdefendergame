import { STREAK_TIERS } from '@store/constants';

import {
  addLocalDays,
  buildActiveDaysByWeek,
  buildWeekDays,
  computeWeeklyGoalProgress,
  computeWeeklyStreak,
  describeRunGoalResult,
  getRunAccuracy,
  isQualifyingRun,
  evaluateNewAchievements,
  STREAK_TIER_IDS,
  getAchievementKey,
  findNextStreakTier,
  startOfLocalWeek,
  toPreviousWeekKey,
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
        shieldBanked: 0,
        shieldUsedWeekKeys: [],
        atRisk: false,
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

  describe('streak shield', () => {
    const streakWeeks = (count: number, endWeeksBack = 1) => Array.from(
      { length: count },
      (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + endWeeksBack)),
    ).flat();

    it('banks a shield after 4 streak weeks and holds at most 1 after 8', () => {
      expect(computeWeeklyStreak(streakWeeks(3), MONDAY).shieldBanked).toBe(0);
      expect(computeWeeklyStreak(streakWeeks(4), MONDAY).shieldBanked).toBe(1);
      expect(computeWeeklyStreak(streakWeeks(8), MONDAY).shieldBanked).toBe(1);
    });

    it('uses the shield on a completed short week: the streak continues without counting it', () => {
      const history = [...streakWeeks(4, 2), ...activeWeek(mondayWeeksBefore(MONDAY, 1), [0, 1])];
      const streak = computeWeeklyStreak(history, MONDAY);

      expect(streak.streakWeeks).toBe(4);
      expect(streak.shieldBanked).toBe(0);
      expect(streak.shieldUsedWeekKeys).toEqual(['2026-W45']);
      expect(toPreviousWeekKey(MONDAY)).toBe('2026-W45');
    });

    it('resets the streak on a short week without a shield', () => {
      const history = [...streakWeeks(3, 2), ...activeWeek(mondayWeeksBefore(MONDAY, 1), [0, 1])];

      expect(computeWeeklyStreak(history, MONDAY).streakWeeks).toBe(0);
    });

    it('resets after the second of two short weeks with only one shield', () => {
      const history = streakWeeks(4, 3);
      const streak = computeWeeklyStreak(history, MONDAY);

      expect(streak.streakWeeks).toBe(0);
      expect(streak.shieldBanked).toBe(0);
      expect(streak.shieldUsedWeekKeys).toEqual(['2026-W44']);
    });

    it('banks the next shield at 8 streak weeks after one was used', () => {
      const history = [
        ...streakWeeks(4, 1),
        ...activeWeek(mondayWeeksBefore(MONDAY, 5), [0]),
        ...streakWeeks(4, 6),
      ];
      const streak = computeWeeklyStreak(history, MONDAY);

      expect(streak.streakWeeks).toBe(8);
      expect(streak.shieldBanked).toBe(1);
      expect(computeWeeklyStreak(history.filter((entry) => entry.playedAt < mondayWeeksBefore(MONDAY, 1)), mondayWeeksBefore(MONDAY, 1)).shieldBanked).toBe(0);
    });

    it('banks again at 4 weeks after a reset', () => {
      const history = [...streakWeeks(4, 1), ...streakWeeks(2, 7)];
      const streak = computeWeeklyStreak(history, MONDAY);

      expect(streak.streakWeeks).toBe(4);
      expect(streak.shieldBanked).toBe(1);
      expect(streak.shieldUsedWeekKeys).toEqual([]);
    });

    it('still reports risk when a shield is banked', () => {
      expect(computeWeeklyStreak(streakWeeks(4), at(2026, 11, 15)).atRisk).toBe(true);
    });

    it('does not use the shield for the unfinished current week', () => {
      const streak = computeWeeklyStreak(streakWeeks(4), at(2026, 11, 15, 23, 59));

      expect(streak.streakWeeks).toBe(4);
      expect(streak.shieldBanked).toBe(1);
      expect(streak.shieldUsedWeekKeys).toEqual([]);
    });

    it('lets a shielded streak go on to Relentless Silver, with the covered week not counted', () => {
      const history = [
        ...streakWeeks(2, 1),
        ...activeWeek(mondayWeeksBefore(MONDAY, 3), [0]),
        ...streakWeeks(4, 4),
      ];

      expect(computeWeeklyStreak(history, MONDAY).streakWeeks).toBe(6);
      expect(evaluateNewAchievements(history, null, MONDAY).map((award) => award.weekKey)).toEqual(['2026-W41', '2026-W45']);
    });
  });

  describe('atRisk', () => {
    const lastWeek = () => activeWeek(mondayWeeksBefore(MONDAY, 1));

    it('is false before Friday, even with no active days', () => {
      expect(computeWeeklyStreak(lastWeek(), at(2026, 11, 12)).atRisk).toBe(false);
    });

    it('is false on Friday with one active day and three days left', () => {
      expect(computeWeeklyStreak([...lastWeek(), ...activeWeek(MONDAY, [0])], at(2026, 11, 13)).atRisk).toBe(false);
    });

    it('is true on Saturday when both remaining days are needed', () => {
      expect(computeWeeklyStreak([...lastWeek(), ...activeWeek(MONDAY, [0])], at(2026, 11, 14)).atRisk).toBe(true);
    });

    it('is true when the week can no longer reach 3 days', () => {
      expect(computeWeeklyStreak(lastWeek(), at(2026, 11, 15)).atRisk).toBe(true);
    });

    it('counts today only while it is not active yet', () => {
      const history = [...lastWeek(), ...activeWeek(MONDAY, [0, 6])];

      expect(computeWeeklyStreak(history, at(2026, 11, 15, 18)).atRisk).toBe(true);
      expect(computeWeeklyStreak([...lastWeek(), ...activeWeek(MONDAY, [0, 1])], at(2026, 11, 15)).atRisk).toBe(true);
      expect(computeWeeklyStreak([...lastWeek(), ...activeWeek(MONDAY, [0, 1, 6])], at(2026, 11, 15, 18)).atRisk).toBe(false);
    });

    it('is false when there is no streak to lose', () => {
      expect(computeWeeklyStreak([], at(2026, 11, 15)).atRisk).toBe(false);
    });
  });

  describe('evaluateNewAchievements', () => {
    const weeks = (count: number) => Array.from({ length: count }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat();

    it('returns nothing below three streak weeks', () => {
      expect(evaluateNewAchievements(weeks(2), { achievements: [] }, MONDAY)).toEqual([]);
    });

    it('awards each tier reached, dated by the run that completed the week', () => {
      const awards = evaluateNewAchievements(weeks(6), null, MONDAY);

      expect(awards).toEqual([
        { id: 'weekly-streak-bronze', earnedAt: at(2026, 10, 14), weekKey: '2026-W42' },
        { id: 'weekly-streak-silver', earnedAt: at(2026, 11, 4), weekKey: '2026-W45' },
      ]);
    });

    it('skips tiers already saved, even with a different week', () => {
      const awards = evaluateNewAchievements(weeks(6), {
        achievements: [{ id: 'weekly-streak-bronze', earnedAt: 1, weekKey: '2025-W01' }],
      }, MONDAY);

      expect(awards.map((award) => award.id)).toEqual(['weekly-streak-silver']);
    });

    it('keeps a tier earned before a broken streak and does not re-award it', () => {
      const history = [
        ...activeWeek(mondayWeeksBefore(MONDAY, 8)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 7)),
        ...activeWeek(mondayWeeksBefore(MONDAY, 6)),
        ...weeks(3),
      ];
      const awards = evaluateNewAchievements(history, null, MONDAY);

      expect(awards).toHaveLength(1);
      expect(awards[0].weekKey).toBe('2026-W40');
      expect(evaluateNewAchievements(history, { achievements: awards }, MONDAY)).toEqual([]);
    });

    it('has one medal id per streak tier', () => {
      expect(STREAK_TIER_IDS).toHaveLength(STREAK_TIERS.length);
    });

    it('keys weekly awards by week and one-time awards by id', () => {
      expect(getAchievementKey({ id: 'weekly-goal-met', weekKey: '2026-W46' })).toBe('weekly-goal-met|2026-W46');
      expect(getAchievementKey({ id: 'weekly-streak-gold', weekKey: '2026-W46' })).toBe('weekly-streak-gold');
      expect(getAchievementKey({ id: 'mastery-add' })).toBe('mastery-add');
    });
  });

  describe('weekly goal', () => {
    const run = (playedAt: number, finalScore: number, correctAnswers = 17, incorrectAnswers = 3) => (
      makeRun(playedAt, { finalScore, correctAnswers, incorrectAnswers })
    );

    it('qualifies runs at 85.0% accuracy but not 84.9%', () => {
      expect(isQualifyingRun({ correctAnswers: 17, incorrectAnswers: 3 })).toBe(true);
      expect(isQualifyingRun({ correctAnswers: 849, incorrectAnswers: 151 })).toBe(false);
      expect(isQualifyingRun({ correctAnswers: 850, incorrectAnswers: 150 })).toBe(true);
    });

    it('requires at least 10 answers whatever the accuracy', () => {
      expect(isQualifyingRun({ correctAnswers: 9, incorrectAnswers: 0 })).toBe(false);
      expect(isQualifyingRun({ correctAnswers: 10, incorrectAnswers: 0 })).toBe(true);
      expect(getRunAccuracy({ correctAnswers: 0, incorrectAnswers: 0 })).toBe(0);
    });

    it('adds qualifying runs across days: 200 Mon + 300 Tue = 500 / 1000', () => {
      const progress = computeWeeklyGoalProgress([run(at(2026, 11, 9), 200), run(at(2026, 11, 10), 300)], 1000, at(2026, 11, 10, 18));

      expect(progress).toEqual({
        creditedScore: 500,
        goal: 1000,
        percent: 50,
        met: false,
        todayCredited: 300,
        todayCap: 400,
        nonQualifyingRuns: 0,
      });
    });

    it('caps one day at 40% of the goal across several runs', () => {
      const history = [run(at(2026, 11, 9, 9), 300), run(at(2026, 11, 9, 12), 250), run(at(2026, 11, 9, 15), 150)];
      const progress = computeWeeklyGoalProgress(history, 1000, at(2026, 11, 9, 20));

      expect(progress.creditedScore).toBe(400);
      expect(progress.todayCredited).toBe(400);
    });

    it('skips runs that do not qualify and counts them', () => {
      const history = [
        run(at(2026, 11, 9), 500, 849, 151),
        run(at(2026, 11, 9, 13), 500, 9, 0),
        run(at(2026, 11, 10), 200),
      ];
      const progress = computeWeeklyGoalProgress(history, 1000, at(2026, 11, 11));

      expect(progress.creditedScore).toBe(200);
      expect(progress.nonQualifyingRuns).toBe(2);
      expect(progress.todayCredited).toBe(0);
    });

    it('counts only the calendar week of now, from Monday 00:00', () => {
      const history = [run(at(2026, 11, 8, 23, 59), 300), run(at(2026, 11, 9, 0, 0), 100), run(at(2026, 11, 16, 0, 0), 300)];

      expect(computeWeeklyGoalProgress(history, 1000, at(2026, 11, 15, 23, 59)).creditedScore).toBe(100);
    });

    it('marks the goal met and caps percent at 100', () => {
      const history = [0, 1, 2].map((day) => run(at(2026, 11, 9 + day), 400));
      const progress = computeWeeklyGoalProgress(history, 1000, at(2026, 11, 12));

      expect(progress.creditedScore).toBe(1200);
      expect(progress.met).toBe(true);
      expect(progress.percent).toBe(100);
    });

    describe('describeRunGoalResult', () => {
      it('reports the credit and new percent for a qualifying run', () => {
        const first = run(at(2026, 11, 9), 200);
        const latest = run(at(2026, 11, 10), 320);

        expect(describeRunGoalResult([latest, first], latest, 1000)).toEqual({ kind: 'counted', credited: 320, percent: 52 });
      });

      it('reports partial credit when the run hits the daily cap', () => {
        const first = run(at(2026, 11, 9, 9), 300);
        const latest = run(at(2026, 11, 9, 12), 300);

        expect(describeRunGoalResult([latest, first], latest, 1000)).toEqual({ kind: 'counted', credited: 100, percent: 40 });
      });

      it('reports the cap once today is full', () => {
        const first = run(at(2026, 11, 9, 9), 500);
        const latest = run(at(2026, 11, 9, 12), 300);

        expect(describeRunGoalResult([latest, first], latest, 1000)).toEqual({ kind: 'capped' });
      });

      it('reports low accuracy with one decimal, rounded down', () => {
        const latest = run(at(2026, 11, 9), 300, 849, 151);

        expect(describeRunGoalResult([latest], latest, 1000)).toEqual({ kind: 'low-accuracy', accuracyPercent: 84.9 });
      });

      it('computes low accuracy from whole numbers, avoiding float drift', () => {
        const latest = run(at(2026, 11, 9), 300, 29, 71);

        expect(describeRunGoalResult([latest], latest, 1000)).toEqual({ kind: 'low-accuracy', accuracyPercent: 29 });
      });

      it('keeps at least 1 point of daily credit for tiny goals', () => {
        const latest = run(at(2026, 11, 9), 300);

        expect(computeWeeklyGoalProgress([latest], 1, at(2026, 11, 9, 18))).toMatchObject({ creditedScore: 1, met: true, todayCap: 1 });
      });

      it('reports runs with fewer than 10 answers', () => {
        const latest = run(at(2026, 11, 9), 300, 9, 0);

        expect(describeRunGoalResult([latest], latest, 1000)).toEqual({ kind: 'too-short' });
      });
    });
  });
});
