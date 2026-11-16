import rawFeatureFlags from './feature-flags.json';

/**
 * Map of feature flag names to their enabled/disabled state.
 *
 * Each key is a boolean flag name, such as "newTutorial" or "dailyRewards".
 */
export type FeatureFlags = Record<string, boolean>;

/** localStorage key E2E tests use to pre-set flag overrides before the app initializes. */
export const E2E_FLAGS_STORAGE_KEY = '__e2eFeatureFlags';

/**
 * Runtime feature flag registry loaded from the JSON config.
 * Only E2E builds (`vite build --mode e2e`) honor localStorage overrides. Production builds
 * ignore them and delete any stale value, so leftovers from older builds cannot disable features.
 */
const getInitialFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') {
    return rawFeatureFlags as FeatureFlags;
  }

  if (!__E2E__) {
    try {
      localStorage.removeItem(E2E_FLAGS_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; bundled flags still apply.
    }
    return rawFeatureFlags as FeatureFlags;
  }

  const stored = localStorage.getItem(E2E_FLAGS_STORAGE_KEY);
  if (stored) {
    try {
      return { ...rawFeatureFlags, ...JSON.parse(stored) };
    } catch {
      return rawFeatureFlags as FeatureFlags;
    }
  }
  return rawFeatureFlags as FeatureFlags;
};

const featureFlags: FeatureFlags = getInitialFlags();

/**
 * Returns a shallow copy of the current feature flag set.
 *
 * @returns A cloned object containing the current enabled/disabled flags.
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

/**
 * Checks whether a feature flag is enabled.
 *
 * @param flagName - The feature flag key to look up.
 * @param fallbackValue - Value to return when the flag is missing or not a boolean.
 * @returns True when the flag exists and is enabled, otherwise the provided fallback value.
 */
export function isFeatureEnabled(flagName: string, fallbackValue = false): boolean {
  const value = featureFlags[flagName];
  return typeof value === 'boolean' ? value : fallbackValue;
}
