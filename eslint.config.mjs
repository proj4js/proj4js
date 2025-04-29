import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default [
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    quoteProps: 'as-needed',
    semi: true,
    braceStyle: '1tbs',
    commaDangle: 'never'
  }),
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      curly: 'error',
      eqeqeq: 'error',
      'no-use-before-define': ['error', { functions: false }],
      'no-undef': 'error',
      'no-unused-vars': 'error'
    }
  },
  { files: ['test/**/*.js', 'test/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        ...globals.amd
      }
    }
  }
];
