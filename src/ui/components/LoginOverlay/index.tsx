import { FormEvent, useEffect, useRef, useState } from 'react';

import { useGameStore } from '@store/useGameStore';

type AuthMode = 'login' | 'create';

export function LoginOverlay() {
  const loginProfile = useGameStore((state) => state.loginProfile);
  const createAndLoginProfile = useGameStore((state) => state.createAndLoginProfile);
  const [activeMode, setActiveMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, [activeMode]);

  const switchMode = (mode: AuthMode) => {
    setActiveMode(mode);
    if (mode === 'login') {
      setVerifyPassword('');
    }

    setErrorMessage(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeMode === 'create') {
      if (!verifyPassword.trim()) {
        setErrorMessage('Please verify your password.');
        return;
      }

      if (password !== verifyPassword) {
        setErrorMessage('Password and verify password must match.');
        return;
      }
    }

    const result = activeMode === 'login'
      ? loginProfile(username, password, keepLoggedIn)
      : createAndLoginProfile(username, password, false);

    if (!result.success) {
      setErrorMessage(result.error ?? 'Authentication failed.');
      return;
    }

    setErrorMessage(null);
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="login-screen">
      <div className="overlay-panel login-panel">
        <h1>PLAYER ACCESS</h1>
        <p className="menu-subtitle login-subtitle">
          {activeMode === 'login'
            ? 'Login with your existing profile.'
            : 'Create your profile to continue.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="text-input"
            autoFocus
            maxLength={20}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={activeMode === 'login' ? 'Your username' : 'Unique username'}
            ref={usernameInputRef}
            value={username}
          />

          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="text-input"
            maxLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={activeMode === 'login' ? 'Your password' : '8 chars: Aa1xxxxx'}
            type="password"
            value={password}
          />

          {activeMode === 'create' && (
            <>
              <label className="field-label" htmlFor="login-verify-password">Verify password</label>
              <input
                id="login-verify-password"
                className="text-input"
                maxLength={8}
                onChange={(event) => setVerifyPassword(event.target.value)}
                placeholder="Re-enter your password"
                type="password"
                value={verifyPassword}
              />
            </>
          )}

          {activeMode === 'login' && (
            <label className="checkbox-row" htmlFor="keep-logged-in">
              <input
                id="keep-logged-in"
                checked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
                type="checkbox"
              />
              Keep me logged in
            </label>
          )}

          {errorMessage && (
            <div className="form-error-block" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="login-actions">
            {activeMode === 'login' ? (
              <>
                <button className="primary-button" type="submit">
                  Login
                </button>
                <button className="secondary-button" onClick={() => switchMode('create')} type="button">
                  Create Profile
                </button>
              </>
            ) : (
              <>
                <button className="primary-button" type="submit">
                  Create
                </button>
                <button className="secondary-button" onClick={() => switchMode('login')} type="button">
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
