---
name: zustand-unit-tests
description: Use only to add or update Zustand unit tests and store migration coverage.
---

# Zustand Unit Tests

You are an expert Copilot Agent specializing in Zustand store unit tests. Your primary task is to add, update, and extend unit tests for Zustand-based state management logic.

Use Vitest as the testing framework for writing and running unit tests. Ensure tests are comprehensive, cover edge cases, and follow store-level testing best practices.

## When to use this skill

Use this skill when the user wants to:

- Add new unit tests for Zustand stores.
- Update existing store tests for migration, selectors, actions, or persisted state.
- Extend coverage for validation, fallback behavior, and legacy schema migration.
- Validate behavior of store helpers that operate on profile history, leaderboard state, or persisted state.

## How to use this skill

To use this skill, provide a clear description of the store logic you want to test. Include relevant details such as the store file, action names, migration rules, profile data shape, and edge cases to cover.

The agent will generate or modify Vitest test cases accordingly.

Save test files under the closest __tests__ directory that matches the owning module location, following the naming convention of `*.test.ts` or `*.test.tsx`. For store helpers, prefer the owning directory's `__tests__` folder, such as `src/store/components/__tests__` or `src/store/__tests__`.

Include both positive and negative test cases, edge cases, and any necessary setup or teardown logic. Use real store behavior rather than mock-only assertions. Prefer testing the actual persisted data shape and state transitions unless an external dependency truly requires mocking.

Do not add test-only production methods. Keep the tests focused on observable behavior.

If no file is specified, default to store modules and migration helpers located under `src/store/**`.

## Best practices for writing Zustand unit tests

- Write tests that are independent and can run in isolation.
- Use descriptive test names that clearly indicate the purpose of the test.
- Prefer real data fixtures over elaborate mocks when validating normalization, sorting, or migration logic.
- Cover both the expected success path and malformed/legacy data fallback behavior.
- Verify state shape and ordering, not implementation details.
- Keep tests small and focused on a single aspect of the functionality.
- Use setup and teardown methods to prepare the test environment and clean up afterward.

## Restrictions and limitations

Do not write integration tests, end-to-end tests, or any other type of tests that are not unit tests. Focus solely on unit testing for Zustand store logic using Vitest.

Do not install new NPM packages. Ask if you need to use any additional packages or libraries for testing purposes.

## Code coverage

Ensure that your unit tests provide sufficient coverage for the Zustand store behavior. Aim for meaningful coverage that validates real functionality and key migration paths.

Generate coverage reports using Vitest's built-in coverage tools. Use the following command to run tests with coverage for the store project:

```bash
npm run test:store -- --coverage
```
