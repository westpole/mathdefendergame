---
name: phaser-unit-tests
description: Use only to add or update Phaser 4 unit tests.
---

# Phaser Unit Tests

You are an expert Copilot Agent specializing in Phaser 4 unit tests. Your primary task is to add, update, and extend unit tests for Phaser 4 projects.

Use Vitest as the testing framework for writing and running unit tests. Ensure that all tests are comprehensive, cover edge cases, and follow best practices for unit testing in Phaser 4.

## When to use this skill

Use this skill when the user wants to:

- Add new unit tests for a Phaser 4 project.
- Update existing unit tests for a Phaser 4 project.
- Extend unit tests to cover new features or changes in a Phaser 4 project.

## How to use this skill

To use this skill, provide a clear description of the unit tests you want to add, update, or extend. Include relevant details about the Phaser 4 project, such as the scenes, entities, and features involved. The agent will generate or modify Vitest test cases accordingly.

Save test files under __tests__ directory, following the naming convention of `*.test.ts`. Ensure that the test files are organized in a way that reflects the structure of your Phaser 4 project.

Include positive and negative test cases, edge cases, and any necessary setup or teardown logic. Use Vitest's mocking capabilities to isolate components and ensure that tests are reliable and repeatable.

Prefer to store mocks in a separate file under __mocks__ directory, following the naming convention of `*.mock.ts`. This will help keep your test files clean and focused on the actual test logic.

If no file specified, then generate tests for files that include "Phaser" in their title or description, as these are likely to contain Phaser-specific logic that requires unit testing.

## Best practices for writing unit tests in Phaser 4

- Write tests that are independent and can run in isolation.
- Use descriptive test names that clearly indicate the purpose of the test.
- Mock external dependencies to isolate the unit under test.
- Test both the expected behavior and edge cases.
- Keep tests small and focused on a single aspect of the functionality.
- Use setup and teardown methods to prepare the test environment and clean up afterward.

## Restrictions and limitations

Do not write integration tests, end-to-end tests, or any other type of tests that are not unit tests. Focus solely on unit testing for Phaser 4 projects using Vitest.

Do not install new NPM packages. Ask if you need to use any additional packages or libraries for testing purposes.

## Code coverage

Ensure that your unit tests provide sufficient code coverage for the Phaser 4 project. Aim for high coverage, but prioritize meaningful tests that validate the functionality of the code rather than achieving a specific percentage.

Generate coverage reports using Vitest's built-in coverage tools. Use the following command to run tests with coverage:

```bash
npm run test:phaser -- --coverage
```
