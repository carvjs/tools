/* eslint-env node */
const path = require('path')

const paths = require('./package-paths')

module.exports = require(path.join(paths.root, 'package.json'))
