type AppCloseHandlers = {
  onCloseRequested: () => void;
  onCloseConfirmed: () => void;
  onCloseCancelled: () => void;
  shouldConfirmClose: () => boolean;
};

const PLATFORM_EVENTS = {
  closeQuery: 'electron-close-query',
  closeRequested: 'electron-close-requested',
  closeConfirmed: 'electron-close-confirmed',
  closeCancelled: 'electron-close-cancelled',
  closeQueryResult: 'math-defender-close-query-result',
  closeReady: 'math-defender-close-ready',
  closeFlowCancelled: 'math-defender-close-cancelled',
} as const;

function canUseWindow(): boolean {
  return typeof window !== 'undefined';
}

function dispatchPlatformEvent(eventName: string, detail?: Record<string, unknown>): void {
  if (!canUseWindow() || !isElectron()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName, detail === undefined ? undefined : { detail }),
  );
}

export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');
}

export function requestAppClose(): void {
  if (!canUseWindow()) {
    return;
  }

  window.close();
}

export function subscribeToAppCloseEvents(handlers: AppCloseHandlers): () => void {
  if (!canUseWindow() || !isElectron()) {
    return () => {};
  }

  const handleCloseQuery = () => {
    dispatchPlatformEvent(PLATFORM_EVENTS.closeQueryResult, {
      shouldConfirm: handlers.shouldConfirmClose(),
    });
  };

  window.addEventListener(PLATFORM_EVENTS.closeQuery, handleCloseQuery);
  window.addEventListener(PLATFORM_EVENTS.closeRequested, handlers.onCloseRequested);
  window.addEventListener(PLATFORM_EVENTS.closeConfirmed, handlers.onCloseConfirmed);
  window.addEventListener(PLATFORM_EVENTS.closeCancelled, handlers.onCloseCancelled);

  return () => {
    window.removeEventListener(PLATFORM_EVENTS.closeQuery, handleCloseQuery);
    window.removeEventListener(PLATFORM_EVENTS.closeRequested, handlers.onCloseRequested);
    window.removeEventListener(PLATFORM_EVENTS.closeConfirmed, handlers.onCloseConfirmed);
    window.removeEventListener(PLATFORM_EVENTS.closeCancelled, handlers.onCloseCancelled);
  };
}

export function notifyAppCloseReady(): void {
  dispatchPlatformEvent(PLATFORM_EVENTS.closeReady);
}

export function notifyAppCloseCancelled(): void {
  dispatchPlatformEvent(PLATFORM_EVENTS.closeFlowCancelled);
}
