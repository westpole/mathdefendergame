import { SubmitEvent, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import { CreateProfileForm } from '@ui/components/CreateProfileForm';
import { Select, type SelectOption } from '@ui/components/Select';
import { LANGUAGE_OPTIONS } from '@ui/constants';

type SelectorMode = 'select' | 'create';

/**
 * Profile selector component allowing users to select or create profiles.
 */
export function ProfileSelector() {
  const { t, i18n } = useTranslation();
  const profiles = useGameStore((state) => state.profiles);
  const rememberedUsername = useGameStore((state) => state.rememberedUsername);
  const selectProfileByUsername = useGameStore((state) => state.selectProfileByUsername);
  const triggerId = 'profile-selector-username';
  const labelId = useId();
  const languageLabelId = useId();
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('select');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedUsername));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const language = i18n.resolvedLanguage ?? 'en';

  const profileUsernames = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);
  const profileOptions = useMemo<SelectOption[]>(
    () => profileUsernames.map((username) => ({ value: username, label: username })),
    [profileUsernames],
  );
  const selectedUsernameIsValid = profileUsernames.includes(selectedUsername);
  const rememberedUsernameIsValid = Boolean(rememberedUsername && profileUsernames.includes(rememberedUsername));
  const currentSelectedUsername = selectedUsernameIsValid
    ? selectedUsername
    : rememberedUsernameIsValid
      ? rememberedUsername ?? ''
      : '';

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentSelectedUsername.trim()) {
      setErrorMessage(t('auth.chooseProfile'));
      return;
    }

    const result = selectProfileByUsername(currentSelectedUsername, rememberMe);

    if (!result.success) {
      setErrorMessage(result.error ?? t('errors.profileUnavailable'));
      return;
    }

    setErrorMessage(null);
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="profile-selector-screen">
      <div className="overlay-panel login-panel">
        <h1>{t('ui.profileSelectTitle')}</h1>
        <p className="menu-subtitle login-subtitle">
          {selectorMode === 'select' ? t('ui.selectYourUsername') : t('ui.createProfilePrompt')}
        </p>

        {selectorMode === 'select' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" id={labelId}>{t('ui.username')}</label>
            <Select
              id={triggerId}
              labelId={labelId}
              onChange={(username) => {
                setSelectedUsername(username);
                setErrorMessage(null);
              }}
              options={profileOptions}
              placeholder={t('ui.profileSelectPlaceholder')}
              value={currentSelectedUsername}
            />

            <label className="field-label" id={languageLabelId}>{t('ui.profileSelectionLabel')}</label>
            <Select
              id="profile-language-select"
              labelId={languageLabelId}
              onChange={(nextLanguage) => {
                void i18n.changeLanguage(nextLanguage);
              }}
              options={LANGUAGE_OPTIONS}
              value={language}
            />

            {profileUsernames.length === 0 && (
              <div className="form-error-block" role="status">
                {t('ui.noProfilesFound')}
              </div>
            )}

            {errorMessage && (
              <div className="form-error-block" role="alert">
                {errorMessage}
              </div>
            )}

            <label className="checkbox-row" htmlFor="remember-profile-login">
              <input
                checked={rememberMe}
                id="remember-profile-login"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
                disabled={!selectedUsernameIsValid}
              />
              {t('ui.rememberMe')}
            </label>

            <div className="login-actions">
              <button className="primary-button" disabled={profileUsernames.length === 0} type="submit">
                {t('ui.login')}
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setErrorMessage(null);
                  setSelectorMode('create');
                }}
                type="button"
              >
                {t('ui.createProfile')}
              </button>
            </div>
          </form>
        ) : (
          <CreateProfileForm
            onCancel={() => {
              setErrorMessage(null);
              setSelectorMode('select');
            }}
          />
        )}
      </div>
    </div>
  );
}
