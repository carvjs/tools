/* eslint-env node */

// eslint-disable-next-line func-names
module.exports = function hasDependency(name, manifest = require('./package-manifest')) {
  return (
    has(manifest.dependencies, name) ||
    has(manifest.peerDependencies, name) ||
    has(manifest.devDependencies, name) ||
    has(manifest.optinonalDependencies, name)
  )
}

function has(dependencies, name) {
  return dependencies && dependencies[name]
}
