import { SubmitEvent, useEffect, useRef, useState } from 'react';

import { useGameStore } from '@store/useGameStore';

interface CreateProfileFormProps {
  simpleMode: boolean;
  onCancel?: () => void;
}

/**
 * Renders the create-account form used during login flow startup.
 *
 * In full mode, the user must provide a username, password, and password confirmation;
 * in simple mode, only a username is required and a lightweight profile is created.
 * Successful submissions call the matching store action to create and immediately log in
 * the profile. Validation errors are surfaced inline in the form.
 *
 * @param props - The form configuration and optional cancel callback.
 * @param props.simpleMode - When true, skip password fields and use the simplified profile flow.
 * @param props.onCancel - Optional callback invoked when the user cancels the form.
 * @returns The profile creation form UI.
 */
export function CreateProfileForm({ simpleMode, onCancel }: CreateProfileFormProps) {
  const createAndLoginProfile = useGameStore((state) => state.createAndLoginProfile);
  const createAndLoginSimpleProfile = useGameStore((state) => state.createAndLoginSimpleProfile);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!simpleMode) {
      if (!verifyPassword.trim()) {
        setErrorMessage('Please verify your password.');
        return;
      }

      if (password !== verifyPassword) {
        setErrorMessage('Password and verify password must match.');
        return;
      }
    }

    const result = simpleMode
      ? createAndLoginSimpleProfile(username)
      : createAndLoginProfile(username, password, false);

    if (!result.success) {
      setErrorMessage(result.error ?? 'Profile creation failed.');
      return;
    }

    setErrorMessage(null);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="create-profile-username">Username</label>
      <input
        id="create-profile-username"
        className="text-input"
        autoFocus
        maxLength={20}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Unique username"
        ref={usernameInputRef}
        value={username}
      />

      {!simpleMode && (
        <>
          <label className="field-label" htmlFor="create-profile-password">Password</label>
          <input
            id="create-profile-password"
            className="text-input"
            maxLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8 chars: Aa1xxxxx"
            type="password"
            value={password}
          />

          <label className="field-label" htmlFor="create-profile-verify-password">Verify password</label>
          <input
            id="create-profile-verify-password"
            className="text-input"
            maxLength={8}
            onChange={(event) => setVerifyPassword(event.target.value)}
            placeholder="Re-enter your password"
            type="password"
            value={verifyPassword}
          />
        </>
      )}

      {errorMessage && (
        <div className="form-error-block" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="login-actions">
        <button className="primary-button" type="submit">
          Create
        </button>
        {onCancel && (
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
