import { describe, expect, it } from 'vitest';

import { isMobileDevice, type MobileDeviceEnvironment } from '../isMobileDevice';

const desktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';

function createEnvironment(
  navigator: Partial<NonNullable<MobileDeviceEnvironment['navigator']>> = {},
  matchingQueries: string[] = [],
): MobileDeviceEnvironment {
  return {
    navigator: { userAgent: desktopUserAgent, platform: 'Win32', maxTouchPoints: 0, ...navigator },
    matchMedia: (query) => ({ matches: matchingQueries.includes(query) }),
  };
}

describe('isMobileDevice', () => {
  it('returns false for a desktop browser with a fine pointer', () => {
    expect(isMobileDevice(createEnvironment())).toBe(false);
  });

  it('returns false when no navigator is available', () => {
    expect(isMobileDevice({})).toBe(false);
  });

  it('always treats the Electron shell as desktop', () => {
    const env = createEnvironment(
      { userAgent: `${desktopUserAgent} Electron/42.0.0`, userAgentData: { mobile: true } },
      ['(pointer: coarse)', '(hover: none)'],
    );

    expect(isMobileDevice(env)).toBe(false);
  });

  it('trusts User-Agent Client Hints reporting a mobile device', () => {
    expect(isMobileDevice(createEnvironment({ userAgentData: { mobile: true } }))).toBe(true);
  });

  it.each([
    ['Android phone', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'],
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'],
    ['legacy iPad', 'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'],
  ])('detects a %s from its user agent', (_label, userAgent) => {
    expect(isMobileDevice(createEnvironment({ userAgent }))).toBe(true);
  });

  it('detects iPadOS that reports itself as a Mac', () => {
    const env = createEnvironment({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });

    expect(isMobileDevice(env)).toBe(true);
  });

  it('keeps a touch-less Mac on desktop', () => {
    expect(isMobileDevice(createEnvironment({ platform: 'MacIntel', maxTouchPoints: 0 }))).toBe(false);
  });

  it('detects touch-first devices through pointer media queries', () => {
    expect(isMobileDevice(createEnvironment({}, ['(pointer: coarse)', '(hover: none)']))).toBe(true);
  });

  it('keeps touchscreen laptops with a mouse on desktop', () => {
    expect(isMobileDevice(createEnvironment({}, ['(pointer: coarse)']))).toBe(false);
  });

  it('returns false when media queries are unavailable', () => {
    expect(isMobileDevice({ navigator: { userAgent: desktopUserAgent } })).toBe(false);
  });
});
