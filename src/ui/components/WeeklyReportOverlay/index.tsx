import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectActiveProfileHistory } from '@store/selectors/performance';
import { buildGradeProgressSummary, buildWeeklyProgressReport } from '@store/selectors/progress';
import { useGameStore } from '@store/useGameStore';
import { ProfileIcon } from '@ui/components/ProfileIcon';

import { formatShortDate, formatScore, formatAccuracy, toGradeTitle } from '../HomeOverlay/utilities';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dedicated weekly report view for the active profile.
 */
export function WeeklyReportOverlay() {
  const { t } = useTranslation();
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
  const displayGradeLabel = t(`grades.${displayGrade}`, { defaultValue: toGradeTitle(displayGrade) });
  const iconGradeLabel = t(`grades.${grade}`, { defaultValue: toGradeTitle(grade) });
  const nextGradeLabel = progress.nextGrade
    ? t(`grades.${progress.nextGrade}`, { defaultValue: toGradeTitle(progress.nextGrade) })
    : null;
  const weekWindowLabel = `${formatShortDate(now - (6 * DAY_MS))} - ${formatShortDate(now)}`;
  const hasWeeklyProgress = weeklyReport.runsCompleted > 0;

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="weekly-report-overlay">
      <div className="overlay-panel home-report-panel" data-testid="home-weekly-report">
        <div className="home-report-header">
          <ProfileIcon label={t('ui.gradeIconLabel', { grade: iconGradeLabel })} size={120} />

          <div className="home-report-copy">
            <p className="home-report-eyebrow">{t('ui.weeklyProgressReportTitle')}</p>
            <h1>{activeUsername ?? t('ui.guestUsername')}</h1>
            <h4 className="menu-subtitle">{t('ui.gradeOnDuty', { grade: displayGradeLabel })}</h4>
            <p className="home-report-window">{weekWindowLabel}</p>
          </div>
        </div>

        {hasWeeklyProgress ? (
          <div className="home-report-stat-grid" aria-label={t('ui.weeklySummaryAriaLabel')}>
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">{t('ui.runsCompleted')}</span>
              <strong>{weeklyReport.runsCompleted}</strong>
            </div>
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">{t('ui.scoreEarned')}</span>
              <strong>{formatScore(weeklyReport.scoreEarned)}</strong>
            </div>
            <div className="home-report-stat-card">
              <span className="home-report-stat-label">{t('ui.avgAccuracy')}</span>
              <strong>{formatAccuracy(weeklyReport.averageAccuracy)}</strong>
            </div>
          </div>
        ) : (
          <div className="home-report-empty-state" data-testid="home-weekly-empty-state" role="status">
            {t('ui.noCompletedRunsLast7Days')}
          </div>
        )}

        <section className="home-report-progress-section" aria-label={t('ui.gradeProgressAriaLabel')}>
          <div className="home-report-progress-header">
            <div>
              <h2>{t('ui.gradeProgressTitle')}</h2>
              <p className="home-report-progress-note">
                {t('ui.weeklyRecapLifetimePromotion')}
              </p>
            </div>
            <strong className="home-report-progress-score">
              {t('ui.pointsShortLabel', { count: formatScore(progress.progressScore) })}
            </strong>
          </div>

          {progress.nextGrade ? (
            <>
              <div className="profile-progress-labels home-report-progress-labels">
                <span>{formatScore(progress.currentThreshold)}</span>
                <span>{nextGradeLabel ? t('ui.nextGradeLabel', { grade: nextGradeLabel }) : t('ui.topGrade')}</span>
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
                {t('ui.pointsToNextGrade', { count: formatScore(progress.pointsLeft) })}
              </div>
            </>
          ) : (
            <div className="profile-major-general-box home-report-major-general-box">
              {t('ui.lifetimePointsSecured', { count: formatScore(progress.progressScore) })}
            </div>
          )}

          {weeklyReport.latestRunAt ? (
            <p className="home-report-latest-run">
              {t('ui.lastRecordedDefense', { date: formatShortDate(weeklyReport.latestRunAt) })}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
