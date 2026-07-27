---
name: react-frontend-zustand-expert
description: Guidelines for building, refactoring, and optimizing client-side-only React applications (Vite/CRA) using Zustand for state management.
---

# React Front-End Expert Skill (Zustand Edition)

Use this skill when developing client-side-only React applications utilizing Zustand. Do NOT apply these rules to server-side rendering (SSR) frameworks.

## 1. Core Component Architecture

- **Functional Components**: Write all components as functional components using explicit `const Component = () => {}` syntax.
- **Strict Typing**: Use TypeScript `interface` for props. Avoid `React.FC` to keep generic parameters clean.
- **File Structure**: Enforce one component per file. Group features and global state logically.

## 2. Zustand State Management Standards

- **Atomic Selectors**: Always use explicit, atomic selectors when extracting state or actions from a store to prevent unnecessary re-renders.
  - *Correct*: `const user = useAuthStore((state) => state.user)`
  - *Incorrect*: `const { user } = useAuthStore()` (triggers re-renders on any store update)
- **Action Separation**: Define actions alongside state inside the store object to keep mutators close to the data, or use a standalone `actions` object.
- **Immer Integration**: For complex, nested store objects, wrap the store recipe in `immer` middleware to allow safe mutation syntax.
- **State Persistence**: Wrap stores that need to survive page refreshes (e.g., user preferences, UI theme, non-sensitive settings) in the `persist` middleware with a clear storage key. **Never persist authentication tokens, session tokens, or other secrets to `localStorage`** — they are vulnerable to XSS theft (OWASP A02/A07). Tokens must be held in memory only.
- **Resetting State**: Provide a clear `reset()` action in every store to easily wipe data on user logout or session cleanup.

## 3. Local vs. Global State Boundaries

- **Keep Local State Local**: Use standard `useState` for UI-only variables (e.g., dropdown toggle states, modal visibility, form draft inputs) that do not need to be shared globally.
- **Derived State**: Do not sync store state into local `useState`. Compute derived values directly in the component, wrapping them in `useMemo` if the calculation is heavy.

## 4. Performance & Rendering

- **Dependency Arrays**: Maintain perfect accuracy in `useEffect`, `useCallback`, and `useMemo` dependency arrays. Never skip or fake dependencies.
- **No Effects for Fetching**: Do not fetch data inside bare `useEffect` blocks. Combine Zustand with a dedicated client-side cache library like TanStack Query (React Query) for API states.
- **Code Splitting**: Utilize `React.lazy` and `Suspense` to split code at the route level to minimize the initial bundle payload.
- **List Keys**: Never use array indices or the item's string content as `key` props for dynamic lists. Use stable, unique identifier strings (`item.id`). String content keys break reconciliation when items are reordered or deduplicated.
- **Memoization**: Apply `React.memo` to components that receive stable props but re-render due to a parent update. Use `useCallback` to stabilize event handler references passed as props. Reserve `useMemo` for genuinely expensive derivations — do not apply it prematurely.

## 5. Security Standards

- **No `dangerouslySetInnerHTML`**: Never use `dangerouslySetInnerHTML` with any user-controlled or externally sourced string. React's JSX escapes text nodes automatically — rely on that instead.
- **Input Sanitization**: Validate and sanitize all user-supplied input at the point of collection, before it reaches the store or any display path. Apply a whitelist regex where possible:
  ```tsx
  const SAFE_NAME = /^[a-zA-Z0-9 \-_]{1,20}$/;
  const isValid = SAFE_NAME.test(name);
  ```
- **`maxLength` Is Not Enough**: The HTML `maxLength` attribute can be bypassed via DevTools or programmatic input. Always enforce length limits in code as well (`value.slice(0, MAX)` or store-level validation).
- **localStorage Is Public**: Any data written to `localStorage` (via `persist` or directly) is readable and writable by any JavaScript on the page and by the user. Treat it as untrusted on read. Never store secrets, tokens, or integrity-critical data there.
- **No `eval` / `Function` Constructor**: Never use `eval()`, `new Function()`, or `setTimeout`/`setInterval` with string arguments. These open code-injection vectors.
- **Avoid Prototype Pollution**: When merging or spreading user-provided objects into store state, validate keys are not `__proto__`, `constructor`, or `prototype`.

## 6. Accessibility (a11y)

- **Semantic HTML**: Use the correct element for the job (`<button>` for actions, `<a>` for navigation, `<ul>`/`<li>` for lists). Avoid click handlers on `<div>` or `<span>`.
- **Keyboard Navigation**: Every interactive element must be reachable and operable via keyboard. Custom interactive elements (e.g., `<li>` acting as a tab) need `tabIndex`, `role`, `aria-selected`, and `onKeyDown` handlers for `Enter`/`Space`:
  ```tsx
  <li
    role="tab"
    tabIndex={isActive ? 0 : -1}
    aria-selected={isActive}
    onClick={() => setActive(tab)}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(tab)}
  >
  ```
- **ARIA Attributes**: Add `aria-label` or `aria-labelledby` to interactive controls that lack visible text. Associate `<label>` with inputs via `htmlFor`/`id`.
- **Focus Management in Modals**: When a modal or overlay opens, move focus to the first focusable element inside it. Trap focus within the modal while it is open. Return focus to the trigger element on close.
- **Color Is Not the Only Indicator**: Never rely solely on color to communicate state (e.g., error, success). Pair color with text, icons, or patterns.

## 7. Styling Standards

- **SCSS Files**: Write all component styles in dedicated SCSS files co-located with the component. Use the pattern `ComponentName.module.scss` to ensure scoped styles via CSS modules.
  ```
  ComponentName.tsx
  ComponentName.module.scss
  ComponentName.stories.tsx
  ```
- **No Inline Styles**: Avoid the `style` prop entirely. Inline styles bypass the cascade, defeat theming, increase bundle size, and make testing harder. Use class composition instead.
  - *Incorrect*: `<div style={{ color: 'red', fontSize: '16px' }}>`
  - *Correct*: `<div className={styles.errorMessage}>`
- **BEM Methodology**: Follow the Block-Element-Modifier naming convention to keep class names predictable and maintainable.
  - **Block**: The root component class (`.game-hud`)
  - **Element**: A child within the block (`.game-hud__score`, `.game-hud__lives`)
  - **Modifier**: A variant or state flag (`.game-hud--hidden`, `.game-hud__score--critical`)
  - Use double underscores (`__`) to separate block from element, double hyphens (`--`) to separate modifier.
  ```scss
  .game-hud {
    display: flex;
    &__score { font-size: 2rem; }
    &__lives { color: green; }
    &--hidden { visibility: hidden; }
    &__score--critical { color: red; }
  }
  ```
- **clsx for Dynamic Classes**: Use the `clsx` utility to compose class names based on state or props. Never build class strings manually with template literals or ternaries.
  ```tsx
  import clsx from 'clsx';
  import styles from './GameHUD.module.scss';

  <div className={clsx(styles['game-hud'], isHidden && styles['game-hud--hidden'])}>
    <span className={clsx(
      styles['game-hud__score'],
      isCritical && styles['game-hud__score--critical']
    )}>
      {score}
    </span>
  </div>
  ```
- **Global Styles in `styles/`**: Reserve `src/ui/styles/` for true globals (CSS resets, typography baseline, design tokens). Component-specific styles belong next to the component.
- **Design Tokens**: Define color palettes, spacing scales, and typography in SCSS variables or CSS custom properties at the root. Import them into component SCSS files:
  ```scss
  @use '@/ui/styles/tokens' as *;
  .button { background-color: $color-primary; padding: $space-md; }
  ```
- **Avoid Deep Nesting**: Keep SCSS nesting shallow (max 2-3 levels). Deep nesting increases specificity and makes overrides painful.
- **One Responsibility per Class**: Each class should do one job. Compose multiple single-purpose classes with `clsx` rather than creating monolithic utility classes.

## 8. Error Boundaries

- **Wrap UI Regions**: Wrap independent UI regions in `ErrorBoundary` components (e.g., `react-error-boundary`) so a single component crash does not take down the entire overlay layer.
- **Placement**: Place boundaries at the top of the overlay tree in `App.tsx` and around any dynamically loaded (`React.lazy`) sections.
  ```tsx
  import { ErrorBoundary } from 'react-error-boundary';

  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <GameUI />
  </ErrorBoundary>
  ```
- **Fallback UI**: Always provide a minimal, user-friendly `FallbackComponent` — never show a raw error stack in production.

## 9. Verification Checklist

Before completing any task, verify the code against these constraints:
1. Did you use atomic selectors for all Zustand store consumption to avoid render loops?
2. Does the store explicitly type its state and action interface?
3. Are authentication tokens or other secrets absent from `localStorage` / `persist` middleware?
4. Is all user-supplied input validated with a whitelist pattern before entering the store or being rendered?
5. Are all interactive elements keyboard-accessible with correct ARIA roles?
6. Are Error Boundaries in place for critical UI regions?
7. Does the component render without throwing warnings in `React.StrictMode`?
8. Are all styles in SCSS module files following BEM methodology, with no inline `style` props?
9. Are dynamic class names composed using `clsx` instead of template literals?
10. Run `npm run lint` to ensure zero compilation or type-checking errors.
