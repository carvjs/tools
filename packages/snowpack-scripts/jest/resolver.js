// Based on https://github.com/tanhauhau/jest-svelte-resolver
const path = require('path')

module.exports = function (request, options) {
  console.log(request)

  const { defaultResolver } = options

  if (
    request &&
    !(
      request[0] === '\0' ||
      request.startsWith('./') ||
      request.startsWith('../') ||
      path.isAbsolute(request)
    )
  ) {
    try {
      const pkgPath = defaultResolver(`${request}/package.json`, options)

      if (pkgPath) {
        const pkg = require(pkgPath)

        if (pkg.exports && pkg.exports['.'] && pkg.exports['.'].jest) {
          return defaultResolver(path.join(request, pkg.exports['.'].jest), options)
        }

        if (pkg.svelte) {
          return defaultResolver(path.join(request, pkg.svelte), options)
        }
      }
    } catch (error) {}
  }

  return defaultResolver(request, options)
}
