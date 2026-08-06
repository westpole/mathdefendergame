// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // Ignore build outputs and dependencies
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'storybook-static/**',
      'reports/**',
      'electron/**',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React and TypeScript specific configuration
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types': 'off', // TypeScript handles this

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // React Refresh (Vite HMR)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },

  // Phaser-specific adjustments
  {
    files: ['src/game/**/*.ts'],
    rules: {
      // Phaser often uses classes with public fields
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // Allow unused class members for Phaser lifecycle methods
          caughtErrors: 'none',
        },
      ],
      // Phaser uses 'this' extensively in scene classes
      '@typescript-eslint/no-this-alias': 'off',
    },
  },

  // Storybook files
  {
    files: ['src/**/*.stories.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // E2E test files (Playwright)
  {
    files: ['e2e/**/*.ts'],
    rules: {
      // Playwright fixtures often use empty object destructuring
      'no-empty-pattern': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
