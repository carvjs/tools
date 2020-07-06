import fs from 'fs-extra'
import path from 'path'

export default function carvAssets({ loadStylesheetModuleID = '@carv/load-stylesheet@1' } = {}) {
  return {
    name: 'carv:assets',

    async load(id) {
      const extname = path.extname(id)

      if (id.includes('/node_modules/')) return null

      if (/\.([tj]sx?|svelte)$/.test(extname)) {
        return null
      }

      if (extname === '.css') {
        return null // handle in transform
      }

      const referenceId = this.emitFile({
        type: 'asset',
        name: path.basename(id),
        source: await fs.readFile(id),
      })

      return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`
    },

    transform(code, id) {
      const extname = path.extname(id)

      if (id.includes('/node_modules/')) return null

      if (extname !== '.css') return null

      // TODO extract sourcemap into own file
      // const result = await require('cssnano').process(code, cssOptions)
      // code = result.css

      // TODO process css https://github.com/sebastian-software/rollup-plugin-rebase/blob/master/src/index.js#L36
      const referenceId = this.emitFile({
        type: 'asset',
        name: path.basename(id),
        source: code,
      })

      return {
        code: `
          import injectStyle from "${loadStylesheetModuleID}"

          export default injectStyle(import.meta.ROLLUP_FILE_URL_${referenceId});
        `,
        map: { mappings: '' },
      }
    },
  }
}
