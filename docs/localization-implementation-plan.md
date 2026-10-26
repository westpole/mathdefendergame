# Localization Implementation Plan (Phaser 4 + React Overlay)

This plan adapts the proposed localization architecture to the current Math Defender Game repository structure and ownership boundaries.

## Goals

- Introduce robust multilingual support using `i18next`.
- Keep Phaser gameplay state ownership in the game layer.
- Localize React overlays and game-generated messages without duplicating state.
- Preserve existing app lifecycle behavior and Electron security posture.

## Current Architecture Alignment

- Phaser version is **4.x** (`phaser: ^4.2.0`), not Phaser 3.
- React overlays live in `src/ui/components/**`.
- Phaser scenes and game logic live in:
  - `src/game/scenes/**`
  - `src/game/main.ts`
- Zustand store (`src/store/useGameStore.ts`) is the integration boundary between Phaser and React.
- App bootstrapping happens in `src/main.tsx`, and Phaser is managed from `src/game/scenes/UIScene.ts`.

## Scope and Non-Goals

### In scope

- Add i18n infrastructure (`i18next`, `react-i18next`, language detector).
- Localize React overlay text.
- Localize game-generated user-facing messages.
- Support runtime language switching with clean scene/listener lifecycle handling.

### Out of scope (initial rollout)

- Full localization of texture atlases and every sprite asset.
- Broad refactors of gameplay architecture not required for i18n.

---

## Phase 0 — Requirements Lock

1. Confirm first locale set (**initial rollout**: `en`, `uk`).
2. Define translation key conventions:
   - `ui.*` for overlay labels/actions
   - `game.*` for gameplay-driven messages
   - `auth.*` for profile/login copy
   - `errors.*` for validation/errors
3. Define fallback policy:
   - Locale fallback chain (e.g., `uk-UA -> uk -> en`)
   - Missing-key behavior in development vs production

---

## Phase 1 — Infrastructure Setup

1. Install dependencies:
   - `i18next`
   - `react-i18next`
   - `i18next-browser-languagedetector`
2. Add localization resources:
   - `src/assets/locales/en/translation.json`
   - `src/assets/locales/uk/translation.json`
3. Add i18n bootstrap file:
   - `src/i18n/config.ts`
4. Initialize i18n before React render in `src/main.tsx`.

### Config recommendations

- `fallbackLng: 'en'`
- `returnNull: false`
- `interpolation.escapeValue: false`
- Dev-only diagnostics for missing keys
- Language detection and local persistence via detector plugin

---

## Phase 2 — React Overlay Localization

Migrate hardcoded UI strings in:

- `src/ui/components/HUDOverlay/index.tsx`
- `src/ui/components/HomeOverlay/index.tsx`
- `src/ui/components/PauseOverlay/index.tsx`
- `src/ui/components/GameOverOverlay/index.tsx`
- `src/ui/components/MenuControls/MenuList.tsx`
- `src/ui/components/LoginOverlay/index.tsx`
- `src/ui/components/ProfileSelector/index.tsx`
- `src/ui/components/StageMessageOverlay/index.tsx`

Implementation notes:

- Use `useTranslation()` in overlay components.
- Preserve atomic Zustand selectors as-is; avoid store shape churn for pure labels.
- Add a language selector entry in menu controls (or home screen controls) for runtime switching.
- Update the Select Profile form to include a **Select language** control and default it to **EN** on first load.
- Update root direction (`document.documentElement.dir`) from `i18n.dir()` on language change.

---

## Phase 3 — Phaser/Game-Domain Localization Bridge

1. Add a lightweight bridge module:
   - `src/i18n/phaserBridge.ts`
2. Provide:
   - translation helper for non-React code
   - language change subscription helper with explicit cleanup contracts
3. Keep scene lifecycle safe:
   - register language listeners in scene setup
   - detach on `Phaser.Scenes.Events.SHUTDOWN`

### Important repo-specific rule

Do not move gameplay state ownership out of `src/game/main.ts`.  
Only localize user-facing strings and message formatting.

### Suggested data-shape adjustment

For stage/streak messages, store structured payloads (`lives`, `streak`, `stage`) and format display strings at render time with translation keys. Avoid persisting prebuilt English sentences in store state.

---

## Phase 4 — Fonts, Layout Resilience, and Optional Localized Assets

1. Expand boot readiness flow in `src/game/scenes/BootScene.ts` to include locale-appropriate font readiness (in addition to existing font gate).
2. Ensure long-string resilience:
   - word wrapping for constrained text blocks
   - layout-safe button/label containers
3. Add optional localized asset resolver conventions:
   - deterministic texture key naming per locale
   - fallback to base/default asset

---

## Phase 5 — Testing, Storybook, and QA

### Unit/integration coverage

- React tests:
  - switching language rerenders translated copy
  - interpolation/pluralization correctness
  - fallback language behavior
- Phaser/store tests:
  - scene listeners attach/detach cleanly
  - localized gameplay messages reflect payload values

### Storybook coverage

- Update stories for changed components.
- Provide locale variants for both initial locales (`en` and `uk`).

### Validation commands

- `npm run test:react`
- `npm run test:phaser`
- `npm run lint`
- `npm run typecheck`

---

## Improvements and Missing Parts to Include

1. **Typed translation keys**  
   Add compile-time key safety to avoid runtime key typos.

2. **Pluralization standard**  
   Define plural key conventions (`*_one`, `*_other`) and enforce them.

3. **Pseudo-localization**  
   Add an `en-XA` pseudo locale early to catch overflow/truncation issues.

4. **Observability for missing translations**  
   Dev-mode warning pipeline for missing keys/namespaces.

5. **Formatting policy**  
   Standardize locale-aware number/date formatting via `Intl`.

6. **Persistence boundary discipline**  
   Keep localization persistence independent from gameplay/profile persistence unless product requirements explicitly change.

7. **RTL readiness checklist**  
   Add explicit overlay and Phaser alignment checks if RTL locales are introduced.

---

## Delivery Strategy

Recommended rollout in 2 PRs:

1. **PR 1:** Infrastructure + React overlay localization + tests/stories updates
2. **PR 2:** Phaser bridge + gameplay message localization + optional font/asset hooks

This sequencing minimizes risk while delivering user-visible localization early.
