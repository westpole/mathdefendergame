import type {
  GameHistoryEntry,
  MathOperation,
  OperationHistoryStat,
  ScoreEntry,
  Grade,
} from '@shared/types';
import { gradeOrder, passwordPolicy, GUEST_HISTORY_BUCKET } from './const';
import type { PlayerProfile, HistoryByProfile } from '@store/types';
import { resolveGradeFromScore } from '@game/config';

export function sortHistory(entries: GameHistoryEntry[]): GameHistoryEntry[] {
  return [...entries]
    .sort((left, right) => right.playedAt - left.playedAt);
}

export function isMathOperation(value: unknown): value is MathOperation {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

export function createEmptyOperationHistoryStats(): Record<MathOperation, OperationHistoryStat> {
  return {
    '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
  };
}

export function sortAndTrimScores(scores: ScoreEntry[]): ScoreEntry[] {
  return [...scores]
    .sort((left, right) => right.combined - left.combined || right.date - left.date)
    .slice(0, 10);
}

export function flattenLeaderboard(leaderboard: Record<Grade, ScoreEntry[]>): ScoreEntry[] {
  return gradeOrder.flatMap((grade) => leaderboard[grade]);
}

export function validatePassword(password: string): boolean {
  return passwordPolicy.test(password);
}

export function isGrade(value: unknown): value is Grade {
  return value === 'trainee' || value === 'cadet' || value === 'commander' || value === 'major-general';
}

export function normalizeGrade(value: unknown): Grade {
  if (isGrade(value)) {
    return value;
  }

  return 'trainee';
}

export function resolveActiveProfile(
  activeUsername: string | null,
  profiles: Record<string, PlayerProfile>,
): PlayerProfile | null {
  if (!activeUsername) {
    return null;
  }

  return profiles[activeUsername] ?? null;
}

function getLifetimeScoreForProfile(
  activeUsername: string | null,
  gameHistoryByProfile: HistoryByProfile,
): number {
  const profileKey = activeUsername ?? GUEST_HISTORY_BUCKET;

  if (!gameHistoryByProfile[profileKey]) {
    return 0;
  }

  return gameHistoryByProfile[profileKey]
    .reduce((sum, entry) => sum + entry.finalScore, 0);
}

export function resolveLifetimeGrade(
  activeUsername: string | null,
  gameHistoryByProfile: HistoryByProfile,
): Grade {
  return resolveGradeFromScore(getLifetimeScoreForProfile(activeUsername, gameHistoryByProfile));
}
