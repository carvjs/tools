/* eslint-env node */

const path = require('path')
const paths = require('../lib/package-paths')

const resolveTarget = (to) => {
  if (to.startsWith('./') || to.startsWith('../')) {
    return path.resolve(paths.root, to)
  }

  return to
}

module.exports = function resolve({ bundledDependencies = false, alias = {}, appMode = false }) {
  const resolveAlias = (id) => {
    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id) || id.includes('\0')) {
      return id
    }

    for (const [from, to] of Object.entries(alias)) {
      if (id === from) {
        return resolveTarget(to)
      }

      if (id.startsWith(`${from}/`)) {
        return resolveTarget(to) + id.slice(from.length)
      }
    }

    return id
  }

  const isExternal = (id) => {
    if (appMode) {
      return false
    }

    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id)) {
      return false
    }

    if (bundledDependencies === true) return false

    if (bundledDependencies === false) return true

    for (const bundledDependency of bundledDependencies) {
      if (id === bundledDependency || id.startsWith(`${bundledDependency}/`)) {
        return false
      }
    }

    return true
  }

  return {
    name: 'carv:resolve',

    resolveId(importee, importer) {
      if (importee.includes('\0')) return null

      const id = resolveAlias(importee)

      if (importer && !this.meta.watchMode && isExternal(id)) {
        return { id, external: true }
      }

      return id === importee ? null : this.resolve(id, importer, { skipSelf: true })
    },
  }
}
