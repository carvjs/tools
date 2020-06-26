const defaults = require('@snowpack/app-scripts-svelte/jest.config.js')()

module.exports = {
  ...defaults,

  testMatch: [
    '<rootDir>/src/**/__tests__/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__fixtures__/',
    '/__mocks__/',
    '/__preview__/',
    '/build/',
    '/.build/',
  ],

  setupFilesAfterEnv: [require.resolve('@testing-library/jest-dom')],

  // The test environment that will be used for testing
  testEnvironment: require.resolve('jest-environment-jsdom-sixteen'),

  moduleFileExtensions: ['svelte', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],

  transform: {
    ...defaults.transform,
    '^.+\\.module\\.(css|scss|less)$': require.resolve('./jest/transform-identity-obj-proxy'),
    '^.+\\.(css|scss|less|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve(
      './jest/transform-filename',
    ),
  },
}
