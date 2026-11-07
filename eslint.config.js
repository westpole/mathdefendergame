// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
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
      ...eslintReact.configs['recommended-typescript'].plugins,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      // React rules
      ...eslintReact.configs['recommended-typescript'].rules,

      // eslint-plugin-react-hooks owns hook rules; turn off the @eslint-react duplicates
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/error-boundaries': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-render': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/use-memo': 'off',

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
