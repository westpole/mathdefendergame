import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ScoreEntry } from '@shared/types';

import {
  initialState,
  GUEST_HISTORY_BUCKET,
  leaderboardStorageKey,
} from './const';

import type {
  PlayerProfile,
  GameStoreState,
} from './types';

import {
  sortHistory,
  sortAndTrimScores,
  validatePassword,
  flattenLeaderboard,
  resolveActiveProfile,
  resolveLifetimeGrade,
} from './utilities/general';

import { migrateLeaderboard } from './utilities/migrateLeaderboard';
import { migrateProfiles } from './utilities/migrateProfiles';
import { migrateGameHistoryByProfile } from './utilities/migrateGameHistoryByProfile';

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
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
        // Keep HUD updates local to UI state to avoid frequent profile/localStorage writes.
        // Profile syncs (bestScore/highestStage) are already handled in showGameOver/saveScore.
        set(payload);
      },
      showStageMessage: (stageMessage) => set({ phase: 'stage-message', stageMessage }),
      showStreakRewardMessage: (streakRewardMessage) => set({ streakRewardMessage }),
      clearStreakRewardMessage: () => set({ streakRewardMessage: null }),
      showPauseOverlay: (reason) => set({
        phase: 'paused',
        stageMessage: null,
        streakRewardMessage: null,
        pauseOverlay: {
          reason,
          isSavingBeforeClose: false,
        },
      }),
      hidePauseOverlay: () => set((state) => ({
        phase: state.bootReady ? 'playing' : state.phase,
        pauseOverlay: null,
      })),
      showSavingBeforeClose: () => set((state) => ({
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
      })),
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
              [activeProfile.username]: {
                ...activeProfile,
                bestScore: Math.max(activeProfile.bestScore, payload.score),
                highestStage: Math.max(activeProfile.highestStage, state.stage),
                preferredGrade: resolvedGrade,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
      persistPrematureGameEnd: (payload) => {
        set((state) => {
          const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);
          const profileKey = state.activeUsername ?? GUEST_HISTORY_BUCKET;
          const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];
          const nextHistoryForProfile = sortHistory([...historyForProfile, payload.historyEntry]);
          const nextGameHistoryByProfile = {
            ...state.gameHistoryByProfile,
            [profileKey]: nextHistoryForProfile,
          };
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
              [activeProfile.username]: {
                ...activeProfile,
                bestScore: Math.max(activeProfile.bestScore, payload.score),
                highestStage: Math.max(activeProfile.highestStage, payload.stage),
                preferredGrade: resolvedGrade,
                updatedAt: Date.now(),
              },
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
      openMenu: () => set({
        ...initialState,
        bootReady: true,
        phase: 'start',
        score: get().score,
        grade: get().grade,
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        gameHistoryByProfile: get().gameHistoryByProfile,
        activeUsername: get().activeUsername,
        rememberedUsername: get().rememberedUsername,
      }),
      openScreenView: (screenView) => set({
        ...initialState,
        bootReady: true,
        phase: 'start',
        screenView,
        score: get().score,
        grade: get().grade,
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        gameHistoryByProfile: get().gameHistoryByProfile,
        activeUsername: get().activeUsername,
        rememberedUsername: get().rememberedUsername,
      }),
      logOff: () => set({
        ...initialState,
        bootReady: true,
        phase: 'login',
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        gameHistoryByProfile: get().gameHistoryByProfile,
        activeUsername: null,
        rememberedUsername: null,
      }),
      loginProfile: (username, password, keepLoggedIn) => {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
          return {
            success: false,
            error: 'Username is required.',
          };
        }

        const profile = get().profiles[normalizedUsername];

        if (!profile) {
          return {
            success: false,
            error: 'Username not found. Switch to Create profile to register this commander.',
          };
        }

        if (profile.password !== password) {
          return {
            success: false,
            error: 'Incorrect password. Check your credentials or create a new profile if needed.',
          };
        }

        const resolvedGrade = resolveLifetimeGrade(normalizedUsername, get().gameHistoryByProfile);

        set({
          activeUsername: normalizedUsername,
          rememberedUsername: keepLoggedIn ? normalizedUsername : null,
          grade: resolvedGrade,
          phase: 'start',
          screenView: 'home',
        });

        return { success: true };
      },
      createAndLoginProfile: (username, password, keepLoggedIn = false) => {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
          return {
            success: false,
            error: 'Username is required.',
          };
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
        const profile: PlayerProfile = {
          username: normalizedUsername,
          password,
          bestScore: 0,
          highestStage: 1,
          preferredGrade: get().grade,
          createdAt: now,
          updatedAt: now,
        };

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
      getActiveProfile: () => {
        const state = get();
        return resolveActiveProfile(state.activeUsername, state.profiles);
      },
      saveScore: (name, score, perfScore, grade) => {
        const entry: ScoreEntry = {
          key: `leaderboard_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
          name,
          score,
          perfScore,
          combined: score + perfScore,
          grade,
          date: Date.now(),
        };

        set((state) => ({
          leaderboard: {
            ...state.leaderboard,
            [grade]: sortAndTrimScores([...state.leaderboard[grade], entry]),
          },
        }));
      },
      getScores: (gradeFilter = null) => {
        const { leaderboard } = get();

        if (gradeFilter) {
          return leaderboard[gradeFilter];
        }

        return flattenLeaderboard(leaderboard).sort(
          (left, right) => right.combined - left.combined || right.date - left.date,
        );
      },
      addGameHistory: (entry) => {
        set((state) => {
          const profileKey = state.activeUsername ?? GUEST_HISTORY_BUCKET;
          const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];

          return {
            gameHistoryByProfile: {
              ...state.gameHistoryByProfile,
              [profileKey]: sortHistory([...historyForProfile, entry]),
            },
          };
        });
      },
      getGameHistory: (username = null, limit = 20) => {
        const state = get();
        const profileKey = username ?? state.activeUsername ?? GUEST_HISTORY_BUCKET;
        const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];

        return historyForProfile.slice(0, Math.max(0, limit));
      },
    }),
    {
      name: leaderboardStorageKey,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const rawState = (persistedState ?? {}) as Record<string, unknown>;

        return {
          ...rawState,
          leaderboard: migrateLeaderboard(rawState.leaderboard),
          profiles: migrateProfiles(rawState.profiles),
          gameHistoryByProfile: migrateGameHistoryByProfile(rawState.gameHistoryByProfile),
          rememberedUsername:
            typeof rawState.rememberedUsername === 'string' || rawState.rememberedUsername === null
              ? rawState.rememberedUsername
              : null,
        };
      },
      partialize: (state) => ({
        leaderboard: state.leaderboard,
        profiles: state.profiles,
        gameHistoryByProfile: state.gameHistoryByProfile,
        rememberedUsername: state.rememberedUsername,
      }),
    },
  ),
);
