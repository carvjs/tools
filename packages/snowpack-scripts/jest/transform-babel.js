const babelJest = require('babel-jest')
const importMetaBabelPlugin = require('@snowpack/app-scripts-svelte/jest/importMetaBabelPlugin')

module.exports = babelJest.createTransformer({
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        shippedProposals: true,
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [importMetaBabelPlugin],
})
