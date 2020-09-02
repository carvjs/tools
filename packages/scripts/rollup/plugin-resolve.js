/* eslint-env node */

const path = require('path')

module.exports = function resolve({bundledDependencies = false, alias = {}}) {
  const resolveAlias = (id) => {
    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id) || id.includes('\0')) {
      return id
    }

    for (const [from, to] of Object.entries(alias)) {
      if (id === from) {
        return to
      }

      if (id.startsWith(`${from}/`)) {
        return to + id.slice(from.length)
      }
    }

    return id
  }

  const isExternal = (id, parentId) => {
    // Entry is never external
    if (!parentId) return false

    if (id.startsWith('./') || id.startsWith('../') || path.isAbsolute(id) || id.includes('\0')) {
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
    name: 'resolve',

    resolveId(importee, importer) {
      if (importee.includes('\0')) return null

      const id = resolveAlias(importee)

      if (isExternal(id, importer)) {
        return { id, external: true }
      }

      return this.resolve(id, importer, { skipSelf: true })
    }
  }
}
