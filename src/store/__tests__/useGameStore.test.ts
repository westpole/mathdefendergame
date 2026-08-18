/**
 * Unit tests for Zustand store
 * Tests state management logic
 */

import { gameStore } from '../useGameStore';
import type { GameHistoryEntry } from '../../shared/types';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    gameStore.setState({
      phase: 'booting',
      menuView: 'home',
      bootReady: false,
      activeUsername: null,
      profiles: {},
      grade: 'trainee',
      score: 0,
      lives: 3,
      shield: 5,
      stage: 1,
      stageScore: 0,
      inputBuffer: '',
      correctCount: 0,
      incorrectCount: 0,
      finalPerfScore: 0,
      ddaHeatState: 'BALANCED',
      ddaMathTier: 1,
      ddaSpeedMultiplier: 1,
      ddaIsCooloffActive: false,
      stageMessage: null,
      leaderboard: {
        trainee: [],
        cadet: [],
        commander: [],
        'major-general': [],
      },
      gameHistoryByProfile: {},
    });
  });

  describe('phase management', () => {
    it('should initialize with booting phase', () => {
      const { phase } = gameStore.getState();
      expect(phase).toBe('booting');
    });

    it('should transition to menu after boot', () => {
      gameStore.getState().markBootReady();
      expect(gameStore.getState().bootReady).toBe(true);
      expect(gameStore.getState().phase).toBe('login');
    });

    it('should start playing phase', () => {
      gameStore.getState().startPlaying();
      expect(gameStore.getState().phase).toBe('playing');
    });

    it('should return to menu', () => {
      gameStore.getState().startPlaying();
      gameStore.getState().returnToMenu();
      expect(gameStore.getState().phase).toBe('start');
      expect(gameStore.getState().menuView).toBe('home');
    });
  });

  describe('HUD synchronization', () => {
    it('should update HUD data', () => {
      gameStore.getState().syncHUD({
        score: 100,
        lives: 2,
        shield: 80,
        stage: 5,
        ddaHeatState: 'FLOW',
        ddaMathTier: 3,
        ddaSpeedMultiplier: 1.45,
        ddaIsCooloffActive: false,
      });

      const state = gameStore.getState();
      expect(state.score).toBe(100);
      expect(state.lives).toBe(2);
      expect(state.shield).toBe(80);
      expect(state.stage).toBe(5);
      expect(state.ddaHeatState).toBe('FLOW');
      expect(state.ddaMathTier).toBe(3);
      expect(state.ddaSpeedMultiplier).toBe(1.45);
      expect(state.ddaIsCooloffActive).toBe(false);
    });

    it('should partially update HUD', () => {
      gameStore.getState().syncHUD({ score: 500 });
      expect(gameStore.getState().score).toBe(500);
      expect(gameStore.getState().lives).toBe(3); // unchanged
    });
  });

  describe('menu navigation', () => {
    it('should switch to rules view', () => {
      gameStore.getState().openMenuView('rules');
      expect(gameStore.getState().menuView).toBe('rules');
    });

    it('should switch to profile view', () => {
      gameStore.getState().openMenuView('profile');
      expect(gameStore.getState().menuView).toBe('profile');
    });

    it('should return to home menu', () => {
      gameStore.getState().openMenuView('rules');
      gameStore.getState().openMenuView('home');
      expect(gameStore.getState().menuView).toBe('home');
    });
  });

  describe('profile login', () => {
    it('creates and loads profile when credentials are valid', () => {
      gameStore.getState().markBootReady();

      const result = gameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      expect(result.success).toBe(true);
      expect(gameStore.getState().activeUsername).toBe('PilotOne');
      expect(gameStore.getState().phase).toBe('start');
      expect(gameStore.getState().profiles.PilotOne).toBeTruthy();
    });

    it('rejects duplicate usernames', () => {
      gameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      const duplicate = gameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toMatch(/already exists/i);
    });

    it('rejects invalid passwords', () => {
      const result = gameStore.getState().createAndLoginProfile('PilotTwo', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/must be exactly 8 characters/i);
      expect(gameStore.getState().profiles.PilotTwo).toBeUndefined();
    });

    it('logs in existing profile when credentials match', () => {
      gameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');
      gameStore.setState({ phase: 'login', activeUsername: null });

      const result = gameStore.getState().loginProfile('PilotOne', 'Abc12345');

      expect(result.success).toBe(true);
      expect(gameStore.getState().activeUsername).toBe('PilotOne');
      expect(gameStore.getState().phase).toBe('start');
    });

    it('shows create profile suggestion when username is not found', () => {
      const result = gameStore.getState().loginProfile('GhostPilot', 'Abc12345');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/username not found/i);
      expect(result.error).toMatch(/create profile/i);
    });

    it('rejects login when password does not match', () => {
      gameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');
      gameStore.setState({ phase: 'login', activeUsername: null });

      const result = gameStore.getState().loginProfile('PilotOne', 'Abc12344');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/incorrect password/i);
      expect(gameStore.getState().activeUsername).toBeNull();
      expect(gameStore.getState().phase).toBe('login');
    });
  });

  describe('stage message', () => {
    it('should show stage message on success', () => {
      gameStore.getState().showStageMessage({
        success: true,
        stage: 5,
        score: 1000,
        lives: 2,
        stageIncorrect: 1,
      });

      const state = gameStore.getState();
      expect(state.phase).toBe('stage-message');
      expect(state.stageMessage?.success).toBe(true);
      expect(state.stageMessage?.stage).toBe(5);
    });

    it('should show stage message on failure', () => {
      gameStore.getState().showStageMessage({
        success: false,
        stage: 3,
        score: 500,
        lives: 0,
        stageIncorrect: 5,
      });

      const message = gameStore.getState().stageMessage;
      expect(message?.success).toBe(false);
      expect(message?.lives).toBe(0);
    });
  });

  describe('game over', () => {
    it('should transition to game over phase', () => {
      gameStore.getState().showGameOver({
        grade: 'commander',
        score: 2000,
        correctCount: 50,
        incorrectCount: 10,
        finalPerfScore: 85,
      });

      const state = gameStore.getState();
      expect(state.phase).toBe('gameover');
      expect(state.score).toBe(2000);
      expect(state.finalPerfScore).toBe(85);
    });
  });

  describe('grade', () => {
    it('should set grade level', () => {
      gameStore.getState().setGrade('major-general');
      expect(gameStore.getState().grade).toBe('major-general');
    });

    it('should default to trainee grade', () => {
      expect(gameStore.getState().grade).toBe('trainee');
    });
  });

  describe('leaderboard', () => {
    beforeEach(() => {
      // Clear leaderboard before each test
      gameStore.setState({
        leaderboard: {
          trainee: [],
          cadet: [],
          commander: [],
          'major-general': [],
        },
      });
    });

    it('should save score to leaderboard', () => {
      gameStore.getState().saveScore('Test Player', 1000, 90, 'trainee');

      const scores = gameStore.getState().getScores('trainee');
      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0].name).toBe('Test Player');
      expect(scores[0].score).toBe(1000);
    });

    it('should get scores for specific grade', () => {
      gameStore.getState().saveScore('Player 1', 500, 80, 'trainee');
      gameStore.getState().saveScore('Player 2', 1000, 90, 'cadet');

      const traineeScores = gameStore.getState().getScores('trainee');
      const cadetScores = gameStore.getState().getScores('cadet');
      expect(traineeScores.length).toBe(1);
      expect(cadetScores.length).toBe(1);
    });

    it('should sort leaderboard by score descending', () => {
      gameStore.getState().saveScore('Player 1', 500, 80, 'trainee');
      gameStore.getState().saveScore('Player 2', 1000, 90, 'trainee');
      gameStore.getState().saveScore('Player 3', 750, 85, 'trainee');

      const scores = gameStore.getState().getScores('trainee');
      expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
      expect(scores[1].score).toBeGreaterThanOrEqual(scores[2].score);
    });
  });

  describe('game history', () => {
    const baseHistoryEntry: GameHistoryEntry = {
      key: 'history-1',
      playedAt: 1_700_000_000_000,
      correctAnswers: 10,
      incorrectAnswers: 3,
      averageAnswerTimeMs: 1450,
      mostProblematicOperation: '+',
      operationStats: {
        '+': { attempts: 6, incorrect: 3, avgTimeMs: 1700 },
        '-': { attempts: 3, incorrect: 0, avgTimeMs: 1200 },
        '*': { attempts: 2, incorrect: 0, avgTimeMs: 1300 },
        '/': { attempts: 2, incorrect: 0, avgTimeMs: 1600 },
      },
      gradeAtFinish: 'cadet' as const,
      finalScore: 120,
      finalPerfScore: 76.92,
    };

    it('stores history under active profile', () => {
      gameStore.setState({ activeUsername: 'PilotOne' });

      gameStore.getState().addGameHistory(baseHistoryEntry);

      const history = gameStore.getState().getGameHistory('PilotOne');
      expect(history).toHaveLength(1);
      expect(history[0].finalScore).toBe(120);
      expect(history[0].gradeAtFinish).toBe('cadet');
    });

    it('stores history in guest bucket when no profile is active', () => {
      gameStore.getState().addGameHistory(baseHistoryEntry);

      const history = gameStore.getState().getGameHistory(null);
      expect(history).toHaveLength(1);
      expect(history[0].mostProblematicOperation).toBe('+');
    });

    it('returns newest history first', () => {
      gameStore.setState({ activeUsername: 'PilotOne' });

      gameStore.getState().addGameHistory({
        ...baseHistoryEntry,
        key: 'older-entry',
        playedAt: baseHistoryEntry.playedAt - 5000,
      });

      gameStore.getState().addGameHistory({
        ...baseHistoryEntry,
        key: 'newer-entry',
        playedAt: baseHistoryEntry.playedAt + 5000,
      });

      const history = gameStore.getState().getGameHistory('PilotOne');
      expect(history).toHaveLength(2);
      expect(history[0].key).toBe('newer-entry');
      expect(history[1].key).toBe('older-entry');
    });

    it('limits history to 50 entries per profile', () => {
      gameStore.setState({ activeUsername: 'PilotOne' });

      for (let i = 0; i < 55; i++) {
        gameStore.getState().addGameHistory({
          ...baseHistoryEntry,
          key: `history-${i}`,
          playedAt: baseHistoryEntry.playedAt + i,
        });
      }

      const history = gameStore.getState().getGameHistory('PilotOne', 100);
      expect(history).toHaveLength(50);
      expect(history[0].key).toBe('history-54');
      expect(history[49].key).toBe('history-5');
    });
  });
});
