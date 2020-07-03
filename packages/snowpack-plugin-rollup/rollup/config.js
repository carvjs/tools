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
    //   'process.env.': '({}).',
    //    import.meta.env
    //    'import.meta.hot': 'false',
    //   'typeof process': 'undefined',
    // },

    resolve({
      dedupe: ['svelte', '@carv/runtime'],
    }),

    commonjs(),

    esbuild({
      // minify: process.env.NODE_ENV === 'production',
      target: 'esnext',
    }),
  ]

  return [
    // Used by nodejs and rollup: *.svelte production transpiled
    {
      input: {
        [path.basename(inputFile, path.extname(inputFile))]: inputFile,
      },

      output: [
        {
          format: 'esm',
          dir: path.join(destDirectory, path.dirname(pkg.module)),
          entryFileNames: path.basename(pkg.module),
          assetFileNames: '_/[name]-[hash][extname]',
          sourcemap: true,
        },

        {
          format: 'cjs',
          dir: path.join(destDirectory, path.dirname(pkg.main)),
          entryFileNames: path.basename(pkg.main),
          assetFileNames: '_/[name]-[hash][extname]',
          sourcemap: true,
        },
      ].filter(Boolean),

      external,
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
      ].filter(Boolean),
    },

    // Used by snowpack dev: *.svelte development transpiled
    pkg['browser:module'] && {
      input: {
        [path.basename(inputFile, path.extname(inputFile))]: inputFile,
      },

      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(pkg['browser:module'])),
        entryFileNames: path.basename(pkg['browser:module']),
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
      },

      external,
      plugins: [
        ...plugins,

        pkg.svelte &&
          svelte({
            ...svelteConfig,
            dev: true,
            onwarn: ignore,
          }),
      ].filter(Boolean),
    },

    // Used by svelte and jest: point to untranspiled *.svelte
    pkg.svelte && {
      input: inputFile,

      // For svelte we need to copy *.svelte files
      // As they may import from other files we transpile the while source directory
      output: {
        format: 'esm',
        dir: path.join(destDirectory, path.dirname(inputFile)),
        preserveModules: true,
        assetFileNames: '_/[name]-[hash][extname]',
        sourcemap: true,
      },

      external,
      plugins: [keepSvelte({ destDirectory }), ...plugins],
    },

    // Generate typescript declarations
    dtsFile &&
      pkg.types && {
        input: path.relative(process.cwd(), dtsFile),
        output: {
          format: 'esm',
          file: path.join(destDirectory, pkg.types),
          sourcemap: true,
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
