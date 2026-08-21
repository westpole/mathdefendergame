import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { gameStore } from '@store/useGameStore';

import { ProfileOverlay } from '..';

describe('ProfileOverlay', () => {
  beforeEach(() => {
    gameStore.setState({
      phase: 'start',
      menuView: 'profile',
      bootReady: true,
      activeUsername: 'AcePilot',
      profiles: {
        AcePilot: {
          username: 'AcePilot',
          password: 'Pass1234',
          bestScore: 120,
          highestStage: 3,
          preferredGrade: 'cadet',
          createdAt: 1,
          updatedAt: 2,
        },
      },
      grade: 'cadet',
      score: 120,
      lives: 3,
      shield: 5,
      stage: 1,
      stageScore: 0,
      inputBuffer: '',
      correctCount: 8,
      incorrectCount: 2,
      streak: 0,
      finalPerfScore: 0,
      ddaHeatState: 'BALANCED',
      ddaMathTier: 2,
      ddaSpeedMultiplier: 1,
      ddaIsCooloffActive: false,
      stageMessage: null,
      streakRewardMessage: null,
      pauseOverlay: null,
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
      gameHistoryByProfile: {
        AcePilot: [
          {
            key: 'history-1',
            playedAt: 10,
            correctAnswers: 10,
            incorrectAnswers: 2,
            averageAnswerTimeMs: 1000,
            mostProblematicOperation: '+',
            operationStats: {
              '+': { attempts: 4, incorrect: 1, avgTimeMs: 1100 },
              '-': { attempts: 3, incorrect: 1, avgTimeMs: 1000 },
              '*': { attempts: 3, incorrect: 0, avgTimeMs: 900 },
              '/': { attempts: 2, incorrect: 0, avgTimeMs: 950 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 200,
            finalPerfScore: 83,
          },
          {
            key: 'history-2',
            playedAt: 20,
            correctAnswers: 12,
            incorrectAnswers: 1,
            averageAnswerTimeMs: 900,
            mostProblematicOperation: '-',
            operationStats: {
              '+': { attempts: 4, incorrect: 0, avgTimeMs: 900 },
              '-': { attempts: 4, incorrect: 1, avgTimeMs: 950 },
              '*': { attempts: 3, incorrect: 0, avgTimeMs: 880 },
              '/': { attempts: 2, incorrect: 0, avgTimeMs: 920 },
            },
            gradeAtFinish: 'cadet',
            finalScore: 150,
            finalPerfScore: 92,
          },
        ],
      },
    });
  });

  it('uses completed game history for profile progress in the menu', () => {
    render(<ProfileOverlay />);

    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('1 pts to next grade')).toBeInTheDocument();
  });

  it('includes the active run score while a game is still in progress', () => {
    gameStore.setState({
      phase: 'playing',
      grade: 'commander',
      score: 20,
    });

    render(<ProfileOverlay />);

    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('381 pts to next grade')).toBeInTheDocument();
  });
});
