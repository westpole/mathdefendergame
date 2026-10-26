import { SubmitEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import { CreateProfileForm } from '@ui/components/CreateProfileForm';

type AuthMode = 'login' | 'create';

/**
 * Renders the player access screen for logging in or creating a profile.
 *
 * The form switches between login and creation modes, validates credentials via
 * the game store, and shows any authentication errors returned by the store.
 */
export function LoginOverlay() {
  const { t } = useTranslation();
  const loginProfile = useGameStore((state) => state.loginProfile);
  const [activeMode, setActiveMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, [activeMode]);

  const switchMode = (mode: AuthMode) => {
    setActiveMode(mode);
    setErrorMessage(null);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginProfile(username, password, keepLoggedIn);

    if (!result.success) {
      setErrorMessage(result.error ?? t('auth.authenticationFailed'));
      return;
    }

    setErrorMessage(null);
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="login-screen">
      <div className="overlay-panel login-panel">
        <h1>{t('ui.playerAccessTitle')}</h1>
        <p className="menu-subtitle login-subtitle">
          {activeMode === 'login' ? t('ui.playerAccessLoginHint') : t('ui.playerAccessCreateHint')}
        </p>

        {activeMode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="login-username">{t('ui.username')}</label>
            <input
              id="login-username"
              className="text-input"
              autoFocus
              maxLength={20}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t('ui.yourUsername')}
              ref={usernameInputRef}
              value={username}
            />

            <label className="field-label" htmlFor="login-password">{t('ui.password')}</label>
            <input
              id="login-password"
              className="text-input"
              maxLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('ui.yourPassword')}
              type="password"
              value={password}
            />

            <label className="checkbox-row" htmlFor="keep-logged-in">
              <input
                id="keep-logged-in"
                checked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
                type="checkbox"
              />
              {t('ui.keepLoggedIn')}
            </label>

            {errorMessage && (
              <div className="form-error-block" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="login-actions">
              <button className="primary-button" type="submit">
                {t('ui.login')}
              </button>
              <button className="secondary-button" onClick={() => switchMode('create')} type="button">
                {t('ui.createProfile')}
              </button>
            </div>
          </form>
        ) : (
          <CreateProfileForm onCancel={() => switchMode('login')} simpleMode={false} />
        )}
      </div>
    </div>
  );
}
