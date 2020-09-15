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

    // Work around export from bug in esbuild transform
    const hasExportFrom = /\bexport\s*{[^}]+}\s*from\b/.test(source)

    if (hasExportFrom) {
      const [imports, exports] = global.__ES_MODULE_LEXER__PARSE(source)

      if (imports.length + exports.length) {
        const external = []

        for (const location of imports) {
          let id = source.slice(location.s, location.e)

          if (id.startsWith('"') || id.startsWith("'") || id.startsWith('`')) {
            id = id.slice(1)
          }

          if (id.endsWith('"') || id.endsWith("'") || id.endsWith('`')) {
            id = id.slice(0, -1)
          }

          if (
            filename &&
            (id.startsWith('./') || id.startsWith('../') || id === '.' || id === '..')
          ) {
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

          printWarnings(filename, warnings)

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
      target,
      sourcemap: 'external',
    })

    printWarnings(filename, warnings)

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

function printWarnings(filename, warnings) {
  if (filename) {
    filename = path.relative(process.cwd(), filename) + ':'
  }

  for (const warning of warnings) {
    if (warning.text === 'Unsupported source map comment') {
      continue
    }

    let message = `[esbuild]`

    message += ` (${filename}`
    if (warning.location) {
      message += `${warning.location.line}:${warning.location.column}`
    }

    message += `) ${warning.text}`

    console.warn(message)
  }
}
