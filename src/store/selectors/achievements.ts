import type { GameHistoryEntry } from '@shared/types';
import {
  ACTIVE_DAY_MIN_CORRECT,
  DAY_MS,
  STREAK_MIN_DAYS_PER_WEEK,
} from '@store/constants';
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
 * Returns local midnight of the day that contains a timestamp.
 * Built from local date parts, so DST changes never shift the day.
 *
 * @param ts - Timestamp in milliseconds.
 * @returns Local midnight as a timestamp.
 */
export function startOfLocalDay(ts: number): number {
  const date = new Date(ts);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
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
 * Sums correct answers per local day.
 *
 * @param history - Runs in any order.
 * @returns Correct answers keyed by day key.
 */
function sumCorrectByDay(history: GameHistoryEntry[]): Map<string, number> {
  const correctByDay = new Map<string, number>();

  for (const entry of history) {
    const dayKey = toDayKey(entry.playedAt);
    correctByDay.set(dayKey, (correctByDay.get(dayKey) ?? 0) + entry.correctAnswers);
  }

  return correctByDay;
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
  const correctByDay = sumCorrectByDay(history);
  const dayStartByKey = new Map<string, number>();

  for (const entry of history) {
    dayStartByKey.set(toDayKey(entry.playedAt), startOfLocalDay(entry.playedAt));
  }

  const activeDaysByWeek = new Map<string, Set<string>>();

  for (const [dayKey, correct] of correctByDay) {
    if (correct < ACTIVE_DAY_MIN_CORRECT) {
      continue;
    }

    const weekKey = toWeekKey(dayStartByKey.get(dayKey) ?? 0);
    const days = activeDaysByWeek.get(weekKey) ?? new Set<string>();
    days.add(dayKey);
    activeDaysByWeek.set(weekKey, days);
  }

  return activeDaysByWeek;
}

/** Result of walking the calendar weeks from the oldest run to the current week. */
interface StreakWalk {
  streakWeeks: number;
  /** First week key at which the streak reached each length. */
  firstWeekKeyByLength: Map<number, string>;
}

/**
 * Walks every calendar week from the oldest run's week to the current week, counting
 * streak weeks in a row. Completed short weeks break the streak; the current week only
 * adds to it once it reaches the minimum and never breaks it.
 *
 * @param activeDaysByWeek - Output of `buildActiveDaysByWeek`.
 * @param oldestPlayedAt - Timestamp of the oldest run, or null with no history.
 * @param now - Reference time.
 * @returns The streak length now and the week each length was first reached.
 */
function walkStreakWeeks(
  activeDaysByWeek: Map<string, Set<string>>,
  oldestPlayedAt: number | null,
  now: number,
): StreakWalk {
  const firstWeekKeyByLength = new Map<number, string>();
  let streakWeeks = 0;

  if (oldestPlayedAt === null) {
    return { streakWeeks, firstWeekKeyByLength };
  }

  const currentWeekStart = startOfLocalWeek(now);

  for (
    let weekStart = startOfLocalWeek(oldestPlayedAt);
    weekStart <= currentWeekStart;
    weekStart = addLocalDays(weekStart, 7)
  ) {
    const weekKey = toWeekKey(weekStart);
    const isStreakWeek = (activeDaysByWeek.get(weekKey)?.size ?? 0) >= STREAK_MIN_DAYS_PER_WEEK;

    if (isStreakWeek) {
      streakWeeks += 1;

      if (!firstWeekKeyByLength.has(streakWeeks)) {
        firstWeekKeyByLength.set(streakWeeks, weekKey);
      }
    } else if (weekStart < currentWeekStart) {
      streakWeeks = 0;
    }
  }

  return { streakWeeks, firstWeekKeyByLength };
}

/**
 * Builds the shared weekly streak walk from history. Runs after `now` are ignored.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns Active days by week and the streak walk.
 */
function buildStreakWalk(
  history: GameHistoryEntry[],
  now: number,
): { activeDaysByWeek: Map<string, Set<string>>; walk: StreakWalk } {
  const pastEntries = history.filter((entry) => entry.playedAt <= now);
  const activeDaysByWeek = buildActiveDaysByWeek(pastEntries);
  const oldestPlayedAt = pastEntries.length > 0
    ? pastEntries.reduce((oldest, entry) => Math.min(oldest, entry.playedAt), Infinity)
    : null;

  return { activeDaysByWeek, walk: walkStreakWeeks(activeDaysByWeek, oldestPlayedAt, now) };
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
  const { activeDaysByWeek, walk } = buildStreakWalk(history, now);
  const thisWeekActiveDayKeys = [...(activeDaysByWeek.get(toWeekKey(now)) ?? [])].sort();
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
