/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')
const npmRunPath = require('npm-run-path')
const globby = require('globby')
const paths = require('../lib/package-paths')

const EXTNAMES = ['', '.svelte', '.tsx', '.ts', '.mjs', '.jsx', '.js', '.cjs', '.json']

function resolveFile(base) {
  for (const extname of EXTNAMES) {
    const file = path.resolve(paths.root, base + extname)
    if (fs.existsSync(file)) {
      return file
    }
  }
}

// eslint-disable-next-line complexity
module.exports = async (commandLineArguments) => {
  console.log('commandLineArguments', commandLineArguments)

  const manifest = require('../lib/package-manifest')
  const use = require('../lib/package-use')

  // TODO copy additional exports
  console.log('Copying common package files...')
  await fs.mkdirp(paths.dist)

  /**
   * Copy readme, license, changelog to dist
   */
  const files = await globby(
    [
      ...(manifest.files || []),
      '{changes,changelog,history,license,licence,notice,readme}?(.md|.txt)',
    ],
    {
      cwd: paths.root,
      absolute: false,
      gitignore: true,
      caseSensitiveMatch: false,
      dot: true,
    },
  )

  await Promise.all(files.map((file) => fs.copy(file, path.join(paths.dist, file))))

  // Const packageName = manifest.name.replace(/^@/, '').replace(/\//g, '__')
  const unscopedPackageName = manifest.name.replace(/^@.*\//, '')

  const inputFile =
    resolveFile(manifest.source) ||
    resolveFile(manifest.svelte) ||
    resolveFile(manifest.main) ||
    resolveFile(path.join(paths.source, unscopedPackageName)) ||
    resolveFile(path.join(paths.source, 'index'))

  if (!inputFile) throw new Error('No input file found.')

  const useTypescript = use.typescript && (inputFile.endsWith('.ts') || inputFile.endsWith('.tsx'))

  /**
   * Generate typescript definitions to .build which allows them to be picked up by svelte
   */
  const typesDirectory = path.join(paths.build, 'types')

  let dtsFile

  if (useTypescript) {
    console.log('Generating typescript declarations...')
    await fs.mkdirp(typesDirectory)

    await execa('tsc', ['--emitDeclarationOnly', '--noEmit', 'false', '--outDir', typesDirectory], {
      cwd: paths.root,
      env: {
        ...npmRunPath.env(),
      },
      extendEnv: true,
      stdout: 'inherit',
      stderr: 'inherit',
    })

    dtsFile = await require('find-up')(path.basename(inputFile.replace(/\.(ts|tsx)$/, '.d.ts')), {
      cwd: path.resolve(typesDirectory, path.relative(paths.root, path.dirname(inputFile))),
    })
  }

  const outputs = {
    node: {
      require: {
        platform: 'node',
        target: 'es2019',
        format: 'cjs',
        mainFields: ['main'],
        svelte: { dev: true, generate: 'dom' },
        file: `./node/cjs/${unscopedPackageName}.js`,
        esmWrapper: `./node/esm/${unscopedPackageName}.js`,
      },

      default: {
        // This is created by the esmWrapper above
        file: `./node/esm/${unscopedPackageName}.js`,
      },
    },

    browser: maybe(use.browser, {
      development: {
        platform: 'browser',
        target: 'es2020',
        format: 'esm',
        mainFields: ['browser:module', 'esnext', 'es2015'],
        svelte: { dev: true, generate: 'dom' },
        file: `./browser/dev/${unscopedPackageName}.js`,
      },

      esnext: {
        platform: 'browser',
        target: 'esnext',
        format: 'esm',
        mainFields: ['esnext', 'es2015'],
        svelte: { dev: false, generate: 'dom' },
        file: `./browser/esnext/${unscopedPackageName}.js`,
      },

      default: {
        platform: 'browser',
        target: 'es2015',
        format: 'esm',
        mainFields: ['esnext', 'es2015'],
        svelte: { dev: false, generate: 'dom' },
        file: `./browser/es2015/${unscopedPackageName}.js`,
      },
    }),

    types: maybe(useTypescript, {
      format: 'typesscript',
      file: `./types/${unscopedPackageName}.d.ts`,
    }),
  }

  const publishManifest = {
    ...manifest,

    // Define package loading
    // https://gist.github.com/sokra/e032a0f17c1721c71cfced6f14516c62
    exports: {
      ...manifest.exports,
      '.': {
        node:
          outputs.node &&
          Object.fromEntries(
            Object.entries(outputs.node)
              .map(([condition, output]) => {
                return output && [condition, output.file]
              })
              .filter(Boolean),
          ),
        browser:
          outputs.browser &&
          Object.fromEntries(
            Object.entries(outputs.browser)
              .map(([condition, output]) => {
                return output && [condition, output.file]
              })
              .filter(Boolean),
          ),
        types: outputs.types && outputs.types.file,
      },
      './package.json': './package.json',
    },

    // Used by nodejs
    main: outputs.node && outputs.node.require.file,

    // Used by carv cdn: *.svelte production transpiled
    esnext: outputs.browser && outputs.browser.esnext.file,

    // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
    module: outputs.browser && outputs.browser.default.file,

    // Used by snowpack dev: *.svelte development transpiled
    'browser:module': outputs.browser && outputs.browser.development.file,

    // Typying
    types: outputs.types && outputs.types.file,

    // Not using it - see README
    svelte: undefined,

    // Some defaults
    sideEffects: manifest.sideEffects === true,

    // Allow publish
    private: undefined,

    // Include all files in the build folder
    files: undefined,

    // Default to cjs
    type: undefined,

    // These are not needed any more
    source: undefined,
    scripts: undefined,
    devDependencies: undefined,
    // Reset bundledDependencies as rollup includes those into the bundle
    bundledDependencies: undefined,
    bundleDependencies: undefined,

    // Reset config sections
    eslintConfig: undefined,
    jest: undefined,
    prettier: undefined,
    snowpack: undefined,
    graphql: undefined,
  }

  await fs.writeFile(
    path.join(paths.dist, 'package.json'),
    JSON.stringify(publishManifest, null, 2),
  )

  const dedupe = ['svelte', '@carv/runtime']

  const extensions = ['.mjs', '.js', '.cjs', '.json']
  if (use.svelte) extensions.unshift('.svelte')

  // Like snowpack: hhttps://github.com/pikapkg/snowpack/blob/master/src/commands/install.ts#L216
  const mainFields = ['module', 'main:esnext', 'main']

  // Bundled dependencies are included into the output bundle
  const bundledDependencies = []
    .concat(manifest.bundledDependencies || [])
    .concat(manifest.bundleDependencies || [])

  const external = (id, parentId) => {
    // Entry is never external
    if (!parentId) return false

    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id) || id.includes('\0')) {
      return false
    }

    for (const bundledDependency of bundledDependencies) {
      if (id === bundledDependency || id.startsWith(`${bundledDependency}/`)) {
        return false
      }
    }

    return true
  }

  const { compilerOptions, ...svelteConfig } = use.svelte ? require(paths.svelteConfig) : {}
  Object.assign(svelteConfig, compilerOptions)

  const assetFileNames = path.join('assets', '[name]-[hash][extname]')
  const fileNameConfig = (outputFile) => {
    const outputDirectory = path.join(paths.dist, path.dirname(outputFile))
    const base = path.relative(paths.dist, outputDirectory)

    return {
      dir: paths.dist,
      entryFileNames: path.join(base, '[name].js'),
      chunkFileNames: path.join(base, '[name]-[hash].js'),
      assetFileNames,
    }
  }

  const { startService } = require('esbuild')
  let service
  const stopService = () => service && service.stop()

  const json = require('@rollup/plugin-json')
  const yaml = require('@rollup/plugin-yaml')
  const { default: nodeResolve } = require('@rollup/plugin-node-resolve')
  const commonjs = require('@rollup/plugin-commonjs')
  const define = require('rollup-plugin-define')
  const assets = require('./plugin-assets')

  function createRollupConfig(options) {
    if (!(options && options.format)) return

    return {
      input: {
        [path.basename(options.file, path.extname(options.file))]: path.relative(
          process.cwd(),
          inputFile,
        ),
      },

      output: {
        format: options.format,
        ...fileNameConfig(options.file),
        sourcemap: true,
        sourcemapExcludeSources: false,
        preferConst: true,
        compact: options.minify !== false,
        interop: 'auto',
        exports: 'auto',
      },

      external,

      // Value of this at the top level
      context: options.platform === 'node' ? 'global' : 'self',

      plugins: [
        nodeResolve({
          dedupe,
          extensions,
          mainFields: [...(options.mainFields || []), ...mainFields],
        }),

        use.svelte &&
          require('rollup-plugin-svelte')({
            ...svelteConfig,

            ...options.svelte,

            // Create external css files
            emitCss: true,
          }),

        commonjs({ requireReturnsDefault: 'auto', extensions }),

        json({ preferConst: true }),
        yaml({ preferConst: true }),

        assets({ assetFileNames, target: options.target }),

        define({
          replacements: {
            // Common
            'import.meta.browser': JSON.stringify(options.platform === 'browser'),
            'process.browser': JSON.stringify(options.platform === 'browser'),

            ...(options.platform === 'node'
              ? {
                  // Node and CJS
                  // De-alias MODE to NODE_ENV
                  'import.meta.env.MODE': 'process.env.NODE_ENV',
                  'process.env.MODE': 'process.env.NODE_ENV',

                  // Rewrite these for node.js
                  'import.meta.url': `require('url').pathToFileURL(__filename)`,
                  'import.meta.resolve': `(id, parent) => new Promise(resolve => resolve(parent ? require('module').createRequire(parent).resolve(id) : require.resolve(id)))`,

                  // Delegate to process.*
                  'import.meta.platform': 'process.platform',
                  'import.meta.env': 'process.env',

                  // No hot mode
                  'import.meta.hot': 'undefined',

                  // No meta
                  'import.meta': '{}',
                }
              : {
                  // Browser & ESM
                  'import.meta.platform': '"browser"',
                  'process.platform': '"browser"',

                  'process.versions.node': 'undefined',
                  'typeof process': '"undefined"',

                  ...(options.svelte.dev
                    ? {
                        'process.env': '(import.meta.env || {})',
                      }
                    : {
                        'process.env.NODE_ENV': '"production"',
                        'process.env.MODE': '"production"',
                        'process.env': '{}',

                        'import.meta.env.NODE_ENV': '"production"',
                        'import.meta.env.MODE': '"production"',
                        'import.meta.env': '{}',

                        // No hot mode
                        'import.meta.hot': 'undefined',
                      }),
                }),
          },
        }),

        {
          name: 'esbuild',

          async buildStart() {
            if (!service) {
              service = await startService()
            }
          },

          buildEnd(error) {
            // Stop the service early if there's error
            if (error) {
              stopService()
            }
          },

          async renderChunk(code, chunk) {
            const result = await service.transform(code, {
              sourcefile: chunk.fileName,
              loader: 'js',
              target: options.target,
              platform: options.platform,
              minify: options.minify !== false,
              sourcemap: 'external',
            })

            if (result.warnings) {
              for (const warning of result.warnings) {
                let message = ''
                if (warning.location) {
                  message += `(${path.relative(process.cwd(), chunk.fileName)}:${
                    warning.location.line
                  }:${warning.location.column}) `
                }

                message += warning.text

                this.warn(message)
              }
            }

            if (result.js) {
              return {
                code: result.js,
                map: result.jsSourceMap || null,
              }
            }

            return null
          },

          renderError: stopService,
        },

        // Create esm wrapper: https://nodejs.org/api/esm.html#esm_approach_1_use_an_es_module_wrapper
        options.esmWrapper && require('./plugin-esm-wrapper')(options.esmWrapper),
      ].filter(Boolean),
    }
  }

  const configs = [
    // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
    ...(outputs.node && Object.values(outputs.node).map(createRollupConfig)),

    // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
    ...(outputs.browser && Object.values(outputs.browser).map(createRollupConfig)),

    // Generate typescript declarations
    dtsFile &&
      outputs.types && {
        input: path.relative(process.cwd(), dtsFile),

        output: {
          format: 'esm',
          file: path.join(paths.dist, outputs.types.file),
          sourcemap: true,
          preferConst: true,
          exports: 'auto',
        },

        external,

        plugins: [
          {
            name: 'svelte.d.ts',
            async resolveId(source, importer) {
              if (path.extname(source) === '.svelte') return `\0:svelte.d.ts:${source}`

              return this.resolve(source, importer, { skipSelf: true })
            },

            async load(id) {
              if (id.startsWith('\0:svelte.d.ts:')) {
                return `export { SvelteComponent as default } from 'svelte'`
              }

              return null
            },
          },

          (0, require('rollup-plugin-dts').default)(),
        ],
      },
  ].filter(Boolean)

  // TODO remove build folder
  configs[configs.length - 1].plugins.push({
    name: 'cleanup',
    generateBundle: stopService,
  })

  return configs
}

function maybe(condition, truthy, falsy) {
  return condition ? truthy : falsy
}
