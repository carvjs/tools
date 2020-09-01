/* eslint-env node */

const sveltePreprocess = require('svelte-preprocess')

async function transform({ content, filename }) {
  const isTest = process.env.NODE_ENV === 'test'

  const { js, jsSourceMap, warnings } = await require('./lib/esbuild').transform(content, {
    sourcefile: filename,
    write: false,
    platform: isTest ? 'node' : 'browser',
    target: isTest ? require('./lib/current-node-target') : 'es2020',
    sourcemap: 'external',
  })

  if (warnings.length > 0) console.warn(filename, warnings)

  return { code: js, map: jsSourceMap }
}

module.exports = {
  preprocess: sveltePreprocess({
    sourceMap: true,

    babel: transform,
    typescript: transform,

    globalStyle: true, // <style global>...</style>
    postcss: {
      plugins: [require('postcss-nested')],
    },
    scss: {
      includePaths: require('./lib/include-paths'),
      // Use the sync render method which is faster for dart sass
      renderSync: true,
      implementation: require('sass'),
    },

    pug: false,
    coffeescript: false,
  }),
}
