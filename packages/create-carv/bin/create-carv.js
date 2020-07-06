#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const pkg = require('../package.json')
updateNotifier({ pkg }).notify()

if (require('at-least-node')('12.4.0')) {
  require('../generator/cli')
} else {
  console.error(
    'You are running Node ' +
      process.versions.node +
      '.\n' +
      'Create Carv requires Node 12.4 or higher. \n' +
      'Please update your version of Node.',
  )
  process.exit(1)
}
