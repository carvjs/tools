/* eslint-env node */
const atLeastNode = require('at-least-node')

module.exports = atLeastNode('14.5.0')
  ? 'es2020'
  : atLeastNode('12.4.0')
  ? 'es2019'
  : atLeastNode('10.3.0')
  ? 'es2018'
  : `node${process.versions.node.split('.')[0]}`
