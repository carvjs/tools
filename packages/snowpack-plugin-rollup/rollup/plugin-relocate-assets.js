import { promises as fs } from 'fs'
import path from 'path'

export default function snowpack({
  destDirectory,
  loadStylesheetModuleID = '@carv/load-stylesheet@1',
}) {
  const assets = new Set()

  return {
    name: 'relocate-assets',

    async load(id) {
      const extname = path.extname(id)

      if (['.js', '.jsx', '.ts', '.tsx'].includes(extname)) {
        return null // use default behavior
      }

      if (id.endsWith('.svelte')) {
        // copy as is
        assets.add(id)
        return null
      }

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

    writeBundle(options) {
      // only run for svelte src copy output
      if (options.preserveModules) {
        return Promise.all(
          [...assets].map((id) =>
            fs.copyFile(id, path.join(destDirectory, path.relative(process.cwd(), id))),
          ),
        )
      }
    },
  }
}
