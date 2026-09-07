# Web-First Mobile Plan With Optional Electron Wrapper

### Current Constraints

1. The shell uses fixed viewport sizing.
   - `body` uses `width: 100vw` and `height: 100vh`.
   - `#app-shell` also uses `width: 100vw` and `height: 100vh`.
   - This is fragile on mobile browsers because browser chrome and virtual keyboard changes make `100vh` unreliable.

2. The game canvas is fixed to a desktop-like square layout.
   - Phaser is configured with `CANVAS_WIDTH: 700` and `CANVAS_HEIGHT: 700`.
   - That works on desktop, but it is not a good default for portrait phones.

3. The responsive layer is too limited.
   - Breakpoint mixins exist, but only a few components adapt.
   - The HUD still uses a fixed `90px` height and fixed-size status boxes.
   - The main menu starts as a two-column desktop layout.

4. Mobile gameplay is blocked by input, not just layout.
   - Gameplay uses keyboard events for typing answers.
   - Stage continue flow also supports Enter key interaction.
   - On a phone, the game can render without being truly playable unless an on-screen input path is added.

5. The renderer still contains Electron-specific behavior.
   - The app listens for Electron close events.
   - That should be isolated behind a platform boundary so the browser app can run standalone while Electron remains a thin optional wrapper.

6. Mobile-web polish is not in place yet.
   - The HTML viewport meta is basic.
   - There is no visible safe-area handling for notches.
   - There is no clear dynamic viewport handling for keyboard open/close.

## What Should Stay

- Keep the SCSS entrypoint architecture.
- Keep shared design tokens in variables.
- Keep the separation between Phaser canvas and React overlays.
- Keep Zustand as the integration boundary between gameplay and UI.

## Target Architecture

The right target is not two separate apps.

The right target is one web-first renderer with two shells:

1. Browser shell
   - Vite serves and builds the app as a normal web application.
   - This becomes the primary runtime for mobile devices.

2. Electron shell
   - Electron loads the same built web app.
   - Electron owns only desktop wrapper concerns such as window lifecycle, desktop menu, and packaging.

This keeps the gameplay, React overlays, Zustand state, styles, and asset pipeline shared across both environments.

## Separation Plan To Keep Electron And Enable Web-Only Build

### Phase 1: Separate Platform Shell From Renderer Core

Goal: make the renderer a platform-neutral web app and keep Electron as a thin wrapper.

Tasks:

1. Move Electron-specific renderer integration behind a small platform adapter.
2. Make the default renderer path work with no Electron globals, events, or assumptions.
3. Keep desktop-only behaviors optional and activated only when the app is running inside Electron.
4. Prevent React, Phaser, and gameplay modules from importing anything from the Electron folder directly.

Why this comes first:

- It gives you one shared game codebase instead of a browser fork and a desktop fork.
- It keeps the Electron surface small and easier to maintain.

Suggested boundary:

1. `src/platform/adapter.ts`
   - Exposes platform-neutral functions such as `isElectron()`, `requestAppClose()`, and optional event subscription helpers.
2. Browser implementation
   - Safe no-op behavior for Electron-only features.
3. Electron implementation
   - Bridges renderer events to the Electron wrapper behavior.

Result:

- The browser build works on its own.
- The Electron build wraps the exact same renderer bundle.

### Phase 2: Make Build Targets Explicit

Goal: separate build intent without splitting the app.

Tasks:

1. Keep `build:web` as the primary renderer build.
2. Make the Electron packaging step depend on the web build output instead of acting like a separate app runtime.
3. Split scripts conceptually into:
   - web development
   - web production build
   - Electron development wrapper
   - Electron packaging
4. Keep the output contract simple: Electron should load the generated web assets and nothing more.

Recommended script model:

1. `dev:web` runs only Vite.
2. `dev:electron` runs Vite plus Electron wrapper.
3. `build:web` creates the deployable browser app.
4. `build:win` packages Electron around the existing web build.

Why this matters:

- It makes mobile web deployment and Windows packaging two outputs from the same renderer instead of competing app modes.

Current repo mapping:

1. `dev:web` runs the renderer only with Vite.
2. `dev:electron` runs the renderer plus the Electron wrapper against the Vite URL.
3. `start:electron` loads the built renderer through Electron.
4. `build:web` remains the primary production renderer build.
5. `build:web:e2e` creates the E2E-flavored renderer build without packaging.
6. `build:win` packages Electron around the existing web build output.

### Phase 3: Fix The App Shell For Mobile Browsers

Goal: make the root layout stable on phones and tablets.

Tasks:

1. Replace hard `100vh` usage with dynamic viewport-safe sizing.
2. Add support for safe-area insets.
3. Define shell sizing rules for portrait and landscape.
4. Ensure overlays remain usable when the software keyboard is open.

Expected output:

- A shell that does not jump or crop when mobile browser chrome changes.

### Phase 4: Add A Mobile Input Model

Goal: make the game actually playable on touch devices.

Tasks:

1. Introduce an on-screen numeric keypad, numeric input field, or both.
2. Route mobile answer entry into the same gameplay logic that currently uses keyboard input.
3. Add touch-friendly controls for continue, pause, and end-game flows.
4. Preserve desktop keyboard support while adding touch support.

Recommendation:

- Use an on-screen keypad as the primary mobile input.
- Optionally support native numeric input as a fallback.

Why this is critical:

- Without this step, the app may be viewable on mobile but it is not a usable mobile game.

### Phase 5: Rework Phaser Sizing And Aspect Ratio

Goal: fit the game naturally on phone screens.

Tasks:

1. Revisit the internal Phaser canvas size.
2. Decide whether to keep a square game area with letterboxing or switch to a portrait-first aspect ratio.
3. Update any gameplay constants that assume current canvas height and width.
4. Validate text readability and meteor spacing at smaller visible sizes.

Recommendation:

- Prefer a portrait-first internal layout for phones unless there is a strong gameplay reason to keep the square canvas.

### Phase 6: Rewrite Key Overlays As Mobile-First

Goal: make the React overlay UI usable on narrow screens.

Highest-priority surfaces:

1. HUD
2. Start/home menu
3. Login/profile forms
4. Stage message overlay
5. Game over overlay

Tasks:

1. Replace fixed heights and rigid tile sizes with fluid sizing.
2. Reduce spacing and type scale on narrow screens.
3. Make primary actions thumb-friendly.
4. Add portrait and landscape variants where needed.
5. Prevent overlay content from being hidden by the mobile keyboard.

### Phase 7: Finish Mobile Web App Polish

Goal: make the browser experience feel intentional on phones.

Tasks:

1. Improve mobile web app metadata in `index.html`.
2. Add touch-behavior tuning where needed.
3. Define behavior for orientation changes.
4. Decide how the game should pause when the tab loses visibility.
5. Verify loading, fonts, and overlays on real device dimensions.

### Phase 8: Shift Testing To Web-First Validation

Goal: make mobile browser quality a standard part of development.

Tasks:

1. Keep the Vite web build as the primary release path.
2. Add Playwright coverage for narrow mobile-sized viewports.
3. Add touch interaction tests for answer input and overlay navigation.
4. Validate portrait and landscape layouts.

Add one more validation lane:

5. Add a thin Electron smoke test that verifies the wrapper can load the built web assets and forward desktop-only events correctly.

## Recommended Code Separation

Use this responsibility split:

1. `src/**`
   - Shared application code only.
   - React overlays, Phaser scenes, Zustand store, gameplay logic, and styles.

2. `src/platform/**`
   - Platform adapter interfaces and browser-safe implementations.
   - No direct Electron imports in feature code.

3. `electron/**`
   - Main process only.
   - Preload only if needed.
   - Window creation, app menu, close confirmation bridge, and packaging concerns.

4. `build/`
   - Web output consumed by both browser deployment and Electron packaging.

Rule:

- Electron may depend on the built web app.
- The web app must not depend on Electron.

## Recommended Refactor Order

1. Extract the current close-confirmation behavior into a platform adapter.
2. Make the browser implementation a no-op or browser-native equivalent.
3. Update `App.tsx` and any scene helpers to depend on the adapter instead of raw Electron window events.
4. Leave `electron/main.js` responsible only for wrapper concerns and asset loading.
5. After the platform boundary is stable, continue with mobile viewport, touch input, and responsive overlay work.

## Recommended Execution Order

1. Separate Electron-specific renderer wiring behind a platform adapter.
2. Make web and Electron build targets explicit while keeping one shared renderer.
3. Build the mobile answer-entry system.
4. Replace fixed viewport shell sizing with mobile-safe layout rules.
5. Refactor HUD and menu overlays for narrow screens.
6. Revisit Phaser aspect ratio and scaling decisions.
7. Add mobile browser testing and Electron smoke coverage.

## Practical Outcome

If this separation is done correctly, you will have:

1. A normal web build deployable to static hosting or any web server.
2. A mobile-friendly browser experience using the same codebase.
3. A Windows desktop build produced by Electron without forking gameplay or UI logic.
4. A cleaner boundary where Electron can evolve independently from the game itself.

## Most Important Decision Before Implementation

The main product decision is the mobile input model.

You need to choose one of these paths:

1. On-screen keypad only
2. Native numeric input only
3. Both keypad and native input

Best option:

- Both, with the on-screen keypad as the primary UI.

That gives the most reliable touch experience while still letting the browser provide native keyboard support when useful.
