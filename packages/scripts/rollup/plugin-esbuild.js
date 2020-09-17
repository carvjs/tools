/* eslint-env node */

const { transform, stopService } = require('../lib/esbuild')

module.exports = function esbuild(options) {
  const codeCache = new Map()

  return {
    name: 'carv:esbuild',

    async transform(code, id) {
      if (id.includes('\0')) return null
      if (id.includes('node_modules')) return null

      if (!/.([mc]js|[jt]sx?)$/.test(id)) return null

      if (this.meta.watchMode) {
        const cache = codeCache.get(id)

        if (cache?.code === code) {
          return cache.result
        }
      }

      const result = await transform(
        code,
        id,
        { ...options, target: 'esnext', minify: false },
        this,
      )

      if (result && this.meta.watchMode) {
        codeCache.set(id, { code, result })
      }

      return result
    },

    buildEnd(error) {
      // Stop the service early if there's error
      if (error && !this.meta.watchMode) {
        stopService()
      }
    },

    async renderChunk(code, chunk) {
      if (this.meta.watchMode) {
        const cache = codeCache.get(chunk.fileName)

        if (cache?.code === code) {
          return cache.result
        }
      }

      const result = await transform(code, chunk.fileName, { ...options, loader: 'js' }, this)

      if (result && this.meta.watchMode) {
        codeCache.set(chunk.fileName, { code, result })
      }

      return result
    },

    generateBundle() {
      if (!this.meta.watchMode) {
        stopService()
      }
    },
  }
}
