import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockScene = {
  continueFromOverlay: ReturnType<typeof vi.fn<() => void>>;
  setAnswerInputBuffer: ReturnType<typeof vi.fn<(value: string) => void>>;
  appendAnswerInputCharacter: ReturnType<typeof vi.fn<(char: string) => void>>;
  removeAnswerInputCharacter: ReturnType<typeof vi.fn<() => void>>;
  submitAnswerInput: ReturnType<typeof vi.fn<() => void>>;
  pauseForManualEndPrompt: ReturnType<typeof vi.fn<(reason: string) => void>>;
  resumeFromManualPausePrompt: ReturnType<typeof vi.fn<() => void>>;
  endGameEarly: ReturnType<typeof vi.fn<(options?: { closeApp?: boolean }) => void>>;
};

type MockState = {
  scenePlugin: {
    isActive: ReturnType<typeof vi.fn<(key: string) => boolean>>;
    isPaused: ReturnType<typeof vi.fn<(key: string) => boolean>>;
    stop: ReturnType<typeof vi.fn<(key: string) => void>>;
    start: ReturnType<typeof vi.fn<(key: string, data?: unknown) => void>>;
    getScene: ReturnType<typeof vi.fn<(key: string) => MockScene>>;
  };
  destroy: ReturnType<typeof vi.fn<(removeCanvas?: boolean) => void>>;
  gameInstances: Array<{ scene: MockState['scenePlugin']; destroy: MockState['destroy'] }>;
  getState: ReturnType<typeof vi.fn>;
  store: {
    phase: string;
    pauseOverlay: { reason: string; isSavingBeforeClose: boolean } | null;
    score: number;
    setGrade: ReturnType<typeof vi.fn<(grade: string) => void>>;
    startPlaying: ReturnType<typeof vi.fn<() => void>>;
    openMenu: ReturnType<typeof vi.fn<() => void>>;
    openScreenView: ReturnType<typeof vi.fn<(screenView: string) => void>>;
    logOff: ReturnType<typeof vi.fn<() => void>>;
    showSavingBeforeClose: ReturnType<typeof vi.fn<() => void>>;
  };
  scene: MockScene;
  notifyAppCloseCancelled: ReturnType<typeof vi.fn<() => void>>;
  notifyAppCloseReady: ReturnType<typeof vi.fn<() => void>>;
};

const mockState = vi.hoisted((): MockState => ({
  scenePlugin: {
    isActive: vi.fn<(key: string) => boolean>(),
    isPaused: vi.fn<(key: string) => boolean>(),
    stop: vi.fn<(key: string) => void>(),
    start: vi.fn<(key: string, data?: unknown) => void>(),
    getScene: vi.fn<(key: string) => MockScene>(),
  },
  destroy: vi.fn<(removeCanvas?: boolean) => void>(),
  gameInstances: [] as Array<{ scene: typeof mockState.scenePlugin; destroy: typeof mockState.destroy }>,
  getState: vi.fn(),
  store: {
    phase: 'start',
    pauseOverlay: null,
    score: 0,
    setGrade: vi.fn<(grade: string) => void>(),
    startPlaying: vi.fn<() => void>(),
    openMenu: vi.fn<() => void>(),
    openScreenView: vi.fn<(screenView: string) => void>(),
    logOff: vi.fn<() => void>(),
    showSavingBeforeClose: vi.fn<() => void>(),
  },
  scene: {
    continueFromOverlay: vi.fn<() => void>(),
    setAnswerInputBuffer: vi.fn<(value: string) => void>(),
    appendAnswerInputCharacter: vi.fn<(char: string) => void>(),
    removeAnswerInputCharacter: vi.fn<() => void>(),
    submitAnswerInput: vi.fn<() => void>(),
    pauseForManualEndPrompt: vi.fn<(reason: string) => void>(),
    resumeFromManualPausePrompt: vi.fn<() => void>(),
    endGameEarly: vi.fn<(options?: { closeApp?: boolean }) => void>(),
  },
  notifyAppCloseCancelled: vi.fn<() => void>(),
  notifyAppCloseReady: vi.fn<() => void>(),
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
  useGameStore: {
    getState: mockState.getState,
  },
}));

vi.mock('../../../platform/adapter', () => ({
  notifyAppCloseCancelled: mockState.notifyAppCloseCancelled,
  notifyAppCloseReady: mockState.notifyAppCloseReady,
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
    mockState.store.phase = 'start';
    mockState.store.pauseOverlay = null;
    mockState.store.score = 0;
    mockState.store.setGrade.mockReset();
    mockState.store.startPlaying.mockReset();
    mockState.store.openMenu.mockReset();
    mockState.store.openScreenView.mockReset();
    mockState.store.logOff.mockReset();
    mockState.store.showSavingBeforeClose.mockReset();
    mockState.scene.continueFromOverlay.mockReset();
    mockState.scene.setAnswerInputBuffer.mockReset();
    mockState.scene.appendAnswerInputCharacter.mockReset();
    mockState.scene.removeAnswerInputCharacter.mockReset();
    mockState.scene.submitAnswerInput.mockReset();
    mockState.scene.pauseForManualEndPrompt.mockReset();
    mockState.scene.resumeFromManualPausePrompt.mockReset();
    mockState.scene.endGameEarly.mockReset();
    mockState.notifyAppCloseCancelled.mockReset();
    mockState.notifyAppCloseReady.mockReset();

    mockState.getState.mockReturnValue(mockState.store);
    mockState.scenePlugin.isActive.mockReturnValue(false);
    mockState.scenePlugin.isPaused.mockReturnValue(false);
    mockState.scenePlugin.getScene.mockReturnValue(mockState.scene);
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
    mockState.store.score = 351;

    uiScene.startGame();

    expect(mockState.store.setGrade).toHaveBeenCalledWith('commander');
    expect(mockState.store.startPlaying).toHaveBeenCalledTimes(1);
    expect(mockState.scenePlugin.stop).toHaveBeenCalledWith('GameScene');
    expect(mockState.scenePlugin.start).toHaveBeenCalledWith('GameScene', {
      grade: 'commander',
      score: 351,
    });
  });

  it('leaves GameScene alone when the game starts from an idle state', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.isActive.mockReturnValue(false);
    mockState.scenePlugin.isPaused.mockReturnValue(false);
    mockState.store.score = 44;

    uiScene.startGame();

    expect(mockState.scenePlugin.stop).not.toHaveBeenCalled();
    expect(mockState.scenePlugin.start).toHaveBeenCalledWith('GameScene', {
      grade: 'trainee',
      score: 44,
    });
  });

  it('continues the current GameScene overlay flow when the scene is available', async () => {
    const uiScene = await loadModule();

    uiScene.continueGame();
    expect(mockState.scene.continueFromOverlay).not.toHaveBeenCalled();

    uiScene.ensurePhaserGame();
    uiScene.continueGame();

    expect(mockState.scenePlugin.getScene).toHaveBeenCalledWith('GameScene');
    expect(mockState.scene.continueFromOverlay).toHaveBeenCalledTimes(1);
  });

  it('routes answer input, pause, and resume actions through the active scene', async () => {
    const uiScene = await loadModule();
    uiScene.ensurePhaserGame();

    uiScene.setAnswerInputBuffer('42');
    uiScene.appendAnswerInputCharacter('7');
    uiScene.removeAnswerInputCharacter();
    uiScene.submitAnswerInput();
    uiScene.pauseGameForManualEnd('escape');
    uiScene.resumePausedGame();

    expect(mockState.scene.setAnswerInputBuffer).toHaveBeenCalledWith('42');
    expect(mockState.scene.appendAnswerInputCharacter).toHaveBeenCalledWith('7');
    expect(mockState.scene.removeAnswerInputCharacter).toHaveBeenCalledTimes(1);
    expect(mockState.scene.submitAnswerInput).toHaveBeenCalledTimes(1);
    expect(mockState.scene.pauseForManualEndPrompt).toHaveBeenCalledWith('escape');
    expect(mockState.scene.resumeFromManualPausePrompt).toHaveBeenCalledTimes(1);
  });

  it('returns to the menu and stops GameScene when it is active or paused', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.isPaused.mockReturnValue(true);

    uiScene.openMenu();

    expect(mockState.scenePlugin.stop).toHaveBeenCalledWith('GameScene');
    expect(mockState.store.openMenu).toHaveBeenCalledTimes(1);
  });

  it('no-ops all scene actions when there is no active GameScene', async () => {
    const uiScene = await loadModule();

    uiScene.setAnswerInputBuffer('42');
    uiScene.appendAnswerInputCharacter('7');
    uiScene.removeAnswerInputCharacter();
    uiScene.submitAnswerInput();
    uiScene.pauseGameForManualEnd('escape');
    uiScene.resumePausedGame();

    expect(mockState.scene.setAnswerInputBuffer).not.toHaveBeenCalled();
    expect(mockState.scene.appendAnswerInputCharacter).not.toHaveBeenCalled();
    expect(mockState.scene.removeAnswerInputCharacter).not.toHaveBeenCalled();
    expect(mockState.scene.submitAnswerInput).not.toHaveBeenCalled();
    expect(mockState.scene.pauseForManualEndPrompt).not.toHaveBeenCalled();
    expect(mockState.scene.resumeFromManualPausePrompt).not.toHaveBeenCalled();
  });

  it('opens menu views, logs out, and tolerates missing GameScene access', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.getScene.mockImplementation(() => {
      throw new Error('missing scene');
    });
    mockState.scenePlugin.isActive.mockReturnValue(true);

    uiScene.ensurePhaserGame();

    expect(() => uiScene.continueGame()).not.toThrow();
    uiScene.openScreenView('rules');
    uiScene.logOff();

    expect(mockState.store.openScreenView).toHaveBeenCalledWith('rules');
    expect(mockState.store.logOff).toHaveBeenCalledTimes(1);
    expect(mockState.scenePlugin.stop).toHaveBeenCalledWith('GameScene');
    expect(mockState.scenePlugin.start).not.toHaveBeenCalled();
  });

  it('handles close-approval flows and close cancellation events', async () => {
    const uiScene = await loadModule();
    uiScene.ensurePhaserGame();
    mockState.store.phase = 'paused';
    mockState.store.pauseOverlay = { reason: 'window-close', isSavingBeforeClose: false };

    uiScene.cancelElectronClose();
    expect(mockState.scene.resumeFromManualPausePrompt).toHaveBeenCalledTimes(1);
    expect(mockState.notifyAppCloseCancelled).toHaveBeenCalledTimes(1);

    mockState.store.phase = 'playing';
    uiScene.onElectronCloseRequested();
    expect(mockState.scene.pauseForManualEndPrompt).toHaveBeenCalledWith('window-close');

    mockState.store.phase = 'paused';
    mockState.store.pauseOverlay = { reason: 'window-close', isSavingBeforeClose: false };
    uiScene.onElectronCloseCancelled();
    expect(mockState.scene.resumeFromManualPausePrompt).toHaveBeenCalledTimes(2);

    mockState.store.phase = 'playing';
    mockState.store.pauseOverlay = { reason: 'escape', isSavingBeforeClose: false };
    uiScene.onElectronCloseCancelled();
    expect(mockState.scene.resumeFromManualPausePrompt).toHaveBeenCalledTimes(2);

    mockState.store.phase = 'start';
    mockState.store.pauseOverlay = null;
    expect(uiScene.shouldConfirmElectronClose()).toBe(false);
    mockState.store.phase = 'playing';
    expect(uiScene.shouldConfirmElectronClose()).toBe(true);
    mockState.store.phase = 'stage-message';
    expect(uiScene.shouldConfirmElectronClose()).toBe(true);
  });

  it('confirms close actions by ending the game or saving before exit', async () => {
    const uiScene = await loadModule();
    uiScene.ensurePhaserGame();
    mockState.store.phase = 'playing';

    uiScene.onElectronCloseConfirmed();
    expect(mockState.scene.endGameEarly).toHaveBeenCalledWith({ closeApp: true });

    mockState.store.phase = 'start';
    mockState.store.pauseOverlay = null;
    uiScene.onElectronCloseConfirmed();
    expect(mockState.store.showSavingBeforeClose).toHaveBeenCalledTimes(1);
    expect(mockState.notifyAppCloseReady).toHaveBeenCalledTimes(1);
  });

  it('ends the current game early with or without app shutdown when no scene is available', async () => {
    const uiScene = await loadModule();
    mockState.scenePlugin.getScene.mockImplementation(() => {
      throw new Error('scene unavailable');
    });

    uiScene.endGameEarly({ closeApp: true });
    expect(mockState.notifyAppCloseReady).toHaveBeenCalledTimes(1);

    uiScene.endGameEarly();
    expect(mockState.scene.endGameEarly).not.toHaveBeenCalled();
  });

  it('delegates endGameEarly to the active GameScene when one exists', async () => {
    const uiScene = await loadModule();
    uiScene.ensurePhaserGame();

    uiScene.endGameEarly({ closeApp: true });

    expect(mockState.scene.endGameEarly).toHaveBeenCalledWith({ closeApp: true });
    expect(mockState.notifyAppCloseReady).not.toHaveBeenCalled();
  });

  it('keeps menu helpers from stopping scenes when no GameScene is active', async () => {
    const uiScene = await loadModule();
    uiScene.ensurePhaserGame();
    mockState.scenePlugin.isActive.mockReturnValue(false);
    mockState.scenePlugin.isPaused.mockReturnValue(false);

    uiScene.openMenu();
    uiScene.openScreenView('rules');
    uiScene.logOff();

    expect(mockState.scenePlugin.stop).not.toHaveBeenCalled();
    expect(mockState.store.openMenu).toHaveBeenCalledTimes(1);
    expect(mockState.store.openScreenView).toHaveBeenCalledWith('rules');
    expect(mockState.store.logOff).toHaveBeenCalledTimes(1);
  });

  it('respects the game-scene shutdown flow and stores the current game state for close prompts', async () => {
    const uiScene = await loadModule();
    mockState.store.phase = 'paused';
    mockState.store.pauseOverlay = { reason: 'escape', isSavingBeforeClose: false };

    uiScene.cancelElectronClose();
    expect(mockState.notifyAppCloseCancelled).toHaveBeenCalledTimes(1);
    expect(mockState.scene.resumeFromManualPausePrompt).not.toHaveBeenCalled();
  });
});
