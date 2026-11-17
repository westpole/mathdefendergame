import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import {
  avatarIds,
  avatarImageById,
  resolveAvatarId,
  type AvatarId,
} from '@shared/avatarCatalog';
import { WEEKLY_GOAL_PRESETS } from '@store/constants';
import { computeSuggestedGoal } from '@store/selectors/achievements';
import { selectActiveProfileHistory } from '@store/selectors/performance';
import { useGameStore } from '@store/useGameStore';
import { Select, type SelectOption } from '@ui/components/Select';

const GOAL_OFF_VALUE = 'off';
const GOAL_SUGGESTED_PREFIX = 'suggested:';

/**
 * Turns a goal select value into the goal to save.
 *
 * @param value - `off`, a number, or `suggested:<number>`.
 * @returns The goal, or null for Off.
 */
function parseGoalValue(value: string): number | null {
  return value === GOAL_OFF_VALUE ? null : Number(value.replace(GOAL_SUGGESTED_PREFIX, ''));
}

interface SettingsOverlayProps {
  /** Reference time for the suggested goal. Defaults to when the screen opened; stories pin it. */
  now?: number;
}

/**
 * Settings overlay where the active player updates their avatar and weekly goal.
 * Both use one Save button.
 */
export function SettingsOverlay({ now: nowOverride }: SettingsOverlayProps = {}) {
  const { t } = useTranslation();
  const activeUsername = useGameStore((state) => state.activeUsername);
  const profiles = useGameStore((state) => state.profiles);
  const updateActiveProfileAvatar = useGameStore((state) => state.updateActiveProfileAvatar);
  const setWeeklyScoreGoal = useGameStore((state) => state.setWeeklyScoreGoal);
  const goalLabelId = useId();
  const history = useGameStore(selectActiveProfileHistory);
  const [openedAt] = useState(() => Date.now());
  const now = nowOverride ?? openedAt;
  const suggestedGoal = useMemo(() => computeSuggestedGoal(history, now), [history, now]);
  const activeProfile = activeUsername ? profiles[activeUsername] : null;
  const persistedAvatarId = resolveAvatarId(activeProfile?.avatarId);
  const [pendingAvatarId, setPendingAvatarId] = useState<AvatarId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaveAnimating, setIsSaveAnimating] = useState(false);
  const saveAnimationTimeoutRef = useRef<number | null>(null);
  const draftAvatarId = pendingAvatarId ?? persistedAvatarId;
  const persistedGoalValue = activeProfile?.weeklyScoreGoal ? String(activeProfile.weeklyScoreGoal) : GOAL_OFF_VALUE;
  const [pendingGoalValue, setPendingGoalValue] = useState<string | null>(null);
  const draftGoalValue = pendingGoalValue ?? persistedGoalValue;
  const hasAvatarChange = pendingAvatarId !== null && pendingAvatarId !== persistedAvatarId;
  const hasGoalChange = pendingGoalValue !== null
    && parseGoalValue(pendingGoalValue) !== (activeProfile?.weeklyScoreGoal ?? null);
  const hasUnsavedChanges = hasAvatarChange || hasGoalChange;
  const goalOptions: SelectOption[] = [
    { value: GOAL_OFF_VALUE, label: t('achievements.goal.off') },
    // Saved as a plain number: the goal doesn't follow later suggestions.
    ...(suggestedGoal && suggestedGoal !== activeProfile?.weeklyScoreGoal ? [{
      value: `${GOAL_SUGGESTED_PREFIX}${suggestedGoal}`,
      label: t('achievements.goal.suggested', { value: suggestedGoal.toLocaleString() }),
    }] : []),
    ...WEEKLY_GOAL_PRESETS.map((goal) => ({ value: String(goal), label: goal.toLocaleString() })),
  ];

  // Keep a saved goal visible even when it isn't one of the presets.
  if (!goalOptions.some((option) => option.value === persistedGoalValue)) {
    goalOptions.push({ value: persistedGoalValue, label: Number(persistedGoalValue).toLocaleString() });
  }

  const avatarOptions = avatarIds.map((avatarId) => ({ avatarId, src: avatarImageById[avatarId] }));

  useEffect(() => {
    return () => {
      if (saveAnimationTimeoutRef.current !== null) {
        window.clearTimeout(saveAnimationTimeoutRef.current);
      }
    };
  }, []);

  const triggerSaveAnimation = () => {
    if (saveAnimationTimeoutRef.current !== null) {
      window.clearTimeout(saveAnimationTimeoutRef.current);
    }

    setIsSaveAnimating(true);
    saveAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsSaveAnimating(false);
      saveAnimationTimeoutRef.current = null;
    }, 220);
  };

  const handleSave = () => {
    if (hasAvatarChange) {
      const result = updateActiveProfileAvatar(draftAvatarId);

      if (!result.success) {
        setErrorMessage(result.error ?? t('ui.settingsAvatarSaveError'));
        return;
      }

      setPendingAvatarId(null);
    }

    if (hasGoalChange) {
      const result = setWeeklyScoreGoal(parseGoalValue(draftGoalValue));

      if (!result.success) {
        setErrorMessage(result.error ?? t('achievements.goal.saveError'));
        return;
      }

      setPendingGoalValue(null);
    }

    setErrorMessage(null);
    triggerSaveAnimation();
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="settings-overlay">
      <section className="overlay-panel menu-page-panel settings-panel">
        <div className="overlay-header">
          <h1>{t('ui.settingsTitle')}</h1>
        </div>

        <section aria-label={t('ui.selectAvatar')} className="settings-avatar-section">
          <h2 className="settings-avatar-section__title">{t('ui.selectAvatar')}</h2>
          <div className="settings-avatar-grid">
            {avatarOptions.map(({ avatarId, src }) => {
              const isSelected = avatarId === draftAvatarId;

              return (
                <button
                  key={avatarId}
                  aria-label={t('ui.avatarOptionLabel', { id: avatarId })}
                  aria-pressed={isSelected}
                  className={clsx('settings-avatar-option', isSelected && 'settings-avatar-option--selected')}
                  data-testid={`settings-avatar-option-${avatarId}`}
                  onClick={() => setPendingAvatarId(avatarId)}
                  type="button"
                >
                  {isSelected && (
                    <span aria-hidden="true" className="settings-avatar-option__checkmark">
                      ✓
                    </span>
                  )}
                  <img alt={t('ui.avatarOptionLabel', { id: avatarId })} src={src} />
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby={goalLabelId} className="settings-goal-section" data-testid="settings-goal-section">
          <h2 className="settings-avatar-section__title" id={goalLabelId}>{t('achievements.goal.title')}</h2>
          {activeProfile ? (
            <>
              <Select
                id={`${goalLabelId}-select`}
                labelId={goalLabelId}
                onChange={setPendingGoalValue}
                options={goalOptions}
                value={draftGoalValue}
              />
              <p className="settings-goal-section__hint">{t('achievements.goal.helper')}</p>
            </>
          ) : (
            <p className="settings-goal-section__hint" data-testid="settings-goal-guest-hint">
              {t('achievements.goal.guestHint')}
            </p>
          )}
        </section>

        {errorMessage && (
          <div className="form-error-block" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="settings-actions">
          <button
            className={clsx('primary-button', 'settings-save-button', isSaveAnimating && 'settings-save-button--animating')}
            data-testid="settings-save-avatar-button"
            disabled={!hasUnsavedChanges}
            onClick={handleSave}
            type="button"
          >
            {t('ui.save')}
          </button>
        </div>
      </section>
    </div>
  );
}
