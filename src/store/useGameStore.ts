import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  initialState,
  leaderboardStorageKey,
} from './constants';
import type { GameStoreState } from './types';

import { createGameStoreSetters } from './setters/createGameStoreSetters';
import { migrateProfiles } from './utilities/migrateProfiles';
import { migrateGameHistoryByProfile } from './utilities/migrateGameHistoryByProfile';

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...createGameStoreSetters(set, get),
    }),
    {
      name: leaderboardStorageKey,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const rawState = (persistedState ?? {}) as Record<string, unknown>;

        return {
          ...rawState,
          profiles: migrateProfiles(rawState.profiles),
          gameHistoryByProfile: migrateGameHistoryByProfile(rawState.gameHistoryByProfile),
          rememberedUsername:
            typeof rawState.rememberedUsername === 'string' || rawState.rememberedUsername === null
              ? rawState.rememberedUsername
              : null,
        };
      },
      partialize: (state) => ({
        profiles: state.profiles,
        gameHistoryByProfile: state.gameHistoryByProfile,
        rememberedUsername: state.rememberedUsername,
      }),
    },
  ),
);
