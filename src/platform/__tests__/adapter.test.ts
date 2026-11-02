import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isElectron,
  notifyAppCloseCancelled,
  notifyAppCloseReady,
  subscribeToAppCloseEvents,
  subscribeToMobileDeviceChanges,
} from '../adapter';

const originalUserAgent = window.navigator.userAgent;

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
}

afterEach(() => {
  setUserAgent(originalUserAgent);
  vi.restoreAllMocks();
});

describe('platform adapter', () => {
  it('keeps desktop close events inactive in the browser shell', () => {
    setUserAgent('Mozilla/5.0');

    const onCloseRequested = vi.fn();
    const onReady = vi.fn();
    const onCancelled = vi.fn();

    window.addEventListener('math-defender-close-ready', onReady);
    window.addEventListener('math-defender-close-cancelled', onCancelled);

    const unsubscribe = subscribeToAppCloseEvents({
      onCloseRequested,
      onCloseConfirmed: vi.fn(),
      onCloseCancelled: vi.fn(),
      shouldConfirmClose: () => true,
    });

    window.dispatchEvent(new Event('electron-close-requested'));
    notifyAppCloseReady();
    notifyAppCloseCancelled();

    expect(isElectron()).toBe(false);
    expect(onCloseRequested).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
    expect(onCancelled).not.toHaveBeenCalled();

    unsubscribe();
    window.removeEventListener('math-defender-close-ready', onReady);
    window.removeEventListener('math-defender-close-cancelled', onCancelled);
  });

  it('wires the close handshake only when running inside Electron', () => {
    setUserAgent('Mozilla/5.0 Electron/42.0');

    const onCloseRequested = vi.fn();
    const onCloseConfirmed = vi.fn();
    const onCloseCancelled = vi.fn();
    const onQueryResult = vi.fn();
    const onReady = vi.fn();
    const onFlowCancelled = vi.fn();

    window.addEventListener('math-defender-close-query-result', onQueryResult as EventListener);
    window.addEventListener('math-defender-close-ready', onReady);
    window.addEventListener('math-defender-close-cancelled', onFlowCancelled);

    const unsubscribe = subscribeToAppCloseEvents({
      onCloseRequested,
      onCloseConfirmed,
      onCloseCancelled,
      shouldConfirmClose: () => true,
    });

    window.dispatchEvent(new Event('electron-close-query'));
    window.dispatchEvent(new Event('electron-close-requested'));
    window.dispatchEvent(new Event('electron-close-confirmed'));
    window.dispatchEvent(new Event('electron-close-cancelled'));
    notifyAppCloseReady();
    notifyAppCloseCancelled();

    expect(isElectron()).toBe(true);
    expect(onCloseRequested).toHaveBeenCalledTimes(1);
    expect(onCloseConfirmed).toHaveBeenCalledTimes(1);
    expect(onCloseCancelled).toHaveBeenCalledTimes(1);
    expect(onQueryResult).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onFlowCancelled).toHaveBeenCalledTimes(1);

    const queryEvent = onQueryResult.mock.calls[0]?.[0] as CustomEvent<{ shouldConfirm: boolean }>;

    expect(queryEvent.detail.shouldConfirm).toBe(true);

    unsubscribe();
    window.dispatchEvent(new Event('electron-close-requested'));

    expect(onCloseRequested).toHaveBeenCalledTimes(1);

    window.removeEventListener('math-defender-close-query-result', onQueryResult as EventListener);
    window.removeEventListener('math-defender-close-ready', onReady);
    window.removeEventListener('math-defender-close-cancelled', onFlowCancelled);
  });
});

describe('subscribeToMobileDeviceChanges', () => {
  function mockMatchMedia(matches: boolean) {
    const mediaQueryList = {
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQueryList as unknown as MediaQueryList);

    return mediaQueryList;
  }

  it('reports the current device type immediately', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148');
    mockMatchMedia(false);
    const onChange = vi.fn();

    subscribeToMobileDeviceChanges(onChange);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('re-detects the device when the pointer media query changes and cleans up the listener', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    const mediaQueryList = mockMatchMedia(false);
    const onChange = vi.fn();

    const unsubscribe = subscribeToMobileDeviceChanges(onChange);

    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(pointer: coarse)');

    const handleChange = mediaQueryList.addEventListener.mock.calls[0]?.[1] as () => void;
    mediaQueryList.matches = true;
    handleChange();

    expect(onChange).toHaveBeenLastCalledWith(true);

    unsubscribe();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', handleChange);
  });
});
