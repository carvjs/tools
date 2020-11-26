/* eslint-env node */

const path = require('path')

const projectRoot = require('project-root-directory')
const root = require('pkg-dir').sync() || projectRoot

exports.isMonorepo = root !== projectRoot

exports.projectRoot = projectRoot
exports.root = root
exports.build = path.join(root, 'build')
exports.dist = path.join(root, 'dist')
exports.source = path.join(root, 'src')

exports.docs = path.join(projectRoot, 'docs')

exports.svelteConfig = path.join(root, 'svelte.config.js')
exports.typescriptConfig = path.join(root, 'tsconfig.json')
