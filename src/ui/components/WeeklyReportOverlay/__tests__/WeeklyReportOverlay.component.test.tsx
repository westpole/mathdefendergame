import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import i18n from '../../../../i18n/config';
import weeklyProgressMock from '../../HomeOverlay/__mocks__/weekly-progress.json';
import { WeeklyReportOverlay } from '../index';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(weeklyProgressMock) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('WeeklyReportOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    setMockStoreState();
  });

  it('renders translated weekly report labels in English by default', () => {
    render(<WeeklyReportOverlay />);

    expect(screen.getByText('Weekly Progress Report')).toBeInTheDocument();
    expect(screen.getByText('Grade Progress')).toBeInTheDocument();
  });

  it('renders per-operation progress toward the next grade from lifetime history', () => {
    render(<WeeklyReportOverlay />);

    expect(screen.getByText('Next Cadet')).toBeInTheDocument();
    // + (6−2) + (7−2) + (5−2) = 12; − (6−2) + (7−4) + (4−4) = 7
    expect(screen.getByText('12 / 250')).toBeInTheDocument();
    expect(screen.getByText('7 / 150')).toBeInTheDocument();
    expect(screen.queryByTestId('grade-requirement-multiplication')).not.toBeInTheDocument();
  });

  it('renders translated weekly report labels in Ukrainian', async () => {
    await i18n.changeLanguage('uk');

    render(<WeeklyReportOverlay />);

    expect(screen.getByText('Щотижневий звіт прогресу')).toBeInTheDocument();
    expect(screen.getByText('Прогрес звання')).toBeInTheDocument();
  });
});
