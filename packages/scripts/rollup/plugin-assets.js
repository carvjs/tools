/* eslint-env node */

const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const convert = require('convert-source-map')
const { encode, decode } = require('sourcemap-codec')

// eslint-disable-next-line func-names
module.exports = function assets({
  assetFileNames = path.join('assets', '[name]-[hash][extname]'),
  target = 'es2015',
} = {}) {
  // The final name of the combined css file
  let styleFileName = null

  // The virtual asset reference to the combined css file
  let styleReferenceId = null

  // All styles to put in the combine css file
  const styleAssets = new Map()

  // Assets from stylesheet
  const emittedAssets = new Map()

  async function resolveAsset(plugin, id) {
    let asset = emittedAssets.get(id)

    if (!asset) {
      asset = emitAsset(plugin, id, assetFileNames)
      emittedAssets.set(id, asset)
    }

    return asset
  }

  return {
    name: 'assets',

    buildStart() {
      styleReferenceId = null
      styleFileName = null
      styleAssets.clear()
      emittedAssets.clear()
    },

    async load(id) {
      if (id.includes('\0')) return null
      if (id.includes('/node_modules/')) return null

      const extname = path.extname(id)

      if (/\.(([mc]js|[jt]sx?)|svelte)$/.test(extname)) {
        return null
      }

      if (extname === '.css') {
        return null // Handled in transform
      }

      const asset = await resolveAsset(this, id)

      return {
        code: `export default import.meta.ROLLUP_FILE_URL_${asset.referenceId}`,
        map: '',
      }
    },

    async transform(code, id) {
      if (id.includes('\0')) return null
      if (id.includes('/node_modules/')) return null

      const extname = path.extname(id)

      if (extname === '.css') {
        const dependencies = new Set()

        const output = await require('postcss')([
          require('./postcss-assets')({
            resolveFile: async (dependency, isAtImport) => {
              const resolved = await this.resolve(dependency, id, { skipSelf: true })

              if (!resolved) {
                return null
              }

              if (resolved.external) {
                return `~${dependency}`
              }

              if (isAtImport && resolved.id.endsWith('.css')) {
                dependencies.add(resolved.id)
                return true
              }

              const asset = await resolveAsset(this, resolved.id)

              return asset.relativePath
            },
          }),

          target !== 'esnext' && require('postcss-preset-env')({
            browsers: require('@carv/polyfills').getBrowserlistForTarget(target),
            // https://preset-env.cssdb.org/features#stage-2
            stage: 2,
            // https://github.com/csstools/postcss-preset-env/blob/master/src/lib/plugins-by-id.js#L36
            features: {
              'any-link-pseudo-class': false,
              'case-insensitive-attributes': false,
              'dir-pseudo-class': false,
              'gray-function': false,
            },
            autoprefixer: {
              // https://github.com/postcss/autoprefixer#options
              grid: true,
            },
          }),

          require('cssnano')({
            preset: require('cssnano-preset-default')({
              calc: false,
              convertValues: false,
              orderedValues: false,
              discardOverridden: false,
              discardDuplicates: false,
              cssDeclarationSorter: false,
            }),
          }),
        ].filter(Boolean)).process(code, {
          from: id,
          to: id,
          map: {
            inline: true,
          },
        })

        for (const warning of output.warnings()) {
          this.warn(warning)
        }

        code = output.css

        const converter = convert.fromSource(code)

        if (converter) {
          styleAssets.set(id, { code: convert.removeComments(code), map: converter.toObject() })
        } else {
          styleAssets.set(id, { code })
        }

        if (!styleReferenceId) {
          styleReferenceId = this.emitFile({
            type: 'asset',
            name: 'style.css',
            source: '',
          })
        }

        return {
          code: [
            [...dependencies]
              .map((dependency) => `import ${JSON.stringify(dependency)}`)
              .join('\n'),
            `import.meta.ROLLUP_FILE_URL_${styleReferenceId}`,
          ].join('\n'),
          map: {
            version: 3,
            file: id,
            sources: [],
            sourcesContent: [],
            names: [],
            mappings: '',
          },
          moduleSideEffects: 'no-treeshake',
        }
      }

      return null
    },

    renderStart() {
      if (!styleReferenceId) return

      // Write out CSS file.
      let result = ''

      const mappings = []
      const sources = []
      const sourcesContent = []

      for (const chunk of styleAssets.values()) {
        if (!chunk.code) continue

        result += chunk.code + '\n'

        if (chunk.map) {
          const index = sources.length
          sources.push(chunk.map.sources[0])
          sourcesContent.push(chunk.map.sourcesContent[0])

          const decoded = decode(chunk.map.mappings)

          if (index > 0) {
            decoded.forEach((line) => {
              line.forEach((segment) => {
                segment[1] = index
              })
            })
          }

          mappings.push(...decoded)
        }
      }

      styleFileName = toAssetFileName('style.css', result, assetFileNames)

      if (sources.length > 0) {
        const mapFileName = styleFileName + '.map'

        this.emitFile({
          type: 'asset',
          fileName: mapFileName,
          source: JSON.stringify({
            version: 3,
            file: path.basename(styleFileName),
            sources: sources.map((source) => path.relative(path.dirname(mapFileName), source)),
            sourcesContent,
            names: [],
            mappings: encode(mappings),
          }),
        })

        result += convert.generateMapFileComment(path.posix.basename(mapFileName), {
          multiline: true,
        })
      }

      this.emitFile({
        type: 'asset',
        fileName: styleFileName,
        source: result,
      })
    },

    resolveFileUrl({ fileName, format, referenceId, relativePath }) {
      if (referenceId === styleReferenceId && fileName.endsWith('.css')) {
        // Use generated style file; this should have been generated in the same folder
        const importPath = path.posix.join(
          path.posix.dirname(relativePath),
          path.posix.basename(styleFileName),
        )
        const importCode = toImport(format, importPath)

        if (importCode) {
          return importCode
        }
      }

      return null
    },

    generateBundle(options, bundle) {
      // Remove virtual style asset
      if (styleReferenceId) {
        delete bundle[this.getFileName(styleReferenceId)]
      }
    },
  }
}

function toImport(format, relativePath) {
  // eslint-disable-next-line default-case
  switch (format) {
    case 'es':
      return `import${JSON.stringify(relativePath)}`

    case 'cjs':
      return `require(${JSON.stringify(relativePath)})`
  }
}

async function emitAsset(plugin, id, assetFileNames) {
  const source = await fs.promises.readFile(id)

  const assetFileName = toAssetFileName(id, source, assetFileNames)

  const referenceId = plugin.emitFile({
    type: 'asset',
    fileName: assetFileName,
    source,
  })

  // Assume all assets are in the same folder
  const relativePath = `./${path.posix.basename(assetFileName)}`

  return { relativePath, referenceId }
}

function toAssetFileName(id, source, assetFileNames) {
  const extname = path.extname(id)
  const basename = path.basename(id, extname)

  return (
    assetFileNames
      .replace('[name]', basename)
      // Like https://github.com/rollup/rollup/blob/19e50af3099c2f627451a45a84e2fa90d20246d5/src/utils/FileEmitter.ts#L48
      .replace(
        '[hash]',
        createHash('sha256').update('asset').update(':').update(source).digest('hex').slice(0, 8),
      )
      .replace('[extname]', extname)
      .replace('[ext]', extname.slice(1))
  )
}
