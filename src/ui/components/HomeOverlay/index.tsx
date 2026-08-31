import { useState } from 'react';

import { selectActiveProfileHistory } from '@store/selectors/performance';
import { buildGradeProgressSummary, buildWeeklyProgressReport } from '@store/selectors/progress';
import { useGameStore } from '@store/useGameStore';
import type { Grade } from '@shared/types';

import { gradeIcons } from '../gradeIcons';

const DAY_MS = 24 * 60 * 60 * 1000;

function toGradeTitle(grade: Grade): string {
  return grade
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatScore(value: number): string {
  return value.toLocaleString();
}

function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`;
}

function formatShortDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

export function HomeOverlay() {
  const activeUsername = useGameStore((state) => state.activeUsername);
  const grade = useGameStore((state) => state.grade);
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const history = useGameStore(selectActiveProfileHistory);
  const [now] = useState(() => Date.now());
  const weeklyReport = buildWeeklyProgressReport(history, now);
  const progress = buildGradeProgressSummary({
    currentScore: score,
    grade,
    history,
    phase,
  });
  const displayGrade = progress.effectiveGrade;
  const weekWindowLabel = `${formatShortDate(now - (6 * DAY_MS))} - ${formatShortDate(now)}`;
  const hasWeeklyProgress = weeklyReport.runsCompleted > 0;

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel home-report-panel" data-testid="home-weekly-report">
        <div className="home-report-header">
          <div className="grade-icon-wrap home-report-grade-icon-wrap">
            <img
              src={gradeIcons[displayGrade]}
              alt={`${toGradeTitle(displayGrade)} icon`}
              className="grade-icon home-report-grade-icon"
              width={160}
            />
          </div>

          <div className="home-report-copy">
            <p className="home-report-eyebrow">Weekly Progress Report</p>
            <h1>{activeUsername ?? 'Ghost'}</h1>
            <h4 className="menu-subtitle">{toGradeTitle(displayGrade)} on duty</h4>
            <p className="home-report-window">{weekWindowLabel}</p>
          </div>
        </div>

        {hasWeeklyProgress ? (
          <div className="home-report-stat-grid" aria-label="Weekly summary">
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">Runs Completed</span>
              <strong>{weeklyReport.runsCompleted}</strong>
            </div>
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">Score Earned</span>
              <strong>{formatScore(weeklyReport.scoreEarned)}</strong>
            </div>
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">Avg Accuracy</span>
              <strong>{formatAccuracy(weeklyReport.averageAccuracy)}</strong>
            </div>
          </div>
        ) : (
          <div className="home-report-empty-state" data-testid="home-weekly-empty-state" role="status">
            No completed runs in the last 7 days. Use Menu and choose Play Game to start a fresh report.
          </div>
        )}

        <section className="home-report-progress-section" aria-label="Grade progress">
          <div className="home-report-progress-header">
            <div>
              <h2>Grade Progress</h2>
              <p className="home-report-progress-note">
                Weekly recap, lifetime promotion track.
              </p>
            </div>
            <strong className="home-report-progress-score">{formatScore(progress.progressScore)} pts</strong>
          </div>

          {progress.nextGrade ? (
            <>
              <div className="profile-progress-labels home-report-progress-labels">
                <span>{formatScore(progress.currentThreshold)}</span>
                <span>Next {toGradeTitle(progress.nextGrade)}</span>
                <span>{formatScore(progress.nextThreshold ?? progress.currentThreshold)}</span>
              </div>

              <div className="profile-progress-bar home-report-progress-bar">
                <div
                  className={`profile-progress-fill home-report-progress-fill home-report-progress-fill--${displayGrade}`}
                  style={{ width: `${progress.progressRatio * 100}%` }}
                />
                <div
                  className={`profile-progress-marker home-report-progress-marker home-report-progress-marker--${displayGrade}`}
                  style={{ left: `${progress.progressRatio * 100}%` }}
                />
              </div>

              <div className="profile-points-remaining home-report-points-remaining">
                {formatScore(progress.pointsLeft)} pts to next grade
              </div>
            </>
          ) : (
            <div className="profile-major-general-box home-report-major-general-box">
              {formatScore(progress.progressScore)} lifetime points secured
            </div>
          )}

          {weeklyReport.latestRunAt ? (
            <p className="home-report-latest-run">
              Last recorded defense: {formatShortDate(weeklyReport.latestRunAt)}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
