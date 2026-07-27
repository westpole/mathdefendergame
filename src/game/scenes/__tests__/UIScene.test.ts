import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockState = {
  scenePlugin: {
    isActive: ReturnType<typeof vi.fn<(key: string) => boolean>>;
    isPaused: ReturnType<typeof vi.fn<(key: string) => boolean>>;
    stop: ReturnType<typeof vi.fn<(key: string) => void>>;
    start: ReturnType<typeof vi.fn<(key: string, data?: unknown) => void>>;
    getScene: ReturnType<typeof vi.fn<(key: string) => { continueFromOverlay: () => void }>>;
  };
  destroy: ReturnType<typeof vi.fn<(removeCanvas?: boolean) => void>>;
  gameInstances: Array<{ scene: MockState['scenePlugin']; destroy: MockState['destroy'] }>;
  getState: ReturnType<typeof vi.fn>;
  store: {
    setDifficulty: ReturnType<typeof vi.fn<(difficulty: string) => void>>;
    startPlaying: ReturnType<typeof vi.fn<() => void>>;
    returnToMenu: ReturnType<typeof vi.fn<() => void>>;
    openMenuView: ReturnType<typeof vi.fn<(menuView: string) => void>>;
  };
  continueFromOverlay: ReturnType<typeof vi.fn<() => void>>;
};

const mockState = vi.hoisted((): MockState => ({
  scenePlugin: {
    isActive: vi.fn<(key: string) => boolean>(),
    isPaused: vi.fn<(key: string) => boolean>(),
    stop: vi.fn<(key: string) => void>(),
    start: vi.fn<(key: string, data?: unknown) => void>(),
    getScene: vi.fn<(key: string) => { continueFromOverlay: () => void }>(),
  },
  destroy: vi.fn<(removeCanvas?: boolean) => void>(),
  gameInstances: [] as Array<{ scene: typeof mockState.scenePlugin; destroy: typeof mockState.destroy }>,
  getState: vi.fn(),
  store: {
    setDifficulty: vi.fn<(difficulty: string) => void>(),
    startPlaying: vi.fn<() => void>(),
    returnToMenu: vi.fn<() => void>(),
    openMenuView: vi.fn<(menuView: string) => void>(),
  },
  continueFromOverlay: vi.fn<() => void>(),
}));

vi.mock('phaser', () => ({
  default: {
    AUTO: 'AUTO',
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
    Game: class {
      scene = mockState.scenePlugin;
      destroy = mockState.destroy;

      constructor() {
        mockState.gameInstances.push(this as never);
      }
    },
  },
}));

vi.mock('../../../store/useGameStore', () => ({
  gameStore: {
    getState: mockState.getState,
  },
}));

vi.mock('../BootScene', () => ({
  BootScene: class {},
}));

vi.mock('../GameScene', () => ({
  GameScene: class {},
}));

async function loadModule() {
  return import('../UIScene');
}

describe('UIScene module', () => {
  beforeEach(() => {
    vi.resetModules();

    mockState.scenePlugin.isActive.mockReset();
    mockState.scenePlugin.isPaused.mockReset();
    mockState.scenePlugin.stop.mockReset();
    mockState.scenePlugin.start.mockReset();
    mockState.scenePlugin.getScene.mockReset();
    mockState.destroy.mockReset();
    mockState.gameInstances.length = 0;
    mockState.getState.mockReset();
    mockState.store.setDifficulty.mockReset();
    mockState.store.startPlaying.mockReset();
    mockState.store.returnToMenu.mockReset();
    mockState.store.openMenuView.mockReset();
    mockState.continueFromOverlay.mockReset();

    mockState.getState.mockReturnValue(mockState.store);
    mockState.scenePlugin.isActive.mockReturnValue(false);
    mockState.scenePlugin.isPaused.mockReturnValue(false);
    mockState.scenePlugin.getScene.mockReturnValue({
      continueFromOverlay: mockState.continueFromOverlay,
    });
  });

  afterEach(async () => {
    const uiScene = await loadModule();

    const currentGame = mockState.gameInstances[mockState.gameInstances.length - 1];
    if (currentGame) {
      uiScene.destroyGame(currentGame as never);
    }

    vi.restoreAllMocks();
  });

  it('creates the Phaser game once and reuses the singleton', async () => {
    const uiScene = await loadModule();

    const firstGame = uiScene.ensurePhaserGame();
    const secondGame = uiScene.ensurePhaserGame();

    expect(firstGame).toBe(secondGame);
    expect(mockState.gameInstances).toHaveLength(1);
  });

  it('destroys only the tracked game instance and allows recreating it', async () => {
    const uiScene = await loadModule();

    const game = uiScene.ensurePhaserGame();
    uiScene.destroyGame({} as never);

    expect(mockState.destroy).not.toHaveBeenCalled();

    uiScene.destroyGame(game);

    expect(mockState.destroy).toHaveBeenCalledWith(true);

    const recreatedGame = uiScene.ensurePhaserGame();
    expect(recreatedGame).not.toBe(game);
    expect(mockState.gameInstances).toHaveLength(2);
  });

  it('starts the game, updates the store, and restarts GameScene when needed', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.isActive.mockReturnValue(true);

    uiScene.startGame('adult');

    expect(mockState.store.setDifficulty).toHaveBeenCalledWith('adult');
    expect(mockState.store.startPlaying).toHaveBeenCalledTimes(1);
    expect(mockState.scenePlugin.stop).toHaveBeenCalledWith('GameScene');
    expect(mockState.scenePlugin.start).toHaveBeenCalledWith('GameScene', { difficulty: 'adult' });
  });

  it('continues the current GameScene overlay flow when the scene is available', async () => {
    const uiScene = await loadModule();

    uiScene.continueGame();
    expect(mockState.continueFromOverlay).not.toHaveBeenCalled();

    uiScene.ensurePhaserGame();
    uiScene.continueGame();

    expect(mockState.scenePlugin.getScene).toHaveBeenCalledWith('GameScene');
    expect(mockState.continueFromOverlay).toHaveBeenCalledTimes(1);
  });

  it('returns to the menu and stops GameScene when it is active or paused', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.isPaused.mockReturnValue(true);

    uiScene.returnToMenu();

    expect(mockState.scenePlugin.stop).toHaveBeenCalledWith('GameScene');
    expect(mockState.store.returnToMenu).toHaveBeenCalledTimes(1);
  });

  it('opens a menu view and tolerates missing GameScene access during continue', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.getScene.mockImplementation(() => {
      throw new Error('missing scene');
    });

    uiScene.ensurePhaserGame();

    expect(() => uiScene.continueGame()).not.toThrow();

    uiScene.openMenuView('rules');

    expect(mockState.store.openMenuView).toHaveBeenCalledWith('rules');
    expect(mockState.scenePlugin.start).not.toHaveBeenCalled();
  });
});
