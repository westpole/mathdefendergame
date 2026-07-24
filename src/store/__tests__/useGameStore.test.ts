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
      difficulty: 'child',
      score: 0,
      lives: 10,
      shield: 5,
      stage: 1,
      stageScore: 0,
      inputBuffer: '',
      correctCount: 0,
      incorrectCount: 0,
      finalPerfScore: 0,
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
        stage: 5
      });

      const state = gameStore.getState();
      expect(state.score).toBe(100);
      expect(state.lives).toBe(2);
      expect(state.shield).toBe(80);
      expect(state.stage).toBe(5);
    });

    it('should partially update HUD', () => {
      gameStore.getState().syncHUD({ score: 500 });
      expect(gameStore.getState().score).toBe(500);
      expect(gameStore.getState().lives).toBe(10); // unchanged
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
        difficulty: 'student',
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

  describe('difficulty', () => {
    it('should set difficulty level', () => {
      gameStore.getState().setDifficulty('adult');
      expect(gameStore.getState().difficulty).toBe('adult');
    });

    it('should default to child difficulty', () => {
      expect(gameStore.getState().difficulty).toBe('child');
    });
  });

  describe('leaderboard', () => {
    beforeEach(() => {
      // Clear leaderboard before each test
      gameStore.setState({
        leaderboard: {
          child: [],
          student: [],
          adult: [],
        },
      });
    });

    it('should save score to leaderboard', () => {
      gameStore.getState().saveScore('Test Player', 1000, 90, 'child');

      const scores = gameStore.getState().getScores('child');
      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0].name).toBe('Test Player');
      expect(scores[0].score).toBe(1000);
    });

    it('should get scores for specific difficulty', () => {
      gameStore.getState().saveScore('Player 1', 500, 80, 'child');
      gameStore.getState().saveScore('Player 2', 1000, 90, 'student');

      const childScores = gameStore.getState().getScores('child');
      const studentScores = gameStore.getState().getScores('student');
      expect(childScores.length).toBe(1);
      expect(studentScores.length).toBe(1);
    });

    it('should sort leaderboard by score descending', () => {
      gameStore.getState().saveScore('Player 1', 500, 80, 'child');
      gameStore.getState().saveScore('Player 2', 1000, 90, 'child');
      gameStore.getState().saveScore('Player 3', 750, 85, 'child');

      const scores = gameStore.getState().getScores('child');
      expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
      expect(scores[1].score).toBeGreaterThanOrEqual(scores[2].score);
    });
  });
});
