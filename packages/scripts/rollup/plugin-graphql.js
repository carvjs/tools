/* eslint-env node */

const path = require('path')

module.exports = function graphql({ tsconfigPath }) {
  const cache = new Map()

  return {
    name: 'graphql',

    generateBundle(outputOptions, bundle) {
      if (!(this.meta.watchMode && outputOptions.preserveModules)) return
      const changed = Object.values(bundle)
        .filter(chunk => chunk.type === 'chunk')
        .filter(({facadeModuleId, code}) => {
          const extname = facadeModuleId && path.isAbsolute(facadeModuleId) && !facadeModuleId.includes('node_modules') && path.extname(facadeModuleId)

          const isTypescript = extname && (extname === '.ts' || extname === '.tsx')

          if (!isTypescript) return false

          // Check if gql tag is used
          if (!/\bgql`/.test(code)) return false

          if (cache.get(facadeModuleId) === code) return false

          cache.set(facadeModuleId, code)

          return true
        })

      if (changed.length > 0) {
        const { typegenCommand } = require('ts-graphql-plugin/lib/cli/commands/typegen')

        return typegenCommand({options: {project: tsconfigPath}})
      }
    },
  }
}
