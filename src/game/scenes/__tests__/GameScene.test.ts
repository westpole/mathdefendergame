import Phaser from 'phaser';

import type { GameCallbacks } from '@game/main';
import { gameStore } from '@store/useGameStore';

import { GameScene } from '../GameScene';

type GameScenePrivate = {
  handleKeyDown: (e: KeyboardEvent) => void;
  meteorTexts: Map<number, Phaser.GameObjects.Text>;
  handleShutdown: () => void;
  handleStreakReward: (lives: number) => void;
};

const mockGameState = vi.hoisted(() => ({
  lastInstance: undefined as undefined | {
    state: string;
    grade: string;
    inputBuffer: string;
    lastSpawn: number;
    stage: number;
    stageIncorrect: number;
    score: number;
    lives: number;
    correctCount: number;
    incorrectCount: number;
    finalPerfScore: number;
    meteors: MockMeteor[];
    particles: MockParticle[];
    reset: ReturnType<typeof vi.fn>;
    setCanvasHeight: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    checkAnswer: ReturnType<typeof vi.fn>;
    resumeFromMessage: ReturnType<typeof vi.fn>;
    resumeAfterStreakReward: ReturnType<typeof vi.fn>;
    setGrade: ReturnType<typeof vi.fn>;
  },
  lastCallbacks: undefined as GameCallbacks | undefined,
}));

type MockMeteor = {
  id: number;
  x: number;
  y: number;
  text: string;
  op: string;
};

type MockParticle = {
  x: number;
  y: number;
  life: number;
  color: string;
};

vi.mock('../../main', () => ({
  Game: class {
    state = 'start';
    grade = 'trainee';
    inputBuffer = '';
    lastSpawn = 0;
    stage = 1;
    stageIncorrect = 0;
    score = 0;
    lives = 10;
    correctCount = 0;
    incorrectCount = 0;
    finalPerfScore = 0;
    meteors: MockMeteor[] = [];
    particles: MockParticle[] = [];

    reset = vi.fn();
    setCanvasHeight = vi.fn();
    update = vi.fn();
    checkAnswer = vi.fn();
    resumeFromMessage = vi.fn();
    resumeAfterStreakReward = vi.fn(() => {
      this.state = 'playing';
    });
    setGrade = vi.fn((grade: string) => {
      this.grade = grade;
    });

    constructor(callbacks: GameCallbacks) {
      mockGameState.lastInstance = this;
      mockGameState.lastCallbacks = callbacks;
    }
  },
}));

function createTextStub() {
  return {
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createGraphicsStub() {
  return {
    setDepth: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
  };
}

function setupScene() {
  const startPlaying = vi.fn();
  const syncHUD = vi.fn();
  const showStageMessage = vi.fn();
  const showStreakRewardMessage = vi.fn();
  const clearStreakRewardMessage = vi.fn();
  const showGameOver = vi.fn();
  const returnToMenu = vi.fn();
  const state = {
    phase: 'playing' as const,
    menuView: 'home' as const,
    bootReady: true,
    grade: 'trainee' as const,
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
    streakRewardMessage: null,
    leaderboard: { trainee: [], cadet: [], commander: [], 'major-general': [] },
    markBootReady: vi.fn(),
    setGrade: vi.fn(),
    openMenuView: vi.fn(),
    saveScore: vi.fn(),
    getScores: vi.fn(() => []),
    startPlaying,
    syncHUD,
    showStageMessage,
    showStreakRewardMessage,
    clearStreakRewardMessage,
    showGameOver,
    returnToMenu,
  } as unknown as ReturnType<typeof gameStore.getState>;

  vi.spyOn(gameStore, 'getState').mockReturnValue(state);

  const graphics = createGraphicsStub();
  const keyboard = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const scale = {
    height: 720,
    on: vi.fn(),
    off: vi.fn(),
  };
  const textObjects: ReturnType<typeof createTextStub>[] = [];
  const add = {
    graphics: vi.fn(() => graphics),
    text: vi.fn(() => {
      const text = createTextStub();
      textObjects.push(text);
      return text;
    }),
  };
  const events = {
    once: vi.fn(),
  };
  const stop = vi.fn();
  const shake = vi.fn();

  const scene = new GameScene();
  (scene as unknown as {
    add: typeof add;
    input: { keyboard: typeof keyboard };
    scale: typeof scale;
    events: typeof events;
    scene: { stop: typeof stop };
    cameras: { main: { shake: typeof shake } };
  }).add = add;
  (scene as unknown as { input: { keyboard: typeof keyboard } }).input = { keyboard };
  (scene as unknown as { scale: typeof scale }).scale = scale;
  (scene as unknown as { events: typeof events }).events = events;
  (scene as unknown as { scene: { stop: typeof stop } }).scene = { stop };
  (scene as unknown as { cameras: { main: { shake: typeof shake } } }).cameras = { main: { shake } };

  return {
    scene,
    store: {
      startPlaying,
      syncHUD,
      showStageMessage,
      showStreakRewardMessage,
      clearStreakRewardMessage,
      showGameOver,
      returnToMenu,
    },
    phaser: { graphics, keyboard, scale, add, events, stop, shake, textObjects },
  };
}

describe('GameScene', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGameState.lastInstance = undefined;
    mockGameState.lastCallbacks = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('extends Phaser.Scene', () => {
    const scene = new GameScene();

    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('initializes game logic and starts the playing phase', () => {
    const { scene, store, phaser } = setupScene();
    const beforeInit = Date.now();

    scene.init({ grade: 'major-general' });

    expect(mockGameState.lastInstance).toBeDefined();
    expect(mockGameState.lastInstance?.grade).toBe('major-general');
    expect(mockGameState.lastInstance?.reset).toHaveBeenCalledTimes(1);
    expect(mockGameState.lastInstance?.state).toBe('playing');
    expect(mockGameState.lastInstance?.lastSpawn).toBeGreaterThanOrEqual(beforeInit);
    expect(store.startPlaying).toHaveBeenCalledTimes(1);

    mockGameState.lastCallbacks?.onShake();
    expect(phaser.shake).toHaveBeenCalledWith(500, 0.01);
  });

  it('wires scene services during create and paints the initial HUD', () => {
    const { scene, store, phaser } = setupScene();

    scene.init({ grade: 'trainee' });
    scene.create();

    expect(phaser.events.once).toHaveBeenCalledWith(Phaser.Scenes.Events.SHUTDOWN, expect.any(Function), scene);
    expect(phaser.add.graphics).toHaveBeenCalledTimes(1);
    expect(phaser.graphics.setDepth).toHaveBeenCalledWith(6);
    expect(phaser.keyboard.off).toHaveBeenCalledWith('keydown', expect.any(Function), scene);
    expect(phaser.keyboard.on).toHaveBeenCalledWith('keydown', expect.any(Function), scene);
    expect(phaser.scale.on).toHaveBeenCalledWith('resize', expect.any(Function), scene);
    expect(mockGameState.lastInstance?.setCanvasHeight).toHaveBeenCalledWith(720);
    expect(store.syncHUD).toHaveBeenCalledWith({ inputBuffer: '' });
  });

  it('updates the HUD input buffer on backspace and accepts numeric input up to five chars', () => {
    const { scene, store } = setupScene();

    scene.init({ grade: 'trainee' });
    mockGameState.lastInstance!.state = 'playing';
    mockGameState.lastInstance!.inputBuffer = '123';

    (scene as unknown as GameScenePrivate).handleKeyDown({ key: 'Backspace' } as KeyboardEvent);
    expect(mockGameState.lastInstance?.inputBuffer).toBe('12');
    expect(store.syncHUD).toHaveBeenLastCalledWith({ inputBuffer: '12' });

    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '-' } as KeyboardEvent);
    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '4' } as KeyboardEvent);
    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '5' } as KeyboardEvent);
    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '6' } as KeyboardEvent);

    expect(mockGameState.lastInstance?.inputBuffer).toBe('12-45');

    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '7' } as KeyboardEvent);
    expect(mockGameState.lastInstance?.inputBuffer).toBe('12-45');
  });

  it('submits entered answers and ignores gameplay keys outside the playing state', () => {
    const { scene, store, phaser } = setupScene();

    scene.init({ grade: 'trainee' });
    scene.create();
    mockGameState.lastInstance!.state = 'playing';
    mockGameState.lastInstance!.inputBuffer = '42';

    (scene as unknown as GameScenePrivate).handleKeyDown({ key: 'Enter' } as KeyboardEvent);
    expect(mockGameState.lastInstance?.checkAnswer).toHaveBeenCalledTimes(1);

    mockGameState.lastInstance!.state = 'paused';
    mockGameState.lastInstance!.inputBuffer = '42';
    (scene as unknown as GameScenePrivate).handleKeyDown({ key: '9' } as KeyboardEvent);
    expect(mockGameState.lastInstance?.inputBuffer).toBe('42');

    (scene as unknown as GameScenePrivate).handleKeyDown({ key: 'Escape' } as KeyboardEvent);
    expect(store.returnToMenu).toHaveBeenCalledTimes(1);
    expect(phaser.stop).toHaveBeenCalledTimes(1);
  });

  it('synchronizes meteor text objects and particle drawing during update', () => {
    const { scene, phaser } = setupScene();

    scene.init({ grade: 'trainee' });
    scene.create();

    const staleText = createTextStub();
    (scene as unknown as GameScenePrivate).meteorTexts.set(999, staleText as unknown as Phaser.GameObjects.Text);

    mockGameState.lastInstance!.state = 'playing';
    mockGameState.lastInstance!.meteors = [
      { id: 1, x: 10, y: 20, text: '1+1', op: '+' },
      { id: 2, x: 30, y: 40, text: '2+2', op: '?' },
    ] as MockMeteor[];
    mockGameState.lastInstance!.particles = [
      { x: 5, y: 6, life: 1.5, color: '#ff0000' },
      { x: 7, y: 8, life: -2, color: '#00ff00' },
    ];

    scene.update(0, 16);

    expect(mockGameState.lastInstance?.update).toHaveBeenCalledWith(16);
    expect(staleText.destroy).toHaveBeenCalledTimes(1);
    expect(phaser.add.text).toHaveBeenCalledTimes(2);
    expect(phaser.add.text).toHaveBeenNthCalledWith(1, 10, 20, '1+1', expect.objectContaining({ color: '#4ade80' }));
    expect(phaser.add.text).toHaveBeenNthCalledWith(2, 30, 40, '2+2', expect.objectContaining({ color: '#ffffff' }));
    expect(phaser.graphics.clear).toHaveBeenCalled();
    expect(phaser.graphics.fillStyle).toHaveBeenNthCalledWith(1, 0xff0000, 1);
    expect(phaser.graphics.fillStyle).toHaveBeenNthCalledWith(2, 0x00ff00, 0);
    expect(phaser.graphics.fillCircle).toHaveBeenCalledTimes(2);

    const existingText = phaser.textObjects[0];
    mockGameState.lastInstance!.meteors = [{ id: 1, x: 99, y: 88, text: '1+1', op: '+' }] as MockMeteor[];
    mockGameState.lastInstance!.particles = [];

    scene.update(0, 16);

    expect(existingText.setPosition).toHaveBeenCalledWith(99, 88);
  });

  it('bridges stage and game-over callbacks into the store', () => {
    const { scene, store, phaser } = setupScene();

    scene.init({ grade: 'commander' });
    mockGameState.lastInstance!.stage = 4;
    mockGameState.lastInstance!.stageIncorrect = 2;
    mockGameState.lastInstance!.score = 150;
    mockGameState.lastInstance!.lives = 3;
    mockGameState.lastInstance!.correctCount = 12;
    mockGameState.lastInstance!.incorrectCount = 5;
    mockGameState.lastInstance!.finalPerfScore = 70.59;

    mockGameState.lastCallbacks?.onFinishStage(false);
    expect(store.showStageMessage).toHaveBeenCalledWith({
      success: false,
      stage: 4,
      stageIncorrect: 2,
      score: 150,
      lives: 3,
    });

    mockGameState.lastCallbacks?.onGameOver('victory');
    expect(store.showGameOver).toHaveBeenCalledWith({
      grade: 'commander',
      score: 150,
      correctCount: 12,
      incorrectCount: 5,
      finalPerfScore: 70.59,
    });

    mockGameState.lastCallbacks?.onGameOver('lives-depleted');
    expect(store.returnToMenu).toHaveBeenCalledTimes(1);
    expect(phaser.stop).toHaveBeenCalledTimes(1);
  });

  it('shows a timed streak reward message and resumes game after 3 seconds', () => {
    const { scene, store } = setupScene();

    scene.init({ grade: 'trainee' });

    mockGameState.lastInstance!.state = 'paused';
    mockGameState.lastCallbacks?.onStreakReward(6);

    expect(store.showStreakRewardMessage).toHaveBeenCalledWith({
      message: 'Congratulations! +1 life awarded for a 30 streak. Lives: 6',
    });

    vi.advanceTimersByTime(3000);

    expect(store.clearStreakRewardMessage).toHaveBeenCalledTimes(1);
    expect(mockGameState.lastInstance?.resumeAfterStreakReward).toHaveBeenCalledTimes(1);
    expect(store.startPlaying).toHaveBeenCalledTimes(2);
  });

  it('resumes from overlay, clears renderables, and restarts play unless the game is over', () => {
    const { scene, store, phaser } = setupScene();

    scene.init({ grade: 'trainee' });
    scene.create();

    const meteorText = createTextStub();
    (scene as unknown as GameScenePrivate).meteorTexts.set(1, meteorText as unknown as Phaser.GameObjects.Text);
    mockGameState.lastInstance!.inputBuffer = '88';
    mockGameState.lastInstance!.state = 'playing';

    scene.continueFromOverlay();

    expect(mockGameState.lastInstance?.resumeFromMessage).toHaveBeenCalledTimes(1);
    expect(meteorText.destroy).toHaveBeenCalledTimes(1);
    expect(phaser.graphics.clear).toHaveBeenCalled();
    expect(store.syncHUD).toHaveBeenLastCalledWith({ inputBuffer: '88' });
    expect(store.startPlaying).toHaveBeenCalledTimes(2);

    mockGameState.lastInstance!.state = 'gameover';
    scene.continueFromOverlay();
    expect(store.startPlaying).toHaveBeenCalledTimes(2);
  });

  it('removes listeners and transient renderables during shutdown', () => {
    const { scene, phaser } = setupScene();

    scene.init({ grade: 'trainee' });
    scene.create();

    const meteorText = createTextStub();
    (scene as unknown as GameScenePrivate).meteorTexts.set(7, meteorText as unknown as Phaser.GameObjects.Text);

    (scene as unknown as GameScenePrivate).handleShutdown();

    expect(phaser.keyboard.off).toHaveBeenCalledWith('keydown', expect.any(Function), scene);
    expect(phaser.scale.off).toHaveBeenCalledWith('resize', expect.any(Function), scene);
    expect(meteorText.destroy).toHaveBeenCalledTimes(1);
    expect(phaser.graphics.clear).toHaveBeenCalled();
  });
});
