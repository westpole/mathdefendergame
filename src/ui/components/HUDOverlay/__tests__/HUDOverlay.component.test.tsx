/**
 * HUD Overlay component test
 * Tests the game HUD with React Testing Library
 */

import { act, render, screen } from '@testing-library/react';

import { gameStore } from '@store/useGameStore';

import { HUDOverlay } from '../index';

describe('HUDOverlay Component', () => {
  beforeEach(() => {
    // Set initial state for the game store before each test
    gameStore.setState({
      grade: 'major-general',
      score: 1000,
      lives: 3,
      shield: 80,
      stage: 5,
      stageScore: 200,
      inputBuffer: '123',
      correctCount: 10,
      incorrectCount: 2,
      finalPerfScore: 85,
      ddaHeatState: 'FLOW',
      ddaMathTier: 3,
      ddaSpeedMultiplier: 1.5,
      ddaIsCooloffActive: true,
      stageMessage: null,
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
    });
  });

  it('should render score correctly', () => {
    render(<HUDOverlay />);
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });

  it('should render lives correctly', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Lives')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render the base shield label', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Base Shield')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render stage goal by grade target', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Goal: Correct 200/20')).toBeInTheDocument();
  });

  it('should display warning when lives are in the warning range', () => {
    gameStore.setState({ lives: 1 });

    render(<HUDOverlay />);
    const livesSquare = document.querySelector('.status-square--lives');

    expect(livesSquare).toHaveClass('status-square--warn');
  });

  it('should render numeric status squares for shield and lives', () => {
    render(<HUDOverlay />);

    expect(document.querySelectorAll('.status-square')).toHaveLength(2);
  });

  it('should update when store state changes', () => {
    render(<HUDOverlay />);
    expect(screen.getByText(/1000/)).toBeInTheDocument();

    act(() => {
      gameStore.setState({ score: 2000 });
    });

    expect(screen.getByText(/2000/)).toBeInTheDocument();
  });

  it('should render DDA telemetry', () => {
    render(<HUDOverlay />);

    expect(screen.getByText('Grade: major-general')).toBeInTheDocument();
    expect(screen.getByText('Top Rank Reached')).toBeInTheDocument();
  });
});
