---
name: file-organization
description: Project-wide rules for organizing types, constants, and utilities across React, Zustand, and Phaser with Copilot-friendly JSDoc conventions.
---

# Project File Organization Skill

Use this skill when creating or refactoring files anywhere in the project, including React UI code, Zustand stores, Phaser gameplay code, shared modules, and tests.

## Goals

- Keep project code easy to navigate by separating types, constants, and utilities.
- Promote shared domain reuse via `src/shared` when code is not store-specific.
- Improve Copilot context quality by requiring complete JSDoc on functions.

## 1. Types and Interfaces

- Keep interfaces and types in a dedicated `types.ts` file at the same folder level as the requesting file.
- Do not define reusable domain types in local feature `types.ts` files.
- If a type is reusable across game, UI, platform, store, or tests, move it to `src/shared/types.ts`.
- Import shared types with project aliases when available (example: `@shared/types`).

Decision rule:
- Feature-only type -> local `types.ts`.
- Cross-layer reusable type -> `src/shared/types.ts`.

## 2. Constants and Static Values

- Keep constants and static values in `consts.ts` at the same folder level as the requesting file.
- If a constant is reusable across layers, place it in `src/shared/consts.ts`.
- Keep runtime literals out of store/action files when they can be named and centralized.
- Group related constants and export them as named exports.

Decision rule:
- Feature-only constant -> local `consts.ts`.
- Cross-layer reusable constant -> `src/shared/consts.ts`.

## 3. Utility Function Placement

- Put reusable utility functions that belong to a module area in `utilities.ts` at the same folder level.
- Put specific, single-purpose utility functions in dedicated one-function files under a `utilities/` folder.
- Use one exported function per file in `utilities/<functionName>.ts`.
- Keep utility functions pure unless there is a strong reason not to.

Decision rule:
- Broadly reused within a module -> `utilities.ts`.
- Highly specific helper or function needing isolated tests/imports -> `utilities/<name>.ts`.

Framework scope:
- React components and hooks follow the same utility split.
- Zustand stores keep state/actions in the store file and move helper logic into utilities.
- Phaser scenes and gameplay modules keep rendering/scene flow local and move reusable helper logic into utilities.

## 4. JSDoc Requirements for Copilot

Add JSDoc to every function (including exported and internal helpers) so Copilot has clear intent and contract metadata.

Minimum required tags:
- Summary line describing behavior and intent.
- `@param` for each parameter.
- `@returns` describing output.
- `@throws` when function may throw.
- `@example` for non-trivial behavior.

Template:

```ts
/**
 * Brief summary of what the function does and why.
 *
 * @param input - What this parameter represents.
 * @returns What the function returns.
 * @throws Error when input is invalid.
 * @example
 * const result = doThing('value');
 */
export function doThing(input: string): string {
  if (!input) {
    throw new Error('Input is required.');
  }

  return input.trim();
}
```

## 5. Naming and Import Rules

- Prefer explicit names: `consts.ts`, `types.ts`, `utilities.ts`, and `utilities/<name>.ts`.
- Keep imports type-only where applicable: `import type { X } from './types';`.
- Avoid cyclic dependencies between `types.ts`, `consts.ts`, and utility files.
- Keep feature entry files focused on orchestration, not helper implementation details.

Layer-specific note:
- React files should focus on rendering and event wiring.
- Zustand store files should focus on state shape and actions.
- Phaser scene/game files should focus on lifecycle, input, rendering, and gameplay flow.

## 6. Refactor Checklist

Before finishing any project change:
1. Did all local interfaces/types move into sibling `types.ts`?
2. Did all static values move into sibling `consts.ts`?
3. Did reusable cross-layer types/constants move into `src/shared/types.ts` and `src/shared/consts.ts`?
4. Are general reusable helpers in sibling `utilities.ts`?
5. Are one-off helpers split into one-function files inside `utilities/`?
6. Does every function include complete JSDoc for Copilot?
7. Are imports clean, type-safe, and cycle-free?

## 7. React, Zustand, Phaser Mapping

- React:
  - Place component/hook-specific types in sibling `types.ts`.
  - Place UI constants in sibling `consts.ts`.
  - Place UI helpers in sibling `utilities.ts` or `utilities/<name>.ts`.
- Zustand:
  - Place store-only interfaces/actions in sibling `types.ts`.
  - Place store constants (keys, limits, defaults) in sibling `consts.ts`.
  - Place selectors/normalizers/sorting/validation helpers in utilities files.
- Phaser:
  - Place scene/gameplay module types in sibling `types.ts`.
  - Place gameplay tuning constants in sibling `consts.ts`.
  - Place math/spawn/format helpers in utilities files.

## 8. Migration Notes (Existing Repos)

When a repository currently uses different names (for example `const.ts`), keep behavior unchanged during migration and perform a focused rename in a separate change to avoid regressions.
