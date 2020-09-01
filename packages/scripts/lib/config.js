/* eslint-env node */

const { cosmiconfigSync } = require('cosmiconfig')

const paths = require('./package-paths')

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
