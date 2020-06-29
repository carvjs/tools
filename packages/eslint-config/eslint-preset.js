require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  extends: [
    'xo/esnext',
    'xo/browser',
    'plugin:unicorn/recommended',
    'plugin:promise/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:no-use-extend-native/recommended',
    'prettier',
    'prettier/unicorn',
  ],
  plugins: [
    // Disabled until preprocess is supported: https://github.com/sveltejs/eslint-plugin-svelte3/pull/62
    // 'svelte3'
  ],
  rules: {
    // Disabled until optional chaining is supported
    'no-unused-expressions': 'off',

    'unicorn/no-null': 'off',
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
      },
    ],
    'unicorn/prevent-abbreviations': [
      'error',
      {
        whitelist: {
          src: true,
          pkg: true,
        },
      },
    ],
    // The character class sorting is a bit buggy at the moment.
    'unicorn/better-regex': [
      'error',
      {
        sortCharacterClasses: false,
      },
    ],
    'promise/param-names': 'error',
  },
  overrides: [
    // Disabled until preprocess is supported: https://github.com/sveltejs/eslint-plugin-svelte3/pull/62
    // {
    //   files: ['**/*.svelte'],
    //   processor: 'svelte3/svelte3',
    //   rules: {
    //     'import/no-mutable-exports': 'off',
    //     'import/no-duplicates': 'off',
    //     'import/no-unresolved': 'off',
    //     'import/imports-first': 'off',
    //     'import/first': 'off',
    //     'css-rcurlyexpected': 'off',
    //   },
    // },
    {
      files: [
        '**/*.test.js',
        '**/*.spec.jsx',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/__tests__/*.js',
        '**/__tests__/*.jsx',
        '**/__tests__/*.ts',
        '**/__tests__/*.tsx',
      ],
      extends: [
        'plugin:jest/recommended',
        'plugin:jest/style',
        'plugin:jest-dom/recommended',
        'plugin:testing-library/recommended',
      ],
    },
    {
      files: ['./*.config.js', './package-scripts.js'],
      env: {
        node: true,
      },
    },
  ],
}
