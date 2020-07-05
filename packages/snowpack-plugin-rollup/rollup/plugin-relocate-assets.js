import fs from 'fs-extra'
import path from 'path'

export default function snowpack({ loadStylesheetModuleID = '@carv/load-stylesheet@1' } = {}) {
  return {
    name: 'relocate-assets',

    async load(id) {
      const extname = path.extname(id)

      if (id.includes('/node_modules/')) return

      if (/\.([tj]sx?|svelte)$/.test(extname)) {
        return null // use default behavior
      }

      // TODO process css https://github.com/sebastian-software/rollup-plugin-rebase/blob/master/src/index.js#L36
      const referenceId = this.emitFile({
        type: 'asset',
        name: path.basename(id),
        source: await fs.readFile(id),
      })

      if (extname === '.css') {
        return `
          import injectStyle from "${loadStylesheetModuleID}"

          export default injectStyle(import.meta.ROLLUP_FILE_URL_${referenceId});
        `
      }

      return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`
    },
  }
}
