/* eslint-env node */

const path = require('path')

const { startService } = require('esbuild')

let service

exports.transform = async (code, options) => {
  if (!service) {
    service = await startService()
  }

  return service.transform(code, options)
}

exports.stopService = () => {
  if (service) {
    service.stop()
    service = undefined
  }
}

require('signal-exit')(exports.stopService)

exports.renderChunk = async (code, fileName, options, warn) => {
  const result = await exports.transform(code, {
    sourcefile: fileName,
    loader: 'js',
    target: options.target,
    platform: options.platform,
    minify: options.minify !== false,
    sourcemap: 'external',
  })

  if (result.warnings) {
    for (const warning of result.warnings) {
      let message = ''
      if (warning.location) {
        message += `(${path.relative(process.cwd(), fileName)}:${warning.location.line}:${
          warning.location.column
        }) `
      }

      message += warning.text

      warn(message)
    }
  }

  if (result.js) {
    return {
      code: result.js,
      map: result.jsSourceMap || null,
    }
  }

  return null
}
