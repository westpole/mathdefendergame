import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gameStore } from '@store/useGameStore';
import { App } from '../../../App';

const uiSceneMocks = vi.hoisted(() => ({
  destroyGame: vi.fn(),
  ensurePhaserGame: vi.fn(() => ({ id: 'game-instance' })),
  openMenuView: vi.fn(),
  startGame: vi.fn(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  destroyGame: uiSceneMocks.destroyGame,
  ensurePhaserGame: uiSceneMocks.ensurePhaserGame,
  openMenuView: uiSceneMocks.openMenuView,
  startGame: uiSceneMocks.startGame,
  continueGame: vi.fn(),
  returnToMenu: vi.fn(),
}));

describe('App start menu controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.setState({
      phase: 'login',
      menuView: 'home',
      bootReady: true,
      activeUsername: 'AcePilot',
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

  it('shows the menu button only during the start phase', () => {
    const { rerender } = render(<App />);

    expect(screen.queryByTestId('menu-toggle-button')).not.toBeInTheDocument();

    act(() => {
      gameStore.setState({ phase: 'start', menuView: 'home' });
    });
    rerender(<App />);

    expect(screen.getByTestId('menu-toggle-button')).toBeVisible();
    expect(screen.queryByTestId('start-menu-options')).not.toBeInTheDocument();
  });

  it('opens the React menu and routes menu selections through UIScene', () => {
    act(() => {
      gameStore.setState({ phase: 'start', menuView: 'home' });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));

    expect(screen.getByTestId('start-menu-options')).toBeVisible();

    fireEvent.click(screen.getByTestId('menu-option-profile'));

    expect(uiSceneMocks.openMenuView).toHaveBeenCalledWith('profile');
    expect(screen.queryByTestId('start-menu-options')).not.toBeInTheDocument();
  });

  it('renders the profile page when the menu view is set to profile', () => {
    act(() => {
      gameStore.setState({ phase: 'start', menuView: 'profile' });
    });

    render(<App />);

    expect(screen.getByTestId('profile-overlay')).toBeVisible();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });
});
