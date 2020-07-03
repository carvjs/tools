import fs from 'fs-extra'
import path from 'path'

export default function snowpack({ destDirectory }) {
  const svelteFiles = new Set()

  return {
    name: 'keep-svelte',

    buildStart() {
      svelteFiles.clear()
    },

    async resolveId(source, importer) {
      if (
        source.endsWith('.svelte') &&
        (source.startsWith('./') || source.startsWith('../') || path.isAbsolute(source))
      ) {
        const id = path.resolve(importer ? path.dirname(importer) : process.cwd(), source)

        svelteFiles.add(id)

        return { id, external: true }
      }

      return null
    },

    writeBundle(options) {
      // only run for svelte src copy output
      if (options.preserveModules && options.dir) {
        return Promise.all(
          [...svelteFiles].map(async (src) => {
            const dest = path.join(destDirectory, path.relative(process.cwd(), src))

            await fs.copy(src, dest)
          }),
        )
      }
    },
  }
}
