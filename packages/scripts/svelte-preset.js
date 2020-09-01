/* eslint-env node */

const path = require('path')

const sveltePreprocess = require('svelte-preprocess')

module.exports = {
  preprocess: sveltePreprocess({
    sourceMap: true,

    /** Use as is; rollup transforms the generated chunk */
    babel: false,

    /**
     * Type checking can be skipped by setting 'transpileOnly: true'.
     * This speeds up your build process.
     *
     * Checking is done using svelte-check
     */
    typescript: {
      transpileOnly: true,
    },

    /** `<style global>...</style>` */

    globalStyle: true,
    postcss: {
      plugins: [require('postcss-nested')],
    },

    scss: {
      includePaths: [
        path.join(require('./lib/package-paths').source, 'theme'),
        ...require('./lib/include-paths'),
      ],
      // Use the sync render method which is faster for dart sass
      renderSync: true,
      implementation: require('sass'),
    },

    pug: false,
    coffeescript: false,
  }),
}
