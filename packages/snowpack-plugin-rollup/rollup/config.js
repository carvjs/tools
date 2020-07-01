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
        },
        {
          format: 'cjs',
          dir: path.join(destDirectory, path.dirname(pkg.main)),
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
        input: dtsFile,
        output: [{ file: path.join(destDirectory, pkg.types), format: 'es' }],
        plugins: [dts()],
      },
  ].filter(Boolean)
}
