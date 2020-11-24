/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')

const paths = require('./package-paths')

const EXTNAMES = ['', '.svelte', '.tsx', '.ts', '.mjs', '.jsx', '.js', '.cjs', '.json']

function resolveFile(base) {
  if (!base) return

  for (const extname of EXTNAMES) {
    const file = path.resolve(paths.root, base + extname)

    try {
      const stat = fs.statSync(file)

      if (stat.isDirectory()) {
        return resolveFile(path.join(file, 'index'))
      }

      return file
    } catch (error) {
      if (!(error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
        throw error
      }
    }
  }
}

module.exports = function getInputFile(additional) {
  const manifest = require('./package-manifest')

  return (
    (additional && resolveFile(additional)) ||
    resolveFile(manifest.source) ||
    resolveFile(manifest.svelte) ||
    resolveFile(manifest.main) ||
    resolveFile(path.join(paths.source, require('./unscoped-package-name'))) ||
    resolveFile(paths.source) ||
    fail()
  )
}

function fail() {
  throw new Error('No input file found.')
}
