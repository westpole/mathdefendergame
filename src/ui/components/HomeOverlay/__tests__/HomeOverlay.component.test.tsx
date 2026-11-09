import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState, PlayerProfile } from '@store/types';

import { HomeOverlay } from '..';
import baseStoreState from '../../__mocks__/base-store-state.json';

const uiSceneMocks = vi.hoisted(() => ({
  openScreenView: vi.fn(),
  startGame: vi.fn(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  openScreenView: uiSceneMocks.openScreenView,
  startGame: uiSceneMocks.startGame,
}));

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('HomeOverlay', () => {
  beforeEach(() => {
    uiSceneMocks.startGame.mockReset();
    uiSceneMocks.openScreenView.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders both mode tiles as clickable buttons without nested buttons', () => {
    setMockStoreState({
      activeUsername: 'AcePilot',
      bootReady: true,
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
    });

    render(<HomeOverlay />);

    expect(screen.getByTestId('main-menu')).toBeVisible();
    expect(screen.getByTestId('home-mode-select')).toBeVisible();
    expect(screen.getByTestId('home-practice-controls')).toBeVisible();
    expect(screen.queryByText(/Mission Control/i)).not.toBeInTheDocument();

    const regularTile = screen.getByRole('button', { name: /Regular Play/i });
    const practiceTile = screen.getByRole('button', { name: /Practice Mode/i });

    expect(regularTile).toBe(screen.getByTestId('home-regular-play-tile'));
    expect(practiceTile).toBe(screen.getByTestId('home-practice-tile'));
    expect(regularTile.querySelector('button')).toBeNull();
    expect(practiceTile.querySelector('button')).toBeNull();
    expect(screen.queryByTestId('practice-operation-+')).not.toBeInTheDocument();
  });

  it('starts a regular run when the Regular Play tile is clicked', async () => {
    setMockStoreState({ activeUsername: 'AcePilot', bootReady: true, phase: 'start' });

    render(<HomeOverlay />);
    fireEvent.click(screen.getByTestId('home-regular-play-tile'));

    await vi.waitFor(() => {
      expect(uiSceneMocks.startGame).toHaveBeenCalledWith({ mode: 'regular' });
    });
  });

  it('starts only one regular run when the Regular Play tile is clicked repeatedly', async () => {
    setMockStoreState({ activeUsername: 'AcePilot', bootReady: true, phase: 'start' });

    render(<HomeOverlay />);
    const regularTile = screen.getByTestId('home-regular-play-tile');
    fireEvent.click(regularTile);
    fireEvent.click(regularTile);
    fireEvent.click(screen.getByTestId('home-practice-tile'));

    await vi.waitFor(() => {
      expect(uiSceneMocks.startGame).toHaveBeenCalledTimes(1);
    });
    expect(regularTile).toBeDisabled();
    expect(screen.getByTestId('home-practice-tile')).toBeDisabled();
    expect(uiSceneMocks.openScreenView).not.toHaveBeenCalled();
  });

  it('opens the practice operation selector through UIScene instead of starting when the Practice Mode tile is clicked', async () => {
    setMockStoreState({ activeUsername: 'AcePilot', bootReady: true, phase: 'start', screenView: 'home' });

    render(<HomeOverlay />);
    fireEvent.click(screen.getByTestId('home-practice-tile'));

    await vi.waitFor(() => {
      expect(uiSceneMocks.openScreenView).toHaveBeenCalledWith('practice-select');
    });
    expect(uiSceneMocks.startGame).not.toHaveBeenCalled();
  });

  it('keeps the home screen available without weekly report content', () => {
    setMockStoreState({
      activeUsername: 'AcePilot',
      bootReady: true,
      grade: 'major-general',
      phase: 'start',
    });

    render(<HomeOverlay />);

    expect(screen.queryByTestId('home-weekly-report')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-regular-play-tile')).toBeVisible();
    expect(screen.getByTestId('home-practice-tile')).toBeVisible();
    expect(screen.queryByText(/Mission Control/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Major General/i)).not.toBeInTheDocument();
  });

  describe('rules hint', () => {
    const aceProfile: PlayerProfile = {
      username: 'AcePilot',
      password: '',
      bestScore: 0,
      highestStage: 1,
      preferredGrade: 'cadet',
      createdAt: 1_000,
      updatedAt: 1_000,
    };

    function setHintStoreState(profileOverrides: Partial<PlayerProfile> = {}) {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
        screenView: 'home',
        profiles: { AcePilot: { ...aceProfile, ...profileOverrides } },
      });
    }

    it('shows the rules hint until the profile dismisses it', () => {
      setHintStoreState();

      render(<HomeOverlay />);

      expect(screen.getByTestId('home-rules-hint')).toBeVisible();
      expect(screen.getByTestId('home-rules-hint-dismiss')).not.toBeChecked();
    });

    it('opens the rules screen from the hint link', () => {
      setHintStoreState();

      render(<HomeOverlay />);
      fireEvent.click(screen.getByTestId('home-rules-hint-link'));

      expect(useGameStore.getState().screenView).toBe('rules');
    });

    it('remembers the dismissal on the active profile and hides the hint', () => {
      setHintStoreState();

      render(<HomeOverlay />);
      fireEvent.click(screen.getByTestId('home-rules-hint-dismiss'));

      expect(useGameStore.getState().profiles.AcePilot.rulesHintDismissed).toBe(true);
      expect(screen.queryByTestId('home-rules-hint')).not.toBeInTheDocument();
    });

    it('does not render the hint for a profile that already dismissed it', () => {
      setHintStoreState({ rulesHintDismissed: true });

      render(<HomeOverlay />);

      expect(screen.queryByTestId('home-rules-hint')).not.toBeInTheDocument();
    });
  });
});
