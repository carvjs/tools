import { promises as fs } from 'fs'
import path from 'path'

export default function esmWrapper({ file } = {}) {
  // https://nodejs.org/api/esm.html#esm_approach_1_use_an_es_module_wrapper
  return {
    name: 'carv:esm-wrapper',

    async writeBundle(options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.isEntry) {
          const cjsFileName = path.resolve(options.dir, chunk.fileName)
          const esmFileName = path.resolve(options.dir, file)

          const namedExports = chunk.exports.filter((name) => name !== 'default')

          const code = [
            `import cjsModule from ${JSON.stringify(
              path.relative(path.dirname(esmFileName), cjsFileName),
            )}`,
            // each named export
            namedExports.length > 0 && `export const { ${namedExports.join(', ')} } = cjsModule`,
            // default export
            namedExports.length === chunk.exports.length
              ? `export default cjsModule`
              : `export default cjsModule.default`,
          ]
            .filter(Boolean)
            .join('\n')

          await fs.mkdir(path.dirname(esmFileName), { recursive: true })

          await fs.writeFile(esmFileName, code)

          await fs.writeFile(
            path.resolve(path.dirname(esmFileName), 'package.json'),
            JSON.stringify({ type: 'module' }, null, 2),
          )
        }
      }
    },
  }
}
