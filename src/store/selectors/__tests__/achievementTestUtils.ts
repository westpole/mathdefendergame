import type { GameHistoryEntry, MathOperation } from '@shared/types';

let entryCounter = 0;

/**
 * Builds a history entry for achievement selector tests.
 *
 * @param playedAt - Run timestamp.
 * @param overrides - Fields to override (correct answers default to 10, one active day).
 * @returns A complete history entry.
 */
export function makeRun(playedAt: number, overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
  entryCounter += 1;

  return {
    key: `run-${entryCounter}`,
    playedAt,
    correctAnswers: 10,
    incorrectAnswers: 0,
    averageAnswerTimeMs: 2000,
    mostProblematicOperation: null,
    operationStats: {
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    },
    gradeAtFinish: 'trainee',
    finalScore: 100,
    finalPerfScore: 100,
    mode: 'regular',
    ...overrides,
  };
}

/**
 * Builds per-operation stats with only one operation filled in.
 *
 * @param op - Operation to fill.
 * @param attempts - Attempts for that operation.
 * @param incorrect - Incorrect answers for that operation.
 * @param avgTimeMs - Average answer time for that operation.
 * @returns Operation stats for a history entry.
 */
export function statsFor(
  op: MathOperation,
  attempts: number,
  incorrect: number,
  avgTimeMs: number,
): GameHistoryEntry['operationStats'] {
  const empty = { attempts: 0, incorrect: 0, avgTimeMs: 0 };

  return {
    '+': { ...empty },
    '-': { ...empty },
    '*': { ...empty },
    '/': { ...empty },
    [op]: { attempts, incorrect, avgTimeMs },
  };
}

/**
 * Local timestamp at noon for a calendar date.
 *
 * @param year - Full year.
 * @param month - 1-based month.
 * @param day - Day of the month.
 * @param hour - Local hour (default noon).
 * @param minute - Local minute.
 * @returns Timestamp in milliseconds.
 */
export function at(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

/**
 * Builds one active-day run on each of the given days of the week that starts on `monday`.
 *
 * @param monday - Local Monday timestamp (any time of day).
 * @param dayOffsets - 0 for Monday … 6 for Sunday.
 * @returns One qualifying run per day.
 */
export function activeWeek(monday: number, dayOffsets: number[] = [0, 1, 2]): GameHistoryEntry[] {
  const base = new Date(monday);

  return dayOffsets.map((offset) => makeRun(
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 12).getTime(),
  ));
}

/**
 * Local Monday noon `weeksBack` weeks before the week of `monday`.
 *
 * @param monday - Local Monday timestamp.
 * @param weeksBack - Weeks to go back (0 returns the same Monday).
 * @returns Timestamp in milliseconds.
 */
export function mondayWeeksBefore(monday: number, weeksBack: number): number {
  const base = new Date(monday);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - (7 * weeksBack), 12).getTime();
}
