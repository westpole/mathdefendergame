import { getFeatureFlags, isFeatureEnabled } from '../featureFlags';

describe('feature flags', () => {
  describe('getFeatureFlags', () => {
    it('returns the current feature flags as a copied object', () => {
      const flags = getFeatureFlags();

      expect(flags).toEqual({
        stage_confetti: true,
        streak_reward: true,
        simple_login: true,
      });
      expect(flags).not.toBe(getFeatureFlags());
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true for flags that are enabled', () => {
      expect(isFeatureEnabled('stage_confetti')).toBe(true);
      expect(isFeatureEnabled('streak_reward')).toBe(true);
      expect(isFeatureEnabled('simple_login')).toBe(true);
    });

    it('returns false for flags that are missing', () => {
      expect(isFeatureEnabled('unknown_flag')).toBe(false);
      expect(isFeatureEnabled('unknown_flag', false)).toBe(false);
    });

    it('uses the provided fallback value when a flag is missing or not boolean', () => {
      expect(isFeatureEnabled('missing_flag', true)).toBe(true);
      expect(isFeatureEnabled('missing_flag', false)).toBe(false);
    });
  });
});
