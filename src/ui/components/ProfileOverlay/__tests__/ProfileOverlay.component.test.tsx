import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import { ProfileOverlay } from '..';

import profileMenuStore from '../../__mocks__/profile-menu-store.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('ProfileOverlay', () => {
  beforeEach(() => {
    setMockStoreState();
  });

  it('uses completed game history for profile progress in the menu', () => {
    render(<ProfileOverlay />);

    expect(screen.getByText('Avg. APM')).toBeInTheDocument();
    expect(screen.getByText('55.7')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('1 pts to next grade')).toBeInTheDocument();
  });

  it('includes the active run score while a game is still in progress', () => {
    useGameStore.setState({
      phase: 'playing',
      grade: 'commander',
      score: 20,
    });

    render(<ProfileOverlay />);

    expect(screen.getByText('55.7')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('381 pts to next grade')).toBeInTheDocument();
  });
});
