import { render, screen, within } from '@testing-library/react';
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

  it('shows per-operation progress toward the next grade from completed history', () => {
    render(<ProfileOverlay />);

    expect(screen.getByText('Avg. APM')).toBeInTheDocument();
    expect(screen.getByText('55.7')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Next Cadet')).toBeInTheDocument();
    // + (4−2) + (4−0) = 6; − (3−2) + (4−2) = 3
    expect(within(screen.getByTestId('grade-requirement-addition')).getByText('6 / 250')).toBeInTheDocument();
    expect(within(screen.getByTestId('grade-requirement-subtraction')).getByText('3 / 150')).toBeInTheDocument();
    expect(screen.queryByTestId('grade-requirement-multiplication')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Requirement met' })).not.toBeInTheDocument();
  });

  it('ignores live run values while a game is still in progress', () => {
    useGameStore.setState({
      phase: 'playing',
      grade: 'commander',
      score: 20,
    });

    render(<ProfileOverlay />);

    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('Next Cadet')).toBeInTheDocument();
    expect(screen.getByText('6 / 250')).toBeInTheDocument();
  });

  it('shows the Major-General requirements to hold with checkmarks at the top grade', () => {
    setMockStoreState({
      grade: 'major-general',
      gameHistoryByProfile: {
        AcePilot: [{
          key: 'top-run',
          playedAt: 1,
          correctAnswers: 3200,
          incorrectAnswers: 0,
          averageAnswerTimeMs: 1000,
          mostProblematicOperation: null,
          operationStats: {
            '+': { attempts: 1300, incorrect: 0, avgTimeMs: 900 },
            '-': { attempts: 1100, incorrect: 0, avgTimeMs: 900 },
            '*': { attempts: 550, incorrect: 0, avgTimeMs: 900 },
            '/': { attempts: 250, incorrect: 0, avgTimeMs: 900 },
          },
          gradeAtFinish: 'major-general',
          finalScore: 3200,
          finalPerfScore: 100,
        }],
      },
    });

    render(<ProfileOverlay />);

    expect(screen.getByText('Keep Major General')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Requirement met' })).toHaveLength(4);
    expect(screen.getByText('AcePilot')).toBeInTheDocument();
  });
});
