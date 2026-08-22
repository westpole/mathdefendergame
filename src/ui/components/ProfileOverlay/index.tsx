import { useMemo } from 'react';

import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';
import type { Grade } from '@shared/types';

import { gradeIcons } from '../gradeIcons';

const gradeOrder: Grade[] = ['trainee', 'cadet', 'commander', 'major-general'];
const EMPTY_HISTORY: Array<{
  finalScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageAnswerTimeMs: number;
}> = [];
const gradeColorMap: Record<Exclude<Grade, 'major-general'>, string> = {
  trainee: '#ef4444',
  cadet: '#facc15',
  commander: '#22c55e',
};

function toGradeTitle(grade: Grade): string {
  return grade
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatScore(value: number): string {
  return value.toLocaleString();
}

function formatApm(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ProfileOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const phase = useGameStore((state) => state.phase);
  const grade = useGameStore((state) => state.grade);
  const currentScore = useGameStore((state) => state.score);
  const correctCount = useGameStore((state) => state.correctCount);
  const history = useGameStore((state) => {
    const key = state.activeUsername ?? '__guest__';
    return state.gameHistoryByProfile[key] ?? EMPTY_HISTORY;
  });
  const incorrectCount = useGameStore((state) => state.incorrectCount);

  const hasUncommittedRunStats = phase === 'playing' || phase === 'paused' || phase === 'stage-message';

  const stats = useMemo(() => {
    const totalScore = history.reduce((sum, entry) => sum + entry.finalScore, 0);
    const gameCount = history.length;
    const historyCorrectAnswers = history.reduce((sum, entry) => sum + entry.correctAnswers, 0);
    const historyIncorrectAnswers = history.reduce((sum, entry) => sum + entry.incorrectAnswers, 0);
    const historyResolvedAnswers = historyCorrectAnswers + historyIncorrectAnswers;
    const totalResolvedAnswerTimeMs = history.reduce(
      (sum, entry) => sum + ((entry.correctAnswers + entry.incorrectAnswers) * entry.averageAnswerTimeMs),
      0,
    );
    const totalCorrectAnswers = historyCorrectAnswers + (hasUncommittedRunStats ? correctCount : 0);
    const totalIncorrectAnswers = historyIncorrectAnswers + (hasUncommittedRunStats ? incorrectCount : 0);
    const averageAccuracy = totalCorrectAnswers + totalIncorrectAnswers > 0
      ? (totalCorrectAnswers / (totalCorrectAnswers + totalIncorrectAnswers)) * 100
      : 0;
    const averageAnswersPerMinute = historyResolvedAnswers > 0 && totalResolvedAnswerTimeMs > 0
      ? (historyCorrectAnswers * 60_000) / totalResolvedAnswerTimeMs
      : 0;
    const activeStreak = history.length > 0
      ? Math.max(...history.map((entry) => entry.correctAnswers), correctCount)
      : correctCount;

    return {
      totalScore,
      gameCount,
      averageAnswersPerMinute,
      averageAccuracy,
      activeStreak,
    };
  }, [correctCount, hasUncommittedRunStats, history, incorrectCount]);

  const progressScore = Math.max(stats.totalScore + (hasUncommittedRunStats ? Math.max(currentScore, 0) : 0), 0);
  const currentIndex = gradeOrder.indexOf(grade);
  const currentThreshold = GAME_CONFIG.grades[grade].thresholdScore;
  const nextGrade = currentIndex < gradeOrder.length - 1 ? gradeOrder[currentIndex + 1] : null;
  const nextThreshold = nextGrade ? GAME_CONFIG.grades[nextGrade].thresholdScore : null;
  const pointsLeft = nextThreshold !== null ? Math.max(nextThreshold - progressScore, 0) : 0;
  const progressRatio = nextThreshold !== null && nextThreshold > currentThreshold
    ? Math.min(Math.max((progressScore - currentThreshold) / (nextThreshold - currentThreshold), 0), 1)
    : 0;
  const trackColor = grade === 'trainee' ? gradeColorMap.trainee
    : grade === 'cadet' ? gradeColorMap.cadet
    : grade === 'commander' ? gradeColorMap.commander
    : '#4b5563';

  return (
    <div className="grid-container" data-testid="profile-overlay">
      <div className="contentBox">
        <section className="overlay-panel menu-page-panel profile-panel">
          <div className="overlay-header">
            <h1>PROFILE</h1>
          </div>

          <div className="profile-header">
            <div className="profile-grade-icon-wrap">
              <img
                alt={`${toGradeTitle(grade)} icon`}
                className="profile-grade-icon"
                src={gradeIcons[grade]}
                width={96}
              />
            </div>

            <div className="profile-stat-list">
              <div className="profile-identity-row">
                <strong className="profile-identity-label">{activeUsername ?? 'Ghost'}</strong>
              </div>

              <div className="profile-stat-grid">
                <div className="profile-stat">
                  <span className="profile-stat-label">Avg. APM</span>
                  <strong>{formatApm(stats.averageAnswersPerMinute)}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">Games</span>
                  <strong>{stats.gameCount}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">Avg Accuracy</span>
                  <strong>{`${Math.round(stats.averageAccuracy)}%`}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">Active Streak</span>
                  <strong>{stats.activeStreak}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-progress-section">
            {grade === 'major-general' ? (
              <div className="profile-major-general-box" style={{ backgroundColor: '#4b5563', color: '#fff' }}>
                <span>{formatScore(progressScore)}</span>
              </div>
            ) : (
              <>
                <div className="profile-progress-labels">
                  <span>{formatScore(currentThreshold)}</span>
                  <span>{nextGrade ? `Next ${toGradeTitle(nextGrade)}` : 'Top grade'}</span>
                  <span>{formatScore(nextThreshold ?? currentThreshold)}</span>
                </div>

                <div className="profile-progress-bar" style={{ width: '100%', height: '25px' }}>
                  <div
                    className="profile-progress-fill"
                    style={{ width: `${progressRatio * 100}%`, backgroundColor: trackColor }}
                  />
                  <div
                    className="profile-progress-marker"
                    style={{ left: `${progressRatio * 100}%`, backgroundColor: trackColor }}
                  />
                </div>

                <div className="profile-points-remaining">
                  {formatScore(pointsLeft)} pts to next grade
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
