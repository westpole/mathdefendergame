import { FormEvent, useEffect, useRef, useState } from 'react';

import { useGameStore } from '@store/useGameStore';
import { CreateProfileForm } from '@ui/components/CreateProfileForm';

type AuthMode = 'login' | 'create';

export function LoginOverlay() {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginProfile(username, password, keepLoggedIn);

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

        {activeMode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="text-input"
              autoFocus
              maxLength={20}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Your username"
              ref={usernameInputRef}
              value={username}
            />

            <label className="field-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="text-input"
              maxLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
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
              Keep me logged in
            </label>

            {errorMessage && (
              <div className="form-error-block" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="login-actions">
              <button className="primary-button" type="submit">
                Login
              </button>
              <button className="secondary-button" onClick={() => switchMode('create')} type="button">
                Create Profile
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
