import { MATH_OPERATIONS, WEEKLY_ACHIEVEMENT_IDS } from '@shared/constants';
import type { AchievementId, EarnedAchievement, GameHistoryEntry, MathOperation } from '@shared/types';
import {
  ACTIVE_DAY_MIN_CORRECT,
  BASELINE_MIN_WEEKS,
  BASELINE_WEEKS,
  DAY_MS,
  FOCUS_PRACTICE_RUNS_REQUIRED,
  FOCUS_WINDOW_WEEKS,
  GOAL_DAILY_CAP_RATIO,
  GOAL_MIN_ACCURACY,
  GOAL_MIN_ANSWERS,
  GOAL_SUGGESTION_MULTIPLIER,
  GOAL_SUGGESTION_ROUND_TO,
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
 * Returns the start of the following calendar week. Re-derived with `startOfLocalWeek`
 * so every week key comes from one function, even where local midnight is skipped by DST.
 *
 * @param weekStart - A week start from `startOfLocalWeek`.
 * @returns The next week's start.
 */
export function nextWeekStart(weekStart: number): number {
  return startOfLocalWeek(addLocalDays(weekStart, 7));
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
    weekStart = nextWeekStart(weekStart)
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

/** Profile fields the award evaluators read. */
export type AchievementProfile = Pick<PlayerProfile, 'achievements' | 'weeklyScoreGoal'>;

/** Inputs shared by every award evaluator. */
export interface AchievementEvaluationContext {
  history: GameHistoryEntry[];
  now: number;
  /** Profile fields the evaluators read. Null for guests. */
  profile: AchievementProfile | null;
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
  profile: AchievementProfile | null,
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

/**
 * Groups runs up to `now` by the local Monday 00:00 of their week, and lists every week
 * start from the oldest run's week to the week of `now` (empty weeks included).
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns Runs keyed by week start, and all week starts oldest first (the last one is
 * the week of `now`).
 */
function groupRunsByWeek(
  history: GameHistoryEntry[],
  now: number,
): { runsByWeek: Map<number, GameHistoryEntry[]>; weekStarts: number[] } {
  const runsByWeek = new Map<number, GameHistoryEntry[]>();
  let oldest = Infinity;

  for (const entry of history) {
    if (entry.playedAt > now) {
      continue;
    }

    const weekStart = startOfLocalWeek(entry.playedAt);
    const bucket = runsByWeek.get(weekStart);

    if (bucket) {
      bucket.push(entry);
    } else {
      runsByWeek.set(weekStart, [entry]);
    }

    oldest = Math.min(oldest, entry.playedAt);
  }

  const weekStarts: number[] = [];

  if (oldest !== Infinity) {
    const currentWeekStart = startOfLocalWeek(now);

    for (let weekStart = startOfLocalWeek(oldest); weekStart <= currentWeekStart; weekStart = nextWeekStart(weekStart)) {
      weekStarts.push(weekStart);
    }
  }

  return { runsByWeek, weekStarts };
}

/**
 * Sums credited score for a set of runs.
 *
 * @param runs - Runs in any order.
 * @param dailyCap - Most score one day can add, or Infinity.
 * @returns Total credited score.
 */
function sumCredit(runs: GameHistoryEntry[], dailyCap: number): number {
  return [...creditQualifyingRuns(runs, dailyCap).byDay.values()].reduce((sum, value) => sum + value, 0);
}

/** Credited score per `weekStart|dailyCap`, shared within one evaluation pass. */
type WeekCreditCache = Map<string, number>;

/**
 * Averages credited score over the given complete weeks.
 *
 * @param runsByWeek - Runs keyed by week start.
 * @param priorWeekStarts - Complete weeks to average (at most `BASELINE_WEEKS`).
 * @param dailyCap - Most score one day can add, or Infinity.
 * @param cache - Optional per-pass cache of week credit.
 * @returns The average, or null with fewer than `BASELINE_MIN_WEEKS` weeks.
 */
function averageWeeklyCredit(
  runsByWeek: Map<number, GameHistoryEntry[]>,
  priorWeekStarts: number[],
  dailyCap: number,
  cache: WeekCreditCache = new Map(),
): number | null {
  if (priorWeekStarts.length < BASELINE_MIN_WEEKS) {
    return null;
  }

  const total = priorWeekStarts.reduce((sum, weekStart) => {
    const key = `${weekStart}|${dailyCap}`;
    let credit = cache.get(key);

    if (credit === undefined) {
      credit = sumCredit(runsByWeek.get(weekStart) ?? [], dailyCap);
      cache.set(key, credit);
    }

    return sum + credit;
  }, 0);
  return total / priorWeekStarts.length;
}

/**
 * Turns an uncapped baseline into a suggested goal.
 *
 * @param baseline - Uncapped baseline, or null.
 * @returns Baseline × `GOAL_SUGGESTION_MULTIPLIER` rounded to `GOAL_SUGGESTION_ROUND_TO`, or null when not positive.
 */
function suggestFromBaseline(baseline: number | null): number | null {
  if (baseline === null) {
    return null;
  }

  const suggestion = Math.round((baseline * GOAL_SUGGESTION_MULTIPLIER) / GOAL_SUGGESTION_ROUND_TO) * GOAL_SUGGESTION_ROUND_TO;
  return suggestion > 0 ? suggestion : null;
}

/**
 * Returns the complete weeks (at most `BASELINE_WEEKS`) right before the week at `index`.
 *
 * @param weekStarts - All week starts, oldest first.
 * @param index - Position of the week being checked.
 * @returns The prior week starts.
 */
function priorWeeksOf(weekStarts: number[], index: number): number[] {
  return weekStarts.slice(Math.max(0, index - BASELINE_WEEKS), index);
}

/**
 * Averages credited score over the last `BASELINE_WEEKS` complete weeks before the week
 * of `now`, including weeks with no credit. Needs `BASELINE_MIN_WEEKS` complete weeks
 * since the first run.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @param goal - Weekly goal whose daily cap applies; uncapped when omitted.
 * @returns The baseline, or null with too little history.
 * @example
 * computeFourWeekBaseline(history, Date.now(), 1000); // 800
 */
export function computeFourWeekBaseline(history: GameHistoryEntry[], now: number, goal?: number): number | null {
  const { runsByWeek, weekStarts } = groupRunsByWeek(history, now);
  return averageWeeklyCredit(runsByWeek, priorWeeksOf(weekStarts, weekStarts.length - 1), goal ? getDailyGoalCap(goal) : Infinity);
}

/**
 * Suggests a weekly goal: the uncapped 4-week baseline × `GOAL_SUGGESTION_MULTIPLIER`,
 * rounded to the nearest `GOAL_SUGGESTION_ROUND_TO`.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns The suggestion, or null with too little history or a zero baseline.
 * @example
 * computeSuggestedGoal(history, Date.now()); // baseline 800 → 900
 */
export function computeSuggestedGoal(history: GameHistoryEntry[], now: number): number | null {
  return suggestFromBaseline(computeFourWeekBaseline(history, now));
}

/** Personal-best status for one week. */
export interface PersonalBestStatus {
  /** Baseline to beat, or null with fewer than `BASELINE_MIN_WEEKS` complete weeks before it. */
  baseline: number | null;
  /** Credited score for the week so far. */
  creditedScore: number;
  /** When the week's credit first passed the baseline, or null if it hasn't. */
  beatenAt: number | null;
}

/**
 * Personal-best status for one week from pre-grouped runs. Credit uses the goal's daily
 * cap; with no goal, the cap of the suggested goal (uncapped if there is none). The
 * current goal is used for past weeks too (goals aren't stored per week), so changing the
 * goal can let the login check backfill a past week; saved awards are never removed.
 *
 * @param runsByWeek - Runs keyed by week start.
 * @param weekStarts - All week starts, oldest first.
 * @param index - Position of the week being checked.
 * @param goal - The profile's weekly goal, if any.
 * @param cache - Optional per-pass cache of week credit.
 * @returns The baseline, the week's credit, and when it beat the baseline.
 */
function personalBestForWeek(
  runsByWeek: Map<number, GameHistoryEntry[]>,
  weekStarts: number[],
  index: number,
  goal: number | undefined,
  cache: WeekCreditCache = new Map(),
): PersonalBestStatus {
  const priorWeeks = priorWeeksOf(weekStarts, index);
  const effectiveGoal = goal ?? suggestFromBaseline(averageWeeklyCredit(runsByWeek, priorWeeks, Infinity, cache)) ?? undefined;
  const dailyCap = effectiveGoal ? getDailyGoalCap(effectiveGoal) : Infinity;
  const baseline = averageWeeklyCredit(runsByWeek, priorWeeks, dailyCap, cache);
  const weekRuns = [...(runsByWeek.get(weekStarts[index]) ?? [])].sort((left, right) => left.playedAt - right.playedAt);
  const { byRun } = creditQualifyingRuns(weekRuns, dailyCap);
  let creditedScore = 0;
  let beatenAt: number | null = null;

  for (const entry of weekRuns) {
    creditedScore += byRun.get(entry.key) ?? 0;

    if (beatenAt === null && baseline !== null && creditedScore > baseline) {
      beatenAt = entry.playedAt;
    }
  }

  return { baseline, creditedScore, beatenAt };
}

/**
 * Works out whether the week of `now` beats the player's own baseline (complete weeks
 * before it), counting runs up to `now`.
 *
 * @param history - Runs in any order.
 * @param goal - The profile's weekly goal, if any.
 * @param now - Reference time.
 * @returns The baseline, the week's credit, and when it beat the baseline.
 */
export function computePersonalBestStatus(
  history: GameHistoryEntry[],
  goal: number | undefined,
  now: number,
): PersonalBestStatus {
  const { runsByWeek, weekStarts } = groupRunsByWeek(history, now);

  if (weekStarts.length === 0) {
    return { baseline: null, creditedScore: 0, beatenAt: null };
  }

  return personalBestForWeek(runsByWeek, weekStarts, weekStarts.length - 1, goal);
}

/**
 * Goal Met: the profile's weekly goal is reached this week. Checked only after a run,
 * so it is never backfilled (the goal didn't exist for past weeks).
 *
 * @param context - Evaluation inputs.
 * @returns The award for the current week, or nothing.
 */
const evaluateGoalMet: AchievementEvaluator = ({ history, now, profile, isAfterRun }) => {
  const goal = profile?.weeklyScoreGoal;

  if (!isAfterRun || !goal || !computeWeeklyGoalProgress(history, goal, now).met) {
    return [];
  }

  return [{ id: 'weekly-goal-met', earnedAt: now, weekKey: toWeekKey(now) }];
};

/**
 * Personal Best Week: a week's credit beats the player's baseline. Every week since
 * the first run is checked (runs are grouped once), so past weeks are backfilled.
 *
 * @param context - Evaluation inputs.
 * @returns One award per week that beat its baseline.
 */
const evaluatePersonalBest: AchievementEvaluator = ({ history, now, profile }) => {
  const { runsByWeek, weekStarts } = groupRunsByWeek(history, now);
  const cache: WeekCreditCache = new Map();

  return weekStarts.flatMap((weekStart, index) => {
    if (!runsByWeek.has(weekStart)) {
      return [];
    }

    const { beatenAt } = personalBestForWeek(runsByWeek, weekStarts, index, profile?.weeklyScoreGoal, cache);
    return beatenAt === null
      ? []
      : [{ id: 'personal-best-week' as const, earnedAt: beatenAt, weekKey: toWeekKey(weekStart) }];
  });
};

/**
 * Returns the operation a practice run trained. History doesn't store it, so this is the
 * operation with the most attempts (ties go to the first in `+ - * /` order). Practice runs
 * drill a single operation, so this is exact for them; it is a best guess for anything else.
 *
 * @param entry - A saved run.
 * @returns The operation for a practice run with attempts, otherwise null.
 */
export function getPracticeRunOperation(entry: GameHistoryEntry): MathOperation | null {
  if (entry.mode !== 'practice') {
    return null;
  }

  let best: MathOperation | null = null;

  for (const operation of MATH_OPERATIONS) {
    const attempts = entry.operationStats[operation]?.attempts ?? 0;

    if (attempts > 0 && (best === null || attempts > entry.operationStats[best].attempts)) {
      best = operation;
    }
  }

  return best;
}

/** Running per-operation attempt totals. */
type OperationTotals = Record<MathOperation, { attempts: number; incorrect: number }>;

/**
 * Creates zeroed per-operation totals.
 *
 * @returns Totals for every operation.
 */
function createOperationTotals(): OperationTotals {
  return {
    '+': { attempts: 0, incorrect: 0 },
    '-': { attempts: 0, incorrect: 0 },
    '*': { attempts: 0, incorrect: 0 },
    '/': { attempts: 0, incorrect: 0 },
  };
}

/**
 * Adds runs' per-operation stats to running totals.
 *
 * @param totals - Totals to update in place.
 * @param runs - Runs to add.
 */
function addOperationTotals(totals: OperationTotals, runs: GameHistoryEntry[]): void {
  for (const entry of runs) {
    for (const operation of MATH_OPERATIONS) {
      totals[operation].attempts += entry.operationStats[operation]?.attempts ?? 0;
      totals[operation].incorrect += entry.operationStats[operation]?.incorrect ?? 0;
    }
  }
}

/**
 * Accuracy for one operation from totals.
 *
 * @param totals - Per-operation totals.
 * @param operation - Operation to measure.
 * @returns Accuracy from 0 to 1; 1 when there are no attempts (not a weak spot).
 */
function totalsAccuracy(totals: OperationTotals, operation: MathOperation): number {
  const { attempts, incorrect } = totals[operation];
  return attempts > 0 ? (attempts - incorrect) / attempts : 1;
}

/**
 * Picks the most frequent `mostProblematicOperation` among runs. Ties go to the lower
 * accuracy in `totalsBefore`, then to `+ - * /` order.
 *
 * @param windowRuns - Runs in the focus window.
 * @param totalsBefore - Lifetime totals before the week being picked for.
 * @returns The focus operation, or null when no run flagged one.
 */
function pickFocusOperation(windowRuns: GameHistoryEntry[], totalsBefore: OperationTotals): MathOperation | null {
  const counts = new Map<MathOperation, number>();

  for (const entry of windowRuns) {
    if (entry.mostProblematicOperation) {
      counts.set(entry.mostProblematicOperation, (counts.get(entry.mostProblematicOperation) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  const candidates = MATH_OPERATIONS.filter((operation) => counts.has(operation));
  const topCount = Math.max(...candidates.map((operation) => counts.get(operation) ?? 0));

  return candidates
    .filter((operation) => counts.get(operation) === topCount)
    .reduce((best, operation) => (
      totalsAccuracy(totalsBefore, operation) < totalsAccuracy(totalsBefore, best) ? operation : best
    ));
}

/**
 * Counts qualifying practice runs in one operation, earliest first.
 *
 * @param weekRuns - Runs in the week, up to the reference time.
 * @param operation - Focus operation.
 * @returns Run count and when the required run was played.
 */
function countFocusRuns(weekRuns: GameHistoryEntry[], operation: MathOperation): { practiceRuns: number; completedAt: number | null } {
  const focusRuns = weekRuns
    .filter((entry) => isQualifyingRun(entry) && getPracticeRunOperation(entry) === operation)
    .sort((left, right) => left.playedAt - right.playedAt);

  return {
    practiceRuns: focusRuns.length,
    completedAt: focusRuns[FOCUS_PRACTICE_RUNS_REQUIRED - 1]?.playedAt ?? null,
  };
}

/**
 * Picks the focus operation for the week containing `now`: the most frequent
 * `mostProblematicOperation` over the `FOCUS_WINDOW_WEEKS` weeks before the week starts,
 * so it stays fixed all week. Ties go to the lower lifetime accuracy (before the week),
 * then to `+ - * /` order.
 *
 * @param history - Runs in any order.
 * @param now - Reference time.
 * @returns The focus operation, or null when no run in the window flagged one.
 * @example
 * selectFocusOperation(history, Date.now()); // '*'
 */
export function selectFocusOperation(history: GameHistoryEntry[], now: number): MathOperation | null {
  const weekStart = startOfLocalWeek(now);
  const windowStart = startOfLocalWeek(addLocalDays(weekStart, -7 * FOCUS_WINDOW_WEEKS));
  const before = history.filter((entry) => entry.playedAt < weekStart);
  const totalsBefore = createOperationTotals();
  addOperationTotals(totalsBefore, before);

  return pickFocusOperation(before.filter((entry) => entry.playedAt >= windowStart), totalsBefore);
}

/** Progress toward Focus of the Week for one week. */
export interface FocusProgress {
  operation: MathOperation | null;
  /** Qualifying practice runs in the focus operation so far this week. */
  practiceRuns: number;
  required: number;
  /** When the required run was played, or null. */
  completedAt: number | null;
}

/**
 * Counts this week's qualifying practice runs in the focus operation.
 *
 * @param history - Runs in any order.
 * @param now - Reference time; the week containing it is checked, up to `now`.
 * @returns The focus operation and progress toward `FOCUS_PRACTICE_RUNS_REQUIRED`.
 */
export function computeFocusProgress(history: GameHistoryEntry[], now: number): FocusProgress {
  const operation = selectFocusOperation(history, now);
  const { practiceRuns, completedAt } = operation === null
    ? { practiceRuns: 0, completedAt: null }
    : countFocusRuns(selectWeekRuns(history, now), operation);

  return { operation, practiceRuns, required: FOCUS_PRACTICE_RUNS_REQUIRED, completedAt };
}

/**
 * Focus of the Week: enough qualifying practice runs in the week's focus operation.
 * Every week with runs is checked (runs grouped once, lifetime totals kept as a running
 * sum), so past weeks are backfilled.
 *
 * @param context - Evaluation inputs.
 * @returns One award per week that completed its focus.
 */
const evaluateFocusOfTheWeek: AchievementEvaluator = ({ history, now }) => {
  const { runsByWeek, weekStarts } = groupRunsByWeek(history, now);
  const totalsBefore = createOperationTotals();
  const awards: EarnedAchievement[] = [];

  weekStarts.forEach((weekStart, index) => {
    const weekRuns = runsByWeek.get(weekStart);

    if (weekRuns) {
      const windowRuns = weekStarts
        .slice(Math.max(0, index - FOCUS_WINDOW_WEEKS), index)
        .flatMap((priorWeekStart) => runsByWeek.get(priorWeekStart) ?? []);
      const operation = pickFocusOperation(windowRuns, totalsBefore);
      const completedAt = operation ? countFocusRuns(weekRuns, operation).completedAt : null;

      if (operation && completedAt !== null) {
        awards.push({ id: 'focus-of-the-week', earnedAt: completedAt, weekKey: toWeekKey(weekStart), operation });
      }

      addOperationTotals(totalsBefore, weekRuns);
    }
  });

  return awards;
};

/** Badge evaluators, in the order their awards are announced. Later badges add one here. */
const ACHIEVEMENT_EVALUATORS: AchievementEvaluator[] = [
  evaluateStreakMedals,
  evaluateGoalMet,
  evaluatePersonalBest,
  evaluateFocusOfTheWeek,
];
