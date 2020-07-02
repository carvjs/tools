import { promises as fs } from 'fs'
import path from 'path'

import json from '@rollup/plugin-json'
import yaml from '@rollup/plugin-yaml'
import dts from 'rollup-plugin-dts'

import snowpack from './plugin-snowpack'

export default async function () {
  const srcDirectory = process.env.BUILD_SRC_DIRECTORY
  const destDirectory = process.env.BUILD_DEST_DIRECTORY
  const inputFile = process.env.BUILD_INPUT_FILE || '/_dist_/index'

  const dtsFile = process.env.BUILD_DTS_FILE

  const pkg = JSON.parse(
    await fs.readFile(path.join(destDirectory, 'package.json'), { encoding: 'utf-8' }),
  )

  return [
    {
      input: {
        [path.basename(pkg.main, '.js')]: inputFile,
      },
      output: [
        {
          format: 'esm',
          dir: path.join(destDirectory, path.dirname(pkg.module)),
          sourcemap: true,
          sourcemapExcludeSources: true,
        },
        {
          format: 'cjs',
          dir: path.join(destDirectory, path.dirname(pkg.main)),
          sourcemap: true,
          sourcemapExcludeSources: true,
        },
      ],

      plugins: [
        json({ preferConst: true }),
        yaml({ preferConst: true }),
        snowpack({ srcDirectory, destDirectory, inputFile }),
      ],
    },
    dtsFile &&
      pkg.types && {
        input: path.relative(process.cwd(), dtsFile),
        output: [{ file: path.join(destDirectory, pkg.types), format: 'es' }],
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
