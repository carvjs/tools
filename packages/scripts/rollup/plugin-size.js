/* eslint-env node */

const path = require('path')
const zlib = require('zlib')
const {promisify} = require('util')
const brotliCompress = promisify(zlib.brotliCompress)

const prettyBytes = require('pretty-bytes')

const TEXT_TYPE_REGEXP = /^text\/|\+(?:json|text|xml)$/i

const BROTLI_OPTIONS = {
  [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
}

module.exports = function size() {
  return {
    name: 'carv:size',
    async writeBundle(options, bundle) {
      if (this.meta.watchMode) return

      const compressible = require('compressible')
      const mime = require('mime-types')

      const entries = []
      const chunks = []
      const styles = []
      const assets = []

      await Promise.all([...Object.entries(bundle)].map(async ([fileName, chunk]) => {
        if (chunk.type === 'chunk') {
          const size = Buffer.byteLength(chunk.code)
          const compressed = await compress(chunk.code, size, 'application/javascript')

          if (chunk.isEntry) {
            entries.push({fileName, size, compressed})
          } else {
            chunks.push({fileName, size, compressed})
          }
        } else if (path.extname(fileName) !== '.map') {
          const size = typeof chunk.source === 'string' ? Buffer.byteLength(chunk.source) : chunk.source.length

          const mimeType = mime.lookup(fileName) || 'application/octet-stream'

          const compressed = compressible(mimeType) ? await compress(chunk.source, size, mimeType) : undefined

          if (path.extname(fileName) === '.css') {
            styles.push({fileName, size, compressed})
          } else {
            assets.push({fileName, size, compressed})
          }
        }
      }))


      console.log()
      console.log('Size Summary')
      console.log('============')

      console.log()
      console.log('  Javascript:', summaryOf([...entries, ...chunks]))
      entries.sort(bySize).map(stringify).forEach(s => console.log('    -', s))
      chunks.sort(bySize).map(stringify).forEach(s => console.log('    -', s))

      if (styles.length > 0) {
        console.log()
        console.log('  Styles:', summaryOf(styles))
        styles.sort(bySize).map(stringify).forEach(s => console.log('    -', s))
      }

      if (assets.length > 0) {
        console.log()
        console.log('  Assets:', summaryOf(assets))
        assets.sort(bySize).map(stringify).forEach(s => console.log('    -', s))
      }

      console.log()
    },
  }
}

async function compress(content, size, mimeType) {
  const buffer = await brotliCompress(content, {
    ...BROTLI_OPTIONS,
    [zlib.constants.BROTLI_PARAM_MODE]: getBrotliMode(mimeType),
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: size,
  })

  return buffer.length
}

function getBrotliMode(mimeType) {
  if (mimeType) {
    if (TEXT_TYPE_REGEXP.test(mimeType)) return zlib.constants.BROTLI_MODE_TEXT

    if (mimeType === 'font/woff2') return zlib.constants.BROTLI_MODE_FONT
  }

  return zlib.constants.BROTLI_MODE_GENERIC
}

function bySize(a, b) {
  return b.size - a.size
}

function stringify(entry) {
  let result = `${entry.fileName} - ${prettyBytes(entry.size)}`

  if (entry.compressed) {
    result += ` (${prettyBytes(entry.compressed)})`
  }

  return result
}

function summaryOf(entries) {
  // eslint-disable-next-line unicorn/no-reduce
  const size = entries.reduce((size, info) => size + info.size, 0)

  // eslint-disable-next-line unicorn/no-reduce
  const compressed = entries.reduce((compressed, info) => compressed + (info.compressed || info.size), 0)

  return `${prettyBytes(size)} (${prettyBytes(compressed)})`
}
