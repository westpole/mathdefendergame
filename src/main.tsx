import React from 'react';
import ReactDOM from 'react-dom/client';

import '@ui/styles/index.scss';

import { App } from './App';
import { ensurePhaserGame } from '@game/scenes/UIScene';

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
