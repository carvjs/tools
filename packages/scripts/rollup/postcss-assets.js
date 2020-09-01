/* eslint-env node */

const postcss = require('postcss')
const valueParser = require('postcss-value-parser')

module.exports = postcss.plugin('postcss-assets-plugin', ({ resolveFile }) => {
  return function (root) {
    const pending = []

    root.walkAtRules('import', (rule) => {
      const parsed = valueParser(rule.params)

      let found = false
      parsed.walk((node) => {
        if (found) return false

        if (node.type === 'function' && node.value === 'url') {
          // Keep url imports as is
          found = true
          return false
        }

        if (node.type === 'string') {
          found = true
          handleAsset(rule, parsed, node, (resolved) => {
            if (resolved === true) {
              rule.remove()
            } else {
              rule.params = resolved
            }
          })
        }

        // Prevent traversal of descendent nodes
        return node.type === 'function' && node.value === 'url'
      })
    })

    root.walkDecls((rule) => {
      // Fast first pass to detect urls (`url()`) in the value
      if (!rule.value.includes('url(')) return

      const parsed = valueParser(rule.value)

      parsed.walk((node) => {
        if (
          node.type === 'function' &&
          node.value === 'url' &&
          node.nodes.length === 1 &&
          (node.nodes[0].type === 'string' || node.nodes[0].type === 'word')
        ) {
          handleAsset(rule, parsed, node.nodes[0], (resolved) => {
            rule.value = resolved
          })

          // Prevent traversal of descendent nodes
          return false
        }
      })
    })

    if (pending.length > 0) {
      return Promise.all(pending)
    }

    function handleAsset(rule, parsed, node, apply) {
      const url = node.value

      if (isAbsolute(url)) return

      const isAtImport = rule.type === 'atrule' && rule.name === 'import'

      const {
        groups: { path, parameters = '' },
      } = /^(?<path>[^#?]+)(?<parameters>.+)?$/.exec(url) || { groups: { path: url } }

      const isRelative = url.startsWith('./') || url.startsWith('../')

      const id = path.startsWith('~')
          ? path.slice(1) // Node module
          : isRelative
          ? path
          : './' + path

      pending.push(
        resolveFile(id, isAtImport)
        .then((resolved) => {
          if (resolved || path.startsWith('~') || isRelative) {
            return resolved
          }

          return resolveFile(path, isAtImport)
        })
        .then((resolved) => {
          if (resolved === true) {
            return apply(resolved)
          }

          if (resolved) {
            node.value = resolved + parameters
            return apply(parsed.toString())
          }

          let message = `Could not resolve: "${url}".`

          if (!isRelative) {
            message += ` If this is a relative dependency prefix it with "./".`
          }

          throw rule.error(message)
        }),
      )
    }
  }
})

function isAbsolute(url) {
  return (
    // Absolute urls
    url.startsWith('/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    // Data uris
    url.startsWith('data:')
  )
}
