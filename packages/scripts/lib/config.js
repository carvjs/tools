/* eslint-env node */

const { cosmiconfigSync } = require('cosmiconfig')

const paths = require('./package-paths')
const manifest = require('./package-manifest')

const { config = {}, filepath } = cosmiconfigSync('carv', {
  searchPlaces: [
    'package.json',
    'carv.config.cjs',
    'carv.config.js',
    'carv.config.json',
  ]
}).search(paths.root) || {}

// TODO config.extends
// Inherit from a separate "base" config. Can be a relative file path, an npm package, or a file within an npm package. Your configuration will be merged on top of the extended base config.

const buildOptions = {
  /**
   * Two variants:
   *
   * - 'library': creates a publishable package (use `package.json#browser` to enable node and/or browser builds)
   * - 'app': an all dependency included bundle
   *    - `umd` (es2015) for the browser unless `package.json#browser === false`
   *    - `esm` (es2015) for the browser unless `package.json#browser === false`
   *    - `cjs` (es2019) for node unless `package.json#browser === true`
   */
  mode: 'library',

  /**
   * Necessary for iife/umd bundles that exports values in which case it is the global variable
   * name representing your bundle. Other scripts on the same page can use this variable name
   * to access the exports of your bundle.
   *
   * The default is generated from the project name.
   */
  umdName: manifest.umdName ||  manifest.amdName || safeVariableName(manifest.name),

  ...config.buildOptions
}

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
  ...config,

  filepath,

  buildOptions,

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
