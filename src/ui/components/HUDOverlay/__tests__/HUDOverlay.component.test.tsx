/**
 * HUD Overlay component test
 * Tests the game HUD with React Testing Library
 */

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';

import fullShieldsLives from '../__mocks__/full-shields-lives.json';

import { HUDOverlay } from '../index';

const uiSceneMocks = vi.hoisted(() => ({
  appendAnswerInputCharacter: vi.fn<(char: string) => void>(),
  pauseGameForManualEnd: vi.fn<(reason: 'escape' | 'window-close') => void>(),
  removeAnswerInputCharacter: vi.fn<() => void>(),
  setAnswerInputBuffer: vi.fn<(nextValue: string) => void>(),
  submitAnswerInput: vi.fn<() => void>(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  appendAnswerInputCharacter: uiSceneMocks.appendAnswerInputCharacter,
  pauseGameForManualEnd: uiSceneMocks.pauseGameForManualEnd,
  removeAnswerInputCharacter: uiSceneMocks.removeAnswerInputCharacter,
  setAnswerInputBuffer: uiSceneMocks.setAnswerInputBuffer,
  submitAnswerInput: uiSceneMocks.submitAnswerInput,
}));

const baseHudState = fullShieldsLives as Partial<GameStoreState>;

describe('HUDOverlay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set initial state for the game store before each test
    gameStore.setState({
      ...baseHudState,
      grade: 'major-general',
      score: 1000,
      stage: 7,
      stageScore: 200,
      inputBuffer: '123',
      correctCount: 10,
      incorrectCount: 2,
      finalPerfScore: 85,
    });
  });

  it('should render score correctly', () => {
    render(<HUDOverlay />);
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });

  it('should render lives correctly', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Lives')).toBeInTheDocument();

    const livesSquare = document.querySelector('.status-square--lives');
    expect(livesSquare).not.toBeNull();
    expect(within(livesSquare as HTMLElement).getByText('3')).toBeInTheDocument();
  });

  it('should render streak correctly', () => {
    gameStore.setState({ streak: 12 });

    render(<HUDOverlay />);

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should render the base shield label', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Base Shield')).toBeInTheDocument();

    const shieldSquare = document.querySelector('.status-square--shield');
    expect(shieldSquare).not.toBeNull();
    expect(within(shieldSquare as HTMLElement).getByText('5')).toBeInTheDocument();
  });

  it('should display warning when lives are in the warning range', () => {
    gameStore.setState({ lives: 2 });

    render(<HUDOverlay />);
    const livesSquare = document.querySelector('.status-square--lives');

    expect(livesSquare).toHaveClass('status-square--warn');
  });

  it('should display warning when lives are in the danger range', () => {
    gameStore.setState({ lives: 1 });

    render(<HUDOverlay />);
    const livesSquare = document.querySelector('.status-square--lives');

    expect(livesSquare).toHaveClass('status-square--danger');
  });

  it('should render numeric status squares for shield, lives, streak, score and stage', () => {
    render(<HUDOverlay />);

    expect(document.querySelectorAll('.status-square')).toHaveLength(5);
  });

  it('should update when store state changes', () => {
    render(<HUDOverlay />);
    expect(screen.getByText(/1000/)).toBeInTheDocument();

    act(() => {
      gameStore.setState({ score: 2000 });
    });

    expect(screen.getByText(/2000/)).toBeInTheDocument();
  });

  it('should render streak reward message when present', () => {
    gameStore.setState({
      streakRewardMessage: {
        message: 'Congratulations! +1 life awarded for a 30 streak. Lives: 4',
      },
    });

    render(<HUDOverlay />);

    expect(screen.getByRole('status')).toHaveTextContent('Streak Bonus');
    expect(screen.getByText(/\+1 life awarded for a 30 streak/i)).toBeInTheDocument();
  });

  it('routes mobile answer controls through UIScene helpers', async () => {
    const user = userEvent.setup();

    render(<HUDOverlay />);

    await user.type(screen.getByLabelText(/answer input/i), '-45');
    await user.click(screen.getByRole('button', { name: 'Digit 7' }));
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    expect(uiSceneMocks.setAnswerInputBuffer).toHaveBeenCalled();
    expect(uiSceneMocks.appendAnswerInputCharacter).toHaveBeenCalledWith('7');
    expect(uiSceneMocks.removeAnswerInputCharacter).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.submitAnswerInput).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.pauseGameForManualEnd).toHaveBeenCalledWith('escape');
  });
});
