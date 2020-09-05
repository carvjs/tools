/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')

module.exports = async () => {
  const paths = require('../lib/package-paths')
  const manifest = require('../lib/package-manifest')
  const use = require('../lib/package-use')
  const config = require('../lib/config')

  await require('./copy-files')()

  const inputFile = require('./get-input-file')()

  const useTypescript = use.typescript && (inputFile.endsWith('.ts') || inputFile.endsWith('.tsx'))

  /**
   * Generate typescript definitions to .build which allows them to be picked up by svelte
   */
  const typesDirectory = path.join(paths.build, 'types')

  let dtsFile

  if (useTypescript) {
    const globby = require('globby')
    const execa = require('execa')
    const npmRunPath = require('npm-run-path')

    console.log('Generating typescript declarations...')
    await fs.mkdirp(typesDirectory)

    const cleanupFiles = []
    try {
      // Idea:
      // - create *.svelte.d.ts files
      // - generate typescript declarations in a build directory using tsc
      // - remove created *.svelte.d.ts files
      // - use rollup-plugin-dts to create final bundle
      // - TODO remove build directory
      if (use.svelte) {
        // Collect all svelte files
        const svelteFiles = await globby('**/*.svelte', {
          cwd: paths.root,
          gitignore: true,
          absolute: true,
        })

        // Copy the shim definitions
        // const jsxShimFileName = path.resolve(
        //   paths.root,
        //   path.dirname(inputFile),
        //   '__svelte-jsx-shims.d.ts',
        // )
        // await fs.copyFile(require.resolve('../types/svelte-jsx.d.ts'), jsxShimFileName)
        // cleanupFiles.push(jsxShimFileName)

        /** Copy svelte-jsx as namespace JSX */
        const jsxFileName = path.resolve(
          paths.root,
          path.dirname(inputFile),
          '__svelte-jsx.d.ts',
        )
        const jsx = await fs.readFile(require.resolve('svelte2tsx/svelte-jsx.d.ts'), 'utf-8')

        await fs.writeFile(
          jsxFileName,
          jsx.replace('declare namespace svelte.JSX', 'declare namespace JSX')
        )
        cleanupFiles.push(jsxFileName)

        // Must be available in build/types as well
        await fs.copyFile(jsxFileName, path.join(typesDirectory, path.basename(jsxFileName)))


        /** Copy svelte-shim */
        const shimFileName = path.resolve(
          paths.root,
          path.dirname(inputFile),
          '__svelte-shims.d.ts',
        )
        const shim = await fs.readFile(require.resolve('svelte2tsx/svelte-shims.d.ts'), 'utf-8')

        // Set of exported shim declarations
        const exports = new Set()

        // Remove declare module '*.svelte' {}
        // and export all definitions
        const additionalHelpers = [
          `declare function __sveltets_default<T>(): T;`,
        ].join('\n')
        await fs.writeFile(
          shimFileName,
          (shim.slice(shim.indexOf('}') + 1) + '\n' + additionalHelpers)
            .replace(/^(declare\s+(?:class|function)|type)\s+(\S+?)\b/gm, (match, type, name) => {
              exports.add(name)
              return `export ${match}`
            }),

        )
        cleanupFiles.push(shimFileName)

        // Import all exports, rollup dts will treeshake them for us
        const imports = [...exports].join(', ')

        // Must be available in build/types as well
        await fs.copyFile(shimFileName, path.join(typesDirectory, path.basename(shimFileName)))

        // Create tsx shim for each svelte
        const svelte2tsx = require('svelte2tsx')
        await Promise.all(
          svelteFiles.map(async (svelteFile) => {
            const source = await fs.readFile(svelteFile, 'utf-8')

            const result = svelte2tsx(source, {
              filename: svelteFile,
              strictMode: false,
              isTsFile: true,
            })

            // Add shim import without .d.ts extension
            let shimImport = path.relative(path.dirname(svelteFile), shimFileName.slice(0, -5))
            if (!(shimImport.startsWith('./') || shimImport.startsWith('../'))) {
              shimImport = './' + shimImport
            }

            const svelteFileJsx = svelteFile + '.tsx'
            cleanupFiles.push(svelteFileJsx)

            const code = result.code
              // Replace store access using $store with type
              // ignore: $$restProps, $$props, $:, _$$p, .$on, ${
              .replace(/(?<![$.])\$([\w]+?)\b/gmu, '__sveltets_store_get($1)')
              // Ensure not initalized exports are typed
              .replace(/\b(let\s+[\w]+\s*:[^=;]+?)(;|$)/gmu, '$1 = __sveltets_default()$2')
              // Move render body outside to have access to internal types like ComponentEvents
              .replace('function render() {', '')
              .replace(/(<\/>\);[\r?\n])(\s*return\s*{\s*props:\s*{)/m, '$1function render() {\n$2')

            await fs.writeFile(
              svelteFile + '.tsx',

                `${code}\nimport {${imports}} from ${JSON.stringify(
                  shimImport,
                )}`,
            )
          }),
        )
      }

      await execa(
        'tsc',
        [
          '--emitDeclarationOnly',
          '--noEmit',
          'false',
          '--jsx',
          'preserve',
          '--project',
          paths.typescriptConfig,
          '--outDir',
          typesDirectory,
        ],
        {
          cwd: paths.root,
          env: {
            ...npmRunPath.env(),
          },
          extendEnv: true,
          stdout: 'inherit',
          stderr: 'inherit',
        },
      )

      dtsFile = await require('find-up')(path.basename(inputFile.replace(/\.(ts|tsx)$/, '.d.ts')), {
        cwd: path.resolve(typesDirectory, path.relative(paths.root, path.dirname(inputFile))),
      })
    } finally {
      await Promise.all(
        cleanupFiles.map(async (fileName) => {
          try {
            await fs.unlink(fileName)
          } catch (error) {
            console.warn(`Failed to cleanup: ${fileName}`, error)
          }
        }),
      )
    }
  }

  const outputs = require('./get-outputs')({ useTypescript })

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
        types: outputs.types?.file,
      },
      // All access to all files (including package.json, assets, chunks, ...)
      './': './',
    },

    // Used by nodejs
    main: outputs.node?.require?.file,

    // Used by carv cdn: *.svelte production transpiled
    esnext: outputs.browser?.esnext?.file,

    // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
    module: outputs.browser?.import?.file,

    // Used by snowpack dev: *.svelte development transpiled
    'browser:module': outputs.browser?.development?.file,

    // Can be used from a normal script tag without module system.
    unpkg: outputs.browser?.script?.file,

    // Typying
    types: outputs.types?.file,

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
    carv: undefined,
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

  // Bundled dependencies are included into the output bundle
  const bundledDependencies = []
    .concat(manifest.bundledDependencies || [])
    .concat(manifest.bundleDependencies || [])

  const fileNameConfig = (outputFile) => {
    const outputDirectory = path.join(paths.dist, path.dirname(outputFile))
    const base = path.relative(paths.dist, outputDirectory)

    return {
      dir: paths.dist,
      entryFileNames: path.join(base, '[name].js'),
      chunkFileNames: path.join(base, '[name]-[hash].js'),
    }
  }

  const define = require('rollup-plugin-define')
  const logStart = require('./plugin-log-start')

  function createRollupConfig(options) {
    if (!(options && options.format)) return

    const common = require('./config-common')({
      ...options,
      bundledDependencies: options.format === 'umd' || bundledDependencies,
    })

    return {
      ...common,

      input: {
        [path.basename(options.file, path.extname(options.file))]: path.relative(
          process.cwd(),
          inputFile,
        ),
      },

      output: {
        ...common.output,
        ...fileNameConfig(options.file),
        name: config.buildOptions.umdName,
        inlineDynamicImports: options.format === 'umd',
      },

      plugins: [
        logStart(options, paths.dist, use.svelte),

        ...common.plugins,

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

                  // No other meta propeteries
                  'import.meta': '{}',
                }
              : {
                  // Browser & ESM
                  'import.meta.env.MODE': '(import.meta.env?.MODE || import.meta.env?.NODE_ENV)',
                  'process.env.MODE': '(import.meta.env?.MODE || import.meta.env?.NODE_ENV)',

                  'import.meta.platform': '"browser"',
                  'process.platform': '"browser"',

                  'process.versions.node': 'undefined',
                  'typeof process': '"undefined"',

                  ...(options.svelte.dev
                    ? {
                        // For the development builds delegate to import.meta.*
                        'process.env': '(import.meta.env || {})',
                      }
                    : {
                        // For the productions builds optimize the production code path
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

        // Create esm wrapper: https://nodejs.org/api/esm.html#esm_approach_1_use_an_es_module_wrapper
        options.esmWrapper && require('./plugin-esm-wrapper')(options.esmWrapper),
      ].filter(Boolean),
    }
  }

  return [
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

        plugins: [(0, require('rollup-plugin-dts').default)()],
      },

    ...Object.values(outputs.node || {}).map(createRollupConfig),

    ...Object.values(outputs.browser || {}).map(createRollupConfig),
  ].filter(Boolean)
}
