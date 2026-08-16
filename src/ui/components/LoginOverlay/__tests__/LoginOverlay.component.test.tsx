import { fireEvent, render, screen } from '@testing-library/react';

import { gameStore } from '@store/useGameStore';

import { LoginOverlay } from '../index';

describe('LoginOverlay', () => {
  beforeEach(() => {
    gameStore.setState({
      phase: 'login',
      menuView: 'home',
      bootReady: true,
      activeUsername: null,
      profiles: {},
      grade: 'trainee',
      score: 0,
      lives: 10,
      shield: 5,
      stage: 1,
      stageScore: 0,
      inputBuffer: '',
      correctCount: 0,
      incorrectCount: 0,
      finalPerfScore: 0,
      stageMessage: null,
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
    });
  });

  it('shows login tab by default', () => {
    render(<LoginOverlay />);

    expect(screen.getByRole('tab', { name: /login/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/login with your existing commander profile/i)).toBeInTheDocument();
  });

  it('shows suggestion to create profile when username does not exist', () => {
    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'UnknownPilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login to game/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/username not found/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/create profile/i);
  });

  it('shows validation error for invalid password when creating profile', () => {
    render(<LoginOverlay />);

    fireEvent.click(screen.getByRole('tab', { name: /create profile/i }));

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'abcdef12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/must be exactly 8 characters/i);
  });

  it('creates profile from create profile tab when form is valid', () => {
    render(<LoginOverlay />);

    fireEvent.click(screen.getByRole('tab', { name: /create profile/i }));

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    const state = gameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
  });

  it('logs in and navigates to start when username exists and password matches', () => {
    gameStore.getState().createAndLoginProfile('AcePilot', 'Abc12345');
    gameStore.setState({
      phase: 'login',
      activeUsername: null,
    });

    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login to game/i }));

    const state = gameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
  });
});
