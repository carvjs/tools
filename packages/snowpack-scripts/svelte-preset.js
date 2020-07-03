const sveltePreprocess = require('svelte-preprocess')

const isDev = process.env.NODE_ENV !== 'production'

module.exports = {
  dev: isDev,

  preprocess: sveltePreprocess({
    typescript: {
      /**
       * Type checking can be skipped by setting 'transpileOnly: true'.
       * This speeds up your build process.
       *
       * Checking is done using svelte-check
       */
      transpileOnly: true,
    },
    // postcss: true,
    // scss: { includePaths: ['src', 'node_modules'] },
    babel: false,
    pug: false,
    coffeescript: false,
  }),

  css: false,
}
