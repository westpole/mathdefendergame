export type FeatureFlags = Record<string, boolean>;

let mockFeatureFlags: FeatureFlags = {};

/**
 * Resets the mock feature flag state by clearing all entries.
 */
export function resetMockFeatureFlags(): void {
  mockFeatureFlags = {};
}

/**
 * Adds or updates one or more feature flags manually.
 *
 * @param overrides - Feature flag values to apply.
 */
export function setMockFeatureFlags(overrides: Partial<FeatureFlags>): void {
  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      mockFeatureFlags[key] = value;
    }
  });
}

/**
 * Returns a copy of the current mock feature flag state.
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...mockFeatureFlags };
}

/**
 * Returns the enabled status for a requested feature flag.
 *
 * @param flagName - The feature flag key to look up.
 * @returns The boolean value for the requested flag.
 * @throws Error when the flag name has not been defined.
 */
export function isFeatureEnabled(flagName: string): boolean {
  if (!(flagName in mockFeatureFlags)) {
    throw new Error(`Feature flag "${flagName}" is not defined.`);
  }

  return mockFeatureFlags[flagName];
}

export default {
  getFeatureFlags,
  isFeatureEnabled,
  resetMockFeatureFlags,
  setMockFeatureFlags,
};
