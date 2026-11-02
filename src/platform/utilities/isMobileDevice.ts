import {
  COARSE_POINTER_MEDIA_QUERY,
  MOBILE_USER_AGENT_PATTERN,
  NO_HOVER_MEDIA_QUERY,
} from '../constants';

/**
 * Browser APIs used to detect the device type. Injected so detection stays pure and testable.
 */
export interface MobileDeviceEnvironment {
  navigator?: {
    userAgent: string;
    platform?: string;
    maxTouchPoints?: number;
    /** User-Agent Client Hints (Chromium only); not yet part of the TypeScript DOM lib. */
    userAgentData?: { mobile?: boolean };
  };
  matchMedia?: (query: string) => { matches: boolean };
}

function resolveDefaultEnvironment(): MobileDeviceEnvironment {
  return {
    navigator: typeof navigator === 'undefined' ? undefined : navigator,
    matchMedia:
      typeof window === 'undefined' || typeof window.matchMedia !== 'function'
        ? undefined
        : (query) => window.matchMedia(query),
  };
}

/**
 * Detects whether the app is running on a phone or tablet (touch-first device).
 *
 * Checks, in order: Electron shell (always desktop), User-Agent Client Hints, mobile user-agent
 * tokens, iPadOS reporting itself as a Mac, and finally a coarse, non-hovering primary pointer.
 *
 * @param env - Browser APIs to inspect; defaults to the current window/navigator.
 * @returns True for mobile devices, false for desktops and when no browser APIs are available.
 * @example
 * const showTouchHints = isMobileDevice();
 */
export function isMobileDevice(env: MobileDeviceEnvironment = resolveDefaultEnvironment()): boolean {
  const { navigator: nav, matchMedia } = env;

  if (!nav) {
    return false;
  }

  if (nav.userAgent.includes('Electron')) {
    return false;
  }

  if (nav.userAgentData?.mobile === true) {
    return true;
  }

  if (MOBILE_USER_AGENT_PATTERN.test(nav.userAgent)) {
    return true;
  }

  if (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1) {
    return true;
  }

  if (!matchMedia) {
    return false;
  }

  return matchMedia(COARSE_POINTER_MEDIA_QUERY).matches && matchMedia(NO_HOVER_MEDIA_QUERY).matches;
}
