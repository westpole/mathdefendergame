/**
 * Unit tests for Zustand store
 * Tests state management logic
 */

import { gameStore } from '../useGameStore';

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

    it('should switch to high-score view', () => {
      gameStore.getState().openMenuView('high-score');
      expect(gameStore.getState().menuView).toBe('high-score');
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
});
