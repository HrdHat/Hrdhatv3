import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import unusedImports from 'eslint-plugin-unused-imports'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sonarjs from 'eslint-plugin-sonarjs'
import perfectionist from 'eslint-plugin-perfectionist'
import security from 'eslint-plugin-security'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint.plugin,
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      'sonarjs': sonarjs,
      'perfectionist': perfectionist,
      'security': security,
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'objectLiteralProperty', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        {
          selector: 'function',
          modifiers: ['exported'],
          format: ['camelCase', 'PascalCase'],
          custom: {
            regex: '^(use[A-Z][a-zA-Z0-9]*)|([A-Z][a-zA-Z0-9]*)$',
            match: true,
          },
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase', 'UPPER_CASE', 'camelCase'],
          custom: {
            regex: '^(is|has|should|can)[A-Z]',
            match: true,
          },
        },
      ],
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k'] }],
    },
  },
]
