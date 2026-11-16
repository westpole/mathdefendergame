import { SubmitEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';

interface CreateProfileFormProps {
  onCancel?: () => void;
}

/**
 * Renders the create-profile form used during login flow startup.
 *
 * Only a username is required. A successful submission creates the profile and
 * immediately logs it in through the store. Validation errors are surfaced inline.
 *
 * @param props - The form configuration and optional cancel callback.
 * @param props.onCancel - Optional callback invoked when the user cancels the form.
 * @returns The profile creation form UI.
 */
export function CreateProfileForm({ onCancel }: CreateProfileFormProps) {
  const { t } = useTranslation();
  const createAndLoginSimpleProfile = useGameStore((state) => state.createAndLoginSimpleProfile);
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createAndLoginSimpleProfile(username);

    if (!result.success) {
      setErrorMessage(result.error ?? t('auth.profileCreationFailed'));
      return;
    }

    setErrorMessage(null);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="create-profile-username">{t('ui.username')}</label>
      <input
        id="create-profile-username"
        className="text-input"
        autoFocus
        maxLength={20}
        onChange={(event) => setUsername(event.target.value)}
        placeholder={t('ui.uniqueUsername')}
        ref={usernameInputRef}
        value={username}
      />

      {errorMessage && (
        <div className="form-error-block" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="login-actions">
        <button className="primary-button" type="submit">
          {t('ui.create')}
        </button>
        {onCancel && (
          <button className="secondary-button" onClick={onCancel} type="button">
            {t('ui.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
