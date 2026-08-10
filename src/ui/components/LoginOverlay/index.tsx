import { FormEvent, useState } from 'react';

import { useGameStore } from '@store/useGameStore';

export function LoginOverlay() {
  const createAndLoginProfile = useGameStore((state) => state.createAndLoginProfile);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createAndLoginProfile(username, password);

    if (!result.success) {
      setErrorMessage(result.error ?? 'Login failed.');
      return;
    }

    setErrorMessage(null);
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="login-screen">
      <div className="overlay-panel login-panel">
        <h1>PLAYER LOGIN</h1>
        <p className="menu-subtitle">Create your commander profile to continue.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="text-input"
            maxLength={20}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Unique username"
            value={username}
          />

          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="text-input"
            maxLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8 chars: Aa1xxxxx"
            type="password"
            value={password}
          />

          {errorMessage && (
            <div className="form-error-block" role="alert">
              {errorMessage}
            </div>
          )}

          <button className="primary-button" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
