/**
 * Unit tests for game logic
 * Tests core gameplay mechanics without Phaser rendering
 */

import { Game } from '../game';

describe('Game', () => {
  let game: Game;
  let mockCallbacks;

  beforeEach(() => {
    // Mock callbacks
    mockCallbacks = {
      onHUDUpdate: vi.fn(),
      onFinishStage: vi.fn(),
      onGameOver: vi.fn(),
      onShake: vi.fn(),
    };

    game = new Game(mockCallbacks);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(game.score).toBe(0);
      expect(game.lives).toBe(10);
      expect(game.shield).toBe(5);
      expect(game.stage).toBe(1);
    });

    it('should initialize with start state', () => {
      expect(game.state).toBe('start');
    });

    it('should have empty meteors array', () => {
      expect(game.meteors).toEqual([]);
    });
  });

  describe('spawnMeteor', () => {
    it('should create a new meteor', () => {
      game.spawnMeteor();
      expect(game.meteors.length).toBe(1);
    });

    it('should create meteor with valid properties', () => {
      game.spawnMeteor();
      const meteor = game.meteors[0];

      expect(meteor.text).toBeTruthy();
      expect(meteor.answer).toBeDefined();
      expect(typeof meteor.answer).toBe('number');
      expect(meteor.x).toBeGreaterThanOrEqual(0);
      expect(meteor.y).toBe(-50);
      expect(meteor.speed).toBeGreaterThan(0);
    });

    it('should generate unique meteor IDs', () => {
      game.spawnMeteor();
      game.spawnMeteor();

      expect(game.meteors[0].id).not.toBe(game.meteors[1].id);
    });
  });

  describe('reset', () => {
    it('should reset game to initial state', () => {
      game.score = 1000;
      game.lives = 1;
      game.stage = 5;
      game.spawnMeteor();

      game.reset();

      expect(game.score).toBe(0);
      expect(game.lives).toBe(10);
      expect(game.shield).toBe(5);
      expect(game.stage).toBe(1);
      expect(game.meteors.length).toBe(0);
    });
  });

  describe('createExplosion', () => {
    it('should create particles for explosion', () => {
      game.createExplosion(100, 200, '#ff0000');
      expect(game.particles.length).toBeGreaterThan(0);
    });

    it('should create particles with correct color', () => {
      const color = '#00ff00';
      game.createExplosion(100, 200, color);

      game.particles.forEach(particle => {
        expect(particle.color).toBe(color);
      });
    });
  });

  describe('createConfetti', () => {
    it('should create confetti particles', () => {
      game.createConfetti();
      expect(game.particles.length).toBeGreaterThan(0);
    });

    it('should create many particles for celebration', () => {
      game.createConfetti();
      expect(game.particles.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('difficulty settings', () => {
    it('should initialize with child difficulty', () => {
      expect(game.difficulty).toBe('child');
    });

    it('should track correct and incorrect answers', () => {
      expect(game.correctCount).toBe(0);
      expect(game.incorrectCount).toBe(0);
    });
  });
});
