import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import { StageMessageOverlay } from '..';

const uiSceneMocks = vi.hoisted(() => ({
  continueGame: vi.fn(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  continueGame: uiSceneMocks.continueGame,
  startGame: vi.fn(),
  openMenu: vi.fn(),
  openScreenView: vi.fn(),
  ensurePhaserGame: vi.fn(),
  destroyGame: vi.fn(),
}));

describe('StageMessageOverlay', () => {
  beforeEach(() => {
    uiSceneMocks.continueGame.mockReset();
    useGameStore.setState({
      phase: 'stage-message',
      screenView: 'home',
      bootReady: true,
      activeUsername: null,
      profiles: {},
      grade: 'trainee',
      score: 900,
      lives: 8,
      shield: 3,
      stage: 4,
      stageScore: 10,
      inputBuffer: '',
      correctCount: 12,
      incorrectCount: 2,
      streak: 0,
      finalPerfScore: 0,
      ddaHeatState: 'BALANCED',
      ddaMathTier: 1,
      ddaSpeedMultiplier: 1,
      ddaIsCooloffActive: false,
      stageMessage: {
        success: true,
        stage: 4,
        score: 900,
        lives: 8,
        stageIncorrect: 1,
      },
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
      gameHistoryByProfile: {},
    });
  });

  it('renders stage clear copy and does not auto-focus continue', () => {
    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Stage 4 Cleared!' })).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toHaveAttribute('autofocus');
    expect(document.activeElement).not.toBe(continueButton);
  });

  it('continues the game when Continue is clicked', () => {
    render(<StageMessageOverlay />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(uiSceneMocks.continueGame).toHaveBeenCalledTimes(1);
  });

  it('continues the game when Enter is pressed while the overlay is shown', () => {
    render(<StageMessageOverlay />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(uiSceneMocks.continueGame).toHaveBeenCalledTimes(1);
  });
});
