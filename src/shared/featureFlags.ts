import rawFeatureFlags from './feature-flags.json';

/**
 * Map of feature flag names to their enabled/disabled state.
 *
 * Each key is a boolean flag name, such as "newTutorial" or "dailyRewards".
 */
export type FeatureFlags = Record<string, boolean>;

/**
 * Runtime feature flag registry loaded from the JSON config.
 * E2E tests can pre-set overrides via localStorage before the app initializes.
 */
const getInitialFlags = (): FeatureFlags => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('__e2eFeatureFlags') : null;
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
