/* eslint-env node */

const path = require('path')
const fs = require('fs')
const { createHash } = require('crypto')

const { buildSync, transformSync } = require('esbuild')

const THIS_FILE = fs.readFileSync(__filename)

const target = require('../lib/current-node-target')

// TODO esbuild: MR that adds cjs output to transform (including import.meta.url)
module.exports = {
  process(source, filename) {
    if (filename === __filename) {
      return source
    }

    const isESM = /\bimport|export\b/.test(source)

    if (isESM) {
      const [imports] = global.__ES_MODULE_LEXER__PARSE(source)

      if (imports.length > 0) {
        const external = []

        for (const location of imports) {
          let id = source.slice(location.s, location.e)

          if (id.startsWith('"') || id.startsWith("'") || id.startsWith('`')) {
            id = id.slice(1)
          }

          if (id.endsWith('"') || id.endsWith("'") || id.endsWith('`')) {
            id = id.slice(0, -1)
          }

          if ((filename && id.startsWith('./')) || id.startsWith('../')) {
            external.push(path.resolve(path.dirname(filename), id))
          } else {
            external.push(id)
          }
        }

        let directory

        try {
          if (!filename) {
            directory = fs.mkdtempSync('jest-transform-esbuild-')
            filename = path.join(directory, 'x.js')
            fs.writeFileSync(filename, source)
          }

          // If (filename.endsWith('/jest-transform-esbuild.test.js')) {
          //   console.log(filename, {external})
          // }

          const { outputFiles, warnings } = buildSync({
            entryPoints: [filename],
            // Mirror directory structure
            // src/test/a.js
            //  import './x.js'
            // ;esbuild;src/test/a.js
            //  import '../../src/test/x.js'
            outdir: './;esbuild;' + path.relative(process.cwd(), path.dirname(filename)),
            bundle: true,
            format: 'cjs',
            platform: 'node',
            target,
            sourcemap: 'inline',
            write: false,
            external,
          })

          printWarnings(warnings)

          // If (filename.endsWith('/a.js')) {
          //   console.log('build', filename)
          //   console.log(Buffer.from(outputFiles[0].contents).toString())
          // }
          return Buffer.from(outputFiles[0].contents).toString()
        } finally {
          if (directory) {
            fs.rmdirSync(directory, { recursive: true })
          }
        }
      }
    }

    const { js, jsSourceMap, warnings } = transformSync(source, {
      sourcefile: filename,
      format: 'cjs',
      platform: 'node',
      target,
      sourcemap: 'external',
    })

    printWarnings(warnings)

    // Console.log('transform', filename)
    return { code: js, map: jsSourceMap }
  },
  getCacheKey(fileData, filename, configString, cacheKeyOptions) {
    const { rootDir } = cacheKeyOptions
    return createHash('md5')
      .update(THIS_FILE)
      .update('\0', 'utf8')
      .update(configString)
      .update('\0', 'utf8')
      .update(path.relative(rootDir, filename))
      .update('\0', 'utf8')
      .update(fileData)
      .digest('hex')
  },
}

function printWarnings(warnings) {
  for (const warning of warnings) {
    let message = `[esbuild]`

    if (warning.location) {
      message += ` (${warning.location.line}:${warning.location.column})`
    }

    message += ` ${warning.text}`

    console.warn(message)
  }
}
