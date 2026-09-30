import { FormEvent, useMemo, useState } from 'react';

import { useGameStore } from '@store/useGameStore';
import { CreateProfileForm } from '@ui/components/CreateProfileForm';

type SelectorMode = 'select' | 'create';

export function ProfileSelector() {
  const profiles = useGameStore((state) => state.profiles);
  const selectProfileByUsername = useGameStore((state) => state.selectProfileByUsername);
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('select');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profileUsernames = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUsername.trim()) {
      setErrorMessage('Choose a profile to continue.');
      return;
    }

    const result = selectProfileByUsername(selectedUsername);

    if (!result.success) {
      setErrorMessage(result.error ?? 'Unable to load profile.');
      return;
    }

    setErrorMessage(null);
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="profile-selector-screen">
      <div className="overlay-panel login-panel">
        <h1>PROFILE SELECT</h1>
        <p className="menu-subtitle login-subtitle">
          {selectorMode === 'select'
            ? 'Choose your username to continue.'
            : 'Create your profile to continue.'}
        </p>

        {selectorMode === 'select' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="profile-selector-username">Username</label>
            <select
              id="profile-selector-username"
              className="text-input"
              onChange={(event) => setSelectedUsername(event.target.value)}
              value={selectedUsername}
            >
              <option value="">Select profile</option>
              {profileUsernames.map((username) => (
                <option key={username} value={username}>{username}</option>
              ))}
            </select>

            {profileUsernames.length === 0 && (
              <div className="form-error-block" role="status">
                No profiles found. Create one to begin.
              </div>
            )}

            {errorMessage && (
              <div className="form-error-block" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="login-actions">
              <button className="primary-button" disabled={profileUsernames.length === 0} type="submit">
                Login
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setErrorMessage(null);
                  setSelectorMode('create');
                }}
                type="button"
              >
                Create Profile
              </button>
            </div>
          </form>
        ) : (
          <CreateProfileForm
            onCancel={() => {
              setErrorMessage(null);
              setSelectorMode('select');
            }}
            simpleMode
          />
        )}
      </div>
    </div>
  );
}
