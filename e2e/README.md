# E2E Testing Setup

This directory contains end-to-end tests for the Math Defender game using Playwright to validate the shared E2E renderer build in both the browser shell and the Electron wrapper.

## Architecture

### Test Bridge (`fixtures/test-bridge.ts`)
Exposes a `window.__e2e` API for tests to:
- **Access Zustand store**: Read/write state without UI interaction
- **Control Phaser scenes**: Get scene instances, check readiness
- **Deterministic testing**: Set RNG seed, freeze time, step frames
- **Sync utilities**: Wait for game idle state

### Fixtures (`fixtures/browser-app.ts`, `fixtures/electron-app.ts`)
Provides base test fixtures:
- `browser-app.ts`: Opens the built web app through Playwright's browser context
- `electronApp`: Launches the Electron app in test mode
- `page`: The main window with test bridge installed

## Test Structure

Tests are organized by concern:
- **`mobile/`**: Mobile web viewport, touch input, and overlay layout coverage
- **`ui/`**: React overlay and menu navigation tests
- **`game/`**: Phaser game logic and state tests
- **`integration/`**: Store ↔ Phaser synchronization tests
- **`electron/`**: Thin Electron wrapper smoke coverage
- **`visual/`**: Visual regression tests (screenshots)

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run the web-first mobile browser lane only
npm run test:e2e:web

# Run the Electron-only lane
npm run test:e2e:electron

# Run specific test suite
npm run test:e2e -- e2e/game

# Run in UI mode (interactive)
npm run test:e2e:ui

# Update visual snapshots
npm run test:e2e -- --update-snapshots
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '../fixtures/electron-app';

test('can start game', async ({ page }) => {
  // Wait for test bridge
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);

  // Interact with store
  await page.evaluate(() => {
    const state = (window as E2EWindow).__e2e!.getStoreState();
    state.setGrade('trainee');
    state.startPlaying();
  });

  // Verify state
  const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
  expect(state.phase).toBe('playing');
});
```

### Using Test Bridge API

```typescript
// Read store state
const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

// Write store state
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.setStoreState({ score: 100, lives: 3 });
});

// Access Phaser scene
const sceneExists = await page.evaluate(() => {
  const scene = (window as E2EWindow).__e2e!.getScene('GameScene');
  return scene !== null;
});

// Deterministic testing
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.setSeed(12345); // Fixed RNG
  (window as E2EWindow).__e2e!.freezeTime();   // Stop game loop
  (window as E2EWindow).__e2e!.stepFrame();    // Manual frame step
});

// Wait for game ready
await page.evaluate(() => (window as E2EWindow).__e2e!.waitForIdle());
```

### Visual Tests

```typescript
test('menu matches snapshot', async ({ page }) => {
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);
  await page.waitForTimeout(1500); // Wait for fonts

  await expect(page).toHaveScreenshot('menu.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

## Environment Variables

- `E2E=true` - Set automatically by `electron-app.ts` fixture
- Vite defines `__E2E__` when building with `mode=e2e`

## Notes

- Playwright starts from the **built** E2E renderer bundle automatically via `vite preview`
- Browser-shell tests use the preview server at `http://127.0.0.1:4173`
- Electron tests load the same built renderer from disk through `electron/main.js`
- Visual tests have stricter pixel diff thresholds (1%)
- Use fixed RNG seeds for reproducible game state tests
- Playwright doesn't parallelize Electron windows as well as browser contexts
