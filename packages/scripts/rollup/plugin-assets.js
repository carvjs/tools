/* eslint-env node */

const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const convert = require('convert-source-map')
const { encode, decode } = require('sourcemap-codec')
const STYLE_LOADERS = require('../lib/style-loaders')

module.exports = function assets({
  assetFileNames = 'assets/[name]-[hash][extname]',
  target = 'es2015',
  minify = true,
  platform = 'browser',
  dev = false, // eslint-disable-line unicorn/prevent-abbreviations
  useLoader = false,
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
    name: 'carv:assets',

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
        const loader = useLoader
          ? generateLoader(styleReferenceId)
          : `import(import.meta.ROLLUP_FILE_URL_${styleReferenceId})`

        return {
          code: loader,
          map: '',
        }
      }

      if (id.includes('\0')) return null
      // TODO in mode=app handle all assets
      if (id.includes('/node_modules/')) return null

      const extname = path.extname(id)
      if (/\.(([mc]js|[jt]sx?)|json|svelte)$/.test(extname)) {
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

        const result = await loader({
          code,
          id,
          target,
          minify,
          dev,
          modules: id.endsWith('.module' + extname),
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
        })

        for (const warning of result.warnings || []) {
          this.warn(warning)
        }

        for (const dependency of result.dependencies || []) {
          this.addWatchFile(dependency)
        }

        code = result.code

        const exportedClassNames =
          result.classNames &&
          [
            `const classes = ${JSON.stringify(result.classNames, null, 2)};`,
            platform === 'node'
              ? `export default process.env.NODE_ENV === 'test' ? /* @__PURE__ */ Object.keys(classes).reduce((s,k)=>(s[k]=k,s),{}) : classes;`
              : `export default classes;`,
          ].join('\n')

        if (this.meta.watchMode) {
          const referenceId = this.emitFile({
            type: 'asset',
            fileName: toAssetFileName(id, code, assetFileNames, '.css'),
            // Change extension to ensure it is served as a stylesheet
            name: path.basename(id, extname) + '.css',
            source: code,
          })

          for (const dependency of [...dependencies, id]) {
            this.addWatchFile(dependency)
            this.addWatchFile(dependency + '.js')
          }

          const loader = [
            ...Array.from(dependencies, (dependency) => `import ${JSON.stringify(dependency)}`),
            generateLoader(referenceId),
            exportedClassNames,
          ]
            .filter(Boolean)
            .join('\n')

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
            ...[...dependencies].map((dependency) => `import ${JSON.stringify(dependency)}`),
            `import ${JSON.stringify(toStyleModuleId(styleReferenceId))}`,
            exportedClassNames,
          ]
            .filter(Boolean)
            .join('\n'),
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
          sources.push(...chunk.map.sources)
          sourcesContent.push(...chunk.map.sourcesContent)

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
          left: [
            `(function(h,e){return `,
            `e=document.createElement('link'),`,
            `e.type='text/css',`,
            `e.rel='stylesheet',`,
            `e.href=new URL(h,(document.currentScript && document.currentScript.src) || document.baseURI).href,`,
            `document.head.appendChild(e),`,
            `e})(`,
          ].join(''),
          right: ')',
        }
      }
    },

    resolveFileUrl({ fileName, referenceId, relativePath, format }) {
      if (referenceId === styleReferenceId && fileName.endsWith('.css')) {
        // Use generated style file; this should have been generated in the same folder
        const importPath = path.posix.join(
          path.posix.dirname(relativePath),
          path.posix.basename(styleFileName),
        )

        if (useLoader) {
          const BASE_URL = {
            es: 'import.meta.url',
            system: 'module.meta.url',
            cjs: '__filename',
            umd: '(document.currentScript && document.currentScript.src) || document.baseURI',
          }

          const baseURL = BASE_URL[format] || BASE_URL.umd

          return `new URL(${JSON.stringify(importPath)}, ${baseURL}).href`
        }

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

function toAssetFileName(id, source, assetFileNames, extname = path.extname(id)) {
  const basename = path.basename(id, path.extname(id))

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
  return '\0' + styleReferenceId + '-css-loader'
}

function isStyleModuleId(styleReferenceId, id) {
  return styleReferenceId && toStyleModuleId(styleReferenceId) === id
}

function generateLoader(referenceId) {
  return [
    `import load from ${JSON.stringify(
      path.dirname(require.resolve('@carv/cdn-css-loader/package.json')),
    )}`,
    `const element = await load(import.meta.ROLLUP_FILE_URL_${referenceId})`,
    `import.meta.hot?.dispose(() => element.remove())`,
  ]
    .filter(Boolean)
    .join('\n')
}
