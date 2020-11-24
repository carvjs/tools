/* eslint-env node */

const path = require('path')

module.exports = function logStart(options, outputDirectory, useSvelte) {
  return {
    name: 'carv:log-start',
    options() {
      console.log(format(options, outputDirectory, useSvelte))

      if (options.esmWrapper) {
        console.log(
          format({ ...options, format: 'esm', file: options.esmWrapper }, outputDirectory),
        )
      }
    },
  }
}

function format(
  options,
  outputDirectory = require('@carv/bundle/lib/package-paths').dist,
  useSvelte = require('@carv/bundle/lib/package-use').svelte,
) {
  return [
    options.platform,
    options.format,
    options.target,
    useSvelte && (options.svelte?.dev ? 'dev' : 'prod'),
    '=>',
    path.relative(process.cwd(), path.join(outputDirectory, options.file)),
  ]
    .filter(Boolean)
    .join(' ')
}
