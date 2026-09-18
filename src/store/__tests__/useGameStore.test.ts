/**
 * Unit tests for Zustand store
 * Tests state management logic
 */

import { useGameStore } from '../useGameStore';
import type { GameHistoryEntry } from '../../shared/types';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      phase: 'booting',
      menuView: 'home',
      bootReady: false,
      activeUsername: null,
      rememberedUsername: null,
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
      const { phase } = useGameStore.getState();
      expect(phase).toBe('booting');
    });

    it('should transition to login after boot when no remembered profile exists', () => {
      useGameStore.getState().markBootReady();
      expect(useGameStore.getState().bootReady).toBe(true);
      expect(useGameStore.getState().phase).toBe('login');
    });

    it('should restore remembered user after boot', () => {
      useGameStore.setState({
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 100,
            highestStage: 3,
            preferredGrade: 'trainee',
            createdAt: 1,
            updatedAt: 2,
          },
        },
        rememberedUsername: 'PilotOne',
      });

      useGameStore.getState().markBootReady();

      expect(useGameStore.getState().phase).toBe('start');
      expect(useGameStore.getState().activeUsername).toBe('PilotOne');
    });

    it('should start playing phase', () => {
      useGameStore.getState().startPlaying();
      expect(useGameStore.getState().phase).toBe('playing');
    });

    it('should return to menu', () => {
      useGameStore.getState().startPlaying();
      useGameStore.getState().returnToMenu();
      expect(useGameStore.getState().phase).toBe('start');
      expect(useGameStore.getState().menuView).toBe('home');
    });
  });

  describe('HUD synchronization', () => {
    it('should update HUD data', () => {
      useGameStore.getState().syncHUD({
        score: 100,
        lives: 2,
        shield: 80,
        stage: 5,
        ddaHeatState: 'FLOW',
        ddaMathTier: 3,
        ddaSpeedMultiplier: 1.45,
        ddaIsCooloffActive: false,
      });

      const state = useGameStore.getState();
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
      useGameStore.getState().syncHUD({ score: 500 });
      expect(useGameStore.getState().score).toBe(500);
      expect(useGameStore.getState().lives).toBe(3); // unchanged
    });
  });

  describe('menu navigation', () => {
    it('should switch to rules view', () => {
      useGameStore.getState().openMenuView('rules');
      expect(useGameStore.getState().menuView).toBe('rules');
    });

    it('should switch to profile view', () => {
      useGameStore.getState().openMenuView('profile');
      expect(useGameStore.getState().menuView).toBe('profile');
    });

    it('should switch to performance view', () => {
      useGameStore.getState().openMenuView('performance');
      expect(useGameStore.getState().menuView).toBe('performance');
    });

    it('should return to home menu', () => {
      useGameStore.getState().openMenuView('rules');
      useGameStore.getState().openMenuView('home');
      expect(useGameStore.getState().menuView).toBe('home');
    });
  });

  describe('profile login', () => {
    it('creates and loads profile when credentials are valid', () => {
      useGameStore.getState().markBootReady();

      const result = useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      expect(result.success).toBe(true);
      expect(useGameStore.getState().activeUsername).toBe('PilotOne');
      expect(useGameStore.getState().phase).toBe('start');
      expect(useGameStore.getState().profiles.PilotOne).toBeTruthy();
    });

    it('rejects duplicate usernames', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      const duplicate = useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toMatch(/already exists/i);
    });

    it('rejects invalid passwords', () => {
      const result = useGameStore.getState().createAndLoginProfile('PilotTwo', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/must be exactly 8 characters/i);
      expect(useGameStore.getState().profiles.PilotTwo).toBeUndefined();
    });

    it('logs in existing profile when credentials match', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');
      useGameStore.setState({ phase: 'login', activeUsername: null });

      const result = useGameStore.getState().loginProfile('PilotOne', 'Abc12345', false);

      expect(result.success).toBe(true);
      expect(useGameStore.getState().activeUsername).toBe('PilotOne');
      expect(useGameStore.getState().phase).toBe('start');
      expect(useGameStore.getState().rememberedUsername).toBeNull();
    });

    it('remembers successful login when keep me logged in is selected', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');
      useGameStore.setState({ phase: 'login', activeUsername: null, rememberedUsername: null });

      const result = useGameStore.getState().loginProfile('PilotOne', 'Abc12345', true);

      expect(result.success).toBe(true);
      expect(useGameStore.getState().rememberedUsername).toBe('PilotOne');
    });

    it('logs off by clearing active and remembered login credentials', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345', true);

      useGameStore.getState().logOff();

      expect(useGameStore.getState().phase).toBe('login');
      expect(useGameStore.getState().activeUsername).toBeNull();
      expect(useGameStore.getState().rememberedUsername).toBeNull();
      expect(useGameStore.getState().profiles.PilotOne).toBeTruthy();
    });

    it('derives the login grade from cumulative game history', () => {
      useGameStore.setState({
        phase: 'login',
        activeUsername: null,
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 200,
            highestStage: 4,
            preferredGrade: 'trainee',
            createdAt: 1,
            updatedAt: 2,
          },
        },
        gameHistoryByProfile: {
          PilotOne: [
            {
              key: 'history-1',
              playedAt: 1,
              correctAnswers: 20,
              incorrectAnswers: 2,
              averageAnswerTimeMs: 1000,
              mostProblematicOperation: '+',
              operationStats: {
                '+': { attempts: 6, incorrect: 1, avgTimeMs: 1100 },
                '-': { attempts: 5, incorrect: 1, avgTimeMs: 1000 },
                '*': { attempts: 5, incorrect: 0, avgTimeMs: 950 },
                '/': { attempts: 4, incorrect: 0, avgTimeMs: 980 },
              },
              gradeAtFinish: 'commander',
              finalScore: 400,
              finalPerfScore: 91,
            },
          ],
        },
      });

      const result = useGameStore.getState().loginProfile('PilotOne', 'Abc12345', false);

      expect(result.success).toBe(true);
      expect(useGameStore.getState().grade).toBe('commander');
    });

    it('shows create profile suggestion when username is not found', () => {
      const result = useGameStore.getState().loginProfile('GhostPilot', 'Abc12345', false);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/username not found/i);
      expect(result.error).toMatch(/create profile/i);
    });

    it('rejects login when password does not match', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');
      useGameStore.setState({ phase: 'login', activeUsername: null });

      const result = useGameStore.getState().loginProfile('PilotOne', 'Abc12344', false);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/incorrect password/i);
      expect(useGameStore.getState().activeUsername).toBeNull();
      expect(useGameStore.getState().phase).toBe('login');
    });
  });

  describe('stage message', () => {
    it('should show stage message on success', () => {
      useGameStore.getState().showStageMessage({
        success: true,
        stage: 5,
        score: 1000,
        lives: 2,
        stageIncorrect: 1,
      });

      const state = useGameStore.getState();
      expect(state.phase).toBe('stage-message');
      expect(state.stageMessage?.success).toBe(true);
      expect(state.stageMessage?.stage).toBe(5);
    });

    it('should show stage message on failure', () => {
      useGameStore.getState().showStageMessage({
        success: false,
        stage: 3,
        score: 500,
        lives: 0,
        stageIncorrect: 5,
      });

      const message = useGameStore.getState().stageMessage;
      expect(message?.success).toBe(false);
      expect(message?.lives).toBe(0);
    });
  });

  describe('game over', () => {
    it('should transition to game over phase', () => {
      useGameStore.getState().showGameOver({
        grade: 'commander',
        score: 2000,
        correctCount: 50,
        incorrectCount: 10,
        finalPerfScore: 85,
      });

      const state = useGameStore.getState();
      expect(state.phase).toBe('gameover');
      expect(state.score).toBe(2000);
      expect(state.finalPerfScore).toBe(85);
    });
  });

  describe('grade', () => {
    it('should set grade level', () => {
      useGameStore.getState().setGrade('major-general');
      expect(useGameStore.getState().grade).toBe('major-general');
    });

    it('should default to trainee grade', () => {
      expect(useGameStore.getState().grade).toBe('trainee');
    });
  });

  describe('leaderboard', () => {
    beforeEach(() => {
      // Clear leaderboard before each test
      useGameStore.setState({
        leaderboard: {
          trainee: [],
          cadet: [],
          commander: [],
          'major-general': [],
        },
      });
    });

    it('should save score to leaderboard', () => {
      useGameStore.getState().saveScore('Test Player', 1000, 90, 'trainee');

      const scores = useGameStore.getState().getScores('trainee');
      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0].name).toBe('Test Player');
      expect(scores[0].score).toBe(1000);
    });

    it('should get scores for specific grade', () => {
      useGameStore.getState().saveScore('Player 1', 500, 80, 'trainee');
      useGameStore.getState().saveScore('Player 2', 1000, 90, 'cadet');

      const traineeScores = useGameStore.getState().getScores('trainee');
      const cadetScores = useGameStore.getState().getScores('cadet');
      expect(traineeScores.length).toBe(1);
      expect(cadetScores.length).toBe(1);
    });

    it('should sort leaderboard by score descending', () => {
      useGameStore.getState().saveScore('Player 1', 500, 80, 'trainee');
      useGameStore.getState().saveScore('Player 2', 1000, 90, 'trainee');
      useGameStore.getState().saveScore('Player 3', 750, 85, 'trainee');

      const scores = useGameStore.getState().getScores('trainee');
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
      useGameStore.setState({ activeUsername: 'PilotOne' });

      useGameStore.getState().addGameHistory(baseHistoryEntry);

      const history = useGameStore.getState().getGameHistory('PilotOne');
      expect(history).toHaveLength(1);
      expect(history[0].finalScore).toBe(120);
      expect(history[0].gradeAtFinish).toBe('cadet');
    });

    it('stores history in guest bucket when no profile is active', () => {
      useGameStore.getState().addGameHistory(baseHistoryEntry);

      const history = useGameStore.getState().getGameHistory(null);
      expect(history).toHaveLength(1);
      expect(history[0].mostProblematicOperation).toBe('+');
    });

    it('returns newest history first', () => {
      useGameStore.setState({ activeUsername: 'PilotOne' });

      useGameStore.getState().addGameHistory({
        ...baseHistoryEntry,
        key: 'older-entry',
        playedAt: baseHistoryEntry.playedAt - 5000,
      });

      useGameStore.getState().addGameHistory({
        ...baseHistoryEntry,
        key: 'newer-entry',
        playedAt: baseHistoryEntry.playedAt + 5000,
      });

      const history = useGameStore.getState().getGameHistory('PilotOne');
      expect(history).toHaveLength(2);
      expect(history[0].key).toBe('newer-entry');
      expect(history[1].key).toBe('older-entry');
    });

    it('keeps full history per profile', () => {
      useGameStore.setState({ activeUsername: 'PilotOne' });

      for (let i = 0; i < 55; i++) {
        useGameStore.getState().addGameHistory({
          ...baseHistoryEntry,
          key: `history-${i}`,
          playedAt: baseHistoryEntry.playedAt + i,
        });
      }

      const history = useGameStore.getState().getGameHistory('PilotOne', 100);
      expect(history).toHaveLength(55);
      expect(history[0].key).toBe('history-54');
      expect(history[54].key).toBe('history-0');
    });
  });
});
