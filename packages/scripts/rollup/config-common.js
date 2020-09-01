/* eslint-env node */

const path = require('path')

const paths = require('../lib/package-paths')
const use = require('../lib/package-use')

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
  const yaml = require('@rollup/plugin-yaml')
  const { default: nodeResolve } = require('@rollup/plugin-node-resolve')
  const commonjs = require('@rollup/plugin-commonjs')
  const assets = require('./plugin-assets')

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

    plugins: [
      nodeResolve({
        dedupe,
        extensions,
        mainFields: [...(options.mainFields || []), ...mainFields],
      }),

      svelte?.(svelteConfig),

      json({ preferConst: true }),
      yaml({ preferConst: true }),

      commonjs({ requireReturnsDefault: 'auto', extensions }),

      assets({ assetFileNames, target: options.target, minify: options.minify !== false }),
    ].filter(Boolean),
  }
}
