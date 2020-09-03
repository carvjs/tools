/* eslint-env node */

const path = require('path')

const paths = require('../lib/package-paths')
const use = require('../lib/package-use')
const config = require('../lib/config')

module.exports = (options) => {
  const dedupe = ['svelte', '@carv/runtime']

  const extensions = ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.cjs', '.json']
  if (use.svelte) extensions.unshift('.svelte')

  // Like snowpack: https://github.com/pikapkg/snowpack/blob/master/src/commands/install.ts#L216
  const mainFields = ['module', 'main:esnext', 'main']

  const { compilerOptions, ...svelteConfig } = use.svelte ? require(paths.svelteConfig) : {}
  Object.assign(svelteConfig, compilerOptions, options.svelte, {
    css: true,
    // Create external css files
    emitCss: true,
  })

  const svelte =
    use.svelte &&
    (svelteConfig.hot ? require('rollup-plugin-svelte-hot') : require('rollup-plugin-svelte'))
  const json = require('@rollup/plugin-json')
  const { default: nodeResolve } = require('@rollup/plugin-node-resolve')
  const commonjs = require('@rollup/plugin-commonjs')
  const { default: dynamicImportVars } = require('@rollup/plugin-dynamic-import-vars')
  const assets = require('./plugin-assets')
  const resolve = require('./plugin-resolve')

  const assetFileNames = path.join('assets', '[name]-[hash][extname]')

  return {
    output: {
      format: options.format,
      assetFileNames,
      // Sourcemapping is supported
      sourcemap: true,
      sourcemapExcludeSources: false,
      preferConst: true,
      compact: options.minify !== false,
      interop: 'auto',
      exports: 'auto',
    },

    // Value of this at the top level
    context: options.platform === 'node' ? 'global' : 'self',

    preserveEntrySignatures: 'allow-extension',

    treeshake: {
      moduleSideEffects(id, _external) {
        // Id is module or absolute path

        // TODO not for spectre.css
        if (id.endsWith('.css')) {
          return true
        }

        // TODO check package.json#sideEffects
        return false
      },
    },

    plugins: [
      resolve({
        bundledDependencies: options.bundledDependencies,
        alias: config.alias,
      }),

      nodeResolve({
        dedupe,
        extensions,
        mainFields: [...(options.mainFields || []), ...mainFields],
      }),

      svelte?.(svelteConfig),

      json({ preferConst: true, namedExports: false }),

      commonjs({ requireReturnsDefault: 'auto', extensions }),

      assets({ assetFileNames, target: options.target, minify: options.minify !== false }),

      // Must be after all other transforms (like svelte and css)
      dynamicImportVars({ warnOnError: true }),
    ].filter(Boolean),
  }
}
