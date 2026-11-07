/**
 * Registers the `@testing-library/jest-dom` matchers with Vitest 5's types.
 *
 * jest-dom 7.0.1 augments `Assertion<T>` in `vitest`, but Vitest 5 changed that
 * interface to `Assertion<R, T>`. Merged interfaces must declare identical type
 * parameters, so jest-dom's augmentation is dropped and matchers such as
 * `toBeInTheDocument` stop type-checking. Vitest 5 merges `Matchers<R, T>` into
 * both `Assertion` and the asymmetric matchers, so augmenting it here restores
 * them. The runtime matchers are still registered in `vitest-react.setup.ts`.
 *
 * Remove this file once jest-dom publishes Vitest 5 compatible types.
 */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // Interface merging needs Vitest's exact type parameters (including the unused `T`)
  // and an empty body, so these two rules cannot be satisfied here.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<unknown, R> {}
}
