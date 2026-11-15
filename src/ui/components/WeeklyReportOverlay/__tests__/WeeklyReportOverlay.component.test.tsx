import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { activeWeek, at, makeRun } from '@store/selectors/__tests__/achievementTestUtils';

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

  describe('calendar week section', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(at(2026, 11, 12));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function seedWeek(weeklyScoreGoal?: number) {
      const base = structuredClone(weeklyProgressMock) as Partial<GameStoreState>;
      const username = base.activeUsername as string;
      setMockStoreState({
        profiles: {
          ...base.profiles,
          [username]: { ...base.profiles![username], ...(weeklyScoreGoal && { weeklyScoreGoal }) },
        },
        gameHistoryByProfile: {
          [username]: [
            ...activeWeek(at(2026, 11, 9), [0, 2]),
            makeRun(at(2026, 11, 10), { finalScore: 300, correctAnswers: 17, incorrectAnswers: 3 }),
          ],
        },
      });
    }

    it('shows streak status and goal progress for Mon to Sun', () => {
      seedWeek(1000);
      render(<WeeklyReportOverlay />);

      expect(screen.getByRole('heading', { name: 'This week (Mon to Sun)' })).toBeInTheDocument();
      expect(screen.getByTestId('weekly-report-streak')).toHaveTextContent('1 week in a row · This week counts toward your streak!');
      expect(screen.getByTestId('goal-progress-value')).toHaveTextContent('500 / 1,000');
    });

    it('shows the guest hint instead of pointing guests to Settings', () => {
      setMockStoreState({ activeUsername: null, gameHistoryByProfile: { __guest__: activeWeek(at(2026, 11, 9), [0]) } });
      render(<WeeklyReportOverlay />);

      expect(screen.getByTestId('weekly-report-goal-off')).toHaveTextContent('Create a profile to set a goal');
    });

    it('points to Settings when the goal is off', () => {
      seedWeek();
      render(<WeeklyReportOverlay />);

      expect(screen.getByTestId('weekly-report-goal-off')).toHaveTextContent('Pick a goal in Settings');
      expect(screen.queryByTestId('goal-progress')).not.toBeInTheDocument();
    });
  });

  it('renders translated weekly report labels in Ukrainian', async () => {
    await i18n.changeLanguage('uk');

    render(<WeeklyReportOverlay />);

    expect(screen.getByText('Щотижневий звіт прогресу')).toBeInTheDocument();
    expect(screen.getByText('Прогрес звання')).toBeInTheDocument();
  });
});
