import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { gameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';

import { PerformanceOverlay } from '..';

import profileMenuStore from '../../__mocks__/profile-menu-store.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  gameStore.setState({
    ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('PerformanceOverlay', () => {
  beforeEach(() => {
    setMockStoreState({ menuView: 'performance' });
  });

  it('renders operator rows from completed history', () => {
    render(<PerformanceOverlay />);

    const additionRow = screen.getByRole('rowheader', { name: 'Addition (+)' }).closest('tr');
    const subtractionRow = screen.getByRole('rowheader', { name: 'Subtraction (-)' }).closest('tr');

    expect(additionRow).not.toBeNull();
    expect(subtractionRow).not.toBeNull();

    expect(within(additionRow as HTMLTableRowElement).getByText('88%')).toBeInTheDocument();
    expect(within(additionRow as HTMLTableRowElement).getByText('1.0s')).toBeInTheDocument();
    expect(within(additionRow as HTMLTableRowElement).getByText('Proficient')).toBeInTheDocument();
    expect(within(subtractionRow as HTMLTableRowElement).getByText('71%')).toBeInTheDocument();
    expect(within(subtractionRow as HTMLTableRowElement).getByText('Needs Practice')).toBeInTheDocument();
  });

  it('shows an empty state when no completed history exists', () => {
    setMockStoreState({
      menuView: 'performance',
      gameHistoryByProfile: {},
      activeUsername: 'AcePilot',
    });

    render(<PerformanceOverlay />);

    expect(screen.getByText(/complete a run/i)).toBeInTheDocument();
  });
});
