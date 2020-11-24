/* eslint-env node */

const path = require('path')
const fs = require('fs')
const findUp = require('find-up').sync

const paths = require('./package-paths')

const includePaths = ['src', 'node_modules', paths.source, paths.root, process.cwd()]
let directory = findUp('node_modules', { cwd: paths.root, type: 'directory' })
do {
  includePaths.push(directory)
} while (
  (directory = findUp('node_modules', {
    cwd: path.dirname(path.dirname(directory)),
    type: 'directory',
  }))
)

includePaths.push(...module.paths.filter((directory) => fs.existsSync(directory)))

module.exports = includePaths
