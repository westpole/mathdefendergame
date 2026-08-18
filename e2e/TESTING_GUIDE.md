# E2E Testing Guide

## Adding Test IDs to Components

For components that need to be tested via Playwright, add `data-testid` attributes to the root element:

```tsx
export function MyComponent() {
  return (
    <div className="my-component" data-testid="my-component">
      {/* content */}
    </div>
  );
}
```

### Recommended Test IDs

Add these to make E2E tests more reliable:

**UI Overlays:**
- ✅ `main-menu` - MainMenuOverlay (added)
- `rules-overlay` - RulesOverlay
- `game-over-overlay` - GameOverOverlay
- `hud-overlay` - HUDOverlay
- `stage-message-overlay` - StageMessageOverlay
- `loading-overlay` - Loading

**Interactive Elements:**
- `start-defense-button` - Start game button
- `answer-input` - Game answer input field
- `submit-answer-button` - Submit answer button

**Game Elements:**
- `game-container` - Phaser canvas container
- `score-display` - Current score
- `lives-display` - Remaining lives
- `stage-display` - Current stage number

## Test Bridge API Reference

### Store Access

```typescript
// Get full store state
const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

// Update store (partial state)
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.setStoreState({
    score: 100,
    lives: 3,
    phase: 'playing'
  });
});
```

### Phaser Scene Access

```typescript
// Get scene instance
const scene = await page.evaluate(() =>
  (window as E2EWindow).__e2e!.getScene('GameScene')
);

// Check if scene is ready
const isReady = await page.evaluate(() =>
  (window as E2EWindow).__e2e!.isSceneReady('BootScene')
);
```

### Deterministic Testing

```typescript
// Set fixed RNG seed for reproducible tests
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.setSeed(12345);
});

// Freeze game time
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.freezeTime();
});

// Manually step frame
await page.evaluate(() => {
  (window as E2EWindow).__e2e!.stepFrame();
});
```

### Synchronization

```typescript
// Wait for game to be idle (no boot/loading)
await page.evaluate(() => (window as E2EWindow).__e2e!.waitForIdle());

// Standard wait for test bridge availability
await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, {
  timeout: 5000
});
```

## Common Test Patterns

### Starting a Game

```typescript
test('start game with trainee baseline', async ({ page }) => {
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);

  await page.evaluate(() => {
    const state = (window as E2EWindow).__e2e!.getStoreState();
    state.setGrade('trainee');
    state.startPlaying();
  });

  const newState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
  expect(newState.phase).toBe('playing');
});
```

### Testing Game Logic

```typescript
test('score increases on correct answer', async ({ page }) => {
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);

  // Start game with fixed seed
  await page.evaluate(() => {
    (window as E2EWindow).__e2e!.setSeed(12345);
    const state = (window as E2EWindow).__e2e!.getStoreState();
    state.setGrade('trainee');
    state.startPlaying();
  });

  // Get initial score
  const initialScore = await page.evaluate(() =>
    (window as E2EWindow).__e2e!.getStoreState().score
  );

  // Submit correct answer (you'll need to determine what the answer is)
  await page.fill('[data-testid="answer-input"]', '42');
  await page.click('[data-testid="submit-answer-button"]');

  // Verify score increased
  const newScore = await page.evaluate(() =>
    (window as E2EWindow).__e2e!.getStoreState().score
  );
  expect(newScore).toBeGreaterThan(initialScore);
});
```

### Visual Testing

```typescript
test('game at stage 5 matches snapshot', async ({ page }) => {
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);

  // Set up deterministic state
  await page.evaluate(() => {
    (window as E2EWindow).__e2e!.setSeed(12345);
    (window as E2EWindow).__e2e!.setStoreState({
      phase: 'playing',
      stage: 5,
      score: 5000,
      lives: 3,
    });
  });

  await page.waitForTimeout(1000); // Wait for render

  await expect(page).toHaveScreenshot('stage-5.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

### Menu Navigation

```typescript
test('navigate through menus', async ({ page }) => {
  await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined);

  // Start at home
  let state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
  expect(state.menuView).toBe('home');

  // Open rules from the menu
  await page.click('[data-testid="rules-button"]');
  state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
  expect(state.menuView).toBe('rules');

  // Back to home
  await page.click('[data-testid="back-button"]');
  state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
  expect(state.menuView).toBe('home');
});
```

## Build and Run

```bash
# Build for E2E mode (includes test bridge)
npm run build:e2e

# Run all tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- e2e/game

# Interactive UI mode
npm run test:e2e:ui

# Update visual snapshots
npm run test:e2e:update-snapshots
```

## Debugging

### View Test in Browser-like UI
```bash
npm run test:e2e:ui
```

### Add Debug Logs
```typescript
test('debug test', async ({ page }) => {
  // Log to console
  page.on('console', msg => console.log('Browser:', msg.text()));

  // Take screenshots at key points
  await page.screenshot({ path: 'debug-1.png' });

  // Pause execution for manual inspection
  await page.pause();
});
```

### Check Electron DevTools
The test bridge also logs to the browser console, which you can see in Playwright's trace viewer.

## Notes

- Tests run against the **built** app, not dev server
- Always rebuild with `npm run build:e2e` before running tests
- Use fixed RNG seeds for reproducible game state tests
- Visual tests have 1% pixel diff tolerance
- Electron windows don't parallelize well - tests run sequentially
