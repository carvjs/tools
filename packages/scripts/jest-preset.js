/* eslint-env node */
require('v8-compile-cache')

const path = require('path')
const fs = require('fs')

const isCI = require('is-ci')
const escapeStringRegexp = require('escape-string-regexp')

const manifest = require('./lib/package-manifest')
const paths = require('./lib/package-paths')
const {
  alias,
  jestOptions: { ignorePatterns, transformModules, ...config },
} = require('./lib/config')

const transformModulesRegexp = transformModules.map(escapeStringRegexp).join('|')

const moduleNameMapper = config.moduleNameMapper || {}
for (let [from, to] of Object.entries(alias || {})) {
  if (to.startsWith('./') || to.startsWith('../')) {
    to = path.resolve(paths.root, to)
  }

  moduleNameMapper[`^${escapeStringRegexp(from)}$`] = to
  moduleNameMapper[`^${escapeStringRegexp(from)}/(.+)`] = `${to}/$1`
}

module.exports = {
  maxWorkers: isCI ? 3 : '100%',

  resolver: require.resolve('jest-svelte-resolver'),

  testMatch: [
    ...(config.testMatch || []),
    '<rootDir>/src/**/__tests__/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    ...ignorePatterns,
    ...(config.coveragePathIgnorePatterns || []),
    '/__fixtures__/',
    '/__mocks__/',
    '/__preview__/',
  ],

  modulePathIgnorePatterns: [...ignorePatterns, ...(config.modulePathIgnorePatterns || [])],

  setupFilesAfterEnv: [
    require.resolve('jest-extended'),
    manifest.browser !== false && tryResolve('@testing-library/jest-dom'),
    fs.existsSync(path.join(paths.root, 'jest.setup.js')) && path.join(paths.root, 'jest.setup.js'),
    ...(config.setupFilesAfterEnv || []),
  ].filter(Boolean),

  // The test environment that will be used for testing
  testEnvironment: require.resolve('./jest/enviroment'),

  moduleFileExtensions: ['cjs', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'json', 'node'],

  // Ignore all file in node_modules except for:
  // - *.svelte, *.mjs, *.jsx, *.ts, *.tsx
  // - files within **/src/
  transformIgnorePatterns: [
    ...(config.transformIgnorePatterns || []),
    `/node_modules/(?!.+.(?:svelte|mjs|jsx|tsx?)$|.+/src/|${transformModulesRegexp}/)`,
  ],

  transform: {
    ...config.transform,

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

function tryResolve(id) {
  try {
    return require.resolve(id)
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return
    }

    throw error
  }
}
