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

  it('renders a perfect clear message when the stage is won without mistakes', () => {
    useGameStore.setState({
      stageMessage: {
        success: true,
        stage: 4,
        score: 900,
        lives: 8,
        stageIncorrect: 0,
      },
    });

    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Stage 4 Cleared!' })).toBeInTheDocument();
    expect(screen.getByText(/perfect work\. you saved your town\./i)).toBeInTheDocument();
  });

  it('renders the lost-stage messaging when the player still has lives remaining', () => {
    useGameStore.setState({
      stageMessage: {
        success: false,
        stage: 4,
        score: 900,
        lives: 2,
        stageIncorrect: 1,
      },
    });

    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Stage Lost' })).toBeInTheDocument();
    expect(screen.getByText(/you lost this stage and 1 life\. remaining lives: 2\./i)).toBeInTheDocument();
  });

  it('handles the last-life wording when the player is down to one life', () => {
    useGameStore.setState({
      stageMessage: {
        success: false,
        stage: 4,
        score: 900,
        lives: 1,
        stageIncorrect: 3,
      },
    });

    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Stage Lost' })).toBeInTheDocument();
    expect(screen.getByText(/remaining life:/i)).toBeInTheDocument();
  });

  it('renders the multi-mistake success copy when the player clears with errors', () => {
    useGameStore.setState({
      stageMessage: {
        success: true,
        stage: 5,
        score: 920,
        lives: 4,
        stageIncorrect: 2,
      },
    });

    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Stage 5 Cleared!' })).toBeInTheDocument();
    expect(screen.getByText(/made 2 mistakes/i)).toBeInTheDocument();
  });

  it('renders streak reward message when present', () => {
    useGameStore.setState({
      streakRewardMessage: {
        message: 'Congratulations! +1 life awarded for a 30 streak. Lives: 4',
      },
    });

    render(<StageMessageOverlay />);

    expect(screen.getByRole('heading', { name: 'Streak Bonus' })).toBeInTheDocument();
    expect(screen.getByText(/\+1 life awarded for a 30 streak/i)).toBeInTheDocument();
  });
});
