import { act, fireEvent, render, screen } from '@testing-library/react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

import { ProfileSelector } from '../index';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  act(() => {
    useGameStore.setState({
      ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
      ...partialState,
    });
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

  it('uses a remembered profile when available and keeps the checkbox enabled', () => {
    setMockStoreState({
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
      rememberedUsername: 'AcePilot',
    });

    render(<ProfileSelector />);

    expect(screen.getByRole('button', { name: /acepilot/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeDisabled();
  });

  it('supports keyboard navigation, outside-click closing, and create flow cancellation', () => {
    setMockStoreState({
      profiles: {
        Alpha: {
          username: 'Alpha',
          password: 'enc:v1:test',
          bestScore: 50,
          highestStage: 2,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
        Bravo: {
          username: 'Bravo',
          password: 'enc:v1:test',
          bestScore: 70,
          highestStage: 3,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
        Charlie: {
          username: 'Charlie',
          password: 'enc:v1:test',
          bestScore: 90,
          highestStage: 4,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
      },
    });

    render(<ProfileSelector />);

    const trigger = screen.getByRole('button', { name: /select profile/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(screen.getByRole('listbox')).toBeVisible();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    expect(screen.getByRole('button', { name: /alpha/i })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.getByText(/choose your username to continue/i)).toBeInTheDocument();
  });

  it('validates missing and failed logins', () => {
    render(<ProfileSelector />);

    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose a profile to continue/i);

    const failingSelect = vi.fn(() => ({ success: false, error: 'Profile is unavailable.' }));
    act(() => {
      useGameStore.setState({
        selectProfileByUsername: failingSelect,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /select profile/i }));
    fireEvent.click(screen.getByRole('option', { name: 'AcePilot' }));
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    expect(failingSelect).toHaveBeenCalledWith('AcePilot', false);
    expect(screen.getByRole('alert')).toHaveTextContent(/profile is unavailable/i);
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
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeDisabled();
  });

  it('falls back to an empty selection for invalid remembered profiles and supports escape-key close', () => {
    setMockStoreState({
      profiles: {
        Alpha: {
          username: 'Alpha',
          password: 'enc:v1:test',
          bestScore: 50,
          highestStage: 2,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
        Bravo: {
          username: 'Bravo',
          password: 'enc:v1:test',
          bestScore: 70,
          highestStage: 3,
          preferredGrade: 'trainee',
          createdAt: 1,
          updatedAt: 2,
        },
      },
      rememberedUsername: 'Ghost',
    });

    render(<ProfileSelector />);

    const trigger = screen.getByRole('button', { name: /select profile/i });
    expect(trigger).toHaveTextContent('Select profile');
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeChecked();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByRole('listbox')).toBeVisible();

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
