/* eslint-env node */
require('v8-compile-cache')

const path = require('path')
const fs = require('fs')

const isCI = require('is-ci')

const paths = require('./lib/package-paths')

const ignorePatterns = [
  '/node_modules/',
  '<rootDir>/dist/',
  '<rootDir>/build/',
  '<rootDir>/.build/',
]

module.exports = {
  maxWorkers: isCI ? 3 : '100%',

  resolver: require.resolve('jest-svelte-resolver'),

  testMatch: [
    '<rootDir>/src/**/__tests__/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [...ignorePatterns, '/__fixtures__/', '/__mocks__/', '/__preview__/'],

  modulePathIgnorePatterns: ignorePatterns,

  setupFilesAfterEnv: [
    require.resolve('jest-extended'),
    require.resolve('@testing-library/jest-dom'),
    fs.existsSync(path.join(paths.root, 'jest.setup.js')) && path.join(paths.root, 'jest.setup.js'),
  ].filter(Boolean),

  // The test environment that will be used for testing
  testEnvironment: require.resolve('./jest/enviroment'),

  moduleFileExtensions: ['cjs', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'json', 'node'],

  // Ignore all file in node_modules except for:
  // - *.svelte, *.mjs, *.jsx, *.ts, *.tsx
  // - files within **/src/
  // TODO configurable modules to transform
  transformIgnorePatterns: ['/node_modules/(?!.+.(?:svelte|mjs|jsx|tsx?)$|.+/src/|lodash-es|@smui|@material|svelte-awesome/)'],

  transform: {
    '^.+\\.([mc]js|[jt]sx?)$': require.resolve('./jest/transform-esbuild.js'),

    '^.+\\.svelte$': [
      require.resolve('svelte-jester'),
      { preprocess: true, compilerOptions: { css: false } },
    ],

    // Asset module declarations
    // keep in sync with types/assets.d.ts
    '^.+\\.module\\.(css|scss|less)$': require.resolve('./jest/transform-identity-object-proxy'),
    '^.+\\.(css|scss|less|jpg|jpeg|png|gif|ico|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve(
      './jest/transform-filename',
    ),
  },

  bail: false,
  verbose: true,
}
