import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';

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

  it('renders the weekly report and all-time grade progress', () => {
    setMockStoreState({
      activeUsername: 'AcePilot',
      bootReady: true,
      grade: 'cadet',
      menuView: 'home',
      phase: 'start',
      gameHistoryByProfile: {
        AcePilot: [
          {
            key: 'recent-1',
            playedAt: Date.parse('2026-08-30T12:00:00.000Z'),
            correctAnswers: 12,
            incorrectAnswers: 3,
            averageAnswerTimeMs: 1000,
            mostProblematicOperation: '-',
            operationStats: {
              '+': { attempts: 4, incorrect: 0, avgTimeMs: 900 },
              '-': { attempts: 4, incorrect: 2, avgTimeMs: 1100 },
              '*': { attempts: 4, incorrect: 1, avgTimeMs: 1050 },
              '/': { attempts: 3, incorrect: 0, avgTimeMs: 950 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 150,
            finalPerfScore: 80,
          },
          {
            key: 'recent-2',
            playedAt: Date.parse('2026-08-26T12:00:00.000Z'),
            correctAnswers: 18,
            incorrectAnswers: 2,
            averageAnswerTimeMs: 950,
            mostProblematicOperation: '+',
            operationStats: {
              '+': { attempts: 5, incorrect: 0, avgTimeMs: 850 },
              '-': { attempts: 5, incorrect: 1, avgTimeMs: 980 },
              '*': { attempts: 5, incorrect: 1, avgTimeMs: 970 },
              '/': { attempts: 5, incorrect: 0, avgTimeMs: 1000 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 120,
            finalPerfScore: 90,
          },
          {
            key: 'older',
            playedAt: Date.parse('2026-08-10T12:00:00.000Z'),
            correctAnswers: 20,
            incorrectAnswers: 10,
            averageAnswerTimeMs: 1500,
            mostProblematicOperation: '*',
            operationStats: {
              '+': { attempts: 10, incorrect: 2, avgTimeMs: 1300 },
              '-': { attempts: 8, incorrect: 4, avgTimeMs: 1400 },
              '*': { attempts: 7, incorrect: 3, avgTimeMs: 1700 },
              '/': { attempts: 5, incorrect: 1, avgTimeMs: 1600 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 95,
            finalPerfScore: 66,
          },
        ],
      },
    });

    render(<HomeOverlay />);

    expect(screen.getByTestId('home-weekly-report')).toBeVisible();
    expect(screen.queryByTestId('start-defense-button')).not.toBeInTheDocument();
    expect(screen.getByText('Weekly Progress Report')).toBeInTheDocument();
    expect(screen.getByText('Commander on duty')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('270')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('386 pts to next grade')).toBeInTheDocument();
  });

  it('shows an empty weekly state when no recent runs are available', () => {
    setMockStoreState({
      activeUsername: 'AcePilot',
      bootReady: true,
      grade: 'cadet',
      menuView: 'home',
      phase: 'start',
      gameHistoryByProfile: {
        AcePilot: [
          {
            key: 'older',
            playedAt: Date.parse('2026-08-01T12:00:00.000Z'),
            correctAnswers: 10,
            incorrectAnswers: 2,
            averageAnswerTimeMs: 1200,
            mostProblematicOperation: '+',
            operationStats: {
              '+': { attempts: 3, incorrect: 1, avgTimeMs: 1000 },
              '-': { attempts: 3, incorrect: 0, avgTimeMs: 1200 },
              '*': { attempts: 3, incorrect: 1, avgTimeMs: 1300 },
              '/': { attempts: 3, incorrect: 0, avgTimeMs: 1250 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 125,
            finalPerfScore: 83,
          },
        ],
      },
    });

    render(<HomeOverlay />);

    expect(screen.getByTestId('home-weekly-empty-state')).toBeVisible();
    expect(screen.getByText(/no completed runs in the last 7 days/i)).toBeInTheDocument();
    expect(screen.getByText('226 pts to next grade')).toBeInTheDocument();
  });
});
