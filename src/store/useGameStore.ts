import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  initialState,
  leaderboardStorageKey,
} from './constants';
import type { GameStoreState } from './types';

import { createGameStoreSetters } from './setters/createGameStoreSetters';
import {
  migrateLegacyProfiles,
  migrateProfiles,
} from './utilities/migrateProfiles';
import { migrateGameHistoryByProfile } from './utilities/migrateGameHistoryByProfile';

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...createGameStoreSetters(set, get),
    }),
    {
      name: leaderboardStorageKey,
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, persistedVersion) => {
        const rawState = (persistedState ?? {}) as Record<string, unknown>;
        const profiles =
          persistedVersion < 4
            ? migrateLegacyProfiles(rawState.profiles).profiles
            : migrateProfiles(rawState.profiles);

        return {
          profiles,
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
