---
name: storybook-zustand-expert
description: Guidelines for authoring Storybook (CSF 3) component stories while seamlessly mocking and seeding Zustand global application state.
---

# Storybook & Zustand Component Expert Skill

Use this skill when creating or refactoring Storybook files (`*.stories.tsx`) for components that consume global Zustand state, ensuring isolated, predictable UI renders without real side effects.

## 1. Story Format & Meta Configuration

- **Component Story Format 3 (CSF 3)**: Always use modern object-based CSF 3 syntax with `@storybook/react-vite` types (`Meta` and `StoryObj`). This project uses Vite — **never** import from `@storybook/react`.
- **`satisfies` over `as`**: Use `satisfies Meta<typeof Component>` (not `as Meta`) so TypeScript retains full inference on the meta object.
- **Autodocs**: Enable automatic documentation generation by adding `tags: ['autodocs']` to the default export.
- **Proper Meta Layout**:
  ```tsx
  import type { Meta, StoryObj } from '@storybook/react-vite';
  import { HUDOverlay } from '.';

  const meta = {
    title: 'Screens/HUDOverlay',
    component: HUDOverlay,
    tags: ['autodocs'],
    parameters: {
      layout: 'fullscreen',
    },
  } satisfies Meta<typeof HUDOverlay>;

  export default meta;
  type Story = StoryObj<typeof meta>;
  ```

## 2. Zustand State Seeding Architecture

This project uses a **single global store**: `useGameStore` from `src/store/useGameStore.ts`.

### Key principle: always reset before seeding

Stories share the same Zustand store instance. If a story sets `lives: 0` and the next story does not reset it, the leftover state bleeds through. The decorator **must** reset the store to a known baseline before applying story-specific overrides.

### Canonical Pattern: `args.initialState` + story decorator

Define state overrides as typed `args` on each story, then seed them inside a per-story decorator using `useGameStore.setState`. Do **not** use `syncHUD` for seeding — it performs a partial merge and cannot reset fields to their defaults.

**Story file:**
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useGameStore, GameStoreState } from '../../../store/useGameStore';
import { HUDOverlay } from '.';
import startGameMock from './__mocks__/start.json';

// Typed args interface prevents unsafe `as unknown as` casts in the decorator
interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/HUDOverlay',
  component: HUDOverlay,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) => {
      const { initialState } = context.args as StoryArgs;

      useEffect(() => {
        // Reset to baseline first, then apply story-specific overrides.
        // This prevents state bleed from previously rendered stories.
        useGameStore.setState((prev) => ({
          ...prev,
          phase: 'start',
          score: 0,
          lives: 10,
          shield: 5,
          stage: 1,
          stageScore: 0,
          correctCount: 0,
          incorrectCount: 0,
          finalPerfScore: 0,
          stageMessage: null,
          ...initialState,
        }));
      }, [initialState]);

      return <Story />;
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'HUD overlay on start',
  args: {
    initialState: startGameMock,
  },
};
```

### Store types to import

The store exports its own types — always import them directly rather than re-declaring:

```tsx
import {
  useGameStore,
  GameStoreState,    // full state shape
  OverlayPhase,      // 'booting' | 'start' | 'playing' | 'stage-message' | 'gameover'
  ScreenView,          // 'home' | 'profile' | 'rules'
  StageMessageState,
} from '../../../store/useGameStore';
```

## 3. Global Preview Configuration (`.storybook/preview.tsx`)

The global `preview.tsx` handles shared config only (controls matchers, a11y). **Do not add store decorators here** — store seeding belongs in individual story files where the required state is explicit and co-located with the story.

**Current project standard:**
```tsx
import type { Preview } from '@storybook/react-vite';
import '../src/ui/styles/index.scss'; // Use proper Vite type declarations, not @ts-ignore

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo', // change to 'error' to fail CI on a11y violations
    },
  },
};

export default preview;
```

> **Fix `@ts-ignore`:** The current `preview.tsx` uses `// @ts-ignore` to silence the CSS import. Remove it by ensuring `src/vite-env.d.ts` contains `/// <reference types=vite/client />` — this gives TypeScript the CSS module type declarations it needs.

## 4. Security & Type-Safety Rules

- **No `@ts-ignore`**: Suppresses real errors. Use proper type declarations or generics instead.
- **No `as unknown as T`**: Double-casting defeats TypeScript. Define a typed `interface StoryArgs` and cast only to that specific interface.
- **No cross-story state contamination**: Always reset the store to a known baseline in the decorator before applying story-specific state (see Section 2). Stories must be independently renderable in any order.
- **Never read runtime values in stories**: Mock all data with static JSON files in `__mocks__/`. Do not derive values from `localStorage`, `window`, or environment variables inside stories.
- **Keep `parameters` and `args` consistent**: Do not mix `parameters.initialState` in some stories and `args.initialState` in others within the same file. Use `args` exclusively — it is visible in the Storybook controls panel.

## 5. Interaction Testing with Mocked State

- **Assert UI, not store logic**: Use the `play` function to verify the component renders correctly in response to user interactions. Do not unit-test Zustand reducers — keep those in `*.test.ts` files.
- **Re-seed before each interaction test**: If the `play` function triggers state changes, reset via `useGameStore.setState(...)` inside a `beforeEach` (via `@storybook/test`) to guarantee a clean baseline.

## 6. Layout & Viewports

- **`'fullscreen'` layout**: Use for screens/overlays that fill the viewport (HUDOverlay, GameOverOverlay, HomeOverlay).
- **`'centered'` layout**: Use for small, isolated components (buttons, cards, badges) to avoid edge-to-edge stretching.

## 7. Mock Data Files

Store story fixtures in a `__mocks__/` folder alongside the component. Name files after the scenario they represent (e.g., `child.json`, `adult.json`, `inProgress.json`). Mock files should contain only the `Partial<GameStoreState>` fields relevant to that story — the decorator's reset logic fills in defaults for the rest.

## 8. Verification Checklist

Before completing the task, verify:
1. Does each story render correctly in isolation, without depending on another story having run first?
2. Are all type casts limited to a single typed `StoryArgs` interface — no `as unknown as` chains?
3. Is `@ts-ignore` absent from all story files and `preview.tsx`?
4. Are store types (`GameStoreState`, `OverlayPhase`, etc.) imported from `useGameStore` rather than redeclared?
5. Run `npm run build-storybook` to confirm zero build-time errors.
