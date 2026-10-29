import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import {
  avatarIds,
  avatarImageById,
  resolveAvatarId,
  type AvatarId,
} from '@shared/avatarCatalog';
import { useGameStore } from '@store/useGameStore';

/**
 * Settings overlay that allows the active player to update profile avatar.
 */
export function SettingsOverlay() {
  const { t } = useTranslation();
  const activeUsername = useGameStore((state) => state.activeUsername);
  const profiles = useGameStore((state) => state.profiles);
  const updateActiveProfileAvatar = useGameStore((state) => state.updateActiveProfileAvatar);
  const activeProfile = activeUsername ? profiles[activeUsername] : null;
  const persistedAvatarId = resolveAvatarId(activeProfile?.avatarId);
  const [pendingAvatarId, setPendingAvatarId] = useState<AvatarId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const draftAvatarId = pendingAvatarId ?? persistedAvatarId;
  const hasUnsavedChanges = pendingAvatarId !== null && pendingAvatarId !== persistedAvatarId;

  const avatarOptions = avatarIds.map((avatarId) => ({ avatarId, src: avatarImageById[avatarId] }));

  const handleSave = () => {
    const result = updateActiveProfileAvatar(draftAvatarId);

    if (!result.success) {
      setErrorMessage(result.error ?? t('ui.settingsAvatarSaveError'));
      return;
    }

    setPendingAvatarId(null);
    setErrorMessage(null);
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

        {errorMessage && (
          <div className="form-error-block" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="settings-actions">
          <button
            className="primary-button"
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
