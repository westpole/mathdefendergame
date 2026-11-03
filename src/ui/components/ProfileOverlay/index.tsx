import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import { selectActiveProfileHistory } from '@store/selectors/performance';
import { buildGradeProgressSummary } from '@store/selectors/progress';
import { toGradeTitle, formatApm } from './utilities';
import { ProfileIcon } from '@ui/components/ProfileIcon';
import { GradeRequirementsList } from '@ui/components/GradeRequirementsList';

/**
 * Profile overlay component displaying user statistics and progress.
 */
export function ProfileOverlay() {
  const { t } = useTranslation();
  const activeUsername = useGameStore((state) => state.activeUsername);
  const activeProfile = useGameStore((state) => (state.activeUsername ? state.profiles[state.activeUsername] ?? null : null));
  const phase = useGameStore((state) => state.phase);
  const grade = useGameStore((state) => state.grade);
  const correctCount = useGameStore((state) => state.correctCount);
  const history = useGameStore(selectActiveProfileHistory);
  const incorrectCount = useGameStore((state) => state.incorrectCount);

  const hasUncommittedRunStats = phase === 'playing' || phase === 'paused' || phase === 'stage-message';

  const stats = useMemo(() => {
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
      gameCount,
      averageAnswersPerMinute,
      averageAccuracy,
      activeStreak,
    };
  }, [correctCount, hasUncommittedRunStats, history, incorrectCount]);

  const progress = useMemo(() => buildGradeProgressSummary(history), [history]);
  const progressGrade = progress.effectiveGrade;
  const currentGradeLabel = t(`grades.${grade}`, { defaultValue: toGradeTitle(grade) });
  const progressGradeLabel = t(`grades.${progressGrade}`, { defaultValue: toGradeTitle(progressGrade) });
  const nextGradeLabel = progress.nextGrade
    ? t(`grades.${progress.nextGrade}`, { defaultValue: toGradeTitle(progress.nextGrade) })
    : null;

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="profile-overlay">
      <section className="overlay-panel menu-page-panel profile-panel">
          <div className="overlay-header">
            <h1>{t('ui.profileTitle')}</h1>
          </div>

          <div className="profile-header">
            <ProfileIcon avatarId={activeProfile?.avatarId} label={t('ui.gradeIconLabel', { grade: currentGradeLabel })} size={120} />

            <div className="profile-stat-list">
              <div className="profile-identity-row">
                <strong className="profile-identity-label">{activeUsername ?? t('ui.guestUsername')}</strong>
              </div>

              <div className="profile-stat-grid">
                <div className="profile-stat">
                  <span className="profile-stat-label">{t('ui.avgApm')}</span>
                  <strong>{formatApm(stats.averageAnswersPerMinute)}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">{t('ui.games')}</span>
                  <strong>{stats.gameCount}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">{t('ui.avgAccuracy')}</span>
                  <strong>{`${Math.round(stats.averageAccuracy)}%`}</strong>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-label">{t('ui.activeStreak')}</span>
                  <strong>{stats.activeStreak}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-progress-section" data-testid="profile-grade-progress">
            <div className="grade-requirements-heading">
              {nextGradeLabel
                ? t('ui.nextGradeLabel', { grade: nextGradeLabel })
                : t('ui.holdGradeLabel', { grade: progressGradeLabel })}
            </div>
            <GradeRequirementsList
              operations={progress.operations}
              grade={progressGrade}
              label={t('ui.gradeRequirementsAriaLabel')}
            />
          </div>
      </section>
    </div>
  );
}
