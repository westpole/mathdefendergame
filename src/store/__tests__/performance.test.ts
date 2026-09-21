import type { GameHistoryEntry } from '@shared/types';

import type { GameStoreState } from '@store/useGameStore';

import { buildPerformanceRows, selectActiveProfileHistory } from './performance';

function createHistoryEntry(
  key: string,
  overrides: Partial<GameHistoryEntry> = {},
): GameHistoryEntry {
  return {
    key,
    playedAt: 1,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageAnswerTimeMs: 0,
    mostProblematicOperation: null,
    operationStats: {
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    },
    gradeAtFinish: 'trainee',
    finalScore: 0,
    finalPerfScore: 0,
    ...overrides,
  };
}

function createState(overrides: Partial<GameStoreState> = {}): GameStoreState {
  return {
    activeUsername: null,
    gameHistoryByProfile: {},
    ...overrides,
  } as GameStoreState;
}

describe('performance selectors', () => {
  describe('selectActiveProfileHistory', () => {
    it('returns guest history when no active profile is set', () => {
      const guestHistory = [createHistoryEntry('guest-run')];
      const state = createState({
        gameHistoryByProfile: {
          __guest__: guestHistory,
        },
      });

      expect(selectActiveProfileHistory(state)).toBe(guestHistory);
    });

    it('returns active profile history when a user is selected', () => {
      const pilotHistory = [createHistoryEntry('pilot-run')];
      const state = createState({
        activeUsername: 'PilotOne',
        gameHistoryByProfile: {
          PilotOne: pilotHistory,
          __guest__: [createHistoryEntry('guest-run')],
        },
      });

      expect(selectActiveProfileHistory(state)).toBe(pilotHistory);
    });

    it('returns an empty history when the selected bucket is missing', () => {
      const guestState = createState();
      const profileState = createState({ activeUsername: 'MissingPilot' });

      expect(selectActiveProfileHistory(guestState)).toEqual([]);
      expect(selectActiveProfileHistory(profileState)).toEqual([]);
    });
  });

  describe('buildPerformanceRows', () => {
    it('returns no-data rows for empty history', () => {
      expect(buildPerformanceRows([])).toEqual([
        {
          operation: '+',
          label: 'Addition (+)',
          accuracy: 0,
          avgSpeedSeconds: 0,
          masteryRating: 'No Data',
          attempts: 0,
        },
        {
          operation: '-',
          label: 'Subtraction (-)',
          accuracy: 0,
          avgSpeedSeconds: 0,
          masteryRating: 'No Data',
          attempts: 0,
        },
        {
          operation: '*',
          label: 'Multiplication (*)',
          accuracy: 0,
          avgSpeedSeconds: 0,
          masteryRating: 'No Data',
          attempts: 0,
        },
        {
          operation: '/',
          label: 'Division (/)',
          accuracy: 0,
          avgSpeedSeconds: 0,
          masteryRating: 'No Data',
          attempts: 0,
        },
      ]);
    });

    it('aggregates stats across history entries and assigns mastery ratings', () => {
      const history = [
        createHistoryEntry('run-1', {
          operationStats: {
            '+': { attempts: 10, incorrect: 0, avgTimeMs: 900 },
            '-': { attempts: 5, incorrect: 1, avgTimeMs: 1800 },
            '*': { attempts: 4, incorrect: 1, avgTimeMs: 2500 },
            '/': { attempts: 5, incorrect: 2, avgTimeMs: 1500 },
          },
        }),
        createHistoryEntry('run-2', {
          operationStats: {
            '+': { attempts: 10, incorrect: 1, avgTimeMs: 1000 },
            '-': { attempts: 5, incorrect: 0, avgTimeMs: 2000 },
            '*': { attempts: 4, incorrect: 1, avgTimeMs: 1500 },
            '/': { attempts: 5, incorrect: 2, avgTimeMs: 2500 },
          },
        }),
      ];

      expect(buildPerformanceRows(history)).toEqual([
        {
          operation: '+',
          label: 'Addition (+)',
          accuracy: 95,
          avgSpeedSeconds: 0.95,
          masteryRating: 'Mastered',
          attempts: 20,
        },
        {
          operation: '-',
          label: 'Subtraction (-)',
          accuracy: 90,
          avgSpeedSeconds: 1.9,
          masteryRating: 'Proficient',
          attempts: 10,
        },
        {
          operation: '*',
          label: 'Multiplication (*)',
          accuracy: 75,
          avgSpeedSeconds: 2,
          masteryRating: 'Needs Practice',
          attempts: 8,
        },
        {
          operation: '/',
          label: 'Division (/)',
          accuracy: 60,
          avgSpeedSeconds: 2,
          masteryRating: 'Weak Spot',
          attempts: 10,
        },
      ]);
    });
  });
});
