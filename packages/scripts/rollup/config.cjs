/* eslint-env node */

/* This file has the '.cjs' extension to prevent Rollup from trying to transpile the file. */

Error.stackTraceLimit = Infinity
module.exports = (commandLineArguments) => {
  if (commandLineArguments.watch) {
    return require('./config.watch')(commandLineArguments)
  }

  return require('./config.build')(commandLineArguments)
}
