/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')

const paths = require('../lib/package-paths')

const EXTNAMES = ['', '.svelte', '.tsx', '.ts', '.mjs', '.jsx', '.js', '.cjs', '.json']

function resolveFile(base) {
  for (const extname of EXTNAMES) {
    const file = path.resolve(paths.root, base + extname)
    if (fs.existsSync(file)) {
      return file
    }
  }
}

module.exports = function getInputFile() {
  const manifest = require('../lib/package-manifest')

  return (
    resolveFile(manifest.source) ||
    resolveFile(manifest.svelte) ||
    resolveFile(manifest.main) ||
    resolveFile(path.join(paths.source, require('./unscoped-package-name'))) ||
    resolveFile(path.join(paths.source, 'index')) ||
    fail()
  )
}

function fail() {
  throw new Error('No input file found.')
}
