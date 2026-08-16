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
    expect(screen.getByText('Lives: 3')).toBeInTheDocument();
  });

  it('should render the base shield label', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Base Shield')).toBeInTheDocument();
  });

  it('should render stage number', () => {
    render(<HUDOverlay />);
    expect(screen.getByText('Stage 5/28')).toBeInTheDocument();
  });

  it('should display warning when lives are in the warning range', () => {
    gameStore.setState({ lives: 4 });

    render(<HUDOverlay />);
    const livesFill = document.querySelector('.lives-fill');

    expect(livesFill).toHaveClass('lives-fill--warn');
  });

  it('should render one shield block per base shield slot', () => {
    render(<HUDOverlay />);

    expect(document.querySelectorAll('.shield-block')).toHaveLength(5);
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
    expect(screen.getByText('Speed x1.50')).toBeInTheDocument();
    expect(screen.getByText('Cooloff: ON')).toBeInTheDocument();
  });
});
