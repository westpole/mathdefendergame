import { getFeatureFlags, isFeatureEnabled } from '../featureFlags';

describe('feature flags', () => {
  describe('getFeatureFlags', () => {
    it('returns the current feature flags as a copied object', () => {
      const flags = getFeatureFlags();

      expect(flags).toEqual({
        stage_confetti: true,
        streak_reward: true,
        achievements: true,
      });
      expect(flags).not.toBe(getFeatureFlags());
    });
  });

  describe('production localStorage overrides', () => {
    afterEach(() => {
      localStorage.clear();
      vi.resetModules();
    });

    it('ignores and removes a stale E2E override so bundled flags apply', async () => {
      localStorage.setItem('__e2eFeatureFlags', JSON.stringify({ stage_confetti: false }));
      vi.resetModules();

      const flagsModule = await import('../featureFlags');

      expect(flagsModule.isFeatureEnabled('stage_confetti')).toBe(true);
      expect(localStorage.getItem(flagsModule.E2E_FLAGS_STORAGE_KEY)).toBeNull();
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true for flags that are enabled', () => {
      expect(isFeatureEnabled('stage_confetti')).toBe(true);
      expect(isFeatureEnabled('streak_reward')).toBe(true);
      expect(isFeatureEnabled('achievements')).toBe(true);
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
