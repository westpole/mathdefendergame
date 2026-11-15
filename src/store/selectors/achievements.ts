import { WEEKLY_ACHIEVEMENT_IDS } from '@shared/constants';
import type { AchievementId, EarnedAchievement, GameHistoryEntry } from '@shared/types';
import {
  ACTIVE_DAY_MIN_CORRECT,
  DAY_MS,
  GOAL_DAILY_CAP_RATIO,
  GOAL_MIN_ACCURACY,
  GOAL_MIN_ANSWERS,
  SHIELD_EVERY_N_WEEKS,
  SHIELD_MAX_BANKED,
  STREAK_MIN_DAYS_PER_WEEK,
  STREAK_TIERS,
} from '@store/constants';
import type { PlayerProfile } from '@store/types';
import type { RunGoalResult, WeeklyGoalProgress, WeeklyStreakSummary } from './types';

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
  /** Shields banked now. */
  shieldBanked: number;
  /** Completed short weeks covered by a shield, oldest first. */
  shieldUsedWeekKeys: string[];
}

/**
 * Walks every calendar week from the oldest run's week to the current week, counting
 * streak weeks in a row. Every `SHIELD_EVERY_N_WEEKS` streak weeks bank a shield (at most
 * `SHIELD_MAX_BANKED`). A completed short week uses a banked shield (the streak continues
 * without counting that week) or else breaks the streak. The current week only adds to
 * the streak once it reaches the minimum and never breaks it. Shields are never saved:
 * they are worked out from history every time.
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
  const shieldUsedWeekKeys: string[] = [];
  let streakWeeks = 0;
  let shieldBanked = 0;

  if (oldestPlayedAt === null) {
    return { streakWeeks, firstReachedByLength, shieldBanked, shieldUsedWeekKeys };
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

      if (streakWeeks % SHIELD_EVERY_N_WEEKS === 0) {
        shieldBanked = Math.min(shieldBanked + 1, SHIELD_MAX_BANKED);
      }
    } else if (weekStart < currentWeekStart) {
      if (streakWeeks > 0 && shieldBanked > 0) {
        shieldBanked -= 1;
        shieldUsedWeekKeys.push(weekKey);
      } else {
        streakWeeks = 0;
        shieldBanked = 0;
      }
    }
  }

  return { streakWeeks, firstReachedByLength, shieldBanked, shieldUsedWeekKeys };
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
 * @returns Streak length, this week's active days, days still needed, shield state and risk.
 * @example
 * const streak = computeWeeklyStreak(history, Date.now());
 * // { streakWeeks: 2, thisWeekActiveDays: 1, daysNeeded: 2, shieldBanked: 0, atRisk: false, ... }
 */
export function computeWeeklyStreak(history: GameHistoryEntry[], now: number): WeeklyStreakSummary {
  const { timesByWeek, walk } = buildStreakWalk(history, now);
  const thisWeekActiveDayKeys = (timesByWeek.get(toWeekKey(now)) ?? []).map(toDayKey);
  const thisWeekActiveDays = thisWeekActiveDayKeys.length;
  const daysNeeded = Math.max(0, STREAK_MIN_DAYS_PER_WEEK - thisWeekActiveDays);
  const weekday = toMondayBasedWeekday(now);
  const isTodayActive = thisWeekActiveDayKeys.includes(toDayKey(now));
  // Days still open for practice this week, including today when it isn't active yet.
  const daysLeft = (6 - weekday) + (isTodayActive ? 0 : 1);

  return {
    streakWeeks: walk.streakWeeks,
    thisWeekActiveDays,
    thisWeekActiveDayKeys,
    daysNeeded,
    shieldBanked: walk.shieldBanked,
    shieldUsedWeekKeys: walk.shieldUsedWeekKeys,
    // From Friday on, a streak is at risk when it needs every remaining day (or more).
    atRisk: walk.streakWeeks > 0 && daysNeeded > 0 && weekday >= 4 && daysLeft <= daysNeeded,
  };
}

/**
 * Returns the week key of the calendar week before the one containing `now`.
 *
 * @param now - Reference time.
 * @returns The previous week's key.
 */
export function toPreviousWeekKey(now: number): string {
  return toWeekKey(addLocalDays(startOfLocalWeek(now), -7));
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

/**
 * Returns a run's accuracy as a share of its answers.
 *
 * @param entry - A saved run.
 * @returns Accuracy from 0 to 1 (0 when the run has no answers).
 */
export function getRunAccuracy(entry: Pick<GameHistoryEntry, 'correctAnswers' | 'incorrectAnswers'>): number {
  const answers = entry.correctAnswers + entry.incorrectAnswers;
  return answers > 0 ? entry.correctAnswers / answers : 0;
}

/**
 * Checks whether a run counts toward the weekly goal: at least `GOAL_MIN_ANSWERS`
 * answers and `GOAL_MIN_ACCURACY` accuracy.
 *
 * @param entry - A saved run.
 * @returns True when the run qualifies.
 */
export function isQualifyingRun(entry: Pick<GameHistoryEntry, 'correctAnswers' | 'incorrectAnswers'>): boolean {
  return entry.correctAnswers + entry.incorrectAnswers >= GOAL_MIN_ANSWERS
    && getRunAccuracy(entry) >= GOAL_MIN_ACCURACY;
}

/**
 * Returns the most score one day can add toward a weekly goal.
 *
 * @param goal - Weekly goal.
 * @returns The daily cap, rounded to a whole number and at least 1.
 */
export function getDailyGoalCap(goal: number): number {
  return Math.max(1, Math.round(goal * GOAL_DAILY_CAP_RATIO));
}

/**
 * Credits qualifying runs in play order, capping each day's total at `dailyCap`.
 *
 * @param entries - Runs to credit (any order; non-qualifying runs are skipped).
 * @param dailyCap - Most score one day can add, or Infinity for no cap.
 * @returns Credited score per run key, and per day key.
 */
export function creditQualifyingRuns(
  entries: GameHistoryEntry[],
  dailyCap: number,
): { byRun: Map<string, number>; byDay: Map<string, number> } {
  const byRun = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const entry of [...entries].sort((left, right) => left.playedAt - right.playedAt)) {
    if (!isQualifyingRun(entry)) {
      continue;
    }

    const dayKey = toDayKey(entry.playedAt);
    const creditedToday = byDay.get(dayKey) ?? 0;
    const credited = Math.max(0, Math.min(entry.finalScore, dailyCap - creditedToday));
    byRun.set(entry.key, credited);
    byDay.set(dayKey, creditedToday + credited);
  }

  return { byRun, byDay };
}

/**
 * Returns the runs played in the calendar week of `now`, up to `now`.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns This week's runs.
 */
function selectWeekRuns(history: GameHistoryEntry[], now: number): GameHistoryEntry[] {
  const weekStart = startOfLocalWeek(now);
  return history.filter((entry) => entry.playedAt >= weekStart && entry.playedAt <= now);
}

/**
 * Works out progress toward a weekly goal for the calendar week of `now`. Only
 * qualifying runs count, and at most `GOAL_DAILY_CAP_RATIO` of the goal per day,
 * credited in play order.
 *
 * @param history - Runs in any order.
 * @param goal - Weekly goal (positive).
 * @param now - Reference time.
 * @returns Credited score, percent, today's credit and cap, and runs that didn't count.
 * @example
 * computeWeeklyGoalProgress(history, 1000, Date.now()); // { creditedScore: 500, percent: 50, ... }
 */
export function computeWeeklyGoalProgress(
  history: GameHistoryEntry[],
  goal: number,
  now: number,
): WeeklyGoalProgress {
  const weekRuns = selectWeekRuns(history, now);
  const todayCap = getDailyGoalCap(goal);
  const { byDay } = creditQualifyingRuns(weekRuns, todayCap);
  const creditedScore = [...byDay.values()].reduce((sum, value) => sum + value, 0);

  return {
    creditedScore,
    goal,
    percent: Math.min(100, (creditedScore / goal) * 100),
    met: creditedScore >= goal,
    todayCredited: byDay.get(toDayKey(now)) ?? 0,
    todayCap,
    nonQualifyingRuns: weekRuns.filter((entry) => !isQualifyingRun(entry)).length,
  };
}

/**
 * Describes how one saved run counted toward the weekly goal, for the Game Over screen.
 *
 * @param history - Runs in any order, including `entry`.
 * @param entry - The run to describe.
 * @param goal - Weekly goal (positive).
 * @returns Counted (with credit and new percent), capped, low accuracy, or too short.
 */
export function describeRunGoalResult(
  history: GameHistoryEntry[],
  entry: GameHistoryEntry,
  goal: number,
): RunGoalResult {
  const answers = entry.correctAnswers + entry.incorrectAnswers;

  if (answers < GOAL_MIN_ANSWERS) {
    return { kind: 'too-short' };
  }

  if (!isQualifyingRun(entry)) {
    // Integer maths, floored to one decimal, so 84.96% never reads as 85%.
    return { kind: 'low-accuracy', accuracyPercent: Math.floor((entry.correctAnswers * 1000) / answers) / 10 };
  }

  const { byRun } = creditQualifyingRuns(selectWeekRuns(history, entry.playedAt), getDailyGoalCap(goal));
  const credited = byRun.get(entry.key) ?? 0;

  if (credited === 0) {
    return { kind: 'capped' };
  }

  return { kind: 'counted', credited, percent: computeWeeklyGoalProgress(history, goal, entry.playedAt).percent };
}
