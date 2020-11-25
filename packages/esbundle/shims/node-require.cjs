/* eslint-env node */

exports.url = () => require('url').pathToFileURL(__filename)

exports.resolve = (id, parent) =>
  new Promise((resolve) => {
    resolve(parent ? require('module').createRequire(parent).resolve(id) : require.resolve(id))
  })
