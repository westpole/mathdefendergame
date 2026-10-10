import type {
  GameStoreState,
  LoginResult,
} from '../types';
import {
  resolveActiveProfile,
  resolveLifetimeGrade,
  validatePassword,
} from '../utilities/general';
import {
  encryptPassword,
  isEncryptedPassword,
  verifyPassword,
} from '../utilities/passwordEncryption';
import {
  buildNewProfile,
  createMissingUsernameResult,
  normalizeUsername,
} from '../transformers/auth';
import {
  buildHistoryByProfileWithEntry,
  buildProgressedProfile,
  resolveProfileHistoryKey,
} from '../transformers/history';
import {
  buildHidePauseOverlayState,
  buildPauseOverlayState,
  buildSavingBeforeCloseState,
} from '../transformers/overlay';
import {
  buildLogOffSnapshot,
  buildMenuSnapshot,
} from '../transformers/session';
import type {
  GameStoreGetState,
  GameStoreSetState,
} from './types';

/**
 * Builds a synthetic password seed for simple profile mode and guest-like account flows.
 *
 * @param username - Username used to namespace synthetic entropy.
 * @returns Synthetic password string that will be encrypted before persistence.
 * @example
 * const synthetic = createSyntheticPassword('PilotOne');
 */
function createSyntheticPassword(username: string): string {
  const entropy = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `simple:${username}:${entropy}`;
}

/**
 * Creates all Zustand store action setters while keeping action logic modular.
 *
 * @param set - Zustand setState callback.
 * @param get - Zustand getState callback.
 * @returns Store action functions mapped to GameStoreState contract.
 * @example
 * const actions = createGameStoreSetters(set, get);
 */
export function createGameStoreSetters(
  set: GameStoreSetState,
  get: GameStoreGetState,
): Pick<GameStoreState,
  | 'markBootReady'
  | 'setGrade'
  | 'syncHUD'
  | 'showStageMessage'
  | 'showStreakRewardMessage'
  | 'clearStreakRewardMessage'
  | 'showPauseOverlay'
  | 'hidePauseOverlay'
  | 'showSavingBeforeClose'
  | 'showGameOver'
  | 'persistPrematureGameEnd'
  | 'startPlaying'
  | 'openMenu'
  | 'openScreenView'
  | 'logOff'
  | 'loginProfile'
  | 'selectProfileByUsername'
  | 'createAndLoginProfile'
  | 'createAndLoginSimpleProfile'
  | 'getActiveProfile'
  | 'addGameHistory'
  | 'getGameHistory'
> {
  return {
    markBootReady: () => {
      const rememberedUsername = get().rememberedUsername;

      if (rememberedUsername && get().profiles[rememberedUsername]) {
        const resolvedGrade = resolveLifetimeGrade(rememberedUsername, get().gameHistoryByProfile);

        set({
          bootReady: true,
          activeUsername: rememberedUsername,
          grade: resolvedGrade,
          phase: 'start',
          screenView: 'home',
        });

        return;
      }

      set({
        bootReady: true,
        activeUsername: null,
        rememberedUsername: null,
        phase: 'login',
      });
    },
    setGrade: (grade) => set({ grade }),
    syncHUD: (payload) => {
      set(payload);
    },
    showStageMessage: (stageMessage) => set({ phase: 'stage-message', stageMessage }),
    showStreakRewardMessage: (streakRewardMessage) => set({
      phase: 'stage-message',
      streakRewardMessage,
    }),
    clearStreakRewardMessage: () => set({ streakRewardMessage: null }),
    showPauseOverlay: (reason) => set(buildPauseOverlayState(reason)),
    hidePauseOverlay: () => set((state) => buildHidePauseOverlayState(state)),
    showSavingBeforeClose: () => set((state) => buildSavingBeforeCloseState(state)),
    showGameOver: (payload) => {
      set((state) => {
        const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);
        const resolvedGrade = resolveLifetimeGrade(state.activeUsername, state.gameHistoryByProfile);

        if (!activeProfile) {
          return {
            phase: 'gameover',
            stageMessage: null,
            streakRewardMessage: null,
            pauseOverlay: null,
            ...payload,
            grade: resolvedGrade,
          };
        }

        return {
          phase: 'gameover',
          stageMessage: null,
          streakRewardMessage: null,
          pauseOverlay: null,
          ...payload,
          grade: resolvedGrade,
          profiles: {
            ...state.profiles,
            [activeProfile.username]: buildProgressedProfile(
              activeProfile,
              payload.score,
              state.stage,
              resolvedGrade,
            ),
          },
        };
      });
    },
    persistPrematureGameEnd: (payload) => {
      set((state) => {
        const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);
        const profileKey = resolveProfileHistoryKey(state.activeUsername);
        const nextGameHistoryByProfile = buildHistoryByProfileWithEntry(
          state.gameHistoryByProfile,
          profileKey,
          payload.historyEntry,
        );
        const resolvedGrade = resolveLifetimeGrade(state.activeUsername, nextGameHistoryByProfile);

        const nextState: Partial<GameStoreState> = {
          score: payload.score,
          grade: resolvedGrade,
          stage: payload.stage,
          gameHistoryByProfile: nextGameHistoryByProfile,
        };

        if (activeProfile) {
          nextState.profiles = {
            ...state.profiles,
            [activeProfile.username]: buildProgressedProfile(
              activeProfile,
              payload.score,
              payload.stage,
              resolvedGrade,
            ),
          };
        }

        return nextState;
      });
    },
    startPlaying: () => set({
      phase: 'playing',
      stageMessage: null,
      streakRewardMessage: null,
      pauseOverlay: null,
    }),
    openMenu: () => set((state) => buildMenuSnapshot(state, 'home')),
    openScreenView: (screenView) => set((state) => buildMenuSnapshot(state, screenView)),
    logOff: () => set((state) => buildLogOffSnapshot(state)),
    loginProfile: (username, password, keepLoggedIn): LoginResult => {
      const normalizedUsername = normalizeUsername(username);

      if (!normalizedUsername) {
        return createMissingUsernameResult();
      }

      const profile = get().profiles[normalizedUsername];

      if (!profile) {
        return {
          success: false,
          error: 'Username not found. Switch to Create profile to register this commander.',
        };
      }

      if (!verifyPassword(password, profile.password)) {
        return {
          success: false,
          error: 'Incorrect password. Check your credentials or create a new profile if needed.',
        };
      }

      const resolvedGrade = resolveLifetimeGrade(normalizedUsername, get().gameHistoryByProfile);
      const shouldEncryptExistingPassword = !isEncryptedPassword(profile.password);

      set((state) => {
        const nextState: Partial<GameStoreState> = {
          activeUsername: normalizedUsername,
          rememberedUsername: keepLoggedIn ? normalizedUsername : null,
          grade: resolvedGrade,
          phase: 'start',
          screenView: 'home',
        };

        if (shouldEncryptExistingPassword) {
          nextState.profiles = {
            ...state.profiles,
            [normalizedUsername]: {
              ...profile,
              password: encryptPassword(profile.password),
              updatedAt: Date.now(),
            },
          };
        }

        return nextState;
      });

      return { success: true };
    },
    selectProfileByUsername: (username, rememberProfile = false): LoginResult => {
      const normalizedUsername = normalizeUsername(username);

      if (!normalizedUsername) {
        return createMissingUsernameResult();
      }

      const profile = get().profiles[normalizedUsername];

      if (!profile) {
        return {
          success: false,
          error: 'Username not found. Create a profile to continue.',
        };
      }

      const resolvedGrade = resolveLifetimeGrade(normalizedUsername, get().gameHistoryByProfile);

      set({
        activeUsername: normalizedUsername,
        rememberedUsername: rememberProfile ? normalizedUsername : null,
        grade: resolvedGrade,
        phase: 'start',
        screenView: 'home',
      });

      return { success: true };
    },
    createAndLoginProfile: (username, password, keepLoggedIn = false): LoginResult => {
      const normalizedUsername = normalizeUsername(username);

      if (!normalizedUsername) {
        return createMissingUsernameResult();
      }

      if (get().profiles[normalizedUsername]) {
        return {
          success: false,
          error: 'Username already exists. Pick a different username.',
        };
      }

      if (!validatePassword(password)) {
        return {
          success: false,
          error: 'Password must be exactly 8 characters and include uppercase, lowercase, and a number.',
        };
      }

      const now = Date.now();
      const profile = buildNewProfile(normalizedUsername, password, get().grade, now);

      set((state) => ({
        profiles: {
          ...state.profiles,
          [normalizedUsername]: profile,
        },
        activeUsername: normalizedUsername,
        rememberedUsername: keepLoggedIn ? normalizedUsername : null,
        phase: 'start',
        screenView: 'home',
      }));

      return { success: true };
    },
    createAndLoginSimpleProfile: (username): LoginResult => {
      const normalizedUsername = normalizeUsername(username);

      if (!normalizedUsername) {
        return createMissingUsernameResult();
      }

      if (get().profiles[normalizedUsername]) {
        return {
          success: false,
          error: 'Username already exists. Pick a different username.',
        };
      }

      const now = Date.now();
      const profile = buildNewProfile(
        normalizedUsername,
        createSyntheticPassword(normalizedUsername),
        get().grade,
        now,
      );

      set((state) => ({
        profiles: {
          ...state.profiles,
          [normalizedUsername]: profile,
        },
        activeUsername: normalizedUsername,
        rememberedUsername: null,
        phase: 'start',
        screenView: 'home',
      }));

      return { success: true };
    },
    getActiveProfile: () => {
      const state = get();
      return resolveActiveProfile(state.activeUsername, state.profiles);
    },
    addGameHistory: (entry) => {
      set((state) => {
        const profileKey = resolveProfileHistoryKey(state.activeUsername);

        return {
          gameHistoryByProfile: buildHistoryByProfileWithEntry(
            state.gameHistoryByProfile,
            profileKey,
            entry,
          ),
        };
      });
    },
    getGameHistory: (username = null, limit = 20) => {
      const state = get();
      const profileKey = resolveProfileHistoryKey(username ?? state.activeUsername);
      const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];

      return historyForProfile.slice(0, Math.max(0, limit));
    },
  };
}
