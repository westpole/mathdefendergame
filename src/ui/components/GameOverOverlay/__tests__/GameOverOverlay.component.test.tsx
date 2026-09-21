import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import { GameOverOverlay } from '..';

vi.mock('@game/scenes/UIScene', () => ({
  startGame: vi.fn(),
  continueGame: vi.fn(),
  openMenu: vi.fn(),
  openScreenView: vi.fn(),
  ensurePhaserGame: vi.fn(),
  destroyGame: vi.fn(),
}));

describe('GameOverOverlay', () => {
  beforeEach(() => {
    useGameStore.setState({
      phase: 'gameover',
      screenView: 'home',
      bootReady: true,
      activeUsername: null,
      profiles: {},
      grade: 'cadet',
      score: 1500,
      lives: 0,
      shield: 0,
      stage: 4,
      stageScore: 0,
      inputBuffer: '',
      correctCount: 25,
      incorrectCount: 5,
      finalPerfScore: 83.33,
      ddaHeatState: 'BALANCED',
      ddaMathTier: 2,
      ddaSpeedMultiplier: 1,
      ddaIsCooloffActive: false,
      stageMessage: null,
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
      gameHistoryByProfile: {},
    });
  });

  it('renders the final summary with a start new game action', () => {
    render(<GameOverOverlay />);

    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(screen.getByText('Total Score')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/save your result/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});
