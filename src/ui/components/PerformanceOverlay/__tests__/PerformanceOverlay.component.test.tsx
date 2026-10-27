import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import i18n from '../../../../i18n/config';

import { PerformanceOverlay } from '..';

import profileMenuStore from '../../__mocks__/profile-menu-store.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('PerformanceOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    setMockStoreState({ screenView: 'performance' });
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
    expect(within(subtractionRow as HTMLTableRowElement).getByText('1.0s')).toBeInTheDocument();
    expect(within(subtractionRow as HTMLTableRowElement).getByText('Needs Practice')).toBeInTheDocument();
  });

  it('uses the guest label when there is no active profile', () => {
    setMockStoreState({
      activeUsername: null,
    });

    render(<PerformanceOverlay />);

    expect(
      screen.getByText(/Performance by operator for Ghost based on completed runs\./i),
    ).toBeInTheDocument();
  });

  it('renders translated performance labels in Ukrainian', async () => {
    await i18n.changeLanguage('uk');
    setMockStoreState({ screenView: 'performance' });

    render(<PerformanceOverlay />);

    expect(screen.getByRole('heading', { name: /результати/i })).toBeInTheDocument();
    expect(screen.getByText(/показники за операціями для/i)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /тип операції/i })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Додавання (+)' })).toBeInTheDocument();
  });

  it('shows an empty state when no completed history exists', () => {
    setMockStoreState({
      screenView: 'performance',
      gameHistoryByProfile: {},
      activeUsername: 'AcePilot',
    });

    render(<PerformanceOverlay />);

    expect(screen.getByText(/complete a run/i)).toBeInTheDocument();
  });
});
