/* eslint-env node */

module.exports = (commandLineArguments) => {
  return {
    watch: {
      clearScreen: true,
      exclude: 'node_modules/**',
      include: 'src/**',
      skipWrite: true,
    },
  }
}
