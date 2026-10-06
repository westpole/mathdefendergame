---
name: react-unit-tests
description: Skill for unit testing React components.
---

# React Unit Tests

This skill focuses on writing and maintaining unit tests for React components using popular testing libraries such as Jest and React Testing Library. It helps ensure that individual components function correctly in isolation.

## Key Concepts

- **Unit Testing**: Testing individual components or functions in isolation.
- **Jest**: A JavaScript testing framework commonly used for React applications.
- **React Testing Library**: A library for testing React components by simulating user interactions and verifying component behavior.
- **Feature Flags**: Conditional logic in components that enables or disables features based on specific flags, often used for gradual rollouts or A/B testing. See src/shared/README.md for implementation guidelines.

## Best Practices

- Write tests for each component's functionality and edge cases.
- Keep tests isolated and independent from each other.
- Use descriptive test names to clearly convey the purpose of each test.
- Mock external dependencies to focus on the component being tested. Save mocks under `__mocks__` directory.
- Regularly run tests to catch regressions early.
- Aim for high test coverage to ensure most of the code is tested.
- Review and update tests regularly to keep them relevant as the code evolves.
- Continuously integrate tests into the development workflow to catch issues early and maintain code quality.

## Verification

To verify the effectiveness of your React unit tests:

- Ensure all tests pass successfully.
- Check code coverage reports to confirm that critical paths are tested.
- Review test cases to ensure they cover edge cases and potential failure scenarios. Add happy and failure path tests as needed.
- Run `npm run test:react` to execute the React unit tests and verify their effectiveness.
- Run `npm run test:all:coverage` to validate that test coverage did not decrease.
