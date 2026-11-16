import type {
  GameStoreState,
  LoginResult,
  PlayerProfile,
} from '../types';
import {
  buildGradeUpdate,
  isValidWeeklyScoreGoal,
  resolveActiveProfile,
  resolveLifetimeGrade,
  resolveProfileHistoryKey,
} from '../utilities/general';
import {
  buildNewProfile,
  createMissingUsernameResult,
  normalizeUsername,
} from '../transformers/auth';
import {
  buildHistoryByProfileWithEntry,
  buildProgressedProfile,
} from '../transformers/history';
import {
  buildProfileWithNewAchievements,
  mergeAchievementNotice,
} from '../transformers/achievements';
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
import { isAvatarId } from '@shared/avatarCatalog';
import { isFeatureEnabled } from '@shared/featureFlags';
import type { GameHistoryEntry } from '@shared/types';

const ACHIEVEMENTS_FLAG = 'achievements';

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
  | 'setMobileDevice'
  | 'setGrade'
  | 'startRegularPlay'
  | 'startPracticePlay'
  | 'syncHUD'
  | 'showStageMessage'
  | 'showStreakRewardMessage'
  | 'clearStreakRewardMessage'
  | 'showPauseOverlay'
  | 'hidePauseOverlay'
  | 'showSavingBeforeClose'
  | 'showGameOver'
  | 'persistPrematureGameEnd'
  | 'dismissGradeNotice'
  | 'dismissAchievementNotice'
  | 'startPlaying'
  | 'openMenu'
  | 'openScreenView'
  | 'logOff'
  | 'selectProfileByUsername'
  | 'createAndLoginSimpleProfile'
  | 'updateActiveProfileAvatar'
  | 'setWeeklyScoreGoal'
  | 'getActiveProfile'
  | 'addGameHistory'
  | 'getGameHistory'
> {
  /**
   * Silent award check when a profile becomes active: saves awards its history already
   * earns, without a notice. Awards that must not be backfilled are skipped.
   *
   * @param username - Profile that just became active.
   */
  const reconcileAchievementsOnLogin = (username: string) => {
    if (!isFeatureEnabled(ACHIEVEMENTS_FLAG)) {
      return;
    }

    const state = get();
    const profile = state.profiles[username];

    if (!profile) {
      return;
    }

    const { profile: nextProfile, newAchievements } = buildProfileWithNewAchievements(
      profile,
      state.gameHistoryByProfile[resolveProfileHistoryKey(username)] ?? [],
      Date.now(),
      false,
    );

    if (newAchievements.length > 0) {
      set({ profiles: { ...state.profiles, [username]: nextProfile } });
    }
  };

  /**
   * Award check after a run is saved. Guests get nothing saved and no notice.
   *
   * @param state - Store state before the run is saved.
   * @param profile - Active profile, or null for guests.
   * @param history - The profile's history including the new run.
   * @returns The profile with new awards and the notice to show.
   */
  const checkAchievementsAfterRun = (
    state: GameStoreState,
    profile: PlayerProfile | null,
    history: GameHistoryEntry[],
  ): { profile: PlayerProfile | null; achievementNotice: GameStoreState['achievementNotice'] } => {
    if (!profile || !isFeatureEnabled(ACHIEVEMENTS_FLAG)) {
      return { profile, achievementNotice: state.achievementNotice };
    }

    const result = buildProfileWithNewAchievements(profile, history, Date.now(), true);

    return {
      profile: result.profile,
      achievementNotice: mergeAchievementNotice(state.achievementNotice, result.newAchievements),
    };
  };

  return {
    startRegularPlay: () => set({ runMode: 'regular' }),
    setMobileDevice: (isMobileDevice) => set({ isMobileDevice }),
    startPracticePlay: (operation = get().practiceOperation) => {
      const state = get();
      const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

      set({
        runMode: 'practice',
        practiceOperation: operation,
        // Remember the pick per profile so the practice selector can mark it as "Last practiced".
        ...(activeProfile && {
          profiles: {
            ...state.profiles,
            [activeProfile.username]: {
              ...activeProfile,
              lastPracticeOperation: operation,
              updatedAt: Date.now(),
            },
          },
        }),
      });
    },
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
        reconcileAchievementsOnLogin(rememberedUsername);

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
        // addGameHistory runs first and has already resolved the post-run grade.
        const resolvedGrade = state.grade;

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
        const { grade: resolvedGrade, gradeNotice } = buildGradeUpdate(
          state.activeUsername,
          state.gameHistoryByProfile,
          payload.historyEntry,
        );

        const historyKey = resolveProfileHistoryKey(state.activeUsername);
        const gameHistoryByProfile = buildHistoryByProfileWithEntry(
          state.gameHistoryByProfile,
          historyKey,
          payload.historyEntry,
        );
        const { profile: awardedProfile, achievementNotice } = checkAchievementsAfterRun(
          state,
          activeProfile,
          gameHistoryByProfile[historyKey],
        );

        const nextState: Partial<GameStoreState> = {
          score: payload.score,
          grade: resolvedGrade,
          stage: payload.stage,
          gameHistoryByProfile,
          gradeNotice,
          achievementNotice,
        };

        if (awardedProfile) {
          nextState.profiles = {
            ...state.profiles,
            [awardedProfile.username]: buildProgressedProfile(
              awardedProfile,
              payload.score,
              payload.stage,
              resolvedGrade,
            ),
          };
        }

        return nextState;
      });
    },
    dismissGradeNotice: () => set({ gradeNotice: null }),
    dismissAchievementNotice: () => set({ achievementNotice: null }),
    startPlaying: () => set({
      phase: 'playing',
      stageMessage: null,
      streakRewardMessage: null,
      pauseOverlay: null,
      gradeNotice: null,
      achievementNotice: null,
    }),
    openMenu: () => set((state) => buildMenuSnapshot(state, 'home')),
    openScreenView: (screenView) => set((state) => buildMenuSnapshot(state, screenView)),
    logOff: () => set((state) => buildLogOffSnapshot(state)),
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
      reconcileAchievementsOnLogin(normalizedUsername);

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
      const profile = buildNewProfile(normalizedUsername, get().grade, now);

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
      reconcileAchievementsOnLogin(normalizedUsername);

      return { success: true };
    },
    updateActiveProfileAvatar: (avatarId): LoginResult => {
      if (!isAvatarId(avatarId)) {
        return {
          success: false,
          error: 'Invalid avatar selection.',
        };
      }

      const state = get();
      const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

      if (!activeProfile) {
        return {
          success: false,
          error: 'Active profile is unavailable.',
        };
      }

      set({
        profiles: {
          ...state.profiles,
          [activeProfile.username]: {
            ...activeProfile,
            avatarId,
            updatedAt: Date.now(),
          },
        },
      });

      return { success: true };
    },
    setWeeklyScoreGoal: (goal): LoginResult => {
      if (goal !== null && !isValidWeeklyScoreGoal(goal)) {
        return {
          success: false,
          error: 'Weekly goal must be a positive whole number.',
        };
      }

      const state = get();
      const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

      if (!activeProfile) {
        return {
          success: false,
          error: 'Active profile is unavailable.',
        };
      }

      const { weeklyScoreGoal: _previousGoal, ...profileWithoutGoal } = activeProfile;

      set({
        profiles: {
          ...state.profiles,
          [activeProfile.username]: {
            ...profileWithoutGoal,
            ...(goal !== null && { weeklyScoreGoal: goal }),
            updatedAt: Date.now(),
          },
        },
      });

      return { success: true };
    },
    getActiveProfile: () => {
      const state = get();
      return resolveActiveProfile(state.activeUsername, state.profiles);
    },
    addGameHistory: (entry) => {
      set((state) => {
        const historyKey = resolveProfileHistoryKey(state.activeUsername);
        const gameHistoryByProfile = buildHistoryByProfileWithEntry(state.gameHistoryByProfile, historyKey, entry);
        const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);
        const { profile: awardedProfile, achievementNotice } = checkAchievementsAfterRun(
          state,
          activeProfile,
          gameHistoryByProfile[historyKey],
        );

        return {
          ...buildGradeUpdate(state.activeUsername, state.gameHistoryByProfile, entry),
          gameHistoryByProfile,
          achievementNotice,
          ...(awardedProfile && awardedProfile !== activeProfile && {
            profiles: { ...state.profiles, [awardedProfile.username]: awardedProfile },
          }),
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
