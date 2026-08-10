import { FormEvent, useState } from 'react';

import { useGameStore } from '@store/useGameStore';

type AuthTab = 'login' | 'create';

export function LoginOverlay() {
  const loginProfile = useGameStore((state) => state.loginProfile);
  const createAndLoginProfile = useGameStore((state) => state.createAndLoginProfile);
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = activeTab === 'login'
      ? loginProfile(username, password)
      : createAndLoginProfile(username, password);

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
        <div className="view-tabs login-tabs" role="tablist" aria-label="Profile access modes">
          <button
            className={`view-tab${activeTab === 'login' ? ' is-active' : ''}`}
            id="tab-login"
            role="tab"
            aria-controls="auth-panel"
            aria-selected={activeTab === 'login'}
            onClick={() => switchTab('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`view-tab${activeTab === 'create' ? ' is-active' : ''}`}
            id="tab-create-profile"
            role="tab"
            aria-controls="auth-panel"
            aria-selected={activeTab === 'create'}
            onClick={() => switchTab('create')}
            type="button"
          >
            Create profile
          </button>
        </div>
        <p className="menu-subtitle login-subtitle">
          {activeTab === 'login'
            ? 'Login with your existing commander profile.'
            : 'Create your commander profile to continue.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit} id="auth-panel" role="tabpanel">
          <label className="field-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="text-input"
            maxLength={20}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={activeTab === 'login' ? 'Your username' : 'Unique username'}
            value={username}
          />

          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="text-input"
            maxLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={activeTab === 'login' ? 'Your password' : '8 chars: Aa1xxxxx'}
            type="password"
            value={password}
          />

          {errorMessage && (
            <div className="form-error-block" role="alert">
              {errorMessage}
            </div>
          )}

          <button className="primary-button" type="submit">
            {activeTab === 'login' ? 'Login to game' : 'Create profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
