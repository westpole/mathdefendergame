import { WEEKLY_ACHIEVEMENT_IDS } from '@shared/constants';
import type { AchievementId, EarnedAchievement, GameHistoryEntry } from '@shared/types';
import {
  ACTIVE_DAY_MIN_CORRECT,
  DAY_MS,
  STREAK_MIN_DAYS_PER_WEEK,
  STREAK_TIERS,
} from '@store/constants';
import type { PlayerProfile } from '@store/types';
import type { WeeklyStreakSummary } from './types';

/**
 * Pads a number to two digits for date keys.
 *
 * @param value - Month, day, or week number.
 * @returns The value as a two-digit string.
 */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Returns the weekday index with Monday as 0 and Sunday as 6.
 *
 * @param ts - Timestamp in milliseconds.
 * @returns The local weekday index.
 */
export function toMondayBasedWeekday(ts: number): number {
  return (new Date(ts).getDay() + 6) % 7;
}

/**
 * Returns local Monday 00:00 of the calendar week that contains a timestamp.
 *
 * @param ts - Timestamp in milliseconds.
 * @returns The week start as a timestamp.
 * @example
 * startOfLocalWeek(new Date(2026, 10, 15, 23, 59).getTime()); // Mon 9 Nov 2026 00:00
 */
export function startOfLocalWeek(ts: number): number {
  const date = new Date(ts);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - toMondayBasedWeekday(ts)).getTime();
}

/**
 * Moves a local date by whole days. Uses the Date constructor, so the result stays at
 * the same wall-clock time across DST changes.
 *
 * @param ts - Timestamp in milliseconds.
 * @param days - Days to add (negative to go back).
 * @returns The shifted timestamp.
 */
export function addLocalDays(ts: number, days: number): number {
  const date = new Date(ts);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ).getTime();
}

/**
 * Builds the local day key for a timestamp.
 *
 * @param ts - Timestamp in milliseconds.
 * @returns A key such as `2026-11-15`.
 */
export function toDayKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Builds the ISO week key (ISO week-year and week number) for a timestamp in local time.
 *
 * @param ts - Timestamp in milliseconds.
 * @returns A key such as `2026-W46`. 31 Dec 2024 gives `2025-W01`.
 */
export function toWeekKey(ts: number): string {
  const date = new Date(ts);
  // The ISO week belongs to the year of its Thursday.
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - toMondayBasedWeekday(ts) + 3);
  const isoYear = thursday.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4 - toMondayBasedWeekday(new Date(isoYear, 0, 4).getTime()) + 3);
  // Round to absorb the one-hour DST offset between the two dates.
  const daysBetween = Math.round((thursday.getTime() - firstThursday.getTime()) / DAY_MS);

  return `${isoYear}-W${pad2(Math.floor(daysBetween / 7) + 1)}`;
}

/**
 * Finds when each local day became active: the time of the run that took the day's
 * total correct answers to `ACTIVE_DAY_MIN_CORRECT`. Days that never got there are left out.
 *
 * @param history - Runs in any order.
 * @returns Activation timestamp keyed by day key.
 */
function buildActiveDayReachedAt(history: GameHistoryEntry[]): Map<string, number> {
  const correctByDay = new Map<string, number>();
  const reachedAtByDay = new Map<string, number>();

  for (const entry of [...history].sort((left, right) => left.playedAt - right.playedAt)) {
    const dayKey = toDayKey(entry.playedAt);
    const total = (correctByDay.get(dayKey) ?? 0) + entry.correctAnswers;
    correctByDay.set(dayKey, total);

    if (total >= ACTIVE_DAY_MIN_CORRECT && !reachedAtByDay.has(dayKey)) {
      reachedAtByDay.set(dayKey, entry.playedAt);
    }
  }

  return reachedAtByDay;
}

/**
 * Groups active-day activation times by calendar week, earliest first.
 *
 * @param history - Runs in any order.
 * @returns Sorted activation timestamps keyed by week key.
 */
function buildActiveDayTimesByWeek(history: GameHistoryEntry[]): Map<string, number[]> {
  const timesByWeek = new Map<string, number[]>();

  for (const reachedAt of buildActiveDayReachedAt(history).values()) {
    const weekKey = toWeekKey(reachedAt);
    timesByWeek.set(weekKey, [...(timesByWeek.get(weekKey) ?? []), reachedAt]);
  }

  for (const times of timesByWeek.values()) {
    times.sort((left, right) => left - right);
  }

  return timesByWeek;
}

/**
 * Groups active days by calendar week. A day is active when its runs total at least
 * `ACTIVE_DAY_MIN_CORRECT` correct answers; it counts once however many runs it has.
 *
 * @param history - Runs in any order (practice and regular both count).
 * @returns Active day keys keyed by week key.
 * @example
 * buildActiveDaysByWeek(history).get('2026-W46')?.size; // 2
 */
export function buildActiveDaysByWeek(history: GameHistoryEntry[]): Map<string, Set<string>> {
  const activeDaysByWeek = new Map<string, Set<string>>();

  for (const [weekKey, times] of buildActiveDayTimesByWeek(history)) {
    activeDaysByWeek.set(weekKey, new Set(times.map(toDayKey)));
  }

  return activeDaysByWeek;
}

/** The week at which the streak first reached a given length. */
interface StreakMilestone {
  weekKey: string;
  /** When that week became a streak week (the run that made its last required active day). */
  reachedAt: number;
}

/** Result of walking the calendar weeks from the oldest run to the current week. */
interface StreakWalk {
  streakWeeks: number;
  /** First time the streak reached each length. */
  firstReachedByLength: Map<number, StreakMilestone>;
}

/**
 * Walks every calendar week from the oldest run's week to the current week, counting
 * streak weeks in a row. Completed short weeks break the streak; the current week only
 * adds to it once it reaches the minimum and never breaks it.
 *
 * @param timesByWeek - Output of `buildActiveDayTimesByWeek`.
 * @param oldestPlayedAt - Timestamp of the oldest run, or null with no history.
 * @param now - Reference time.
 * @returns The streak length now and when each length was first reached.
 */
function walkStreakWeeks(
  timesByWeek: Map<string, number[]>,
  oldestPlayedAt: number | null,
  now: number,
): StreakWalk {
  const firstReachedByLength = new Map<number, StreakMilestone>();
  let streakWeeks = 0;

  if (oldestPlayedAt === null) {
    return { streakWeeks, firstReachedByLength };
  }

  const currentWeekStart = startOfLocalWeek(now);

  for (
    let weekStart = startOfLocalWeek(oldestPlayedAt);
    weekStart <= currentWeekStart;
    weekStart = addLocalDays(weekStart, 7)
  ) {
    const weekKey = toWeekKey(weekStart);
    const activeDayTimes = timesByWeek.get(weekKey) ?? [];

    if (activeDayTimes.length >= STREAK_MIN_DAYS_PER_WEEK) {
      streakWeeks += 1;

      if (!firstReachedByLength.has(streakWeeks)) {
        firstReachedByLength.set(streakWeeks, {
          weekKey,
          reachedAt: activeDayTimes[STREAK_MIN_DAYS_PER_WEEK - 1],
        });
      }
    } else if (weekStart < currentWeekStart) {
      streakWeeks = 0;
    }
  }

  return { streakWeeks, firstReachedByLength };
}

/**
 * Builds the shared weekly streak walk from history. Runs after `now` are ignored.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns Active-day times by week and the streak walk.
 */
function buildStreakWalk(
  history: GameHistoryEntry[],
  now: number,
): { timesByWeek: Map<string, number[]>; walk: StreakWalk } {
  const pastEntries = history.filter((entry) => entry.playedAt <= now);
  const timesByWeek = buildActiveDayTimesByWeek(pastEntries);
  const oldestPlayedAt = pastEntries.length > 0
    ? pastEntries.reduce((oldest, entry) => Math.min(oldest, entry.playedAt), Infinity)
    : null;

  return { timesByWeek, walk: walkStreakWeeks(timesByWeek, oldestPlayedAt, now) };
}

/**
 * Summarizes the weekly streak (the Relentless medal's rule) at a point in time.
 *
 * @param history - Runs in any order.
 * @param now - Reference time; the current week is the calendar week containing it.
 * @returns Streak length, this week's active days, and days still needed.
 * @example
 * const streak = computeWeeklyStreak(history, Date.now());
 * // { streakWeeks: 2, thisWeekActiveDays: 1, thisWeekActiveDayKeys: ['2026-11-09'], daysNeeded: 2 }
 */
export function computeWeeklyStreak(history: GameHistoryEntry[], now: number): WeeklyStreakSummary {
  const { timesByWeek, walk } = buildStreakWalk(history, now);
  const thisWeekActiveDayKeys = (timesByWeek.get(toWeekKey(now)) ?? []).map(toDayKey);
  const thisWeekActiveDays = thisWeekActiveDayKeys.length;

  return {
    streakWeeks: walk.streakWeeks,
    thisWeekActiveDays,
    thisWeekActiveDayKeys,
    daysNeeded: Math.max(0, STREAK_MIN_DAYS_PER_WEEK - thisWeekActiveDays),
  };
}

/**
 * Returns the seven local days (Monday to Sunday) of the week containing `now`.
 *
 * @param now - Reference time.
 * @returns Day key and local midnight timestamp for each day, Monday first.
 */
export function buildWeekDays(now: number): Array<{ dayKey: string; startsAt: number }> {
  const weekStart = startOfLocalWeek(now);

  return Array.from({ length: 7 }, (_, index) => {
    const startsAt = addLocalDays(weekStart, index);
    return { dayKey: toDayKey(startsAt), startsAt };
  });
}

/**
 * Returns the next Relentless tier the streak has not reached yet.
 *
 * @param streakWeeks - Current streak length.
 * @param tiers - Tier thresholds in ascending order.
 * @returns The index and week count of the next tier, or null when every tier is reached.
 */
export function findNextStreakTier(
  streakWeeks: number,
  tiers: readonly number[],
): { index: number; weeks: number } | null {
  const index = tiers.findIndex((weeks) => weeks > streakWeeks);
  return index === -1 ? null : { index, weeks: tiers[index] };
}

/** Relentless medal ids in `STREAK_TIERS` order. */
export const STREAK_TIER_IDS = [
  'weekly-streak-bronze',
  'weekly-streak-silver',
  'weekly-streak-gold',
] as const satisfies readonly AchievementId[];

/** Inputs shared by every award evaluator. */
export interface AchievementEvaluationContext {
  history: GameHistoryEntry[];
  now: number;
  /** Profile fields the evaluators read. Null for guests. */
  profile: Pick<PlayerProfile, 'achievements'> | null;
  /** False for the silent check on login, so awards that must not be backfilled are skipped. */
  isAfterRun: boolean;
}

/** Returns every award the history currently earns for one badge type (saved or not). */
type AchievementEvaluator = (context: AchievementEvaluationContext) => EarnedAchievement[];

/**
 * Relentless medals: each tier is earned the first time the streak reaches its length.
 *
 * @param context - Evaluation inputs.
 * @returns One award per tier reached, dated when that week qualified.
 */
const evaluateStreakMedals: AchievementEvaluator = ({ history, now }) => {
  const { walk } = buildStreakWalk(history, now);

  return STREAK_TIERS.flatMap((weeks, index) => {
    const milestone = walk.firstReachedByLength.get(weeks);
    return milestone
      ? [{ id: STREAK_TIER_IDS[index], earnedAt: milestone.reachedAt, weekKey: milestone.weekKey }]
      : [];
  });
};

/** Badge evaluators, in the order their awards are announced. Later badges add one here. */
const ACHIEVEMENT_EVALUATORS: AchievementEvaluator[] = [evaluateStreakMedals];

/**
 * Builds the key that makes an award unique: id and week for weekly awards, the id alone
 * for one-time awards (streak tiers, per-operation mastery).
 *
 * @param achievement - Award to key.
 * @returns The deduplication key.
 */
export function getAchievementKey(achievement: Pick<EarnedAchievement, 'id' | 'weekKey'>): string {
  return WEEKLY_ACHIEVEMENT_IDS.includes(achievement.id)
    ? `${achievement.id}|${achievement.weekKey ?? ''}`
    : achievement.id;
}

/**
 * Returns only the awards the history earns that the profile has not saved yet.
 *
 * @param history - Runs in any order for the profile (or guest).
 * @param profile - Profile with its saved awards, or null to get every earned award (guests).
 * @param now - Reference time.
 * @param options - `isAfterRun: false` for the silent check on login (default true).
 * @returns New awards, deduplicated, in evaluator order.
 * @example
 * const newAwards = evaluateNewAchievements(history, profile, Date.now());
 */
export function evaluateNewAchievements(
  history: GameHistoryEntry[],
  profile: Pick<PlayerProfile, 'achievements'> | null,
  now: number,
  { isAfterRun = true }: { isAfterRun?: boolean } = {},
): EarnedAchievement[] {
  const seenKeys = new Set((profile?.achievements ?? []).map(getAchievementKey));
  const context: AchievementEvaluationContext = { history, now, profile, isAfterRun };
  const newAchievements: EarnedAchievement[] = [];

  for (const evaluate of ACHIEVEMENT_EVALUATORS) {
    for (const achievement of evaluate(context)) {
      const key = getAchievementKey(achievement);

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}
