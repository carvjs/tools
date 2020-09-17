/* eslint-env node */

const path = require('path')

const { startService } = require('esbuild')

// 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'text' | 'base64' | 'file' | 'dataurl' | 'binary';
const LOADERS = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.mjs': 'js',
  '.cjs': 'js',
  '.json': 'json',
}

let servicePromise

async function transform(code, { platform /* not supported by transform */, ...options }) {
  if (!servicePromise) {
    servicePromise = startService()
  }

  return (await servicePromise).transform(code, options)
}

exports.stopService = async () => {
  if (servicePromise) {
    ;(await servicePromise).stop()
    servicePromise = undefined
  }
}

require('signal-exit')(exports.stopService)

exports.transform = async (code, fileName, options, context) => {
  const hideImportMeta =
    options.format === 'esm' && options.target < 'es2020' && /\bimport\.meta\b/.test(code)

  if (hideImportMeta) {
    const output = await require('rollup-plugin-define')({
      replacements: {
        'import.meta': '$$__HIDE_IMPORT_META_FROM_ESBUILD_$$',
      },
    }).transform.call(context, code, fileName)

    if (output) {
      code = output.code
    }
  }

  const result = await transform(code, {
    sourcefile: fileName,
    loader: options.loader || (fileName && LOADERS[path.extname(fileName)]) || 'ts',
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

      context.warn(message)
    }
  }

  // The file had no js (like a type only file)
  if (!result.js) {
    return { code: '', map: null }
  }

  if (hideImportMeta) {
    const output = await require('rollup-plugin-define')({
      replacements: {
        $$__HIDE_IMPORT_META_FROM_ESBUILD_$$: 'import.meta',
      },
    }).transform.call(context, result.js, fileName)

    if (output) {
      return output
    }
  }

  return {
    code: result.js,
    map: result.jsSourceMap || null,
  }
}
