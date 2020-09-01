/* eslint-env node */

// eslint-disable-next-line func-names
module.exports = function getOutputs(useTypescript = require('../lib/package-use').typescript) {
  const manifest = require('../lib/package-manifest')
  const unscopedPackageName = require('./unscoped-package-name')

  return {
    node: maybe(manifest.browser !== true, {
      require: {
        platform: 'node',
        target: 'es2019',
        format: 'cjs',
        mainFields: ['main'],
        svelte: { dev: true, generate: 'dom' },
        file: `./node/cjs/${unscopedPackageName}.js`,
        esmWrapper: `./node/esm/${unscopedPackageName}.js`,
      },

      default: {
        // This is created by the esmWrapper above
        file: `./node/esm/${unscopedPackageName}.js`,
      },
    }),

    browser: maybe(manifest.browser !== false, {
      development: {
        platform: 'browser',
        target: 'es2020',
        format: 'esm',
        mainFields: ['browser:module', 'esnext', 'es2015'],
        svelte: { dev: true, generate: 'dom' },
        file: `./browser/dev/${unscopedPackageName}.js`,
      },

      esnext: {
        platform: 'browser',
        target: 'esnext',
        format: 'esm',
        mainFields: ['esnext', 'es2015'],
        svelte: { dev: false, generate: 'dom' },
        file: `./browser/esnext/${unscopedPackageName}.js`,
      },

      default: {
        platform: 'browser',
        target: 'es2015',
        format: 'esm',
        mainFields: ['esnext', 'es2015'],
        svelte: { dev: false, generate: 'dom' },
        file: `./browser/es2015/${unscopedPackageName}.js`,
      },
    }),

    types: maybe(useTypescript, {
      format: 'typescript',
      file: `./types/${unscopedPackageName}.d.ts`,
    }),
  }
}

function maybe(condition, truthy, falsy) {
  return condition ? truthy : falsy
}
