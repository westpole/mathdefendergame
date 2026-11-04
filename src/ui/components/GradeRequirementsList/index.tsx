import { useTranslation } from 'react-i18next';

import type { Grade, GradeOperationStatus, MathOperation } from '@shared/types';
import { OPERATION_I18N_KEYS } from '@ui/constants';

const operationTestIdByOperation: Record<MathOperation, string> = {
  '+': 'addition',
  '-': 'subtraction',
  '*': 'multiplication',
  '/': 'division',
};

interface GradeRequirementsListProps {
  /** One row per required operation. */
  operations: GradeOperationStatus[];
  /** Grade whose color is used for the progress bars. */
  grade: Grade;
  /** Accessible name for the list. */
  label: string;
}

/**
 * Renders per-operation grade requirements as `current / required` rows with a bar
 * and a ✓ when the requirement is met. Shared by the Profile and Weekly Report screens
 * and the after-game grade notice.
 *
 * @example
 * <GradeRequirementsList operations={progress.operations} grade="cadet" label={t('ui.gradeRequirementsAriaLabel')} />
 */
export function GradeRequirementsList({ operations, grade, label }: GradeRequirementsListProps) {
  const { t } = useTranslation();

  return (
    <ul className="grade-requirements" aria-label={label} data-testid="grade-requirements">
      {operations.map(({ op, current, required }) => {
        const isMet = current >= required;
        const ratio = required > 0 ? Math.min(current / required, 1) : 1;
        const operationLabel = t(OPERATION_I18N_KEYS[op]);

        return (
          <li
            key={op}
            className={`grade-requirement${isMet ? ' grade-requirement--met' : ''}`}
            data-testid={`grade-requirement-${operationTestIdByOperation[op]}`}
          >
            <span className="grade-requirement__op" title={operationLabel} aria-label={operationLabel}>{op}</span>
            <div className="profile-progress-bar grade-requirement__bar" aria-hidden="true">
              <div
                className={`profile-progress-fill profile-progress-fill--${grade}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <span className="grade-requirement__value">
              {t('ui.operationRequirement', { current: current.toLocaleString(), required: required.toLocaleString() })}
              {isMet ? (
                <span className="grade-requirement__met" role="img" aria-label={t('ui.requirementMet')}>✓</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
