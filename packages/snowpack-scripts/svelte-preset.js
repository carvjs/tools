const sveltePreprocess = require('svelte-preprocess')

const isDev = process.env.NODE_ENV !== 'production'

module.exports = {
  dev: isDev,

  preprocess: sveltePreprocess({
    babel: false,
    typescript: {
      /**
       * Type checking can be skipped by setting 'transpileOnly: true'.
       * This speeds up your build process.
       *
       * Checking is done using svelte-check
       */
      transpileOnly: true,
    },
    pug: false,
    coffeescript: false,
  }),

  css: false,
}
