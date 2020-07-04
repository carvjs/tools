import { promises as fs } from 'fs'
import path from 'path'

import json from '@rollup/plugin-json'
import yaml from '@rollup/plugin-yaml'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import svelte from 'rollup-plugin-svelte'
import dts from 'rollup-plugin-dts'

import relocateAssets from './plugin-relocate-assets'
import keepSvelte from './plugin-keep-svelte'

const ignore = () => {}

export default async function () {
  const srcDirectory = process.env.BUILD_SRC_DIRECTORY
  const destDirectory = process.env.BUILD_DEST_DIRECTORY
  const inputFile = process.env.BUILD_INPUT_FILE || '/_dist_/index'

  const dtsFile = process.env.BUILD_DTS_FILE

  const pkg = JSON.parse(
    await fs.readFile(path.join(destDirectory, 'package.json'), { encoding: 'utf-8' }),
  )

  const svelteConfig = pkg.svelte && require(path.resolve(process.cwd(), 'svelte.config.js'))

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
    relocateAssets(),

    // TODO inject import.meta.env
    // rollup hook resolveImportMeta
    // {
    //   'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    //   'process.versions.node': 'undefined',
    //   'process.platform': JSON.stringify('browser'),
    //    only SNOWPACK_PUBLIC_*, MODE, NODE_ENV
    //   'process.env.': '({}).',
    //    import.meta.env
    //    'import.meta.hot': 'undefined',
    //   'typeof process': 'undefined',
    // },

    resolve({
      dedupe: ['svelte', '@carv/runtime'],
    }),

    commonjs(),
  ]

  return [
    // Used by nodejs: *.svelte production transpiled
    // No sourcemap to debug within node_modules
    {
      input: {
        [path.basename(pkg.main, path.extname(pkg.main))]: inputFile,
      },

      output: [
        {
          format: 'esm',
          dir: path.join(destDirectory, path.dirname(pkg.exports['.'].default)),
          assetFileNames: '_/[name]-[hash][extname]',
          preferConst: true,
        },

        {
          format: 'cjs',
          dir: path.join(destDirectory, path.dirname(pkg.main)),
          assetFileNames: '_/[name]-[hash][extname]',
          preferConst: true,
        },
      ].filter(Boolean),

      external,
      context: 'global', // value of this at the top level
      plugins: [
        ...plugins,

        pkg.svelte &&
          svelte({
            ...svelteConfig,
            dev: false,
            onwarn(warning) {
              // Ignore warning for missing export declartion it maybe a module context export
              if (warning.code === 'missing-declaration') {
                return
              }

              console.warn(`[${warning.code}] ${warning.message}\n${warning.frame}`)
            },
          }),

        esbuild({ target: 'es2019' }),
      ].filter(Boolean),
    },

    pkg['esnext'] && {
      input: {
        [path.basename(pkg['esnext'], path.extname(pkg['esnext']))]: inputFile,
      },

      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(pkg['esnext'])),
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        compact: true,
      },

      external,
      context: 'globalThis', // value of this at the top level
      plugins: [
        ...plugins,

        pkg.svelte && svelte({ ...svelteConfig, dev: false, onwarn: ignore }),

        esbuild({ target: 'esnext', minify: true }),
      ].filter(Boolean),
    },

    // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
    pkg.module && {
      input: {
        [path.basename(pkg.module, path.extname(pkg.module))]: inputFile,
      },

      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(pkg.module)),
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        compact: true,
      },

      external,
      context: 'window', // value of this at the top level
      plugins: [
        ...plugins,

        pkg.svelte && svelte({ ...svelteConfig, dev: false, onwarn: ignore }),

        esbuild({ target: 'es2015', minify: true }),
      ].filter(Boolean),
    },

    // Used by snowpack dev: *.svelte development transpiled
    pkg['browser:module'] && {
      input: {
        [path.basename(pkg['browser:module'], path.extname(pkg['browser:module']))]: inputFile,
      },

      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(pkg['browser:module'])),
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
        // include sources in sourcemap for better debugin experience
        preferConst: true,
      },

      external,
      context: 'globalThis', // value of this at the top level
      plugins: [
        ...plugins,

        pkg.svelte && svelte({ ...svelteConfig, dev: false, onwarn: ignore }),

        esbuild({ target: 'es2015' }),
      ].filter(Boolean),
    },

    // Used by svelte and jest: point to untranspiled *.svelte
    pkg.svelte && {
      input: {
        [path.basename(pkg['svelte'], path.extname(pkg['svelte']))]: inputFile,
      },

      // For svelte we need to copy *.svelte files
      // As they may import from other files we need to transpile the whole source directory
      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(pkg.svelte)),
        preserveModules: true,
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        compact: true,
      },

      external,
      plugins: [
        keepSvelte({ destDirectory }),
        ...plugins,
        esbuild({ target: 'esnext', minify: true }),
      ],
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
