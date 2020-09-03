/* eslint-env node */

const fs = require('fs')

const paths = require('./package-paths')
const manifest = require('./package-manifest')
const hasDependency = require('./has-dependency')

exports.svelte = fs.existsSync(paths.svelteConfig) || hasDependency('svelte', manifest)
exports.typescript = fs.existsSync(paths.typescriptConfig)

exports.graphql = Boolean(require('../graphql/find-config')(paths.root))
exports.typescriptGraphql =
  exports.typescript &&
  exports.graphql &&
  fs.readFileSync(paths.typescriptConfig, { encoding: 'utf-8' }).includes('graphql')
