require('@rushstack/eslint-patch/modern-module-resolution')

const path = require('path')
const pkgDirectory = require('pkg-dir').sync()

const pkg = require(path.join(pkgDirectory, 'package.json'))

module.exports = {
  extends: [
    'eslint:recommended',
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
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  env: {
    es2020: true,
    node: pkg.browser === false,
    browser: pkg.browser === true,
    'shared-node-browser': pkg.browser === undefined,
  },
  rules: {
    'require-atomic-updates': 'off',
    'func-names': 'off',

    // Disabled until optional chaining is supported
    'no-unused-expressions': 'off',
    'no-void': ['error', { allowAsStatement: true }],

    // Use function hoisting to improve code readability
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'default-case': ['error', { commentPattern: '^no default$' }],

    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^(?:_|ignore)',
        varsIgnorePattern: '^(?:_|ignore)',
        caughtErrorsIgnorePattern: '^(?:_|ignore)',
        vars: 'all',
        args: 'after-used',
        caughtErrors: 'all',
        ignoreRestSiblings: true,
      },
    ],

    'class-methods-use-this': 'off', // three words: "componentDidMount" :)
    'default-param-last': 'off', // infers with destructering defaults

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
        checkShorthandImports: 'internal',
        checkShorthandProperties: false,
        checkProperties: false,
        checkVariables: true,
        checkFilenames: true,
        extendDefaultWhitelist: true,
        whitelist: {
          pkg: true,
          arg: true,
          args: true,
          env: true,
          nodeEnv: true,
          ref: true,
          src: true,
          docs: true,
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
    'unicorn/catch-error-name': [
      'error',
      {
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'unicorn/no-fn-reference-in-iterator': 'off',

    'promise/param-names': 'error',
  },
  overrides: [
    {
      files: ['{CHANGELOG,CODE_OF_CONDUCT,CONTRIBUTING,README,TODO}.md'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        // TODO handle https://www.npmjs.com/package/@typescript-eslint/parser#parseroptionsproject
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint', 'eslint-plugin-tsdoc'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier/@typescript-eslint',
      ],
      rules: {
        'tsdoc/syntax': 'warn',

        // TypeScript's `noFallthroughCasesInSwitch` option is more robust (#6906)
        'default-case': 'off',
        // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/291)
        'no-dupe-class-members': 'off',
        // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/477)
        'no-undef': 'off',

        // TypeScript supports these features
        'prefer-object-spread': 'error',
        'no-useless-catch': 'error',

        // The rule is deprecated in ESLint and it doesn't fully make sense for TypeScript.
        'valid-jsdoc': 'off',

        // Disabled because of https://github.com/typescript-eslint/typescript-eslint/issues/60
        'no-redeclare': 'off',

        'import/named': 'off',
        'import/no-unresolved': 'off',

        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'warn',
        '@typescript-eslint/no-namespace': 'error',
        'no-use-before-define': 'off',

        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-empty-interface': [
          'error',
          {
            allowSingleExtends: true,
          },
        ],

        // Disabled because it's buggy. It transforms
        // `...(personalToken ? {Authorization: `token ${personalToken}`} : {})`
        // into
        // `...personalToken ? {Authorization: `token ${personalToken}`} : {}`
        // which is not valid.
        'no-extra-parens': 'off',

        // Makes no sense to allow type inferrence for expression parameters, but require typing the response
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          { allowExpressions: true, allowTypedFunctionExpressions: true },
        ],
        '@typescript-eslint/no-use-before-define': [
          'error',
          { functions: false, classes: true, variables: true, typedefs: true },
        ],

        // RATIONALE:         The "any" keyword disables static type checking, the main benefit of using TypeScript.
        //                    This rule should be suppressed only in very special cases such as JSON.stringify()
        //                    where the type really can be anything.  Even if the type is flexible, another type
        //                    may be more appropriate such as "unknown", "{}", or "Record<k,V>".
        '@typescript-eslint/no-explicit-any': 'error',

        // RATIONALE:         Catches a common coding mistake.
        '@typescript-eslint/no-for-in-array': 'error',

        // RATIONALE:         Parameter properties provide a shorthand such as "constructor(public title: string)"
        //                    that avoids the effort of declaring "title" as a field.  This TypeScript feature makes
        //                    code easier to write, but arguably sacrifices readability:  In the notes for
        //                    "@typescript-eslint/member-ordering" we pointed out that fields are central to
        //                    a class's design, so we wouldn't want to bury them in a constructor signature
        //                    just to save some typing.
        '@typescript-eslint/no-parameter-properties': 'error',

        // RATIONALE:         When left in shipping code, unused variables often indicate a mistake.  Dead code
        //                    may impact performance.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^(?:_|ignore)',
            varsIgnorePattern: '^(?:_|ignore)',
            caughtErrorsIgnorePattern: '^(?:_|ignore)',
            vars: 'all',
            args: 'after-used',
            caughtErrors: 'all',
            ignoreRestSiblings: true,
          },
        ],

        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',

        '@typescript-eslint/typedef': [
          'error',
          {
            arrayDestructuring: false,
            arrowParameter: false,
            memberVariableDeclaration: false,
            parameter: false,
            objectDestructuring: false,
            propertyDeclaration: true,
            variableDeclaration: false,
          },
        ],

        '@typescript-eslint/ban-types': [
          'error',
          {
            types: {
              String: {
                message: 'Use `string` instead.',
                fixWith: 'string',
              },
              Number: {
                message: 'Use `number` instead.',
                fixWith: 'number',
              },
              Boolean: {
                message: 'Use `boolean` instead.',
                fixWith: 'boolean',
              },
              Symbol: {
                message: 'Use `symbol` instead.',
                fixWith: 'symbol',
              },
              Object: {
                message: 'Use `object` instead.',
                fixWith: 'object',
              },
              object: 'Use `{}` instead.',
              Function: 'Use a specific function type instead, like `() => void`.',
            },
          },
        ],

        '@typescript-eslint/consistent-type-assertions': [
          'error',
          {
            assertionStyle: 'as',
            objectLiteralTypeAssertions: 'allow-as-parameter',
          },
        ],

        // Disabled because it's not fully usable yet:
        // https://github.com/typescript-eslint/typescript-eslint/issues/142
        // '@typescript-eslint/consistent-type-definitions': [
        // 	'error',
        // 	'type'
        // ],

        '@typescript-eslint/unified-signatures': 'error',

        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: [
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
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
      rules: {
        'jest/no-large-snapshots': ['warn', { maxSize: 300 }],
        'jest/prefer-strict-equal': 'warn',
      },
    },
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/*.ts',
        '**/__tests__/*.tsx',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      files: [
        '**/__generated__/*.js',
        '**/__generated__/*.jsx',
        '**/__generated__/*.ts',
        '**/__generated__/*.tsx',
      ],
      rules: {
        'eslint-comments/disable-enable-pair': 'off',
        'eslint-comments/no-unlimited-disable': 'off',
        'unicorn/no-abusive-eslint-disable': 'off',
      },
    },
    {
      files: ['**/*.config.js', '**/*.setup.js', '**/package-scripts.js'],
      env: {
        node: true,
      },
      rules: {
        'unicorn/prevent-abbreviations': [
          'error',
          {
            checkFilenames: false,
          },
        ],
      },
    },
  ],
}
