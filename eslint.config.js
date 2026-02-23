import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      '**/dist/**',
      'packages/**/docs/**',
      'packages/**/test.html',
      'packages/**/test-suite.html',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        gsap: 'readonly',
        Draggable: 'readonly',
        InertiaPlugin: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'no-undef': 'error',
      'no-var': 'error',
      'no-shadow': 'warn',
      'no-use-before-define': ['error', { functions: false }],
      eqeqeq: ['error', 'always'],
      'prefer-const': [
        'error',
        {
          destructuring: 'any',
          ignoreReadBeforeAssign: true,
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      'no-undef': 'off',
      'no-console': 'off',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': [
        'error',
        {
          destructuring: 'any',
          ignoreReadBeforeAssign: true,
        },
      ],
    },
  },
];
