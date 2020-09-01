/* eslint-env node */

const { cosmiconfigSync } = require('cosmiconfig')

const paths = require('./package-paths')
const manifest = require('./package-manifest')

const { config = {}, filepath } = cosmiconfigSync('carv').search(paths.root) || {}

// eslint-disable-next-line unicorn/prevent-abbreviations
const devOptions = {
  host: 'localhost',

  /** The port number to run the dev server on. */
  port: 5000,

  /** Prevent from falling back on a random port if the specified one is already occupied */
  randomPortFallback: false,

  baseUrl: '/',

  /**
   * Write bundle files in RAM instead of FS and serve them through the dev
   * server. This is obviously more performant but there may be cross domain
   * issues. Also, for very big apps, this might consume too much memory.
   */
  inMemory: true,

  /** If you still want to write do disk when using inMemory. */
  write: undefined,

  /** Clear console after successful HMR updates (Parcel style) */
  clearConsole: false,

  /**
   * When false, only the dev server will run. The plugin will not mess with
   * your config, your bundle, or transform any code. Only reload the
   * browser when the bundle changes.
   */
  hot: true,

  ...config.devOptions,
}

module.exports = {
  /**
   * Two variants:
   *
   * - 'library': creates a publishable package (use `package.json#browser` to enable node and/or browser builds)
   * - 'app': an all dependency included bundle
   *    - `iife` (es2015) for the browser unless `package.json#browser === false`
   *    - `esm` (es2015) for the browser unless `package.json#browser === false`
   *    - `cjs` (es2019) for node unless `package.json#browser === true`
   */
  mode: 'library',
  umdName: manifest.amdName || safeVariableName(manifest.name),

  ...config,
  filepath,

  /** Configure your dev server. */
  devOptions,

  /** Mount local directories to custom URLs in your built application. */
  mount: {
    // / => /build/
    [paths.build]: devOptions.baseUrl,
    ...config.mount,
  },
}

/**
 * Turn a package name into a valid reasonably-unique variable name
 * @param {string} name
 */
function safeVariableName(name) {
  const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z\d]+$)/g

  /** Remove a @scope/ prefix from a package name string */
  const identifier = name
    .replace(/^@.*\//, '')
    .toLowerCase()
    .replace(INVALID_ES3_IDENT, '')

  return require('camelcase')(identifier)
}
