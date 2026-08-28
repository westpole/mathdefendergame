/**
 * Unit tests for game logic
 * Tests core gameplay mechanics without Phaser rendering
 */

import { Game } from '../main';
import { gameStore } from '@store/useGameStore';

interface Callbacks {
  onHUDUpdate: () => void;
  onFinishStage: (success: boolean) => void;
  onStreakReward: (lives: number) => void;
  onGameOver: (reason: 'victory' | 'lives-depleted') => void;
  onShake: () => void;
}

describe('Game', () => {
  let game: Game;
  let mockCallbacks: Callbacks;

  beforeEach(() => {
    // Mock callbacks
    mockCallbacks = {
      onHUDUpdate: vi.fn(),
      onFinishStage: vi.fn(),
      onStreakReward: vi.fn(),
      onGameOver: vi.fn(),
      onShake: vi.fn(),
    };

    game = new Game(mockCallbacks);
    gameStore.setState({ activeUsername: null, gameHistoryByProfile: {} });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(game.score).toBe(0);
      expect(game.lives).toBe(3);
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
      expect(game.lives).toBe(3);
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

  describe('grade progression', () => {
    it('should initialize with trainee grade', () => {
      expect(game.grade).toBe('trainee');
    });

    it('should track correct and incorrect answers', () => {
      expect(game.correctCount).toBe(0);
      expect(game.incorrectCount).toBe(0);
    });

    it('promotes to cadet at score 101', () => {
      game.spawnMeteor();
      game.state = 'playing';
      game.score = 100;

      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();
      game.checkAnswer();

      expect(game.score).toBe(101);
      expect(game.grade).toBe('cadet');
    });

    it('promotes to commander at score 351', () => {
      game.spawnMeteor();
      game.state = 'playing';
      game.score = 350;

      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();
      game.checkAnswer();

      expect(game.score).toBe(351);
      expect(game.grade).toBe('commander');
    });

    it('promotes to major-general at score 751', () => {
      game.spawnMeteor();
      game.state = 'playing';
      game.score = 750;

      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();
      game.checkAnswer();

      expect(game.score).toBe(751);
      expect(game.grade).toBe('major-general');
    });

    it('carries grade progress across completed games', () => {
      gameStore.setState({
        activeUsername: 'PilotOne',
        gameHistoryByProfile: {
          PilotOne: [
            {
              key: 'history-1',
              playedAt: 1,
              correctAnswers: 10,
              incorrectAnswers: 0,
              averageAnswerTimeMs: 1000,
              mostProblematicOperation: null,
              operationStats: {
                '+': { attempts: 4, incorrect: 0, avgTimeMs: 900 },
                '-': { attempts: 3, incorrect: 0, avgTimeMs: 950 },
                '*': { attempts: 2, incorrect: 0, avgTimeMs: 980 },
                '/': { attempts: 1, incorrect: 0, avgTimeMs: 1000 },
              },
              gradeAtFinish: 'cadet',
              finalScore: 350,
              finalPerfScore: 90,
            },
          ],
        },
      });

      game.reset();

      expect(game.grade).toBe('cadet');

      game.spawnMeteor();
      game.state = 'playing';

      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();
      game.checkAnswer();

      expect(game.score).toBe(1);
      expect(game.grade).toBe('commander');
    });
  });

  describe('checkAnswer', () => {
    beforeEach(() => {
      game.spawnMeteor();
      game.state = 'playing';
    });

    it('should destroy meteor on correct answer', () => {
      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();

      game.checkAnswer();

      expect(game.meteors.length).toBe(0);
      expect(game.score).toBe(1);
      expect(game.stageScore).toBe(1);
      expect(game.correctCount).toBe(1);
      expect(game.inputBuffer).toBe('');
    });

    it('should create particles on correct answer', () => {
      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();

      game.checkAnswer();

      expect(game.particles.length).toBeGreaterThan(0);
    });

    it('should increment incorrect count on wrong answer', () => {
      game.inputBuffer = '99999';

      game.checkAnswer();

      expect(game.incorrectCount).toBe(1);
      expect(game.stageIncorrect).toBe(1);
      expect(game.score).toBe(0);
      expect(game.inputBuffer).toBe('');
      expect(mockCallbacks.onShake).toHaveBeenCalled();
    });

    it('should reset streak on incorrect answer', () => {
      game.streak = 12;
      game.inputBuffer = '99999';

      game.checkAnswer();

      expect(game.streak).toBe(0);
    });

    it('should award a life and reset streak at 30 correct answers in a row', () => {
      const initialLives = game.lives;
      game.streak = 29;
      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();

      game.checkAnswer();

      expect(game.lives).toBe(initialLives + 1);
      expect(game.streak).toBe(0);
      expect(game.state).toBe('paused');
      expect(mockCallbacks.onStreakReward).toHaveBeenCalledWith(initialLives + 1);
    });

    it('should not reduce score below zero on wrong answers', () => {
      game.score = 0;
      game.inputBuffer = '99999';

      game.checkAnswer();

      expect(game.score).toBe(0);
    });

    it('should not process NaN input', () => {
      game.inputBuffer = 'abc';
      const initialMeteors = game.meteors.length;

      game.checkAnswer();

      expect(game.meteors.length).toBe(initialMeteors);
      expect(game.score).toBe(0);
    });

    it('should finish stage when correct-answer target is reached', () => {
      const meteor = game.meteors[0];
      game.inputBuffer = meteor.answer.toString();
      game.stageScore = 6;
      game.stageCorrect = 6;

      game.checkAnswer();

      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(true);
      expect(game.state).toBe('message');
    });

    it('should call onHUDUpdate callback', () => {
      game.inputBuffer = '99999';

      game.checkAnswer();

      expect(mockCallbacks.onHUDUpdate).toHaveBeenCalled();
    });
  });

  describe('hitBase', () => {
    it('should decrease shield', () => {
      const initialShield = game.shield;

      game.hitBase();

      expect(game.shield).toBe(initialShield - 1);
      expect(mockCallbacks.onHUDUpdate).toHaveBeenCalled();
    });

    it('should fail stage when shield reaches 0', () => {
      game.shield = 1;

      game.hitBase();

      expect(game.shield).toBe(0);
      expect(game.lives).toBe(2);
    });

    it('should not fail stage when shield is above 0', () => {
      game.shield = 5;
      const initialLives = game.lives;

      game.hitBase();

      expect(game.lives).toBe(initialLives);
    });
  });

  describe('failStage', () => {
    it('should decrease lives', () => {
      const initialLives = game.lives;

      game.failStage();

      expect(game.lives).toBe(initialLives - 1);
      expect(mockCallbacks.onHUDUpdate).toHaveBeenCalled();
    });

    it('should show failed stage when lives reach 0', () => {
      game.lives = 1;

      game.failStage();

      expect(game.lives).toBe(0);
      expect(game.state).toBe('message');
      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(false);
      expect(mockCallbacks.onGameOver).not.toHaveBeenCalled();
    });

    it('should finish stage with failure when lives remain', () => {
      game.lives = 5;

      game.failStage();

      expect(game.state).toBe('message');
      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(false);
    });
  });

  describe('finishStage', () => {
    beforeEach(() => {
      game.state = 'playing';
    });

    it('should create confetti on success', () => {
      game.finishStage(true);

      expect(game.particles.length).toBeGreaterThan(0);
    });

    it('should not award bonus life for a perfect stage without the streak threshold', () => {
      game.stageIncorrect = 0;
      const initialLives = game.lives;

      game.finishStage(true);

      expect(game.lives).toBe(initialLives);
    });

    it('should not award bonus life when stage has errors', () => {
      game.stageIncorrect = 2;
      const initialLives = game.lives;

      game.finishStage(true);

      expect(game.lives).toBe(initialLives);
    });

    it('should increment stage on success', () => {
      const initialStage = game.stage;

      game.finishStage(true);

      expect(game.stage).toBe(initialStage + 1);
    });

    it('should update checkpoints on success without a streak bonus', () => {
      game.score = 100;
      game.lives = 8;
      game.grade = 'trainee';

      game.finishStage(true);

      expect(game.scoreAtStageStart).toBe(105);
      expect(game.livesAtStageStart).toBe(8);
    });

    it('should trigger game over when reaching stage 29', () => {
      game.stage = 28;
      game.correctCount = 50;
      game.incorrectCount = 10;

      game.finishStage(true);

      expect(game.stage).toBe(29);
      expect(game.finalPerfScore).toBeCloseTo(83.33, 1);
    });

    it('should set state to message', () => {
      game.finishStage(true);

      expect(game.state).toBe('message');
    });

    it('should call onFinishStage callback on success', () => {
      game.finishStage(true);

      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(true);
    });

    it('should call onFinishStage callback on failure', () => {
      game.finishStage(false);

      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(false);
    });
  });

  describe('resumeFromMessage', () => {
    beforeEach(() => {
      game.state = 'message';
      game.meteors.push({ x: 100, y: 100, text: '2+2', answer: 4, op: '+', speed: 1, id: 1, spawnTimeMs: Date.now() });
      game.particles.push({ x: 50, y: 50, vx: 1, vy: 1, life: 1, color: '#fff' });
      game.inputBuffer = 'test';
      game.stageScore = 50;
      game.stageIncorrect = 3;
      game.shield = 2;
    });

    it('should reset stage state', () => {
      game.resumeFromMessage();

      expect(game.meteors.length).toBe(0);
      expect(game.particles.length).toBe(0);
      expect(game.inputBuffer).toBe('');
      expect(game.stageScore).toBe(0);
      expect(game.stageIncorrect).toBe(0);
      expect(game.shield).toBe(5);
    });

    it('should set state to playing', () => {
      game.resumeFromMessage();

      expect(game.state).toBe('playing');
    });

    it('should revert score on failure', () => {
      game.score = 150;
      game.scoreAtStageStart = 100;
      game.lives = 8;
      game.finishStage(false);

      game.resumeFromMessage();

      expect(game.score).toBe(100);
      expect(game.livesAtStageStart).toBe(8);
    });

    it('should not revert score on success', () => {
      game.score = 150;
      game.scoreAtStageStart = 100;
      game.finishStage(true);

      game.resumeFromMessage();

      expect(game.score).toBe(150);
    });

    it('should trigger pending game over', () => {
      game.stage = 28;
      game.correctCount = 100;
      game.incorrectCount = 20;
      game.finishStage(true);

      game.resumeFromMessage();

      expect(game.state).toBe('gameover');
      expect(mockCallbacks.onGameOver).toHaveBeenCalledWith('victory');
    });

    it('should trigger lives-depleted game over after stage message', () => {
      game.lives = 1;

      game.failStage();
      expect(game.state).toBe('message');

      game.resumeFromMessage();

      expect(game.state).toBe('gameover');
      expect(mockCallbacks.onGameOver).toHaveBeenCalledWith('lives-depleted');
    });

    it('should not resume if already in gameover state', () => {
      game.state = 'gameover';
      const initialMeteors = game.meteors.length;

      game.resumeFromMessage();

      expect(game.meteors.length).toBe(initialMeteors);
    });

    it('should call onHUDUpdate callback', () => {
      game.resumeFromMessage();

      expect(mockCallbacks.onHUDUpdate).toHaveBeenCalled();
    });
  });

  describe('resumeAfterStreakReward', () => {
    it('returns to playing state after a streak reward pause', () => {
      game.state = 'paused';

      game.resumeAfterStreakReward();

      expect(game.state).toBe('playing');
      expect(mockCallbacks.onHUDUpdate).toHaveBeenCalled();
    });

    it('finishes the stage after reward pause when stage clear was pending', () => {
      game.spawnMeteor();
      game.state = 'playing';
      game.stageCorrect = 6;
      game.streak = 29;

      game.inputBuffer = game.meteors[0].answer.toString();
      game.checkAnswer();

      expect(game.state).toBe('paused');
      expect(mockCallbacks.onFinishStage).not.toHaveBeenCalled();

      game.resumeAfterStreakReward();

      expect(game.state).toBe('message');
      expect(mockCallbacks.onFinishStage).toHaveBeenCalledWith(true);
    });
  });

  describe('gameOver', () => {
    it('should set state to gameover', () => {
      game.gameOver();

      expect(game.state).toBe('gameover');
    });

    it('should calculate final accuracy', () => {
      game.correctCount = 80;
      game.incorrectCount = 20;

      game.gameOver();

      expect(game.finalPerfScore).toBe(80.0);
    });

    it('should handle zero answers gracefully', () => {
      game.correctCount = 0;
      game.incorrectCount = 0;

      game.gameOver();

      expect(game.finalPerfScore).toBe(0);
    });

    it('should call onGameOver callback', () => {
      game.gameOver();

      expect(mockCallbacks.onGameOver).toHaveBeenCalledWith('lives-depleted');
    });

    it('should accept win parameter', () => {
      game.gameOver(true);

      expect(game.state).toBe('gameover');
    });

    it('persists history entry with required summary fields', () => {
      game.correctCount = 8;
      game.incorrectCount = 2;
      game.score = 155;
      game.grade = 'cadet';

      game.gameOver();

      const history = gameStore.getState().getGameHistory(null, 1);
      expect(history).toHaveLength(1);
      expect(history[0].correctAnswers).toBe(8);
      expect(history[0].incorrectAnswers).toBe(2);
      expect(history[0].gradeAtFinish).toBe('cadet');
      expect(history[0].finalScore).toBe(155);
      expect(history[0].finalPerfScore).toBe(80);
    });

    it('persists operation stats and resolves most problematic operation', () => {
      vi.useFakeTimers();
      vi.setSystemTime(10_000);

      game.state = 'playing';
      game.meteors = [
        { x: 0, y: 0, text: '2 + 2', answer: 4, op: '+', speed: 1, id: 1, spawnTimeMs: 9_000 },
        { x: 0, y: 0, text: '3 - 1', answer: 2, op: '-', speed: 1, id: 2, spawnTimeMs: 9_500 },
      ];

      game.inputBuffer = '4';
      game.checkAnswer(); // '+' correct, latency 1000

      game.inputBuffer = '99999';
      game.checkAnswer(); // '-' incorrect, latency 500

      const baseHitMeteor = {
        x: 0,
        y: 0,
        text: '8 - 3',
        answer: 5,
        op: '-' as const,
        speed: 1,
        id: 3,
        spawnTimeMs: 9_800,
      };

      game.hitBase(baseHitMeteor); // '-' incorrect, latency 200
      game.gameOver();

      const history = gameStore.getState().getGameHistory(null, 1);
      expect(history).toHaveLength(1);
      expect(history[0].averageAnswerTimeMs).toBe(567);
      expect(history[0].mostProblematicOperation).toBe('-');
      expect(history[0].operationStats['+']).toEqual({ attempts: 1, incorrect: 0, avgTimeMs: 1000 });
      expect(history[0].operationStats['-']).toEqual({ attempts: 2, incorrect: 2, avgTimeMs: 350 });

      vi.useRealTimers();
    });
  });

  describe('premature end', () => {
    it('rolls back in-progress stage stats before persisting snapshot', () => {
      game.state = 'playing';
      game.grade = 'commander';
      game.scoreAtStageStart = 100;
      game.livesAtStageStart = 7;
      game.correctCountAtStageStart = 20;
      game.incorrectCountAtStageStart = 5;
      game.roundResolvedAnswerCountAtStageStart = 25;
      game.roundTotalAnswerLatencyMsAtStageStart = 20_000;
      game.roundOperationTelemetryAtStageStart = {
        '+': { attempts: 10, incorrect: 2, totalLatencyMs: 8_000 },
        '-': { attempts: 8, incorrect: 1, totalLatencyMs: 6_000 },
        '*': { attempts: 4, incorrect: 1, totalLatencyMs: 4_000 },
        '/': { attempts: 3, incorrect: 1, totalLatencyMs: 2_000 },
      };

      game.score = 128;
      game.lives = 6;
      game.correctCount = 27;
      game.incorrectCount = 9;
      game.stageIncorrect = 4;
      game.stageCorrect = 7;
      game.roundResolvedAnswerCount = 36;
      game.roundTotalAnswerLatencyMs = 30_000;

      const snapshot = game.buildPrematureEndSnapshot();

      expect(snapshot.score).toBe(100);
      expect(snapshot.correctCount).toBe(20);
      expect(snapshot.incorrectCount).toBe(5);
      expect(snapshot.finalPerfScore).toBe(80);
      expect(snapshot.historyEntry.finalScore).toBe(100);
      expect(snapshot.historyEntry.correctAnswers).toBe(20);
      expect(snapshot.historyEntry.incorrectAnswers).toBe(5);
      expect(snapshot.historyEntry.averageAnswerTimeMs).toBe(800);
    });

    it('keeps current stats when ending during stage message', () => {
      game.state = 'message';
      game.grade = 'cadet';
      game.score = 90;
      game.correctCount = 18;
      game.incorrectCount = 2;

      const snapshot = game.buildPrematureEndSnapshot();

      expect(snapshot.score).toBe(90);
      expect(snapshot.correctCount).toBe(18);
      expect(snapshot.incorrectCount).toBe(2);
      expect(snapshot.finalPerfScore).toBe(90);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      game.state = 'playing';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should spawn meteors at spawn rate', () => {
      game.lastSpawn = 0;
      vi.setSystemTime(3000);

      game.update(16);

      expect(game.meteors.length).toBeGreaterThan(0);
    });

    it('should update meteor positions', () => {
      game.spawnMeteor();
      const initialY = game.meteors[0].y;

      game.update(16);

      expect(game.meteors[0].y).toBeGreaterThan(initialY);
    });

    it('should hit base when meteor reaches danger zone', () => {
      game.spawnMeteor();
      const meteor = game.meteors[0];
      meteor.y = 601; // Past danger zone (CANVAS_HEIGHT - dangerZone = 700 - 100 = 600)
      meteor.speed = 0.1; // Small speed to ensure it stays past danger zone
      const initialShield = game.shield;

      // Set lastSpawn to prevent new meteors from spawning during update
      game.lastSpawn = Date.now();

      game.update(16);

      expect(game.shield).toBe(initialShield - 1);
      expect(game.meteors.length).toBe(0);
    });

    it('should update particle positions', () => {
      game.createExplosion(100, 100, '#fff');
      const particle = game.particles[0];
      const initialX = particle.x;

      game.update(16);

      expect(particle.x).not.toBe(initialX);
    });

    it('should remove expired particles', () => {
      game.particles.push({ x: 100, y: 100, vx: 0, vy: 0, life: 0.01, color: '#fff' });

      game.update(16);

      expect(game.particles.length).toBe(0);
    });

    it('should decrease particle life', () => {
      game.createExplosion(100, 100, '#fff');
      const initialLife = game.particles[0].life;

      game.update(16);

      expect(game.particles[0].life).toBeLessThan(initialLife);
    });

    it('should respect DDA max active meteor gating', () => {
      game.lastSpawn = 0;
      vi.setSystemTime(3000);

      game.meteors = Array.from({ length: 4 }, (_, index) => ({
        x: 100,
        y: 0,
        text: '1 + 1',
        answer: 2,
        op: '+',
        speed: 1,
        id: index + 1,
        spawnTimeMs: Date.now(),
      }));

      game.update(16);

      expect(game.meteors).toHaveLength(4);
    });
  });

  describe('state transitions', () => {
    it('should transition from start to playing', () => {
      expect(game.state).toBe('start');
      game.state = 'playing';
      expect(game.state).toBe('playing');
    });

    it('should transition from playing to message on stage completion', () => {
      game.state = 'playing';
      game.finishStage(true);
      expect(game.state).toBe('message');
    });

    it('should transition from message to playing on resume', () => {
      game.state = 'message';
      game.resumeFromMessage();
      expect(game.state).toBe('playing');
    });

    it('should transition to gameover on final stage completion', () => {
      game.stage = 28;
      game.finishStage(true);
      game.resumeFromMessage();
      expect(game.state).toBe('gameover');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple correct answers in sequence', () => {
      for (let i = 0; i < 5; i++) {
        game.spawnMeteor();
        game.inputBuffer = game.meteors[0].answer.toString();
        game.checkAnswer();
      }

      expect(game.correctCount).toBe(5);
      expect(game.score).toBe(5);
    });

    it('should handle multiple incorrect answers in sequence', () => {
      game.spawnMeteor();
      for (let i = 0; i < 3; i++) {
        game.inputBuffer = '99999';
        game.checkAnswer();
      }

      expect(game.incorrectCount).toBe(3);
      expect(game.stageIncorrect).toBe(3);
    });

    it('should maintain meteors when checking wrong answer', () => {
      game.spawnMeteor();
      const initialCount = game.meteors.length;
      game.inputBuffer = '99999';

      game.checkAnswer();

      expect(game.meteors.length).toBe(initialCount);
    });

    it('should reset incorrect count per stage', () => {
      game.stageIncorrect = 5;
      game.finishStage(true);
      game.resumeFromMessage();

      expect(game.stageIncorrect).toBe(0);
    });
  });
});
