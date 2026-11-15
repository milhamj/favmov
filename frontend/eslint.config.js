const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expo,
  prettier,
  { ignores: ['dist/**', '.expo/**', 'node_modules/**', 'patches/**'] },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'error', 'no-console': 'error' },
  },
  {
    files: ['**/__tests__/**', 'test/**', 'jest.setup.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
