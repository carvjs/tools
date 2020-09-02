/* eslint-env node */

const path = require('path')

module.exports = async () => {
  const paths = require('../lib/package-paths')
  const use = require('../lib/package-use')
  const config = require('../lib/config')
  const manifest = require('../lib/package-manifest')

  await require('./copy-files')(paths.build)

  const inputFile = require('./get-input-file')()

  const useTypescript = use.typescript && (inputFile.endsWith('.ts') || inputFile.endsWith('.tsx'))

  const outputs = require('./get-outputs')({ useTypescript, mode: 'library' })

  const options = {
    ...(outputs.browser?.development || outputs.node?.test || outputs.node?.require),
    format: 'system',
    minify: false,
  }

  const common = require('./config-common')({
    ...options,
    svelte: {
      ...options.svelte,

      // `dev: true` is required with HMR
      dev: true,

      hot: {
        // Prevent preserving local component state
        noPreserveState: false,

        // If this string appears anywhere in your component's code, then local
        // state won't be preserved, even when noPreserveState is false
        noPreserveStateKey: '@!hmr',

        // Prevent doing a full reload on next HMR update after fatal error
        noReload: false,

        // Try to recover after runtime errors in component init
        optimistic: false,

        // --- Advanced ---

        // By default, when the hot option is enabled, the `css` option of this
        // plugin (same option as official plugin) will be changed to `false`,
        // because extracting CSS doesn't work with HMR currently. You can use
        // this option to disable this behaviour if it cause problems with your
        // setup.
        noDisableCss: true,

        // When you change only the <style> part of a component, then only the
        // CSS will be reinjected. Existing component instances won't be
        // recreated. Set `false` to force recreation.
        injectCss: true,

        // Delay to mitigate FOUC (flash of unstyled content) when a component
        // is updated, before the new version with the new CSS is loaded.
        cssEjectDelay: 0,

        // Prevent adding an HMR accept handler to components with
        // accessors option to true, or to components with named exports
        // (from <script context="module">). This have the effect of
        // recreating the consumer of those components, instead of the
        // component themselves, on HMR updates. This might be needed to
        // reflect changes to accessors / named exports in the parents,
        // depending on how you use them.
        acceptAccessors: false,
        acceptNamedExports: true,

        // Set true to enable support for Nollup (note: when not specified, this
        // is automatically detected based on the NOLLUP env variable)
        nollup: false,
      },
    },
  })

  const define = require('rollup-plugin-define')
  const html = require('@rollup/plugin-html')
  const hmr = require('rollup-plugin-hot')

  const esbuild = require('../lib/esbuild')

  const outputName = 'dev-bundle'
  const { baseUrl } = config.devOptions

  const codeCache = new Map()

  return {
    ...common,

    perf: false,

    watch: {
      clearScreen: false,
      exclude: 'node_modules/**',
    },

    input: {
      [outputName]: path.relative(process.cwd(), inputFile),
    },

    output: {
      ...common.output,
      dir: paths.build,
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      preserveModules: true,
      exports: 'named',
    },

    plugins: [
      ...common.plugins,

      define({
        replacements: {
          'import.meta.browser': JSON.stringify(options.platform === 'browser'),
          'process.browser': JSON.stringify(options.platform === 'browser'),

          ...(options.platform === 'node'
            ? {
                // De-alias MODE to NODE_ENV
                'import.meta.env.MODE': 'process.env.NODE_ENV',
                'process.env.MODE': 'process.env.NODE_ENV',

                // Delegate to process.*
                'import.meta.platform': 'process.platform',
                'import.meta.env': 'process.env',

                'process.versions.node': JSON.stringify(process.versions.node),
                'typeof process': JSON.stringify(typeof process),
              }
            : {
                'import.meta.env.NODE_ENV': '"development"',
                'process.env.NODE_ENV': '"development"',

                'import.meta.env.MODE': '"development"',
                'process.env.MODE': '"development"',

                'import.meta.platform': '"browser"',
                'process.platform': '"browser"',

                'process.env': '(import.meta.env || {})',

                'process.versions.node': 'undefined',
                'typeof process': '"undefined"',
              }),
        },
      }),

      html({
        publicPath: baseUrl,
        title: manifest.name,
        meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width,initial-scale=1' }],
        template: ({ attributes, meta, publicPath, title }) => {
          const metas = meta.map((input) => `<meta${html.makeHtmlAttributes(input)}>`).join('                \n')

          return require('common-tags').stripIndent`
            <!DOCTYPE html>
            <html${html.makeHtmlAttributes(attributes.html)}>
              <head>
                ${metas}
                <base${html.makeHtmlAttributes({ href: publicPath })}>
                <title>${title}</title>
                <script${html.makeHtmlAttributes({ src: outputName + '.js', defer: '' })}></script>
              </head>
              <body>
              </body>
            </html>
          `
        },
      }),

      {
        name: 'esbuild',
        async renderChunk(code, chunk) {
          const cache = codeCache.get(chunk.fileName)

          if (cache?.code === code) {
            return cache.result
          }

          const result = await esbuild.renderChunk(code, chunk.fileName, options, this)

          codeCache.set(chunk.fileName, { code, result })

          return result
        },
      },

      watchSvelteCSS(
        use.svelte,
        hmr({
          ...config.devOptions, // Default: true

          // When false, the plugin will do nothing at all (useful for prod build).
          enabled: true, // Default: true

          // These two are used to map output filenames to URLs, because Rollup
          // knows about filenames but SystemJS knows about URLs.
          //
          // FS path to public directory
          // NOTE this is only used to compute URLs from FS paths... see mount
          // option bellow if you want to serve static content
          public: paths.build, // Default: ''

          proxy: config.proxy,

          // Serve additional static content: the key is a FS path, the value is
          // the base URL. Static content will always be served _after_ files from
          // the bundle.
          mount: {
            ...config.mount,

            // /@hot/assets/spectre-addons-a3359140.css => /build/assets/
            [path.join(paths.build, 'assets')]: baseUrl + '@hot/assets/',
          },

          // Enable html5 client side routing
          fallback: path.join(paths.build, 'index.html'),
        }),
      ),
    ].filter(Boolean),
  }
}

function watchSvelteCSS(enabled, hmr) {
  if (enabled) {
    const { watchChange } = hmr

    hmr.watchChange = function (id) {
      watchChange.call(this, id)

      if (id.endsWith('.svelte')) {
        watchChange.call(this, id.slice(0, -7) + '.css')
      }
    }
  }

  return hmr
}
