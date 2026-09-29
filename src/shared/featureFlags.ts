import rawFeatureFlags from './feature-flags.json';

export type FeatureFlags = Record<string, boolean>;

const featureFlags: FeatureFlags = rawFeatureFlags as FeatureFlags;

export function getFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

export function isFeatureEnabled(flagName: string, fallbackValue = false): boolean {
  const value = featureFlags[flagName];
  return typeof value === 'boolean' ? value : fallbackValue;
}
