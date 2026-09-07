import React from 'react';
import ReactDOM from 'react-dom/client';

import '@ui/styles/index.scss';

import { App } from './App';
import { ensurePhaserGame } from '@game/scenes/UIScene';

function installViewportCssVars() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const { documentElement } = document;
  const syncViewportCssVars = () => {
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportWidth = viewport?.width ?? window.innerWidth;

    documentElement.style.setProperty('--app-viewport-height', `${Math.round(viewportHeight)}px`);
    documentElement.style.setProperty('--app-viewport-width', `${Math.round(viewportWidth)}px`);
  };

  syncViewportCssVars();

  window.addEventListener('resize', syncViewportCssVars);
  window.addEventListener('orientationchange', syncViewportCssVars);
  window.visualViewport?.addEventListener('resize', syncViewportCssVars);
  window.visualViewport?.addEventListener('scroll', syncViewportCssVars);

  return () => {
    window.removeEventListener('resize', syncViewportCssVars);
    window.removeEventListener('orientationchange', syncViewportCssVars);
    window.visualViewport?.removeEventListener('resize', syncViewportCssVars);
    window.visualViewport?.removeEventListener('scroll', syncViewportCssVars);
  };
}

const cleanupViewportCssVars = installViewportCssVars();

if (__E2E__) {
  // Wait for Phaser game to be ready before installing test bridge
  import('../e2e/fixtures/test-bridge').then(({ installTestBridge }) => {
    const game = ensurePhaserGame();
    installTestBridge(game);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupViewportCssVars();
  });
}
