/* eslint-env node */

const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const convert = require('convert-source-map')
const { encode, decode } = require('sourcemap-codec')

const STYLE_LOADERS = {
  '.css': async ({ code, id, target, minify, resolveFile }) => {
    const output = await require('postcss')(
      [
        require('./postcss-assets')({ resolveFile }),

        require('postcss-nested')(),

        target !== 'esnext' &&
          require('postcss-preset-env')({
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

        minify &&
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
      ].filter(Boolean),
    ).process(code, {
      from: id,
      to: id,
      map: {
        inline: true,
      },
    })

    return {
      code: output.css,
      warnings: output.warnings(),
    }
  },
  '.scss': async (options) => {
    const result = require('sass').renderSync({
      file: options.id,
      data: options.code,
      outFile: options.id,
      includePaths: [path.join(require('../lib/package-paths').source, 'theme'), ...require('../lib/include-paths')],
      sourceMap: true,
      sourceMapContents: true,
      sourceMapEmbed: true,
    })

    return {
      ...(await STYLE_LOADERS['.css']({...options, code: result.css.toString()})),
      dependencies: result.stats.includedFiles,
    }
  }
}

// eslint-disable-next-line func-names
module.exports = function assets({
  assetFileNames = path.join('assets', '[name]-[hash][extname]'),
  target = 'es2015',
  minify = true,
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

    resolveId(id) {
      if (isStyleModuleId(styleReferenceId, id)) {
        return { id, external: false, moduleSideEffects: 'no-treeshake' }
      }

      return null
    },

    async load(id) {
      if (isStyleModuleId(styleReferenceId, id)) {
        return {
          code: `import(import.meta.ROLLUP_FILE_URL_${styleReferenceId})`,
          map: '',
        }
      }

      if (id.includes('\0')) return null
      if (id.includes('/node_modules/')) return null

      const extname = path.extname(id)

      if (/\.(([mc]js|[jt]sx?)|svelte)$/.test(extname)) {
        return null
      }

      if (STYLE_LOADERS[extname]) {
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

      const extname = path.extname(id)

      const loader = STYLE_LOADERS[extname]

      if (loader) {
        const dependencies = new Set()

        const result = await loader({code, id, target, minify, resolveFile: async (dependency, isAtImport) => {
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
        }
        })

        for (const warning of (result.warnings || [])) {
          this.warn(warning)
        }

        for (const dependency of (result.dependencies || [])) {
          this.addWatchFile(dependency)
        }

        code = result.code

        if (!minify) {
          const referenceId = this.emitFile({
            type: 'asset',
            name: path.basename(id, extname) + '.css',
            source: code,
          })

          for (const dependency of [...dependencies, id]) {
            this.addWatchFile(dependency)
            this.addWatchFile(dependency + '.js')
          }

          const loader = [
            [...dependencies]
              .map((dependency) => `import ${JSON.stringify(dependency)}`)
              .join('\n'),
            `import load from ${JSON.stringify(
              path.dirname(require.resolve('@carv/cdn-css-loader/package.json')),
            )}`,
            `const element = await load(import.meta.ROLLUP_FILE_URL_${referenceId})`,
            `import.meta.hot?.dispose(() => element.remove())`,
          ].join('\n')

          return {
            code: loader,
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
            ...[...dependencies].map(
              (dependency) => `import ${JSON.stringify(dependency)}`,
            ),
            `import ${JSON.stringify(toStyleModuleId(styleReferenceId))}`,
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

    renderDynamicImport({ format, moduleId }) {
      if (isStyleModuleId(styleReferenceId, moduleId)) {
        if (format === 'cjs') {
          return { left: 'process.env.NODE_ENV === "test" && require(', right: ')' }
        }

        if (format === 'es') {
          return { left: 'import ', right: '' }
        }

        return {
          left: [`(function(h,e){return `,
                `e=document.createElement('link'),`,
                `e.type='text/css',`,
                `e.rel='stylesheet',`,
                `e.href=new URL(h,(document.currentScript && document.currentScript.src) || document.baseURI).href,`,
                `document.head.appendChild(e),`,
                `e})(`
              ].join(''),
          right: ')' }
      }
    },

    resolveFileUrl({ fileName, referenceId, relativePath }) {
      if (referenceId === styleReferenceId && fileName.endsWith('.css')) {
        // Use generated style file; this should have been generated in the same folder
        const importPath = path.posix.join(
          path.posix.dirname(relativePath),
          path.posix.basename(styleFileName),
        )

        return JSON.stringify(importPath)
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

function toStyleModuleId(styleReferenceId) {
  return '\0' + styleReferenceId
}

function isStyleModuleId(styleReferenceId, id) {
  return styleReferenceId && toStyleModuleId(styleReferenceId) === id
}
