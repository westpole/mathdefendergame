import Phaser from 'phaser';

import { gameStore, GameStoreState } from '@store/useGameStore';

import { BootScene } from '../BootScene';

describe('BootScene', () => {
  const originalFonts = document.fonts;

  afterEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: originalFonts,
    });
  });

  it('extends Phaser.Scene', () => {
    const scene = new BootScene();

    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('marks boot ready only after the font promise resolves', async () => {
    let resolveFonts: (() => void) | undefined;
    const fontsReady = new Promise<void>((resolve) => {
      resolveFonts = resolve;
    });
    const markBootReady = vi.fn();

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: fontsReady },
    });

    vi.spyOn(gameStore, 'getState').mockReturnValue({
      markBootReady,
    } as unknown as GameStoreState);

    const scene = new BootScene();

    scene.create();

    expect(markBootReady).not.toHaveBeenCalled();

    resolveFonts?.();
    await fontsReady;
    await Promise.resolve();

    expect(markBootReady).toHaveBeenCalledTimes(1);
  });
});
