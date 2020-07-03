#!/usr/bin/env node
const path = require('path')
const rimraf = require('rimraf')

const srcDirectory = path.resolve('.build')
const destDirectory = path.resolve('build')

console.log(`Creating package in ./build`)

const { bundle } = require('@carv/snowpack-plugin-rollup')()

rimraf.sync(srcDirectory, { glob: false })
rimraf.sync(destDirectory, { glob: false })

bundle({
  srcDirectory,
  destDirectory,
  log: (msg) => console.log(msg),
})
  .then(() => rimraf.sync(srcDirectory, { glob: false }))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
