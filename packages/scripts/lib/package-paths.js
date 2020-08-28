/* eslint-env node */

const path = require('path')

const root = require('pkg-dir').sync()

exports.root = root
exports.build = path.join(root, 'build')
exports.dist = path.join(root, 'dist')
exports.source = path.join(root, 'src')

exports.svelteConfig = path.join(root, 'svelte.config.js')
exports.typescriptConfig = path.join(root, 'tsconfig.json')
