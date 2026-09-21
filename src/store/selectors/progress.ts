import { GAME_CONFIG, resolveGradeFromScore } from '@game/config';
import type { GameHistoryEntry } from '@shared/types';
import { WEEK_MS, ACTIVE_PROGRESS_PHASES } from '@store/const';
import type { BuildGradeProgressInput, GradeProgressSummary, WeeklyProgressReport } from './types';

export function buildGradeProgressSummary({
  currentScore,
  grade,
  history,
  phase,
}: BuildGradeProgressInput): GradeProgressSummary {
  const progressScore = Math.max(
    history.reduce((sum, entry) => sum + entry.finalScore, 0)
      + (ACTIVE_PROGRESS_PHASES.has(phase) ? Math.max(currentScore, 0) : 0),
    0,
  );
  const effectiveGrade = history.length > 0 ? resolveGradeFromScore(progressScore) : grade;
  const gradeOrder = GAME_CONFIG.gradeOrder;
  const currentIndex = gradeOrder.indexOf(effectiveGrade);
  const currentThreshold = GAME_CONFIG.grades[effectiveGrade].thresholdScore;
  const nextGrade = currentIndex < gradeOrder.length - 1 ? gradeOrder[currentIndex + 1] : null;
  const nextThreshold = nextGrade ? GAME_CONFIG.grades[nextGrade].thresholdScore : null;
  const pointsLeft = nextThreshold !== null ? Math.max(nextThreshold - progressScore, 0) : 0;
  const progressRatio = nextThreshold !== null && nextThreshold > currentThreshold
    ? Math.min(Math.max((progressScore - currentThreshold) / (nextThreshold - currentThreshold), 0), 1)
    : 0;

  return {
    effectiveGrade,
    progressScore,
    currentThreshold,
    nextGrade,
    nextThreshold,
    pointsLeft,
    progressRatio,
  };
}

export function buildWeeklyProgressReport(
  history: GameHistoryEntry[],
  now: number = Date.now(),
): WeeklyProgressReport {
  const cutoff = now - WEEK_MS;
  const weeklyEntries = history.filter((entry) => entry.playedAt >= cutoff && entry.playedAt <= now);
  const totalCorrectAnswers = weeklyEntries.reduce((sum, entry) => sum + entry.correctAnswers, 0);
  const totalIncorrectAnswers = weeklyEntries.reduce((sum, entry) => sum + entry.incorrectAnswers, 0);
  const resolvedAnswers = totalCorrectAnswers + totalIncorrectAnswers;

  return {
    averageAccuracy: resolvedAnswers > 0 ? (totalCorrectAnswers / resolvedAnswers) * 100 : 0,
    latestRunAt: weeklyEntries.length > 0 ? weeklyEntries[0].playedAt : null,
    runsCompleted: weeklyEntries.length,
    scoreEarned: weeklyEntries.reduce((sum, entry) => sum + entry.finalScore, 0),
  };
}
