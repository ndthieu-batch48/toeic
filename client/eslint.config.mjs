import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import unicornPlugin from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended, // ESLint core rules
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FileReader: 'readonly',
        IntersectionObserver: 'readonly',
        // Node globals
        process: 'readonly',
        global: 'readonly',
        // Test globals
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      prettier: prettierPlugin,
      'unused-imports': unusedImportsPlugin,
      unicorn: unicornPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,

      // Turn off conflicting rules
      'no-unused-vars': 'off', // conflicts with unused-imports
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Turn off if you don't want to use PropTypes

      // Auto-fixable rules
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'no-useless-escape': 'error',
      'no-dupe-keys': 'error',
      'react/jsx-closing-bracket-location': ['error', 'tag-aligned'],

      // Import sorting rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Built-in imports (come from NodeJS native) go first
            'external', // External imports go second
            'internal', // Internal imports (absolute imports from your app)
            ['parent', 'sibling'], // Relative imports go last
            'index', // Index imports go last
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/named': 'error',

      // Plugin rules
      'unicorn/no-console-spaces': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'prettier/prettier': 'error', // Prettier
    },
  },
  prettierConfig, // Apply prettier config LAST to override conflicting rules
  {
    ignores: ['node_modules/', 'dist/', 'build/'],
  },
];
