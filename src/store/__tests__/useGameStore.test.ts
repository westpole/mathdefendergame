/**
 * Unit tests for Zustand store
 * Tests state management logic
 */

import { useGameStore } from '../useGameStore';
import type { GameHistoryEntry } from '@shared/types';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      phase: 'booting',
      screenView: 'home',
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
      streak: 0,
      finalPerfScore: 0,
      ddaHeatState: 'BALANCED',
      ddaMathTier: 1,
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
      useGameStore.getState().openMenu();
      expect(useGameStore.getState().phase).toBe('start');
      expect(useGameStore.getState().screenView).toBe('home');
    });

    it('should reset transient gameplay state while preserving profile progress when returning to menu', () => {
      useGameStore.setState({
        bootReady: true,
        phase: 'playing',
        activeUsername: 'PilotOne',
        rememberedUsername: 'PilotOne',
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 220,
            highestStage: 6,
            preferredGrade: 'cadet',
            createdAt: 1,
            updatedAt: 2,
          },
        },
        grade: 'cadet',
        score: 220,
        lives: 1,
        shield: 2,
        stage: 4,
        stageScore: 8,
        inputBuffer: '42',
        correctCount: 12,
        incorrectCount: 3,
        streak: 5,
        stageMessage: {
          success: true,
          stage: 4,
          score: 220,
          lives: 1,
          stageIncorrect: 1,
        },
        streakRewardMessage: { message: 'Streak x5' },
        pauseOverlay: { reason: 'escape', isSavingBeforeClose: false },
        gameHistoryByProfile: {
          PilotOne: [],
        },
      });

      useGameStore.getState().openMenu();

      const state = useGameStore.getState();
      expect(state.phase).toBe('start');
      expect(state.screenView).toBe('home');
      expect(state.score).toBe(220);
      expect(state.grade).toBe('cadet');
      expect(state.activeUsername).toBe('PilotOne');
      expect(state.rememberedUsername).toBe('PilotOne');
      expect(state.stage).toBe(1);
      expect(state.lives).toBe(3);
      expect(state.shield).toBe(5);
      expect(state.stageScore).toBe(0);
      expect(state.inputBuffer).toBe('');
      expect(state.correctCount).toBe(0);
      expect(state.incorrectCount).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.stageMessage).toBeNull();
      expect(state.streakRewardMessage).toBeNull();
      expect(state.pauseOverlay).toBeNull();
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
      useGameStore.getState().openScreenView('rules');
      expect(useGameStore.getState().screenView).toBe('rules');
    });

    it('should switch to profile view', () => {
      useGameStore.getState().openScreenView('profile');
      expect(useGameStore.getState().screenView).toBe('profile');
    });

    it('should switch to performance view', () => {
      useGameStore.getState().openScreenView('performance');
      expect(useGameStore.getState().screenView).toBe('performance');
    });

    it('should return to home menu', () => {
      useGameStore.getState().openScreenView('rules');
      useGameStore.getState().openScreenView('home');
      expect(useGameStore.getState().screenView).toBe('home');
    });

    it('should preserve profile state and clear transient overlays when opening a menu view', () => {
      useGameStore.setState({
        bootReady: true,
        phase: 'paused',
        screenView: 'home',
        activeUsername: 'PilotOne',
        rememberedUsername: 'PilotOne',
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 180,
            highestStage: 4,
            preferredGrade: 'cadet',
            createdAt: 1,
            updatedAt: 2,
          },
        },
        grade: 'cadet',
        score: 180,
        stageMessage: {
          success: false,
          stage: 3,
          score: 180,
          lives: 0,
          stageIncorrect: 5,
        },
        streakRewardMessage: { message: 'Streak x3' },
        pauseOverlay: { reason: 'background', isSavingBeforeClose: false },
      });

      useGameStore.getState().openScreenView('performance');

      const state = useGameStore.getState();
      expect(state.phase).toBe('start');
      expect(state.screenView).toBe('performance');
      expect(state.score).toBe(180);
      expect(state.grade).toBe('cadet');
      expect(state.activeUsername).toBe('PilotOne');
      expect(state.stageMessage).toBeNull();
      expect(state.streakRewardMessage).toBeNull();
      expect(state.pauseOverlay).toBeNull();
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

    it('trims usernames when creating and logging into a profile', () => {
      const created = useGameStore.getState().createAndLoginProfile('  PilotOne  ', 'Abc12345');

      expect(created.success).toBe(true);
      expect(useGameStore.getState().profiles.PilotOne).toBeTruthy();
      expect(useGameStore.getState().profiles['  PilotOne  ']).toBeUndefined();

      useGameStore.setState({ phase: 'login', activeUsername: null });

      const loggedIn = useGameStore.getState().loginProfile('  PilotOne  ', 'Abc12345', false);

      expect(loggedIn.success).toBe(true);
      expect(useGameStore.getState().activeUsername).toBe('PilotOne');
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

    it('returns the active profile when one is selected', () => {
      useGameStore.getState().createAndLoginProfile('PilotOne', 'Abc12345');

      const profile = useGameStore.getState().getActiveProfile();

      expect(profile?.username).toBe('PilotOne');
      expect(profile?.bestScore).toBe(0);
    });

    it('returns null when no profile is active', () => {
      expect(useGameStore.getState().getActiveProfile()).toBeNull();
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

  describe('streak reward message', () => {
    it('shows and clears the streak reward message', () => {
      useGameStore.getState().showStreakRewardMessage({ message: 'Perfect streak' });
      expect(useGameStore.getState().streakRewardMessage?.message).toBe('Perfect streak');

      useGameStore.getState().clearStreakRewardMessage();
      expect(useGameStore.getState().streakRewardMessage).toBeNull();
    });
  });

  describe('pause overlay', () => {
    it('shows pause overlay and clears other transient overlays', () => {
      useGameStore.setState({
        phase: 'playing',
        stageMessage: {
          success: true,
          stage: 2,
          score: 40,
          lives: 2,
          stageIncorrect: 0,
        },
        streakRewardMessage: { message: 'Hot streak' },
      });

      useGameStore.getState().showPauseOverlay('background');

      const state = useGameStore.getState();
      expect(state.phase).toBe('paused');
      expect(state.stageMessage).toBeNull();
      expect(state.streakRewardMessage).toBeNull();
      expect(state.pauseOverlay).toEqual({
        reason: 'background',
        isSavingBeforeClose: false,
      });
    });

    it('hides pause overlay and resumes playing after boot', () => {
      useGameStore.setState({
        bootReady: true,
        phase: 'paused',
        pauseOverlay: { reason: 'escape', isSavingBeforeClose: false },
      });

      useGameStore.getState().hidePauseOverlay();

      expect(useGameStore.getState().phase).toBe('playing');
      expect(useGameStore.getState().pauseOverlay).toBeNull();
    });

    it('clears the pause overlay without resuming play before boot is ready', () => {
      useGameStore.setState({
        bootReady: false,
        phase: 'paused',
        pauseOverlay: { reason: 'window-close', isSavingBeforeClose: false },
      });

      useGameStore.getState().hidePauseOverlay();

      expect(useGameStore.getState().phase).toBe('paused');
      expect(useGameStore.getState().pauseOverlay).toBeNull();
    });

    it('marks an existing pause overlay as saving before close', () => {
      useGameStore.setState({
        phase: 'paused',
        pauseOverlay: { reason: 'background', isSavingBeforeClose: false },
      });

      useGameStore.getState().showSavingBeforeClose();

      expect(useGameStore.getState().pauseOverlay).toEqual({
        reason: 'background',
        isSavingBeforeClose: true,
      });
    });

    it('creates a window-close saving overlay when none exists', () => {
      useGameStore.getState().showSavingBeforeClose();

      const state = useGameStore.getState();
      expect(state.phase).toBe('paused');
      expect(state.pauseOverlay).toEqual({
        reason: 'window-close',
        isSavingBeforeClose: true,
      });
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

    it('resolves grade from lifetime history and updates the active profile', () => {
      useGameStore.setState({
        activeUsername: 'PilotOne',
        stage: 6,
        stageMessage: {
          success: false,
          stage: 5,
          score: 120,
          lives: 0,
          stageIncorrect: 3,
        },
        streakRewardMessage: { message: 'Streak x4' },
        pauseOverlay: { reason: 'escape', isSavingBeforeClose: false },
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 100,
            highestStage: 2,
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
              correctAnswers: 10,
              incorrectAnswers: 2,
              averageAnswerTimeMs: 1200,
              mostProblematicOperation: '+',
              operationStats: {
                '+': { attempts: 4, incorrect: 1, avgTimeMs: 1300 },
                '-': { attempts: 3, incorrect: 1, avgTimeMs: 1100 },
                '*': { attempts: 3, incorrect: 0, avgTimeMs: 1000 },
                '/': { attempts: 2, incorrect: 0, avgTimeMs: 1200 },
              },
              gradeAtFinish: 'cadet',
              finalScore: 400,
              finalPerfScore: 83.3,
            },
          ],
        },
      });

      useGameStore.getState().showGameOver({
        grade: 'trainee',
        score: 150,
        correctCount: 20,
        incorrectCount: 5,
        finalPerfScore: 80,
      });

      const state = useGameStore.getState();
      expect(state.phase).toBe('gameover');
      expect(state.grade).toBe('commander');
      expect(state.stageMessage).toBeNull();
      expect(state.streakRewardMessage).toBeNull();
      expect(state.pauseOverlay).toBeNull();
      expect(state.profiles.PilotOne.bestScore).toBe(150);
      expect(state.profiles.PilotOne.highestStage).toBe(6);
      expect(state.profiles.PilotOne.preferredGrade).toBe('commander');
    });

    it('uses lifetime history grade for guest game over state', () => {
      useGameStore.setState({
        gameHistoryByProfile: {
          __guest__: [
            {
              key: 'guest-history-1',
              playedAt: 1,
              correctAnswers: 25,
              incorrectAnswers: 1,
              averageAnswerTimeMs: 900,
              mostProblematicOperation: null,
              operationStats: {
                '+': { attempts: 7, incorrect: 0, avgTimeMs: 900 },
                '-': { attempts: 6, incorrect: 0, avgTimeMs: 950 },
                '*': { attempts: 6, incorrect: 0, avgTimeMs: 880 },
                '/': { attempts: 6, incorrect: 1, avgTimeMs: 980 },
              },
              gradeAtFinish: 'major-general',
              finalScore: 800,
              finalPerfScore: 96.1,
            },
          ],
        },
      });

      useGameStore.getState().showGameOver({
        grade: 'trainee',
        score: 90,
        correctCount: 12,
        incorrectCount: 1,
        finalPerfScore: 92,
      });

      expect(useGameStore.getState().grade).toBe('major-general');
    });
  });

  describe('premature game end persistence', () => {
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

    it('stores premature end history and updates active profile progress', () => {
      useGameStore.setState({
        activeUsername: 'PilotOne',
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'Abc12345',
            bestScore: 100,
            highestStage: 2,
            preferredGrade: 'trainee',
            createdAt: 1,
            updatedAt: 2,
          },
        },
        gameHistoryByProfile: {
          PilotOne: [
            {
              ...baseHistoryEntry,
              key: 'older-history',
              playedAt: baseHistoryEntry.playedAt - 1000,
              finalScore: 240,
            },
          ],
        },
      });

      useGameStore.getState().persistPrematureGameEnd({
        grade: 'trainee',
        score: 150,
        stage: 6,
        historyEntry: {
          ...baseHistoryEntry,
          key: 'new-history',
          playedAt: baseHistoryEntry.playedAt + 1000,
          finalScore: 160,
        },
      });

      const state = useGameStore.getState();
      expect(state.score).toBe(150);
      expect(state.stage).toBe(6);
      expect(state.grade).toBe('commander');
      expect(state.gameHistoryByProfile.PilotOne).toHaveLength(2);
      expect(state.gameHistoryByProfile.PilotOne[0].key).toBe('new-history');
      expect(state.profiles.PilotOne.bestScore).toBe(150);
      expect(state.profiles.PilotOne.highestStage).toBe(6);
      expect(state.profiles.PilotOne.preferredGrade).toBe('commander');
    });

    it('stores premature end history in the guest bucket when no profile is active', () => {
      useGameStore.getState().persistPrematureGameEnd({
        grade: 'trainee',
        score: 95,
        stage: 3,
        historyEntry: baseHistoryEntry,
      });

      const history = useGameStore.getState().getGameHistory(null, 10);
      expect(history).toHaveLength(1);
      expect(history[0].key).toBe('history-1');
      expect(useGameStore.getState().score).toBe(95);
      expect(useGameStore.getState().stage).toBe(3);
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

    it('should return combined scores across grades in descending order', () => {
      useGameStore.getState().saveScore('Cadet Ace', 500, 90, 'cadet');
      useGameStore.getState().saveScore('Trainee Pro', 550, 10, 'trainee');
      useGameStore.getState().saveScore('Commander Max', 450, 200, 'commander');

      const scores = useGameStore.getState().getScores();
      expect(scores).toHaveLength(3);
      expect(scores[0].name).toBe('Commander Max');
      expect(scores[1].name).toBe('Cadet Ace');
      expect(scores[2].name).toBe('Trainee Pro');
    });

    it('should keep only the top 10 scores per grade', () => {
      for (let i = 0; i < 12; i++) {
        useGameStore.getState().saveScore(`Player ${i}`, i * 10, i, 'trainee');
      }

      const scores = useGameStore.getState().getScores('trainee');
      expect(scores).toHaveLength(10);
      expect(scores[0].name).toBe('Player 11');
      expect(scores[9].name).toBe('Player 2');
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

    it('uses the active profile and default limit when no username is provided', () => {
      useGameStore.setState({ activeUsername: 'PilotOne' });

      for (let i = 0; i < 25; i++) {
        useGameStore.getState().addGameHistory({
          ...baseHistoryEntry,
          key: `active-history-${i}`,
          playedAt: baseHistoryEntry.playedAt + i,
        });
      }

      const history = useGameStore.getState().getGameHistory();
      expect(history).toHaveLength(20);
      expect(history[0].key).toBe('active-history-24');
      expect(history[19].key).toBe('active-history-5');
    });

    it('returns an empty history for negative limits', () => {
      useGameStore.getState().addGameHistory(baseHistoryEntry);

      expect(useGameStore.getState().getGameHistory(null, -1)).toEqual([]);
    });
  });
});
