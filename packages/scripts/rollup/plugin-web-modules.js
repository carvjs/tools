/* eslint-env node */
'use strict'

// [@\w] - Match a word-character or @ (valid package name)
// (?!.*(:\/\/)) - Ignore if previous match was a protocol (ex: http://)
const BARE_SPECIFIER_REGEX = /^[@\w](?!.*(:\/\/))/

function isBareImport(id) {
  if (id.includes('\0')) return false

  return BARE_SPECIFIER_REGEX.test(id)
}

module.exports = function webModulesPlugin({
  prefix = 'web_modules',
  baseUrl = 'http://localhost:5000/@hot',
  ...config
}) {
  const resolveCache = new Map()

  const webModules = new Map()

  let output

  return {
    name: 'web-modules',

    resolveId(source, importer) {
      if (!importer || source.includes('\0')) return

      if (source.includes(`/${prefix}/`)) return source

      const key = [source, importer].join('\0')

      if (resolveCache.has(key)) {
        return resolveCache.get(key)
      }

      if (isBareImport(source) || source.includes('/node_modules/')) {
        return this.resolve(source, importer, { skipSelf: true }).then((resolution) => {
          if (!resolution) return null
          if (resolution.external) return resolution
          if (!resolution.id.includes('/node_modules/')) return resolution
          if (resolution.id.includes('\0')) return resolution

          if (source.includes('/node_modules/')) {
            source = source.slice(source.indexOf('/node_modules/') + '/node_modules/'.length)
          }

          const fileName = `${prefix}/${source}${source.endsWith('.js') ? '' : '.js'}`

          let webModule = webModules.get(fileName)

          if (!webModule) {
            this.addWatchFile(resolution.id)

            webModule = { source, importer, fileName, id: resolution.id }

            output = undefined

            webModules.set(fileName, webModule)
          }

          const resolved = {
            id: `${baseUrl}/${fileName}`,
            external: true,
            moduleSideEffects: resolution.moduleSideEffects,
            meta: { ...resolution.meta, 'web-modules': webModule },
          }

          resolveCache.set(key, resolved)

          return resolved
        })
      }
    },

    watchChange(id) {
      for (const [key, resolution] of resolveCache.entries()) {
        if (resolution.meta['web-modules'].id === id) {
          resolveCache.delete(key)
          output = undefined
        }
      }

      for (const [fileName, webModule] of webModules.entries()) {
        if (webModule.id === id) {
          webModules.delete(fileName)
          output = undefined
        }
      }
    },

    async buildEnd(error) {
      if (error) throw error

      if (webModules.size > 0 && !output) {
        const input = {}

        for (const [fileName, webModule] of webModules.entries()) {
          input[fileName] = webModule.id
        }

        const rollup = require('rollup')

        const bundle = await rollup.rollup({
          ...config,
          input,
          onwarn: (warning) => {
            // Ignore certain warnings
            if (
              ['MIXED_EXPORTS', 'CIRCULAR_DEPENDENCY', 'UNUSED_EXTERNAL_IMPORT'].includes(
                warning.code,
              )
            ) {
              return
            }

            if (warning.plugin === 'svelte' && warning.message.startsWith('A11y:')) {
              return
            }

            this.warn(warning, warning.loc)
          },
        })

        const result = await bundle.generate({
          ...config.output,
          entryFileNames: '[name]',
          chunkFileNames: `${prefix}/-/[name]-[hash].js`,
        })

        output = result.output

        for (const chunk of output) {
          if (chunk.type === 'chunk') {
            // Because rollup-plugin-hot wrap entry chunks
            // un-mark entry chunks
            chunk.isEntry = false
          }
        }
      }
    },

    generateBundle(options, bundle) {
      if (output) {
        for (const chunk of output) {
          // Because rollup-plugin-hot changes the file names
          // we ensure that setting fileName will not effect our chunk object
          bundle[chunk.fileName] = Object.create(chunk)
        }
      }
    },
  }
}
