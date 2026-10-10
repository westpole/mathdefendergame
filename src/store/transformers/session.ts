import { initialState } from '../constants';
import type {
  GameStoreState,
  ScreenView,
} from '../types';

/**
 * Builds a menu-compatible state snapshot while preserving session progress data.
 *
 * @param state - Current store state.
 * @param screenView - Target menu screen.
 * @returns Partial state for menu navigation.
 * @example
 * const nextState = buildMenuSnapshot(state, 'performance');
 */
export function buildMenuSnapshot(
  state: GameStoreState,
  screenView: ScreenView,
): Partial<GameStoreState> {
  return {
    ...initialState,
    bootReady: true,
    phase: 'start',
    screenView,
    score: state.score,
    grade: state.grade,
    profiles: state.profiles,
    gameHistoryByProfile: state.gameHistoryByProfile,
    activeUsername: state.activeUsername,
    rememberedUsername: state.rememberedUsername,
  };
}

/**
 * Builds a log-off state that clears login identity while preserving durable profile data.
 *
 * @param state - Current store state.
 * @returns Partial state for logging off.
 * @example
 * const nextState = buildLogOffSnapshot(state);
 */
export function buildLogOffSnapshot(state: GameStoreState): Partial<GameStoreState> {
  return {
    ...initialState,
    bootReady: true,
    phase: 'login',
    profiles: state.profiles,
    gameHistoryByProfile: state.gameHistoryByProfile,
    activeUsername: null,
    rememberedUsername: null,
  };
}

