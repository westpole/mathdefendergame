import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isElectron,
  notifyAppCloseCancelled,
  notifyAppCloseReady,
  subscribeToAppCloseEvents,
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
