import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import { GradeRequirementsList } from '@ui/components/GradeRequirementsList';

import { toGradeTitle } from '../ProfileOverlay/utilities';

/**
 * After-game message for a grade change, shown on top of whatever screen follows the
 * run (game-over screen, home menu, or profile). Reads `gradeNotice` from the store and
 * renders nothing when there is none.
 *
 * Promotion: the new grade. Demotion: the new grade plus the operations that fell below
 * the previous grade's requirements. The button, Escape, or Enter dismisses it.
 */
export function GradeNoticeOverlay() {
  const { t } = useTranslation();
  const gradeNotice = useGameStore((state) => state.gradeNotice);
  const dismissGradeNotice = useGameStore((state) => state.dismissGradeNotice);

  useEffect(() => {
    if (!gradeNotice) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        dismissGradeNotice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gradeNotice, dismissGradeNotice]);

  if (!gradeNotice) {
    return null;
  }

  const { kind, fromGrade, toGrade, operations } = gradeNotice;
  const toGradeLabel = t(`grades.${toGrade}`, { defaultValue: toGradeTitle(toGrade) });
  const fromGradeLabel = t(`grades.${fromGrade}`, { defaultValue: toGradeTitle(fromGrade) });
  const isPromotion = kind === 'promoted';

  return (
    <div className="overlay-screen overlay-screen--interactive grade-notice-screen" data-testid="grade-notice-overlay">
      <section
        className={`overlay-panel grade-notice-panel grade-notice-panel--${kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-notice-title"
      >
        <div className="overlay-header">
          <h1 id="grade-notice-title">
            {isPromotion ? t('ui.gradePromotedTitle') : t('ui.gradeDemotedTitle')}
          </h1>
        </div>

        <p className={`grade-notice-grade grade-notice-grade--${toGrade}`} data-testid="grade-notice-grade">
          {toGradeLabel}
        </p>

        <p className="grade-notice-body">
          {isPromotion
            ? t('ui.gradePromotedBody', { grade: toGradeLabel })
            : t('ui.gradeDemotedBody', { grade: fromGradeLabel })}
        </p>

        {!isPromotion && operations.length > 0 ? (
          <GradeRequirementsList
            operations={operations}
            grade={fromGrade}
            label={t('ui.gradeRequirementsAriaLabel')}
          />
        ) : null}

        <div className="action-row center-content">
          <button
            className="primary-button"
            type="button"
            data-testid="grade-notice-dismiss"
            onClick={dismissGradeNotice}
            autoFocus
          >
            {t('ui.gradeNoticeDismiss')}
          </button>
        </div>
      </section>
    </div>
  );
}
