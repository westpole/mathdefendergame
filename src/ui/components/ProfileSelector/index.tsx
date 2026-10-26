import { SubmitEvent, KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import { CreateProfileForm } from '@ui/components/CreateProfileForm';

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('select');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedUsername));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [language, setLanguage] = useState(i18n.resolvedLanguage ?? 'en');

  const profileUsernames = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);
  const selectedUsernameIsValid = profileUsernames.includes(selectedUsername);
  const rememberedUsernameIsValid = Boolean(rememberedUsername && profileUsernames.includes(rememberedUsername));
  const currentSelectedUsername = selectedUsernameIsValid
    ? selectedUsername
    : rememberedUsernameIsValid
      ? rememberedUsername ?? ''
      : '';

  useEffect(() => {
    setLanguage(i18n.resolvedLanguage ?? 'en');
  }, [i18n, i18n.resolvedLanguage]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) || listboxRef.current?.contains(target)) {
        return;
      }

      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen || !listboxRef.current) {
      return;
    }

    const activeElement = listboxRef.current.querySelector<HTMLElement>(`[data-option-index="${activeOptionIndex}"]`);
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionIndex, isDropdownOpen]);

  const openDropdown = () => {
    if (profileUsernames.length === 0) {
      return;
    }

    const selectedIndex = profileUsernames.findIndex((username) => username === currentSelectedUsername);
    setActiveOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const moveActiveOption = (direction: -1 | 1) => {
    if (profileUsernames.length === 0) {
      return;
    }

    setActiveOptionIndex((currentIndex) => {
      const lastIndex = profileUsernames.length - 1;

      if (direction === 1) {
        return currentIndex >= lastIndex ? 0 : currentIndex + 1;
      }

      return currentIndex <= 0 ? lastIndex : currentIndex - 1;
    });
  };

  const chooseUsername = (username: string) => {
    setSelectedUsername(username);
    setErrorMessage(null);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!isDropdownOpen) {
        openDropdown();
        return;
      }

      moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!isDropdownOpen) {
        openDropdown();
        return;
      }

      moveActiveOption(-1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (!isDropdownOpen) {
        openDropdown();
        return;
      }

      const username = profileUsernames[activeOptionIndex];
      if (username) {
        chooseUsername(username);
      }
      return;
    }

    if (event.key === 'Escape') {
      closeDropdown();
    }
  };

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
            <div className="custom-select">
              <button
                id={triggerId}
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-labelledby={`${labelId} ${triggerId}-value`}
                className="text-input custom-select__trigger"
                onClick={() => {
                  if (isDropdownOpen) {
                    closeDropdown();
                    return;
                  }

                  openDropdown();
                }}
                onKeyDown={handleTriggerKeyDown}
                ref={triggerRef}
                type="button"
              >
                <span className={!currentSelectedUsername ? 'custom-select__placeholder' : undefined} id={`${triggerId}-value`}>
                  {currentSelectedUsername || t('ui.profileSelectPlaceholder')}
                </span>
                <span aria-hidden="true" className="custom-select__arrow">▼</span>
              </button>

              <ul
                aria-labelledby={labelId}
                className="custom-select__options"
                hidden={!isDropdownOpen}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveActiveOption(1);
                    return;
                  }

                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveActiveOption(-1);
                    return;
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const username = profileUsernames[activeOptionIndex];
                    if (username) {
                      chooseUsername(username);
                    }
                    return;
                  }

                  if (event.key === 'Escape') {
                    closeDropdown();
                    triggerRef.current?.focus();
                  }
                }}
                ref={listboxRef}
                role="listbox"
                tabIndex={-1}
              >
                {profileUsernames.map((username, index) => {
                  const isSelected = currentSelectedUsername === username;
                  const isActive = activeOptionIndex === index;

                  return (
                    <li
                      aria-selected={isSelected}
                      className={isActive ? 'is-active' : undefined}
                      data-option-index={index}
                      key={username}
                      onClick={() => chooseUsername(username)}
                      onMouseEnter={() => setActiveOptionIndex(index)}
                      role="option"
                    >
                      {username}
                    </li>
                  );
                })}
              </ul>
            </div>

            <label className="field-label" htmlFor="profile-language-select">{t('ui.profileSelectionLabel')}</label>
            <select
              id="profile-language-select"
              className="text-input"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                void i18n.changeLanguage(event.target.value);
              }}
            >
              <option value="en">English</option>
              <option value="uk">Українська</option>
            </select>

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
            simpleMode
          />
        )}
      </div>
    </div>
  );
}
