import { promises as fs } from 'fs'
import path from 'path'

import json from '@rollup/plugin-json'
import yaml from '@rollup/plugin-yaml'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import svelte from 'rollup-plugin-svelte'
import dts from 'rollup-plugin-dts'

import carvAssets from './plugin-assets'
import define from './plugin-define'
import esmWrapper from './plugin-esm-wrapper'

const ignore = () => {}

const PUBLIC_ENV_REGEX = /^SNOWPACK_PUBLIC_/
function generateEnvObject({ source = process.env, mode = source.NODE_ENV || 'production' } = {}) {
  const envObject = {
    MODE: mode,
    NODE_ENV: mode,
  }

  for (const key of Object.keys(source)) {
    if (PUBLIC_ENV_REGEX.test(key)) {
      envObject[key] = JSON.stringify(source[key])
    }
  }

  return envObject
}

function expand(prefixes, object) {
  if (!Array.isArray(prefixes)) prefixes = [prefixes]

  const result = {}

  for (const key of Object.keys(object)) {
    for (const prefix of prefixes) {
      result[`${prefix}.${key}`] = object[key]
    }
  }

  return result
}

export default async function () {
  // const srcDirectory = process.env.BUILD_SRC_DIRECTORY
  const destDirectory = process.env.BUILD_DEST_DIRECTORY
  const inputFile = process.env.BUILD_INPUT_FILE || '/_dist_/index'

  const dtsFile = process.env.BUILD_DTS_FILE

  const dedupe = ['svelte', '@carv/runtime']
  const extensions = ['.mjs', '.js', '.cjs', '.json']
  // like snowpack: hhttps://github.com/pikapkg/snowpack/blob/master/src/commands/install.ts#L216
  const mainFields = ['module', 'main:esnext', 'main']

  const pkg = JSON.parse(
    await fs.readFile(path.join(destDirectory, 'package.json'), { encoding: 'utf-8' }),
  )

  const svelteConfig = require(path.resolve(process.cwd(), 'svelte.config.js'))

  // bundledDependencies are included into the output bundle
  const bundledDependencies = []
    .concat(pkg.bundledDependencies || [])
    .concat(pkg.bundleDependencies || [])

  const external = (id) => {
    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id) || id[0] === '\0') {
      return false
    }
    for (const bundledDependency of bundledDependencies) {
      if (id === bundledDependency || id.startsWith(`${bundledDependency}/`)) {
        return false
      }
    }

    return true
  }

  const plugins = [
    json({ preferConst: true }),
    yaml({ preferConst: true }),

    // snowpack({ srcDirectory, destDirectory, inputFile }),
    carvAssets(),

    commonjs({ extensions }),
  ]

  const fileNameConfig = (outputFile) => {
    const outputDirectory = path.join(destDirectory, path.dirname(outputFile))
    const base = path.relative(destDirectory, outputDirectory)

    return {
      dir: destDirectory,
      entryFileNames: path.join(base, '[name].js'),
      chunkFileNames: path.join(base, '_', '[name]-[hash].js'),
      assetFileNames: path.join('assets', '[name]-[hash][extname]'),
    }
  }

  function logStart(message, ...outFiles) {
    return {
      name: 'log-start',
      buildStart() {
        console.log(
          message,
          '=>',
          outFiles
            .map((file) =>
              path.relative(process.cwd(), path.join(destDirectory, path.dirname(file))),
            )
            .join(', '),
        )
      },
    }
  }

  const env = generateEnvObject({ mode: 'production' })

  return [
    // Used by nodejs: *.svelte production transpiled
    // No sourcemap to debug within node_modules
    {
      input: {
        [path.basename(pkg.main, path.extname(pkg.main))]: inputFile,
      },

      output: {
        format: 'cjs',
        ...fileNameConfig(pkg.main),
        preferConst: true,
      },

      external,
      context: 'global', // value of this at the top level
      plugins: [
        logStart('Node.JS', pkg.main, pkg.exports['.'].default),

        resolve({ dedupe, extensions, mainFields }),

        ...plugins,

        svelte({
          ...svelteConfig,

          dev: false,

          // By default, the client-side compiler is used. You
          // can also use the server-side rendering compiler
          generate: 'ssr',

          // ensure that extra attributes are added to head
          // elements for hydration (used with ssr: true)
          hydratable: true,

          onwarn(warning) {
            // Ignore warning for missing export declartion it maybe a module context export
            if (warning.code === 'missing-declaration') {
              return
            }

            console.warn(`[${warning.code}] ${warning.message}\n${warning.frame}`)
          },
        }),

        // 1. Transpile to js
        esbuild({ target: 'esnext' }),

        // 2. Apply replacements
        define({
          // Delegate to process.*
          ...expand('import.meta', {
            url: `require('url').pathToFileURL(__filename)`,
            resolve: `(id, parent) => new Promise(resolve => resolve(parent ? require('module').createRequire(parent).resolve(id) : require.resolve(id)))`,
            platform: 'process.platform',
            browser: 'process.browser',
            env: 'process.env',
            hot: 'undefined',
          }),
        }),

        // 3. Transpile to target
        esbuild({ target: 'es2019' }),

        // Create esm wrapper: https://nodejs.org/api/esm.html#esm_approach_1_use_an_es_module_wrapper
        esmWrapper({ file: pkg.exports['.'].default }),
      ].filter(Boolean),
    },

    {
      input: {
        [path.basename(pkg['esnext'], path.extname(pkg['esnext']))]: inputFile,
      },

      output: {
        format: 'esm',
        ...fileNameConfig(pkg.esnext),
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        compact: true,
      },

      external,
      context: 'globalThis', // value of this at the top level
      plugins: [
        logStart('Carv CDN', pkg.esnext),

        ...plugins,

        svelte({ ...svelteConfig, dev: false, onwarn: ignore }),

        resolve({ dedupe, extensions, mainFields: ['esnext', ...mainFields] }),

        esbuild({ target: 'esnext', minify: true }),

        define({
          ...expand(['import.meta.env', 'process.env'], env),
          ...expand(['import.meta', 'process'], {
            platform: '"browser"',
            browser: 'true',
            env: JSON.stringify(env),
          }),

          'import.meta.hot': 'undefined',
          'process.versions.node': 'undefined',
          'typeof process': '"undefined"',
        }),
      ].filter(Boolean),
    },

    // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
    {
      input: {
        [path.basename(pkg.module, path.extname(pkg.module))]: inputFile,
      },

      output: {
        format: 'esm',
        ...fileNameConfig(pkg.module),
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        compact: true,
      },

      external,
      context: 'window', // value of this at the top level
      plugins: [
        logStart('Bundlers & CDNs', pkg.module),

        ...plugins,

        svelte({ ...svelteConfig, dev: false, onwarn: ignore }),

        resolve({ dedupe, extensions, mainFields }),

        // 1. Transpile to js
        esbuild({ target: 'esnext' }),

        // 2. Apply replacements
        define({
          ...expand(['import.meta.env', 'process.env'], env),
          ...expand(['import.meta', 'process'], {
            platform: '"browser"',
            browser: 'true',
            env: JSON.stringify(env),
          }),

          'import.meta.hot': 'undefined',
          'process.versions.node': 'undefined',
          'typeof process': '"undefined"',

          'import.meta.url': '$$__HIDE_IMPORT_META_URL_FROM_ESBUILD_$$',
          'import.meta.resolve': '$$__HIDE_IMPORT_META_RESOLVE_FROM_ESBUILD_$$',
        }),

        // 3. Transpile to target
        esbuild({ target: 'es2015', minify: true }),

        // 4. Restore import.meta.url and import.meta.resolve
        define({
          $$__HIDE_IMPORT_META_URL_FROM_ESBUILD_$$: 'import.meta.url',
          $$__HIDE_IMPORT_META_RESOLVE_FROM_ESBUILD_$$: 'import.meta.resolve',
        }),
      ].filter(Boolean),
    },

    // Used by snowpack dev: *.svelte development transpiled
    {
      input: {
        [path.basename(pkg['browser:module'], path.extname(pkg['browser:module']))]: inputFile,
      },

      output: {
        format: 'esm',
        ...fileNameConfig(pkg['browser:module']),
        sourcemap: true,
        // include sources in sourcemap for better debugin experience
        preferConst: true,
      },

      external,
      context: 'globalThis', // value of this at the top level
      plugins: [
        logStart('Snowpack', pkg['browser:module']),

        ...plugins,

        svelte({ ...svelteConfig, dev: true, onwarn: ignore }),

        resolve({ dedupe, extensions, mainFields: ['browser:module', ...mainFields] }),

        esbuild({ target: 'es2020' }),

        define({
          // No import.meta.env replacement as that is provided at runtime by snowpack
          ...expand(['import.meta', 'process'], {
            platform: '"browser"',
            browser: 'true',
          }),

          // Delegate process.* to import.meta.*
          ...expand('process', {
            env: `import.meta.env`,
            'versions.node': 'undefined',
          }),

          'typeof process': '"undefined"',
        }),
      ].filter(Boolean),
    },

    // Generate typescript declarations
    dtsFile &&
      pkg.types && {
        input: path.relative(process.cwd(), dtsFile),
        output: {
          format: 'esm',
          file: path.join(destDirectory, pkg.types),
          sourcemap: true,
          preferConst: true,
        },
        plugins: [
          logStart('Typescript', pkg.types),

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

              return null // use default behavior
            },
          },
          dts(),
        ],
      },
  ].filter(Boolean)
}
