import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import { HomeOverlay } from '..';
import baseStoreState from '../../__mocks__/base-store-state.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('HomeOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the home launch tiles and default practice operation selector', () => {
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
    expect(screen.getByTestId('home-regular-play-tile')).toBeVisible();
    expect(screen.getByTestId('home-practice-tile')).toBeVisible();
    expect(screen.queryByText(/Mission Control/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('practice-operation-+')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('practice-operation-*')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('home-practice-start-button')).toBeVisible();
  });

  it('allows the practice operation to be switched before starting the drill', () => {
    setMockStoreState({
      activeUsername: 'AcePilot',
      bootReady: true,
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
    });

    render(<HomeOverlay />);

    fireEvent.click(screen.getByTestId('practice-operation-*'));

    expect(screen.getByTestId('practice-operation-*')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('practice-operation-+')).toHaveAttribute('aria-pressed', 'false');
    expect(useGameStore.getState().practiceOperation).toBe('*');
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
    expect(screen.getByTestId('home-regular-play-button')).toBeVisible();
    expect(screen.getByTestId('home-practice-start-button')).toBeVisible();
    expect(screen.queryByText(/Mission Control/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Major General/i)).not.toBeInTheDocument();
  });
});
