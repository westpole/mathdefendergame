import { fireEvent, render, screen } from '@testing-library/react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

import { ProfileSelector } from '../index';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('ProfileSelector', () => {
  beforeEach(() => {
    setMockStoreState({
      bootReady: true,
      phase: 'login',
      profiles: {
        AcePilot: {
          username: 'AcePilot',
          password: 'enc:v1:test',
          bestScore: 100,
          highestStage: 3,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
      },
      activeUsername: null,
      rememberedUsername: null,
    });
  });

  it('shows profile list and logs in selected profile', () => {
    render(<ProfileSelector />);

    fireEvent.click(screen.getByRole('button', { name: /select profile/i }));
    fireEvent.click(screen.getByRole('option', { name: 'AcePilot' }));
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    const state = useGameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.screenView).toBe('home');
    expect(state.activeUsername).toBe('AcePilot');
    expect(state.rememberedUsername).toBeNull();
  });

  it('remembers selected profile when remember me is enabled', () => {
    render(<ProfileSelector />);

    fireEvent.click(screen.getByRole('button', { name: /select profile/i }));
    fireEvent.click(screen.getByRole('option', { name: 'AcePilot' }));
    fireEvent.click(screen.getByLabelText(/remember me/i));
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    const state = useGameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
    expect(state.rememberedUsername).toBe('AcePilot');
  });

  it('shows create profile form when create profile action is selected', () => {
    render(<ProfileSelector />);

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/verify password/i)).not.toBeInTheDocument();
  });

  it('shows empty state and disables login when no profiles exist', () => {
    setMockStoreState({
      bootReady: true,
      phase: 'login',
      profiles: {},
      activeUsername: null,
      rememberedUsername: null,
    });

    render(<ProfileSelector />);

    expect(screen.getByText(/no profiles found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeDisabled();
  });
});
