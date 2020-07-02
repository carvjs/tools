const fs = require('fs')

const isCI = require('is-ci')

const ignorePatterns = [
  '/node_modules/',
  '<rootDir>/dist/',
  '<rootDir>/build/',
  '<rootDir>/.build/',
]

module.exports = {
  maxWorkers: isCI ? 3 : '100%',

  resolver: 'jest-svelte-resolver', // https://github.com/testing-library/svelte-testing-library/issues/82

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
    require.resolve('@testing-library/jest-dom'),
    require.resolve('jest-extended'),
    fs.existsSync('./jest.setup.js') && './jest.setup.js',
  ].filter(Boolean),

  // The test environment that will be used for testing
  testEnvironment: require.resolve('jest-environment-jsdom-sixteen'),

  moduleFileExtensions: ['svelte', 'cjs', 'js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Ignore all file in node_modules except for:
  // - *.svelte
  // - *.mjs
  // - files within **/src/
  transformIgnorePatterns: ['/node_modules/(?!.+.(?:svelte|mjs)$|.+/src/)'],

  transform: {
    '^.+\\.[t|j]sx?$': require.resolve('./jest/transform-babel.js'),
    '^.+\\.svelte$': [require.resolve('svelte-jester'), { preprocess: true }],

    // asset module declarations
    // keep in sync with types/assets.d.ts
    '^.+\\.module\\.(css|scss|less)$': require.resolve('./jest/transform-identity-obj-proxy'),
    '^.+\\.(css|scss|less|jpg|jpeg|png|gif|ico|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve(
      './jest/transform-filename',
    ),
  },

  bail: false,
  verbose: true,
}
