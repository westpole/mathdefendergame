import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_AVATAR_ID } from '@shared/avatarCatalog';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import { SettingsOverlay } from '..';
import profileMenuStore from '../../__mocks__/profile-menu-store.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('SettingsOverlay', () => {
  beforeEach(() => {
    setMockStoreState();
  });

  it('uses default avatar as selected when profile does not have one yet', () => {
    render(<SettingsOverlay />);

    expect(screen.getByTestId(`settings-avatar-option-${DEFAULT_AVATAR_ID}`)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
  });

  it('selects an avatar and saves it to the active profile', () => {
    render(<SettingsOverlay />);

    fireEvent.click(screen.getByTestId('settings-avatar-option-avatar-3'));
    expect(screen.getByTestId('settings-avatar-option-avatar-3')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

    expect(useGameStore.getState().profiles.AcePilot.avatarId).toBe('avatar-3');
    expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
  });
});
