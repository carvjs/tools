import { promises as fs } from 'fs'
import path from 'path'

export default function snowpack({
  srcDirectory,
  inputFile,
  loadStylesheetModuleID = '@carv/load-stylesheet@1',
} = {}) {
  const bundled = new Map()
  const externals = new Map()

  return {
    name: 'snowpack',
    async buildStart() {
      bundled.clear()
      externals.clear()
      externals.set(loadStylesheetModuleID, loadStylesheetModuleID)

      const pkg = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'package.json'), { encoding: 'utf-8' }),
      )

      const importMap = JSON.parse(
        await fs.readFile(path.join(srcDirectory, 'web_modules', 'import-map.json'), {
          encoding: 'utf-8',
        }),
      )

      // bundledDependencies are included into the output bundle
      const bundledDependencies = []
        .concat(pkg.bundledDependencies || [])
        .concat(pkg.bundleDependencies || [])

      Object.entries(importMap.imports).forEach(([moduleId, file]) => {
        const source = path.join('/web_modules', file)

        // check if bundled
        for (const bundledDependency of bundledDependencies) {
          if (moduleId === bundledDependency || moduleId.startsWith(`${bundledDependency}/`)) {
            bundled.set(source, path.join(srcDirectory, source.slice(1)))
            return
          }
        }

        // mark external
        // /web_modules/module
        externals.set(source, moduleId)
        // /project/directory/.build/web_modules/module
        externals.set(path.join(srcDirectory, source.slice(1)), moduleId)
      })
    },

    async resolveId(source, importer) {
      if (source === inputFile) {
        source = source.replace(/^(?:.\/)?src\//, '/_dist_/').replace(/(\..+)$/, '.js')
      }

      if (importer && source.startsWith('.')) {
        source = path.resolve(path.dirname(importer), source)
      }

      // everything is external unless it is not
      if (externals.has(source)) {
        return { id: externals.get(source), external: true }
      }

      if (bundled.has(source)) {
        return bundled.get(source)
      }

      if (source.startsWith('/__snowpack__/')) {
        source = path.join(srcDirectory, source.slice(1))
      }

      if (source.startsWith('/_dist_/')) {
        source = path.join(srcDirectory, source.slice(1))
      }

      // snowpack resources
      // They are names by like: `${basename(source)}.${type}.js`
      // - import './if-error.css.js'; => import './if-error.css';
      if (path.extname(source) === '.js') {
        const resource = source.replace(/(\.[^\.]+)\.js$/, '$1')

        try {
          await fs.access(resource)

          // does exist -> use that resource
          return resource
        } catch {
          // does not exist - delegate to other resolvers
        }
      }

      return this.resolve(source, importer, { skipSelf: true })
    },

    async load(id) {
      const extname = path.extname(id)

      if (extname === '.js') {
        return null // use default behavior
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
  }
}
