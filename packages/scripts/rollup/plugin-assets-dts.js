/* eslint-env node */

const fs = require('fs/promises')
const path = require('path')

module.exports = function assetDts({ inputFile, typesDirectory }) {
  return {
    name: 'carv:assets.d.ts',

    async resolveId(source, importer) {
      if (!importer) return null

      const resolved = await this.resolve(source, importer, { skipSelf: true })

      if (resolved) return resolved

      // Generate *.d.ts file for that asset
      const targetFile = path.resolve(path.dirname(importer), source)
      const sourceFile = path.resolve(
        path.dirname(inputFile),
        path.relative(typesDirectory, targetFile),
      )

      const extname = path.extname(source)

      // Defaults to plain asset which exports its name as string
      let code = `declare const url: string;\nexport = url;`

      if ((extname === '.css' || extname === '.scss') && source.endsWith('.module' + extname)) {
        const loader = require('../lib/style-loaders')[extname]

        if (loader) {
          const { classNames } = await loader({
            code: await fs.readFile(sourceFile, 'utf-8'),
            sourceFile,
            target: 'esnext',
            minify: false,
            dev: false,
            modules: true,
          })

          const definition = classNames
            ? '{\n' +
              Object.keys(classNames)
                .map((className) => `  ${JSON.stringify(className)}: string`)
                .join(';\n') +
              '\n}'
            : 'Record<string, string>'

          code = `declare const classNames: ${definition};\nexport = classNames;`
        }
      }

      // Write dts file
      await fs.writeFile(targetFile + '.d.ts', code)

      return this.resolve(source, importer, { skipSelf: true })
    },
  }
}
