import type { GameStoreState, PauseOverlayReason } from '../types';

/**
 * Builds state for showing the pause overlay with a specific trigger reason.
 *
 * @param reason - Why the game was paused.
 * @returns Partial state payload for pause display.
 * @example
 * const payload = buildPauseOverlayState('escape');
 */
export function buildPauseOverlayState(reason: PauseOverlayReason): Partial<GameStoreState> {
  return {
    phase: 'paused',
    stageMessage: null,
    streakRewardMessage: null,
    pauseOverlay: {
      reason,
      isSavingBeforeClose: false,
    },
  };
}

/**
 * Builds state for hiding pause overlay and restoring active gameplay when booted.
 *
 * @param state - Current store state.
 * @returns Partial state payload for pause dismissal.
 * @example
 * const payload = buildHidePauseOverlayState(state);
 */
export function buildHidePauseOverlayState(state: GameStoreState): Partial<GameStoreState> {
  return {
    phase: state.bootReady ? 'playing' : state.phase,
    pauseOverlay: null,
  };
}

/**
 * Builds state for save-before-close pause behavior.
 *
 * @param state - Current store state.
 * @returns Partial state payload that marks save-in-progress.
 * @example
 * const payload = buildSavingBeforeCloseState(state);
 */
export function buildSavingBeforeCloseState(state: GameStoreState): Partial<GameStoreState> {
  return {
    phase: 'paused',
    pauseOverlay: state.pauseOverlay
      ? {
        ...state.pauseOverlay,
        isSavingBeforeClose: true,
      }
      : {
        reason: 'window-close',
        isSavingBeforeClose: true,
      },
  };
}

