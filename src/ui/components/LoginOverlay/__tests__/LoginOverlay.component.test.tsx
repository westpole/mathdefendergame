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
      difficulty: 'child',
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
        child: [],
        student: [],
        adult: [],
      },
    });
  });

  it('shows validation error for invalid password', () => {
    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'abcdef12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/must be exactly 8 characters/i);
  });

  it('navigates to home menu when form is valid', () => {
    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    const state = gameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
  });
});
